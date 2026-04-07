import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { pautasDbService } from '@/lib/services/pautas-db-service'
import { sessaoDbService } from '@/lib/services/sessao-db-service'

export const dynamic = 'force-dynamic'

const PautaCreateSchema = z.object({
  sessaoId: z.string().min(1, 'Sessão é obrigatória'),
  observacoes: z.string().nullish().transform(v => v ?? undefined),
  geradaAutomaticamente: z.boolean().nullish().transform(v => v ?? false)
})

const PautaQuerySchema = z.object({
  status: z.enum(['RASCUNHO', 'APROVADA', 'EM_ANDAMENTO', 'CONCLUIDA']).nullish().transform(v => v ?? undefined),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20)
})

// GET - Lista pautas
export const GET = withAuth(withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  const query = PautaQuerySchema.parse({
    status: searchParams.get('status') || undefined,
    page: searchParams.get('page') || 1,
    limit: searchParams.get('limit') || 20
  })

  const result = await pautasDbService.paginate(
    { status: query.status },
    { page: query.page, limit: query.limit }
  )

  const pautasFormatadas = result.data.map((pauta: any) => ({
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
    meta: result.pagination
  })
}), { permissions: 'pauta.view' })

// POST - Cria nova pauta
export const POST = withAuth(withErrorHandler(async (request: NextRequest, _context, session) => {
  const body = await request.json()
  const payload = PautaCreateSchema.parse(body)

  // Verificar se sessão existe e se já tem pauta
  const sessao = await sessaoDbService.getById(payload.sessaoId, { pautaSessao: true })

  if (!sessao) throw new ValidationError('Sessão não encontrada')
  if ((sessao as any).pautaSessao) throw new ValidationError('Esta sessão já possui uma pauta vinculada')

  const pauta = await pautasDbService.create(payload)

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
