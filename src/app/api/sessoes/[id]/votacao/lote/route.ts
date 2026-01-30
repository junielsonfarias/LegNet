import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  NotFoundError
} from '@/lib/error-handler'
import {
  assertSessaoPermiteVotacao,
  ensureParlamentarPresente,
  obterSessaoParaControle,
  resolverSessaoId,
  contabilizarVotos,
  sincronizarStatusProposicao
} from '@/lib/services/sessao-controle'
import { logAudit } from '@/lib/audit'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Schema para voto individual no lote
const VotoIndividualSchema = z.object({
  parlamentarId: z.string().min(1, 'parlamentarId é obrigatório'),
  voto: z.enum(['SIM', 'NAO', 'ABSTENCAO', 'AUSENTE'])
})

// Schema para votação em lote
const VotacaoLoteSchema = z.object({
  proposicaoId: z.string().min(1, 'proposicaoId é obrigatório'),
  itemPautaId: z.string().min(1, 'itemPautaId é obrigatório'),
  votos: z.array(VotoIndividualSchema).min(1, 'Deve haver pelo menos 1 voto'),
  motivo: z.string().optional(),
  finalizarVotacao: z.boolean().default(true),
  resultado: z.enum(['APROVADO', 'REJEITADO']).optional()
})

/**
 * POST /api/sessoes/[id]/votacao/lote
 *
 * Registra múltiplos votos de uma só vez.
 * Suporta lançamento retroativo em sessões CONCLUÍDAS.
 *
 * RN-076: Lançamento retroativo só permitido para sessões CONCLUÍDAS
 * RN-077: Apenas parlamentares PRESENTES podem receber voto retroativo
 * RN-078: Toda alteração retroativa deve ser auditada
 * RN-079: Ao finalizar votação retroativa, atualizar status da Proposição
 * RN-080: Sessão CONCLUÍDA não pode retornar para EM_ANDAMENTO
 */
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  // Verificar autenticação
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new ValidationError('Usuário não autenticado')
  }

  const sessaoId = await resolverSessaoId(params.id)
  const body = await request.json()

  // Validar dados de entrada
  const validatedData = VotacaoLoteSchema.parse(body)

  // Verificar se sessão existe e permite votação
  const sessao = await obterSessaoParaControle(sessaoId)
  assertSessaoPermiteVotacao(sessao)

  // Detectar se é lançamento retroativo
  const isRetroativo = sessao.status === 'CONCLUIDA'

  // RN-078: Motivo obrigatório para lançamento retroativo
  if (isRetroativo && !validatedData.motivo) {
    throw new ValidationError(
      'RN-078: Para lançamento retroativo é obrigatório informar o motivo da alteração'
    )
  }

  // Verificar se proposição existe
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: validatedData.proposicaoId },
    select: {
      id: true,
      numero: true,
      ano: true,
      tipo: true,
      titulo: true,
      status: true
    }
  })

  if (!proposicao) {
    throw new NotFoundError('Proposição')
  }

  // Verificar se item da pauta existe e pertence a esta sessão
  const pautaItem = await prisma.pautaItem.findFirst({
    where: {
      id: validatedData.itemPautaId,
      proposicaoId: validatedData.proposicaoId,
      pauta: {
        sessaoId: sessaoId
      }
    },
    include: {
      pauta: true
    }
  })

  if (!pautaItem) {
    throw new ValidationError('Item da pauta não encontrado ou não pertence a esta sessão')
  }

  // RN-077: Validar que todos os parlamentares estavam/estão presentes na sessão
  const parlamentaresIds = validatedData.votos
    .filter(v => v.voto !== 'AUSENTE')
    .map(v => v.parlamentarId)

  for (const parlamentarId of parlamentaresIds) {
    await ensureParlamentarPresente(sessaoId, parlamentarId)
  }

  // Buscar turno atual
  const turnoAtual = pautaItem.turnoAtual || 1

  // Executar em transação
  const resultado = await prisma.$transaction(async (tx) => {
    const votosRegistrados: Array<{
      parlamentarId: string
      voto: string
      atualizado: boolean
    }> = []

    // Registrar cada voto (exceto AUSENTE que é apenas informativo)
    for (const votoData of validatedData.votos) {
      if (votoData.voto === 'AUSENTE') {
        continue // Não registra voto para ausentes
      }

      const votoExistente = await tx.votacao.findUnique({
        where: {
          proposicaoId_parlamentarId_turno: {
            proposicaoId: validatedData.proposicaoId,
            parlamentarId: votoData.parlamentarId,
            turno: turnoAtual
          }
        }
      })

      const voto = await tx.votacao.upsert({
        where: {
          proposicaoId_parlamentarId_turno: {
            proposicaoId: validatedData.proposicaoId,
            parlamentarId: votoData.parlamentarId,
            turno: turnoAtual
          }
        },
        update: {
          voto: votoData.voto,
          sessaoId: sessaoId
        },
        create: {
          proposicaoId: validatedData.proposicaoId,
          parlamentarId: votoData.parlamentarId,
          voto: votoData.voto,
          turno: turnoAtual,
          sessaoId: sessaoId
        }
      })

      votosRegistrados.push({
        parlamentarId: votoData.parlamentarId,
        voto: votoData.voto,
        atualizado: !!votoExistente
      })
    }

    // Se deve finalizar a votação
    let resultadoFinal = null
    if (validatedData.finalizarVotacao) {
      // Contabilizar votos
      const contagem = await contabilizarVotos(validatedData.proposicaoId, {
        tipoProposicao: proposicao.tipo,
        sessaoId
      })

      // Determinar resultado (usa o fornecido ou o calculado)
      const resultadoVotacao = validatedData.resultado ||
        (contagem.resultado === 'APROVADA' ? 'APROVADO' : 'REJEITADO')

      // Atualizar item da pauta
      await tx.pautaItem.update({
        where: { id: validatedData.itemPautaId },
        data: {
          status: resultadoVotacao,
          finalizadoEm: new Date()
        }
      })

      // GAP #2: Sincronizar status da proposição
      const statusProposicao = resultadoVotacao === 'APROVADO' ? 'APROVADA' : 'REJEITADA'
      await tx.proposicao.update({
        where: { id: validatedData.proposicaoId },
        data: {
          status: statusProposicao,
          resultado: contagem.resultado,
          dataVotacao: new Date(),
          sessaoVotacaoId: sessaoId
        }
      })

      // Registrar votação agrupada
      await tx.votacaoAgrupada.upsert({
        where: {
          proposicaoId_sessaoId_turno: {
            proposicaoId: validatedData.proposicaoId,
            sessaoId: sessaoId,
            turno: turnoAtual
          }
        },
        update: {
          votosSim: contagem.sim,
          votosNao: contagem.nao,
          votosAbstencao: contagem.abstencao,
          resultado: contagem.resultado,
          finalizadaEm: new Date(),
          observacoes: isRetroativo
            ? `Lançamento retroativo: ${validatedData.motivo}`
            : undefined
        },
        create: {
          proposicaoId: validatedData.proposicaoId,
          sessaoId: sessaoId,
          turno: turnoAtual,
          votosSim: contagem.sim,
          votosNao: contagem.nao,
          votosAbstencao: contagem.abstencao,
          resultado: contagem.resultado,
          tipoVotacao: pautaItem.tipoVotacao || 'NOMINAL',
          tipoQuorum: 'MAIORIA_SIMPLES',
          finalizadaEm: new Date(),
          observacoes: isRetroativo
            ? `Lançamento retroativo: ${validatedData.motivo}`
            : undefined
        }
      })

      resultadoFinal = {
        resultado: resultadoVotacao,
        contagem: {
          sim: contagem.sim,
          nao: contagem.nao,
          abstencao: contagem.abstencao,
          total: contagem.total
        },
        detalhesQuorum: contagem.detalhesQuorum
      }
    }

    return {
      votosRegistrados,
      resultadoFinal
    }
  })

  // RN-078: Registrar auditoria para lançamento retroativo
  if (isRetroativo) {
    await logAudit({
      request,
      session,
      action: 'VOTACAO_LOTE_RETROATIVO',
      entity: 'Votacao',
      entityId: validatedData.proposicaoId,
      metadata: {
        sessaoId,
        itemPautaId: validatedData.itemPautaId,
        proposicao: `${proposicao.numero}/${proposicao.ano}`,
        motivo: validatedData.motivo,
        votosRegistrados: resultado.votosRegistrados.length,
        resultado: resultado.resultadoFinal?.resultado,
        timestamp: new Date().toISOString()
      }
    })

    console.log(`[Auditoria] Votação retroativa registrada:`, {
      sessaoId,
      proposicao: `${proposicao.numero}/${proposicao.ano}`,
      usuario: session.user.email,
      motivo: validatedData.motivo,
      votosRegistrados: resultado.votosRegistrados.length
    })
  }

  return createSuccessResponse({
    sessaoId,
    proposicaoId: validatedData.proposicaoId,
    itemPautaId: validatedData.itemPautaId,
    isRetroativo,
    votosRegistrados: resultado.votosRegistrados,
    resultado: resultado.resultadoFinal,
    mensagem: isRetroativo
      ? 'Votação retroativa registrada com sucesso'
      : 'Votação em lote registrada com sucesso'
  }, isRetroativo ? 'Lançamento retroativo concluído' : 'Votação em lote concluída')
})
