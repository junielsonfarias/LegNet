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
import {
  assertSessaoPermiteVotacao,
  ensureParlamentarPresente,
  obterSessaoParaControle
} from '@/lib/services/sessao-controle'

export const dynamic = 'force-dynamic'

const VotoSchema = z.object({
  proposicaoId: z.string(),
  parlamentarId: z.string(),
  voto: z.enum(['SIM', 'NAO', 'ABSTENCAO'])
})

// GET - Listar votos da sessão
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const sessaoId = validateId(params.id, 'Sessão')

  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId },
    include: {
      proposicoes: {
        include: {
          votacoes: {
            include: {
              parlamentar: {
                select: {
                  id: true,
                  nome: true,
                  apelido: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  return createSuccessResponse(sessao.proposicoes, 'Votações listadas com sucesso')
})

// POST - Registrar voto
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const sessaoId = validateId(params.id, 'Sessão')
  const body = await request.json()

  const validatedData = VotoSchema.parse(body)

  // Verificar se sessão existe e está em andamento
  const sessao = await obterSessaoParaControle(sessaoId)
  assertSessaoPermiteVotacao(sessao)

  // Verificar se parlamentar está presente na sessão
  await ensureParlamentarPresente(sessaoId, validatedData.parlamentarId)

  // Verificar se proposição pertence à sessão
  const proposicao = await prisma.proposicao.findUnique({
    where: { id: validatedData.proposicaoId }
  })

  if (!proposicao) {
    throw new NotFoundError('Proposição')
  }

  if (proposicao.sessaoId !== sessaoId) {
    throw new ValidationError('Proposição não pertence a esta sessão')
  }

  // Criar ou atualizar voto
  const voto = await prisma.votacao.upsert({
    where: {
      proposicaoId_parlamentarId: {
        proposicaoId: validatedData.proposicaoId,
        parlamentarId: validatedData.parlamentarId
      }
    },
    update: {
      voto: validatedData.voto
    },
    create: {
      proposicaoId: validatedData.proposicaoId,
      parlamentarId: validatedData.parlamentarId,
      voto: validatedData.voto
    },
    include: {
      parlamentar: {
        select: {
          id: true,
          nome: true,
          apelido: true
        }
      },
      proposicao: {
        select: {
          id: true,
          numero: true,
          ano: true,
          titulo: true
        }
      }
    }
  })

  return createSuccessResponse(voto, 'Voto registrado com sucesso')
})

