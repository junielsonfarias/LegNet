import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError
} from '@/lib/error-handler'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  criarRelatorioAgendado,
  listarRelatoriosAgendados,
  listarTiposRelatorio
} from '@/lib/services/relatorio-agendado-service'

export const dynamic = 'force-dynamic'

const CriarRelatorioSchema = z.object({
  nome: z.string().min(3, 'Nome e obrigatorio'),
  descricao: z.string().optional(),
  tipo: z.string().min(1, 'Tipo e obrigatorio'),
  filtros: z.record(z.any()).optional(),
  frequencia: z.enum(['DIARIO', 'SEMANAL', 'MENSAL', 'SOB_DEMANDA']),
  diaSemana: z.number().int().min(0).max(6).optional(),
  diaHora: z.string().optional(),
  destinatarios: z.array(z.string().email()),
  formato: z.enum(['PDF', 'EXCEL', 'CSV'])
})

/**
 * GET - Listar relatórios agendados ou tipos disponíveis
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new ValidationError('Não autorizado')
  }

  const { searchParams } = new URL(request.url)
  const acao = searchParams.get('acao')

  // Listar tipos de relatórios
  if (acao === 'tipos') {
    const tipos = listarTiposRelatorio()
    return createSuccessResponse(tipos, 'Tipos de relatórios')
  }

  // Listar relatórios agendados
  const relatorios = await listarRelatoriosAgendados()
  return createSuccessResponse(relatorios, 'Relatórios agendados')
})

/**
 * POST - Criar relatório agendado
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new ValidationError('Não autorizado')
  }

  const body = await request.json()
  const validatedData = CriarRelatorioSchema.parse(body)
  const relatorio = await criarRelatorioAgendado(validatedData)

  return createSuccessResponse(relatorio, 'Relatório agendado criado')
})
