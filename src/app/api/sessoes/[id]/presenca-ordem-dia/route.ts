import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { presencaOrdemDiaDbService } from '@/lib/services/presenca-ordem-dia-db-service'

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

export const GET = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const sessaoId = params.id

  const sessao = await prisma.sessao.findUnique({
    where: { id: sessaoId },
    include: {
      presencas: {
        include: {
          parlamentar: {
            select: { id: true, nome: true, apelido: true, partido: true }
          }
        }
      }
    }
  })
  if (!sessao) throw new NotFoundError('Sessão')

  const presencasOrdemDia = await presencaOrdemDiaDbService.listBySessao(sessaoId)

  const totais = {
    presentes: presencasOrdemDia.filter(p => p.presente).length,
    ausentes: presencasOrdemDia.filter(p => !p.presente).length,
    total: presencasOrdemDia.length,
    presencaGeral: {
      presentes: sessao.presencas.filter(p => p.presente).length,
      total: sessao.presencas.length
    }
  }

  return createSuccessResponse({
    presencas: presencasOrdemDia,
    totais,
    semRegistro: sessao.presencas
      .filter(p => p.presente && !presencasOrdemDia.find(pod => pod.parlamentarId === p.parlamentarId))
      .map(p => p.parlamentar)
  })
}), { permissions: 'sessao.view' })

export const POST = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const sessaoId = params.id
  const body = await request.json()

  const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } })
  if (!sessao) throw new NotFoundError('Sessão')

  if (body.presencas && Array.isArray(body.presencas)) {
    const payload = PresencaBulkSchema.parse(body)
    const resultados = await presencaOrdemDiaDbService.registrarLote(sessaoId, payload.presencas)

    await logAudit({
      request, session,
      action: 'PRESENCA_ORDEM_DIA_BULK',
      entity: 'PresencaOrdemDia',
      entityId: sessaoId,
      metadata: { total: resultados.length, presentes: resultados.filter(r => r.presente).length }
    })

    return createSuccessResponse({ registrados: resultados.length, presencas: resultados }, `${resultados.length} presenças registradas`)
  } else {
    const payload = PresencaSchema.parse(body)
    const parlamentar = await prisma.parlamentar.findUnique({ where: { id: payload.parlamentarId } })
    if (!parlamentar) throw new NotFoundError('Parlamentar')

    const presenca = await presencaOrdemDiaDbService.registrar(sessaoId, payload)

    await logAudit({
      request, session,
      action: 'PRESENCA_ORDEM_DIA_REGISTRADA',
      entity: 'PresencaOrdemDia',
      entityId: presenca.id,
      metadata: { sessaoId, parlamentar: parlamentar.nome, presente: payload.presente }
    })

    return createSuccessResponse(presenca, payload.presente ? 'Presença registrada' : 'Ausência registrada')
  }
}), { permissions: 'sessao.manage' })

export const DELETE = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const sessaoId = params.id

  const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } })
  if (!sessao) throw new NotFoundError('Sessão')

  const { removidos } = await presencaOrdemDiaDbService.limpar(sessaoId)

  if (removidos === 0) {
    return createSuccessResponse({ removidos: 0 }, 'Nenhuma presença para remover')
  }

  await logAudit({
    request, session,
    action: 'PRESENCA_ORDEM_DIA_BULK_DELETE',
    entity: 'PresencaOrdemDia',
    entityId: sessaoId,
    metadata: { sessaoId, removidos }
  })

  return createSuccessResponse({ removidos }, `${removidos} presenças removidas com sucesso`)
}), { permissions: 'sessao.manage' })
