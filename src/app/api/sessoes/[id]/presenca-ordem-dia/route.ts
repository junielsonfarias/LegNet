/**
 * API para gerenciar presença na ordem do dia
 * GET: Lista presenças
 * POST: Registra/atualiza presença
 * DELETE: Remove todas as presenças (limpa lista)
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const PresencaSchema = z.object({
  parlamentarId: z.string().min(1, 'Parlamentar é obrigatório'),
  presente: z.boolean(),
  observacoes: z.string().optional()
})

const PresencaBulkSchema = z.object({
  presencas: z.array(z.object({
    parlamentarId: z.string().min(1),
    presente: z.boolean(),
    observacoes: z.string().optional()
  }))
})

// GET - Lista presenças na ordem do dia
export const GET = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const sessaoId = params.id

  // Verificar se sessão existe
  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId },
    include: {
      presencas: {
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

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  // Buscar presenças na ordem do dia
  const presencasOrdemDia = await prisma.presencaOrdemDia.findMany({
    where: { sessaoId },
    include: {
      parlamentar: {
        select: {
          id: true,
          nome: true,
          apelido: true,
          partido: true
        }
      }
    },
    orderBy: {
      parlamentar: { nome: 'asc' }
    }
  })

  // Calcular totais
  const totais = {
    presentes: presencasOrdemDia.filter(p => p.presente).length,
    ausentes: presencasOrdemDia.filter(p => !p.presente).length,
    total: presencasOrdemDia.length,
    // Comparar com presença geral da sessão
    presencaGeral: {
      presentes: sessao.presencas.filter(p => p.presente).length,
      total: sessao.presencas.length
    }
  }

  return createSuccessResponse({
    presencas: presencasOrdemDia,
    totais,
    // Parlamentares presentes na sessão mas sem registro na ordem do dia
    semRegistro: sessao.presencas
      .filter(p => p.presente && !presencasOrdemDia.find(pod => pod.parlamentarId === p.parlamentarId))
      .map(p => p.parlamentar)
  })
}), { permissions: 'sessao.view' })

// POST - Registra presença (individual ou em lote)
export const POST = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const sessaoId = params.id
  const body = await request.json()

  // Verificar se sessão existe
  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId }
  })

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  // Verificar se é bulk ou individual
  if (body.presencas && Array.isArray(body.presencas)) {
    // Bulk
    const payload = PresencaBulkSchema.parse(body)

    const resultados = await Promise.all(
      payload.presencas.map(async (p) => {
        return prisma.presencaOrdemDia.upsert({
          where: {
            sessaoId_parlamentarId: {
              sessaoId,
              parlamentarId: p.parlamentarId
            }
          },
          update: {
            presente: p.presente,
            observacoes: p.observacoes,
            registradoEm: new Date()
          },
          create: {
            sessaoId,
            parlamentarId: p.parlamentarId,
            presente: p.presente,
            observacoes: p.observacoes
          },
          include: {
            parlamentar: {
              select: {
                id: true,
                nome: true,
                apelido: true
              }
            }
          }
        })
      })
    )

    await logAudit({
      request,
      session,
      action: 'PRESENCA_ORDEM_DIA_BULK',
      entity: 'PresencaOrdemDia',
      entityId: sessaoId,
      metadata: {
        total: resultados.length,
        presentes: resultados.filter(r => r.presente).length
      }
    })

    return createSuccessResponse({
      registrados: resultados.length,
      presencas: resultados
    }, `${resultados.length} presenças registradas`)
  } else {
    // Individual
    const payload = PresencaSchema.parse(body)

    // Verificar se parlamentar existe
    const parlamentar = await prisma.parlamentar.findUnique({
      where: { id: payload.parlamentarId }
    })

    if (!parlamentar) {
      throw new NotFoundError('Parlamentar')
    }

    const presenca = await prisma.presencaOrdemDia.upsert({
      where: {
        sessaoId_parlamentarId: {
          sessaoId,
          parlamentarId: payload.parlamentarId
        }
      },
      update: {
        presente: payload.presente,
        observacoes: payload.observacoes,
        registradoEm: new Date()
      },
      create: {
        sessaoId,
        parlamentarId: payload.parlamentarId,
        presente: payload.presente,
        observacoes: payload.observacoes
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

    await logAudit({
      request,
      session,
      action: 'PRESENCA_ORDEM_DIA_REGISTRADA',
      entity: 'PresencaOrdemDia',
      entityId: presenca.id,
      metadata: {
        sessaoId,
        parlamentar: parlamentar.nome,
        presente: payload.presente
      }
    })

    return createSuccessResponse(
      presenca,
      payload.presente ? 'Presença registrada' : 'Ausência registrada'
    )
  }
}), { permissions: 'sessao.manage' })

// DELETE - Remove todas as presenças na ordem do dia (limpa lista)
export const DELETE = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const sessaoId = params.id

  // Verificar se sessão existe
  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId }
  })

  if (!sessao) {
    throw new NotFoundError('Sessão')
  }

  // Contar presenças antes de excluir
  const countAntes = await prisma.presencaOrdemDia.count({
    where: { sessaoId }
  })

  if (countAntes === 0) {
    return createSuccessResponse({ removidos: 0 }, 'Nenhuma presença para remover')
  }

  // Remover todas as presenças da ordem do dia desta sessão
  await prisma.presencaOrdemDia.deleteMany({
    where: { sessaoId }
  })

  await logAudit({
    request,
    session,
    action: 'PRESENCA_ORDEM_DIA_BULK_DELETE',
    entity: 'PresencaOrdemDia',
    entityId: sessaoId,
    metadata: {
      sessaoId,
      removidos: countAntes
    }
  })

  return createSuccessResponse(
    { removidos: countAntes },
    `${countAntes} presenças removidas com sucesso`
  )
}), { permissions: 'sessao.manage' })
