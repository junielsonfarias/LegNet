import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { 
  withErrorHandler, 
  createSuccessResponse, 
  createErrorResponse,
  ValidationError
} from '@/lib/error-handler'

// Schema de validação para sugestão
const SugestaoSchema = z.object({
  titulo: z.string()
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  descricao: z.string()
    .min(10, 'Descrição deve ter pelo menos 10 caracteres')
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres'),
  categoria: z.string()
    .min(2, 'Categoria é obrigatória')
    .max(50, 'Categoria deve ter no máximo 50 caracteres'),
  autorNome: z.string()
    .min(2, 'Nome do autor é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  autorEmail: z.string()
    .email('Email inválido')
    .max(100, 'Email deve ter no máximo 100 caracteres'),
  autorTelefone: z.string()
    .optional()
    .refine(val => !val || val.length >= 10, 'Telefone deve ter pelo menos 10 caracteres'),
  anonimo: z.boolean().default(false)
})

// Interface para sugestão
interface Sugestao {
  id: string
  titulo: string
  descricao: string
  categoria: string
  autorNome: string
  autorEmail: string
  autorTelefone?: string
  anonimo: boolean
  status: 'PENDENTE' | 'EM_ANALISE' | 'ACEITA' | 'REJEITADA' | 'ARQUIVADA'
  resposta?: string
  dataResposta?: string
  createdAt: string
  updatedAt: string
}

// Dados mock para sugestões
let sugestoesData: Sugestao[] = [
  {
    id: '1',
    titulo: 'Melhoria na iluminação pública do centro',
    descricao: 'Sugestão para melhorar a iluminação pública na região central da cidade, especialmente nas ruas comerciais.',
    categoria: 'infraestrutura',
    autorNome: 'Maria Silva',
    autorEmail: 'maria@email.com',
    autorTelefone: '(93) 99999-1111',
    anonimo: false,
    status: 'EM_ANALISE',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-20T14:30:00Z'
  },
  {
    id: '2',
    titulo: 'Criação de ciclovia na avenida principal',
    descricao: 'Sugestão para criação de uma ciclovia na avenida principal para incentivar o uso de bicicletas.',
    categoria: 'mobilidade',
    autorNome: 'João Santos',
    autorEmail: 'joao@email.com',
    anonimo: false,
    status: 'PENDENTE',
    createdAt: '2025-01-18T15:30:00Z',
    updatedAt: '2025-01-18T15:30:00Z'
  }
]

// GET - Listar sugestões
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const categoria = searchParams.get('categoria')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  let sugestoes = [...sugestoesData]

  // Aplicar filtros
  if (status) {
    sugestoes = sugestoes.filter(s => s.status === status)
  }
  
  if (categoria) {
    sugestoes = sugestoes.filter(s => s.categoria === categoria)
  }

  // Paginação
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedSugestoes = sugestoes.slice(startIndex, endIndex)

  return createSuccessResponse(
    paginatedSugestoes,
    'Sugestões listadas com sucesso',
    sugestoes.length,
    200,
    {
      total: sugestoes.length,
      page,
      limit,
      totalPages: Math.ceil(sugestoes.length / limit)
    }
  )
})

// POST - Criar sugestão
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  
  // Validar dados
  const validatedData = SugestaoSchema.parse(body)
  
  // Criar nova sugestão
  const novaSugestao: Sugestao = {
    id: Date.now().toString(),
    titulo: validatedData.titulo,
    descricao: validatedData.descricao,
    categoria: validatedData.categoria,
    autorNome: validatedData.autorNome,
    autorEmail: validatedData.autorEmail,
    autorTelefone: validatedData.autorTelefone,
    anonimo: validatedData.anonimo,
    status: 'PENDENTE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  // Adicionar à lista (em produção, salvaria no banco)
  sugestoesData.push(novaSugestao)
  
  return createSuccessResponse(
    {
      id: novaSugestao.id,
      titulo: novaSugestao.titulo,
      descricao: novaSugestao.descricao,
      categoria: novaSugestao.categoria
    },
    'Sugestão enviada com sucesso',
    undefined,
    201
  )
})
