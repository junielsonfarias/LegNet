import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, withErrorHandler } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const OficioCreateSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório'),
  data: z.string().min(1, 'Data é obrigatória'),
  remetente: z.string().min(1, 'Remetente é obrigatório'),
  assunto: z.string().min(1, 'Assunto é obrigatório'),
  arquivo: z.string().nullish().transform(v => v ?? undefined),
  observacoes: z.string().nullish().transform(v => v ?? undefined)
})

export const GET = withAuth(withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const lido = searchParams.get('lido')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  const where: Record<string, boolean> = {}
  if (lido === 'true') where.lido = true
  if (lido === 'false') where.lido = false

  const [oficios, total] = await Promise.all([
    prisma.oficio.findMany({
      where,
      orderBy: { data: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.oficio.count({ where })
  ])

  return createSuccessResponse(oficios, 'Ofícios carregados', total)
}), { permissions: 'sessao.view' })

export const POST = withAuth(withErrorHandler(async (request: NextRequest, _ctx, session) => {
  const body = await request.json()
  const data = OficioCreateSchema.parse(body)

  const oficio = await prisma.oficio.create({
    data: {
      numero: data.numero,
      data: new Date(data.data),
      remetente: data.remetente,
      assunto: data.assunto,
      arquivo: data.arquivo || null,
      observacoes: data.observacoes || null
    }
  })

  await logAudit({
    request, session,
    action: 'OFICIO_CREATE',
    entity: 'Oficio',
    entityId: oficio.id,
    metadata: { numero: oficio.numero, remetente: oficio.remetente }
  })

  return createSuccessResponse(oficio, 'Ofício cadastrado com sucesso', undefined, 201)
}), { permissions: 'sessao.manage' })
