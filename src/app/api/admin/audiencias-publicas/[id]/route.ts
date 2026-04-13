import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  titulo: z.string().min(3).optional(),
  descricao: z.string().min(3).optional(),
  tipo: z.enum(['ORDINARIA', 'EXTRAORDINARIA', 'ESPECIAL']).optional(),
  status: z.enum(['AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA', 'ADIADA']).optional(),
  dataHora: z.string().optional(),
  local: z.string().min(1).optional(),
  endereco: z.string().optional().nullable(),
  responsavel: z.string().min(1).optional(),
  parlamentarId: z.string().optional().nullable(),
  comissaoId: z.string().optional().nullable(),
  materiaLegislativaId: z.string().optional().nullable(),
  objetivo: z.string().min(1).optional(),
  publicoAlvo: z.string().min(1).optional(),
  observacoes: z.string().optional().nullable(),
  participantes: z.array(z.unknown()).optional(),
  documentos: z.array(z.unknown()).optional(),
  atas: z.array(z.unknown()).optional(),
  transcricoes: z.array(z.unknown()).optional(),
  links: z.array(z.unknown()).optional(),
  transmissaoAoVivo: z.unknown().optional(),
  inscricoesPublicas: z.unknown().optional(),
  publicacaoPublica: z.unknown().optional(),
  cronograma: z.unknown().optional(),
})

export const GET = withAuth(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    const audiencia = await prisma.audienciaPublica.findUnique({ where: { id: params.id } })
    if (!audiencia) throw new NotFoundError('Audiencia nao encontrada')
    return createSuccessResponse(audiencia)
  },
  { permissions: ['sessao.view'] },
)

export const PUT = withAuth(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const body = await request.json()
    const data = updateSchema.parse(body)

    const updateData: Record<string, unknown> = { ...data }
    if (data.dataHora) updateData.dataHora = new Date(data.dataHora)

    const updated = await prisma.audienciaPublica.update({
      where: { id: params.id },
      data: updateData as never,
    })

    return createSuccessResponse(updated)
  },
  { permissions: ['sessao.manage'] },
)

export const DELETE = withAuth(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    await prisma.audienciaPublica.delete({ where: { id: params.id } })
    return createSuccessResponse({ deleted: true })
  },
  { permissions: ['sessao.manage'] },
)
