import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  withErrorHandler,
  createSuccessResponse,
  NotFoundError,
  ValidationError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { resolverSessaoId } from '@/lib/services/sessao-controle'

export const dynamic = 'force-dynamic'

// Schema de validação para criação/atualização da mesa da sessão
const MesaSessaoSchema = z.object({
  membros: z.array(z.object({
    parlamentarId: z.string().min(1, 'Parlamentar é obrigatório'),
    cargo: z.enum(['PRESIDENTE', 'VICE_PRESIDENTE', 'PRIMEIRO_SECRETARIO', 'SEGUNDO_SECRETARIO']),
    titular: z.boolean().default(true),
    observacoes: z.string().optional()
  })).min(1, 'Pelo menos um membro é obrigatório')
    .refine(
      (membros) => {
        const cargos = membros.map(m => m.cargo)
        return new Set(cargos).size === cargos.length
      },
      { message: 'Não pode haver cargos duplicados na mesa' }
    )
    .refine(
      (membros) => {
        const parlamentarIds = membros.map(m => m.parlamentarId)
        return new Set(parlamentarIds).size === parlamentarIds.length
      },
      { message: 'O mesmo parlamentar não pode ocupar dois cargos' }
    ),
  observacoes: z.string().optional()
})

// GET - Obter mesa da sessão
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = await resolverSessaoId(params.id)

  const sessao = await prisma.sessao.findUnique({
    where: { id },
    include: {
      mesaSessao: {
        include: {
          membros: {
            include: {
              parlamentar: {
                select: {
                  id: true,
                  nome: true,
                  apelido: true,
                  partido: true,
                  foto: true
                }
              }
            },
            orderBy: {
              cargo: 'asc'
            }
          }
        }
      },
      periodo: {
        include: {
          mesasDiretora: {
            where: { ativa: true },
            include: {
              membros: {
                where: { ativo: true },
                include: {
                  parlamentar: {
                    select: {
                      id: true,
                      nome: true,
                      apelido: true,
                      partido: true,
                      foto: true
                    }
                  },
                  cargo: {
                    select: {
                      id: true,
                      nome: true,
                      ordem: true
                    }
                  }
                },
                orderBy: {
                  cargo: {
                    ordem: 'asc'
                  }
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

  // Se a sessão tem mesa específica, retornar ela
  if (sessao.mesaSessao) {
    return createSuccessResponse({
      mesaSessao: sessao.mesaSessao,
      mesaDiretora: sessao.periodo?.mesasDiretora?.[0] || null,
      usandoMesaDiretora: false
    }, 'Mesa da sessão encontrada')
  }

  // Se não tem mesa específica, retornar a mesa diretora do período
  const mesaDiretora = sessao.periodo?.mesasDiretora?.[0] || null

  return createSuccessResponse({
    mesaSessao: null,
    mesaDiretora: mesaDiretora,
    usandoMesaDiretora: true
  }, mesaDiretora ? 'Usando mesa diretora do período' : 'Nenhuma mesa encontrada')
})

// POST - Criar/atualizar mesa da sessão
export const POST = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const id = await resolverSessaoId(params.id)
  const body = await request.json()

  const validation = MesaSessaoSchema.safeParse(body)
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message)
  }

  const { membros, observacoes } = validation.data

  // Verificar se a sessão existe
  const sessao = await prisma.sessao.findUnique({
    where: { id },
    include: { mesaSessao: true }
  })

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  // Validar que os parlamentares existem e estão ativos
  const parlamentarIds = membros.map(m => m.parlamentarId)
  const parlamentares = await prisma.parlamentar.findMany({
    where: {
      id: { in: parlamentarIds },
      ativo: true
    }
  })

  if (parlamentares.length !== parlamentarIds.length) {
    const encontradosIds = parlamentares.map(p => p.id)
    const naoEncontrados = parlamentarIds.filter(id => !encontradosIds.includes(id))
    throw new ValidationError(
      `Um ou mais parlamentares não foram encontrados ou estão inativos: ${naoEncontrados.join(', ')}`
    )
  }

  // Verificar se o usuário está autenticado
  if (!session?.user?.id) {
    throw new ValidationError('Usuário não autenticado')
  }

  const userId = session.user.id

  // Usar transação para garantir atomicidade na atualização
  if (sessao.mesaSessao) {
    const mesaSessaoId = sessao.mesaSessao.id
    const mesaAtualizada = await prisma.$transaction(async (tx) => {
      // Deletar membros antigos
      await tx.membroMesaSessao.deleteMany({
        where: { mesaSessaoId }
      })

      // Atualizar mesa e criar novos membros
      return tx.mesaSessao.update({
        where: { id: mesaSessaoId },
        data: {
          observacoes,
          criadoPor: userId,
          membros: {
            create: membros.map(m => ({
              parlamentarId: m.parlamentarId,
              cargo: m.cargo,
              titular: m.titular,
              observacoes: m.observacoes
            }))
          }
        },
        include: {
          membros: {
            include: {
              parlamentar: {
                select: {
                  id: true,
                  nome: true,
                  apelido: true,
                  partido: true,
                  foto: true
                }
              }
            }
          }
        }
      })
    })

    return createSuccessResponse(mesaAtualizada, 'Mesa da sessão atualizada com sucesso')
  }

  // Criar nova mesa da sessão
  const novaMesa = await prisma.mesaSessao.create({
    data: {
      sessaoId: id,
      observacoes,
      criadoPor: userId,
      membros: {
        create: membros.map(m => ({
          parlamentarId: m.parlamentarId,
          cargo: m.cargo,
          titular: m.titular,
          observacoes: m.observacoes
        }))
      }
    },
    include: {
      membros: {
        include: {
          parlamentar: {
            select: {
              id: true,
              nome: true,
              apelido: true,
              partido: true,
              foto: true
            }
          }
        }
      }
    }
  })

  return createSuccessResponse(novaMesa, 'Mesa da sessão criada com sucesso')
}, { roles: ['ADMIN', 'SECRETARIA', 'OPERADOR'] })

// DELETE - Remover mesa da sessão (volta a usar mesa diretora)
export const DELETE = withAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  _session
) => {
  const id = await resolverSessaoId(params.id)

  const sessao = await prisma.sessao.findUnique({
    where: { id },
    include: { mesaSessao: true }
  })

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  if (!sessao.mesaSessao) {
    throw new ValidationError('Esta sessão não possui mesa específica')
  }

  await prisma.mesaSessao.delete({
    where: { id: sessao.mesaSessao.id }
  })

  return createSuccessResponse(null, 'Mesa da sessão removida. A sessão usará a mesa diretora do período.')
}, { roles: ['ADMIN', 'SECRETARIA'] })
