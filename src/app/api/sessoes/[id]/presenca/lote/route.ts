import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { presencaDbService } from '@/lib/services/presenca-db-service'

export const dynamic = 'force-dynamic'

const BulkPresencaSchema = z.object({
  presencas: z.array(z.object({
    parlamentarId: z.string().min(1),
    presente: z.boolean(),
    justificativa: z.string().nullish().transform(v => v ?? undefined)
  })).min(1, 'Informe ao menos uma presenca'),
  marcarTodosPresentes: z.boolean().optional()
})

export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  session
) => {
  const { id: sessaoId } = await context.params
  const body = await request.json()
  const { presencas, marcarTodosPresentes } = BulkPresencaSchema.parse(body)

  const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } })
  if (!sessao) throw new NotFoundError('Sessao')

  let listaPresencas = presencas

  // Se marcarTodosPresentes, buscar todos parlamentares ativos
  if (marcarTodosPresentes) {
    const parlamentares = await prisma.parlamentar.findMany({
      where: { ativo: true },
      select: { id: true }
    })
    listaPresencas = parlamentares.map(p => ({
      parlamentarId: p.id,
      presente: true
    }))
  }

  const results = await presencaDbService.registrarLote(sessaoId, listaPresencas)

  await logAudit({
    request,
    session,
    action: 'PRESENCA_LOTE',
    entity: 'Sessao',
    entityId: sessaoId,
    metadata: { total: results.length, presentes: results.filter(r => r.presente).length }
  })

  return createSuccessResponse(
    { total: results.length, presentes: results.filter((r: any) => r.presente).length },
    `Presenca registrada para ${results.length} parlamentar(es)`
  )
}, { permissions: 'sessao.manage' })
