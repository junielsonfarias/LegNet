import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, NotFoundError, ValidationError, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { oradorSessaoDbService } from '@/lib/services/orador-sessao-db-service'

export const dynamic = 'force-dynamic'

const OradorCreateSchema = z.object({
  parlamentarId: z.string().min(1, 'Parlamentar é obrigatório'),
  tipo: z.enum([
    'PEQUENO_EXPEDIENTE', 'GRANDE_EXPEDIENTE', 'LIDERANCA',
    'ORDEM_DO_DIA', 'EXPLICACAO_PESSOAL', 'APARTE',
    'TRIBUNA_LIVRE', 'COMUNICACAO'
  ]),
  tempoLimite: z.number().int().min(1).optional(),
  assunto: z.string().optional(),
  observacoes: z.string().optional()
})

export const GET = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const sessaoId = params.id
  const { searchParams } = new URL(request.url)

  const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } })
  if (!sessao) throw new NotFoundError('Sessão')

  const oradores = await oradorSessaoDbService.listBySessao(sessaoId, {
    tipo: searchParams.get('tipo') || undefined,
    status: searchParams.get('status') || undefined
  })

  const oradoresPorTipo = oradores.reduce((acc: any, orador: any) => {
    if (!acc[orador.tipo]) acc[orador.tipo] = []
    acc[orador.tipo].push(orador)
    return acc
  }, {})

  return createSuccessResponse({
    oradores,
    oradoresPorTipo,
    totais: {
      total: oradores.length,
      inscritos: oradores.filter((o: any) => o.status === 'INSCRITO').length,
      falando: oradores.filter((o: any) => o.status === 'FALANDO').length,
      concluidos: oradores.filter((o: any) => o.status === 'CONCLUIDO').length
    }
  })
}), { permissions: 'sessao.view' })

export const POST = withAuth(withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  session
) => {
  const sessaoId = params.id
  const body = await request.json()
  const payload = OradorCreateSchema.parse(body)

  const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } })
  if (!sessao) throw new NotFoundError('Sessão')

  const parlamentar = await prisma.parlamentar.findUnique({ where: { id: payload.parlamentarId } })
  if (!parlamentar) throw new NotFoundError('Parlamentar')

  const inscricaoExistente = await oradorSessaoDbService.checkInscricaoExistente(sessaoId, payload.parlamentarId, payload.tipo)
  if (inscricaoExistente) {
    throw new ValidationError('Parlamentar já está inscrito para este tipo de pronunciamento')
  }

  const orador = await oradorSessaoDbService.create(sessaoId, payload)

  await logAudit({
    request, session,
    action: 'ORADOR_INSCRITO',
    entity: 'OradorSessao',
    entityId: orador.id,
    metadata: { sessaoId, parlamentarId: payload.parlamentarId, tipo: payload.tipo }
  })

  return createSuccessResponse(orador, 'Orador inscrito com sucesso')
}), { permissions: 'sessao.manage' })
