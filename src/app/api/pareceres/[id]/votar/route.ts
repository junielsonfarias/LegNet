import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  NotFoundError,
  validateId
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

const VotarSchema = z.object({
  parlamentarId: z.string().min(1, 'Parlamentar é obrigatório'),
  voto: z.enum(['SIM', 'NAO', 'ABSTENCAO']),
  observacoes: z.string().optional()
})

const EncerrarVotacaoSchema = z.object({
  resultado: z.enum(['APROVADO_COMISSAO', 'REJEITADO_COMISSAO']),
  motivoRejeicao: z.string().optional()
})

// POST - Registrar voto de membro da comissão sobre o parecer
// SEGURANÇA: Requer autenticação e permissão de gestão de comissões
export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const parecerId = validateId(rawId, 'Parecer')
  const body = await request.json()

  // Verificar se é uma ação de encerrar votação
  if (body.action === 'encerrar') {
    return encerrarVotacao(parecerId, body)
  }

  const validatedData = VotarSchema.parse(body)

  // Buscar o parecer
  const parecer = await prisma.parecer.findUnique({
    where: { id: parecerId },
    include: {
      comissao: {
        include: {
          membros: {
            where: { ativo: true }
          }
        }
      }
    }
  })

  if (!parecer) {
    throw new NotFoundError('Parecer')
  }

  // Verificar se o parecer está em votação
  if (parecer.status !== 'AGUARDANDO_VOTACAO') {
    throw new ValidationError(
      `O parecer não está em votação. Status atual: ${parecer.status}`
    )
  }

  // Verificar se o parlamentar é membro ativo da comissão
  const membroComissao = parecer.comissao.membros.find(
    m => m.parlamentarId === validatedData.parlamentarId
  )

  if (!membroComissao) {
    throw new ValidationError(
      'Este parlamentar não é membro ativo da comissão'
    )
  }

  // Registrar ou atualizar voto
  const voto = await prisma.votoParecerComissao.upsert({
    where: {
      parecerId_parlamentarId: {
        parecerId,
        parlamentarId: validatedData.parlamentarId
      }
    },
    update: {
      voto: validatedData.voto,
      observacoes: validatedData.observacoes,
      dataVoto: new Date()
    },
    create: {
      parecerId,
      parlamentarId: validatedData.parlamentarId,
      voto: validatedData.voto,
      observacoes: validatedData.observacoes
    },
    include: {
      parlamentar: {
        select: {
          id: true,
          nome: true,
          apelido: true,
          partido: true
        }
      }
    }
  })

  // Atualizar contagem de votos no parecer
  const votos = await prisma.votoParecerComissao.groupBy({
    by: ['voto'],
    where: { parecerId },
    _count: true
  })

  const contagem = {
    votosAFavor: 0,
    votosContra: 0,
    votosAbstencao: 0
  }

  for (const v of votos) {
    if (v.voto === 'SIM') contagem.votosAFavor = v._count
    else if (v.voto === 'NAO') contagem.votosContra = v._count
    else if (v.voto === 'ABSTENCAO') contagem.votosAbstencao = v._count
  }

  await prisma.parecer.update({
    where: { id: parecerId },
    data: contagem
  })

  return createSuccessResponse({
    voto,
    contagem,
    totalMembros: parecer.comissao.membros.length
  }, 'Voto registrado com sucesso')
}, { permissions: 'comissao.manage' })

// Função para encerrar votação
async function encerrarVotacao(parecerId: string, body: any) {
  const validatedData = EncerrarVotacaoSchema.parse(body)

  const parecer = await prisma.parecer.findUnique({
    where: { id: parecerId },
    include: {
      comissao: {
        include: {
          membros: {
            where: { ativo: true }
          }
        }
      },
      _count: {
        select: { votosComissao: true }
      }
    }
  })

  if (!parecer) {
    throw new NotFoundError('Parecer')
  }

  if (parecer.status !== 'AGUARDANDO_VOTACAO') {
    throw new ValidationError(
      `O parecer não está em votação. Status atual: ${parecer.status}`
    )
  }

  // Verificar se houve quórum (maioria dos membros votou)
  const totalMembros = parecer.comissao.membros.length
  const totalVotos = parecer._count.votosComissao
  const quorumMinimo = Math.floor(totalMembros / 2) + 1

  if (totalVotos < quorumMinimo) {
    throw new ValidationError(
      `Quórum insuficiente para encerrar votação. ` +
      `Votos: ${totalVotos}, Mínimo necessário: ${quorumMinimo}`
    )
  }

  // Atualizar parecer com resultado
  const updateData: any = {
    status: validatedData.resultado,
    dataVotacao: new Date()
  }

  if (validatedData.resultado === 'REJEITADO_COMISSAO' && validatedData.motivoRejeicao) {
    updateData.motivoRejeicao = validatedData.motivoRejeicao
  }

  const parecerAtualizado = await prisma.parecer.update({
    where: { id: parecerId },
    data: updateData,
    include: {
      proposicao: {
        select: {
          id: true,
          numero: true,
          ano: true,
          tipo: true,
          titulo: true
        }
      },
      comissao: {
        select: {
          id: true,
          nome: true,
          sigla: true
        }
      },
      relator: {
        select: {
          id: true,
          nome: true,
          apelido: true
        }
      }
    }
  })

  return createSuccessResponse(
    parecerAtualizado,
    `Votação encerrada. Parecer ${validatedData.resultado === 'APROVADO_COMISSAO' ? 'aprovado' : 'rejeitado'} pela comissão.`
  )
}

// GET - Obter votos do parecer
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const parecerId = validateId(params.id, 'Parecer')

  const parecer = await prisma.parecer.findUnique({
    where: { id: parecerId },
    select: {
      id: true,
      status: true,
      votosAFavor: true,
      votosContra: true,
      votosAbstencao: true,
      comissao: {
        select: {
          membros: {
            where: { ativo: true },
            select: {
              parlamentarId: true,
              parlamentar: {
                select: {
                  id: true,
                  nome: true,
                  apelido: true,
                  partido: true
                }
              },
              cargo: true
            }
          }
        }
      },
      votosComissao: {
        include: {
          parlamentar: {
            select: {
              id: true,
              nome: true,
              apelido: true,
              partido: true
            }
          }
        }
      }
    }
  })

  if (!parecer) {
    throw new NotFoundError('Parecer')
  }

  // Mapear membros que ainda não votaram
  const parlamentaresVotaram = parecer.votosComissao.map(v => v.parlamentarId)
  const membrosNaoVotaram = parecer.comissao.membros.filter(
    m => !parlamentaresVotaram.includes(m.parlamentarId)
  )

  return createSuccessResponse({
    parecerId: parecer.id,
    status: parecer.status,
    contagem: {
      aFavor: parecer.votosAFavor,
      contra: parecer.votosContra,
      abstencao: parecer.votosAbstencao,
      total: parecer.votosAFavor + parecer.votosContra + parecer.votosAbstencao
    },
    totalMembros: parecer.comissao.membros.length,
    votos: parecer.votosComissao,
    membrosNaoVotaram: membrosNaoVotaram.map(m => ({
      parlamentarId: m.parlamentarId,
      parlamentar: m.parlamentar,
      cargo: m.cargo
    }))
  }, 'Votos obtidos com sucesso')
})
