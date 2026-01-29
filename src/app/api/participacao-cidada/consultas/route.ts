import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  createErrorResponse,
  ValidationError
} from '@/lib/error-handler'

// Força rota dinâmica para evitar erro de renderização estática
export const dynamic = 'force-dynamic'

// Interface para consulta pública
interface ConsultaPublica {
  id: string
  titulo: string
  descricao: string
  tipo: 'CONSULTA' | 'ENQUETE' | 'DEBATE'
  categoria: string
  dataInicio: string
  dataFim: string
  status: 'ATIVA' | 'FINALIZADA' | 'CANCELADA'
  participantes: number
  resultado?: string
  createdAt: string
  updatedAt: string
}

// Dados mock para consultas públicas
let consultasData: ConsultaPublica[] = [
  {
    id: '1',
    titulo: 'Consulta sobre o Plano Diretor Municipal',
    descricao: 'Consulta pública para discussão do novo Plano Diretor Municipal.',
    tipo: 'CONSULTA',
    categoria: 'planejamento',
    dataInicio: '2025-01-01',
    dataFim: '2025-03-31',
    status: 'ATIVA',
    participantes: 156,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z'
  },
  {
    id: '2',
    titulo: 'Enquete sobre transporte público',
    descricao: 'Avaliação da população sobre melhorias no transporte público municipal.',
    tipo: 'ENQUETE',
    categoria: 'mobilidade',
    dataInicio: '2025-01-10',
    dataFim: '2025-02-10',
    status: 'ATIVA',
    participantes: 89,
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-01-20T14:30:00Z'
  },
  {
    id: '3',
    titulo: 'Debate sobre políticas de saúde',
    descricao: 'Discussão sobre melhorias na rede pública de saúde do município.',
    tipo: 'DEBATE',
    categoria: 'saude',
    dataInicio: '2024-12-01',
    dataFim: '2024-12-31',
    status: 'FINALIZADA',
    participantes: 234,
    resultado: 'Relatório final disponível para download',
    createdAt: '2024-12-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }
]

// GET - Listar consultas públicas
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const tipo = searchParams.get('tipo')
  const categoria = searchParams.get('categoria')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  let consultas = [...consultasData]

  // Aplicar filtros
  if (status) {
    consultas = consultas.filter(c => c.status === status)
  }
  
  if (tipo) {
    consultas = consultas.filter(c => c.tipo === tipo)
  }
  
  if (categoria) {
    consultas = consultas.filter(c => c.categoria === categoria)
  }

  // Paginação
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedConsultas = consultas.slice(startIndex, endIndex)

  return createSuccessResponse(
    paginatedConsultas,
    'Consultas públicas listadas com sucesso',
    consultas.length,
    200,
    {
      total: consultas.length,
      page,
      limit,
      totalPages: Math.ceil(consultas.length / limit)
    }
  )
})
