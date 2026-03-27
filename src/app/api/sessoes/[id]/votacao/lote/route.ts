import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  createSuccessResponse,
  ValidationError,
  NotFoundError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import {
  assertSessaoPermiteVotacao,
  ensureParlamentarPresente,
  obterSessaoParaControle,
  resolverSessaoId
} from '@/lib/services/sessao-controle'
import {
  findProposicaoParaVotacao,
  findPautaItemParaVotacao,
  registrarVotacaoEmLote
} from '@/lib/services/votacao-service'
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
 *
 * SEGURANÇA: Requer autenticação e permissão de votação
 */
export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  // Sessão já verificada pelo withAuth
  const session = await getServerSession(authOptions)

  const { id: rawId } = await context.params
  const sessaoId = await resolverSessaoId(rawId)
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
  const proposicao = await findProposicaoParaVotacao(validatedData.proposicaoId)

  if (!proposicao) {
    throw new NotFoundError('Proposição')
  }

  // Verificar se item da pauta existe e pertence a esta sessão
  const pautaItem = await findPautaItemParaVotacao(validatedData.proposicaoId, sessaoId)

  if (!pautaItem) {
    throw new ValidationError('Item da pauta não encontrado ou não pertence a esta sessão')
  }

  // Validar que o item encontrado corresponde ao itemPautaId informado
  if (pautaItem.id !== validatedData.itemPautaId) {
    throw new ValidationError('Item da pauta não corresponde ao informado')
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

  // Executar votação em lote via serviço
  const resultado = await registrarVotacaoEmLote({
    sessaoId,
    proposicaoId: validatedData.proposicaoId,
    itemPautaId: validatedData.itemPautaId,
    votos: validatedData.votos,
    turno: turnoAtual,
    finalizarVotacao: validatedData.finalizarVotacao,
    resultado: validatedData.resultado,
    motivo: validatedData.motivo,
    isRetroativo,
    tipoProposicao: proposicao.tipo,
    tipoVotacao: pautaItem.tipoVotacao || 'NOMINAL'
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
}, { permissions: 'votacao.manage' })
