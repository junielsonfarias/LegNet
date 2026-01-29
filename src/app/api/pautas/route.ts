/**
 * API para gerenciamento de Pautas
 * POST: Cria nova pauta vinculada a uma sessão existente
 * GET: Lista todas as pautas com dados da sessão
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const PautaCreateSchema = z.object({
  sessaoId: z.string().min(1, 'Sessão é obrigatória'),
  observacoes: z.string().optional(),
  geradaAutomaticamente: z.boolean().optional().default(false)
})

const PautaQuerySchema = z.object({
  status: z.enum(['RASCUNHO', 'APROVADA', 'EM_ANDAMENTO', 'CONCLUIDA']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20)
})

// GET - Lista pautas com dados da sessão
export const GET = withAuth(withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  const query = PautaQuerySchema.parse({
    status: searchParams.get('status') || undefined,
    page: searchParams.get('page') || 1,
    limit: searchParams.get('limit') || 20
  })

  const where: any = {}
  if (query.status) {
    where.status = query.status
  }

  const [pautas, total] = await Promise.all([
    prisma.pautaSessao.findMany({
      where,
      include: {
        sessao: {
          select: {
            id: true,
            numero: true,
            tipo: true,
            data: true,
            horario: true,
            local: true,
            status: true,
            descricao: true,
            legislatura: {
              select: {
                numero: true,
                anoInicio: true,
                anoFim: true
              }
            }
          }
        },
        _count: {
          select: {
            itens: true
          }
        }
      },
      orderBy: {
        sessao: {
          data: 'desc'
        }
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    }),
    prisma.pautaSessao.count({ where })
  ])

  const pautasFormatadas = pautas.map(pauta => ({
    id: pauta.id,
    sessaoId: pauta.sessaoId,
    status: pauta.status,
    geradaAutomaticamente: pauta.geradaAutomaticamente,
    observacoes: pauta.observacoes,
    tempoTotalEstimado: pauta.tempoTotalEstimado,
    tempoTotalReal: pauta.tempoTotalReal,
    totalItens: pauta._count.itens,
    createdAt: pauta.createdAt,
    updatedAt: pauta.updatedAt,
    sessao: {
      id: pauta.sessao.id,
      numero: pauta.sessao.numero,
      tipo: pauta.sessao.tipo,
      data: pauta.sessao.data,
      horario: pauta.sessao.horario,
      local: pauta.sessao.local,
      status: pauta.sessao.status,
      descricao: pauta.sessao.descricao,
      legislatura: pauta.sessao.legislatura ? {
        numero: pauta.sessao.legislatura.numero,
        periodo: `${pauta.sessao.legislatura.anoInicio}-${pauta.sessao.legislatura.anoFim}`
      } : null
    }
  }))

  return createSuccessResponse({
    data: pautasFormatadas,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit)
    }
  })
}), { permissions: 'pauta.view' })

// POST - Cria nova pauta vinculada a uma sessão
export const POST = withAuth(withErrorHandler(async (request: NextRequest, _context, session) => {
  const body = await request.json()
  const payload = PautaCreateSchema.parse(body)

  // Verificar se a sessão existe
  const sessao = await prisma.sessao.findUnique({
    where: { id: payload.sessaoId },
    include: {
      pautaSessao: true
    }
  })

  if (!sessao) {
    throw new ValidationError('Sessão não encontrada')
  }

  // Verificar se já tem pauta
  if (sessao.pautaSessao) {
    throw new ValidationError('Esta sessão já possui uma pauta vinculada')
  }

  // Criar a pauta
  const pauta = await prisma.pautaSessao.create({
    data: {
      sessaoId: payload.sessaoId,
      status: 'RASCUNHO',
      geradaAutomaticamente: payload.geradaAutomaticamente,
      observacoes: payload.observacoes,
      tempoTotalEstimado: 0
    },
    include: {
      sessao: {
        select: {
          id: true,
          numero: true,
          tipo: true,
          data: true,
          horario: true
        }
      }
    }
  })

  await logAudit({
    request,
    session,
    action: 'PAUTA_CREATE',
    entity: 'PautaSessao',
    entityId: pauta.id,
    metadata: {
      sessaoId: payload.sessaoId,
      sessaoNumero: sessao.numero,
      sessaoTipo: sessao.tipo
    }
  })

  return createSuccessResponse(pauta, 'Pauta criada com sucesso')
}), { permissions: 'pauta.manage' })
