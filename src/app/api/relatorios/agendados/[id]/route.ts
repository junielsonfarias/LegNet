import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  NotFoundError,
  validateId
} from '@/lib/error-handler'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  buscarRelatorioAgendado,
  atualizarRelatorioAgendado,
  removerRelatorioAgendado,
  executarRelatorio
} from '@/lib/services/relatorio-agendado-service'

export const dynamic = 'force-dynamic'

const AtualizarSchema = z.object({
  nome: z.string().min(3).optional(),
  descricao: z.string().optional(),
  filtros: z.record(z.any()).optional(),
  frequencia: z.enum(['DIARIO', 'SEMANAL', 'QUINZENAL', 'MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL']).optional(),
  diaSemana: z.number().int().min(0).max(6).optional(),
  diaHora: z.string().optional(),
  destinatarios: z.array(z.string().email()).optional(),
  formato: z.enum(['PDF', 'EXCEL', 'CSV']).optional()
})

/**
 * GET - Buscar relatório agendado por ID
 */
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new ValidationError('Não autorizado')
  }

  const id = params.id
  const relatorio = await buscarRelatorioAgendado(id)

  if (!relatorio) {
    throw new NotFoundError('Relatório agendado')
  }

  return createSuccessResponse(relatorio, 'Relatório encontrado')
})

/**
 * PUT - Atualizar relatório agendado
 */
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new ValidationError('Não autorizado')
  }

  const id = validateId(params.id, 'Relatório')
  const body = await request.json()
  const validatedData = AtualizarSchema.parse(body)

  const relatorio = await atualizarRelatorioAgendado(id, validatedData)

  return createSuccessResponse(relatorio, 'Relatório atualizado')
})

/**
 * POST - Executar relatório
 */
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new ValidationError('Não autorizado')
  }

  const id = validateId(params.id, 'Relatório')
  const resultado = await executarRelatorio(id)

  return createSuccessResponse(resultado, 'Relatório executado')
})

/**
 * DELETE - Remover relatório agendado
 */
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new ValidationError('Não autorizado')
  }

  const id = validateId(params.id, 'Relatório')
  await removerRelatorioAgendado(id)

  return createSuccessResponse({ id }, 'Relatório removido')
})
