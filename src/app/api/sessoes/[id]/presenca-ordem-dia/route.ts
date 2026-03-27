import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, NotFoundError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { presencaOrdemDiaDbService } from '@/lib/services/presenca-ordem-dia-db-service'
import { presencaDbService } from '@/lib/services/presenca-db-service'
import { sessaoDbService } from '@/lib/services/sessao-db-service'
import { parlamentarDbService } from '@/lib/services/parlamentar-db-service'

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
  context: { params: Promise<{ id: string }> }
) => {
  const { id: sessaoId } = await context.params

  const sessao = await sessaoDbService.getById(sessaoId)
  if (!sessao) throw new NotFoundError('Sessão')

  const [presencasOrdemDia, presencasSessao] = await Promise.all([
    presencaOrdemDiaDbService.listBySessao(sessaoId),
    presencaDbService.listBySessao(sessaoId)
  ])

  const totais = {
    presentes: presencasOrdemDia.filter(p => p.presente).length,
    ausentes: presencasOrdemDia.filter(p => !p.presente).length,
    total: presencasOrdemDia.length,
    presencaGeral: {
      presentes: presencasSessao.filter(p => p.presente).length,
      total: presencasSessao.length
    }
  }

  return createSuccessResponse({
    presencas: presencasOrdemDia,
    totais,
    semRegistro: presencasSessao
      .filter(p => p.presente && !presencasOrdemDia.find(pod => pod.parlamentarId === p.parlamentarId))
      .map(p => p.parlamentar)
  })
}), { permissions: 'sessao.view' })

export const POST = withAuth(withErrorHandler(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  session
) => {
  const { id: sessaoId } = await context.params
  const body = await request.json()

  const sessao = await sessaoDbService.getById(sessaoId)
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
    const parlamentar = await parlamentarDbService.getById(payload.parlamentarId)
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
  context: { params: Promise<{ id: string }> },
  session
) => {
  const { id: sessaoId } = await context.params

  const sessao = await sessaoDbService.getById(sessaoId)
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
