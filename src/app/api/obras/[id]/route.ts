import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, NotFoundError } from '@/lib/error-handler'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('api/transparencia/obras-detalhe')

export const dynamic = 'force-dynamic'

const UpdateSchema = z.object({
  descricao: z.string().min(1).optional(),
  endereco: z.string().nullish(),
  bairro: z.string().nullish(),
  cidade: z.string().nullish(),
  valorEstimado: z.number().nullish(),
  valorContratado: z.number().nullish(),
  valorExecutado: z.number().nullish(),
  // Fase M (PNTP 10.3) — execução física e pagamento
  valorPago: z.number().nullish(),
  quantidadeContratada: z.number().nullish(),
  quantidadeExecutada: z.number().nullish(),
  unidadeMedida: z.string().nullish(),
  dataUltimaMedicao: z.string().nullish(),
  dataInicio: z.string().nullish(),
  dataPrevistaFim: z.string().nullish(),
  dataConclusao: z.string().nullish(),
  percentualExecucao: z.number().int().min(0).max(100).optional(),
  situacao: z.enum(['PLANEJADA', 'EM_ANDAMENTO', 'PARALISADA', 'CONCLUIDA', 'CANCELADA']).optional(),
  motivoParalisacao: z.string().nullish(),
  contratoId: z.string().nullish(),
  arquivo: z.string().nullish(),
  observacoes: z.string().nullish()
})

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const item = await prisma.obra.findUnique({ where: { id }, include: { contrato: true } })
  if (!item) throw new NotFoundError('Obra nao encontrada')
  return createSuccessResponse(item)
})

export const PUT = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const data = UpdateSchema.parse(body)
  const updated = await prisma.obra.update({
    where: { id },
    data: {
      ...data,
      dataInicio: data.dataInicio ? new Date(data.dataInicio) : undefined,
      dataPrevistaFim: data.dataPrevistaFim ? new Date(data.dataPrevistaFim) : undefined,
      dataConclusao: data.dataConclusao ? new Date(data.dataConclusao) : undefined,
      dataUltimaMedicao: data.dataUltimaMedicao ? new Date(data.dataUltimaMedicao) : undefined
    }
  })
  log.info('Obra atualizada', {
    action: 'obra_update',
    id,
    situacao: updated.situacao,
    percentualExecucao: updated.percentualExecucao
  })

  return createSuccessResponse(updated, 'Obra atualizada')
}, { permissions: 'transparencia.manage' })

export const DELETE = withAuth(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  await prisma.obra.delete({ where: { id } })

  log.info('Obra removida', {
    action: 'obra_delete',
    id
  })

  return createSuccessResponse(null, 'Obra removida')
}, { permissions: 'transparencia.manage' })
