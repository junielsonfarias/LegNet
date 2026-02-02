import { z } from 'zod'

/**
 * Schema base para paginação
 * Usado em todos os endpoints de listagem
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

/**
 * Schema para filtros de data
 */
export const DateFilterSchema = z.object({
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  ano: z.coerce.number().int().min(2000).max(2100).optional(),
  mes: z.coerce.number().int().min(1).max(12).optional()
})

/**
 * Schema base para filtros financeiros (sem refine para permitir merge)
 */
export const FinanceiroFilterBaseSchema = z.object({
  valorMinimo: z.coerce.number().min(0).optional(),
  valorMaximo: z.coerce.number().min(0).optional()
})

/**
 * Schema para filtros financeiros com validação (não pode ser mesclado)
 */
export const FinanceiroFilterSchema = FinanceiroFilterBaseSchema.refine(
  data => !data.valorMinimo || !data.valorMaximo || data.valorMinimo <= data.valorMaximo,
  { message: 'valorMinimo deve ser menor ou igual a valorMaximo' }
)

/**
 * Schema para ordenação
 */
export const OrderSchema = z.object({
  orderBy: z.string().optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc')
})

/**
 * Combina schemas de query comuns
 */
export const BaseQuerySchema = PaginationSchema.merge(OrderSchema)

/**
 * Helper para extrair e validar query params
 */
export function parseQueryParams<T extends z.ZodTypeAny>(
  searchParams: URLSearchParams,
  schema: T
): z.infer<T> {
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })
  return schema.parse(params)
}

/**
 * Helper para validar query params com fallback seguro
 * Retorna os valores padrão em caso de erro
 */
export function safeParseQueryParams<T extends z.ZodTypeAny>(
  searchParams: URLSearchParams,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })
  return schema.safeParse(params)
}

// Schemas específicos para cada módulo

/**
 * Schema para query params de proposições
 * O campo 'tipo' aceita qualquer código de tipo cadastrado em TipoProposicaoConfig
 */
export const ProposicaoQuerySchema = BaseQuerySchema.extend({
  status: z.enum(['APRESENTADA', 'EM_TRAMITACAO', 'APROVADA', 'REJEITADA', 'ARQUIVADA', 'VETADA']).optional(),
  tipo: z.string().max(50).optional(), // Tipos são dinâmicos - validados contra TipoProposicaoConfig
  autorId: z.string().optional(),
  ano: z.coerce.number().int().min(2000).max(2100).optional()
})

/**
 * Schema para query params de sessões
 */
export const SessaoQuerySchema = BaseQuerySchema.extend({
  status: z.enum(['AGENDADA', 'EM_ANDAMENTO', 'SUSPENSA', 'CONCLUIDA', 'CANCELADA']).optional(),
  tipo: z.enum(['ORDINARIA', 'EXTRAORDINARIA', 'SOLENE', 'ESPECIAL']).optional(),
  legislaturaId: z.string().optional(),
  periodoId: z.string().optional()
})

/**
 * Schema para query params de parlamentares
 */
export const ParlamentarQuerySchema = BaseQuerySchema.extend({
  ativo: z.coerce.boolean().optional(),
  partido: z.string().optional(),
  cargo: z.string().optional()
})

/**
 * Schema para query params de despesas/receitas
 * Usa FinanceiroFilterBaseSchema para permitir merge
 */
export const TransacaoFinanceiraQuerySchema = BaseQuerySchema
  .merge(DateFilterSchema)
  .merge(FinanceiroFilterBaseSchema)
  .extend({
    situacao: z.string().optional(),
    credor: z.string().optional(),
    elemento: z.string().optional(),
    funcao: z.string().optional(),
    programa: z.string().optional()
  })

/**
 * Schema para query params de auditoria
 */
export const AuditoriaQuerySchema = BaseQuerySchema
  .merge(DateFilterSchema)
  .extend({
    tipo: z.enum(['eventos', 'recentes', 'erros', 'usuario', 'suspeitos', 'estatisticas', 'relatorios', 'export']).optional(),
    usuarioId: z.string().optional(),
    acao: z.string().optional(),
    entidade: z.string().optional(),
    entidadeId: z.string().optional(),
    sucesso: z.coerce.boolean().optional(),
    ip: z.string().optional(),
    limite: z.coerce.number().int().min(1).max(1000).optional(),
    formato: z.enum(['json', 'csv']).optional()
  })

/**
 * Schema para query params de contratos
 */
export const ContratoQuerySchema = BaseQuerySchema
  .merge(DateFilterSchema)
  .merge(FinanceiroFilterBaseSchema)
  .extend({
    situacao: z.string().optional(),
    tipo: z.string().optional(),
    fornecedor: z.string().optional(),
    search: z.string().optional()
  })

/**
 * Schema para query params de licitações
 */
export const LicitacaoQuerySchema = BaseQuerySchema
  .merge(DateFilterSchema)
  .merge(FinanceiroFilterBaseSchema)
  .extend({
    modalidade: z.string().optional(),
    situacao: z.string().optional(),
    search: z.string().optional()
  })

/**
 * Schema para query params de despesas
 */
export const DespesaQuerySchema = BaseQuerySchema
  .merge(DateFilterSchema)
  .merge(FinanceiroFilterBaseSchema)
  .extend({
    situacao: z.string().optional(),
    credor: z.string().optional(),
    elemento: z.string().optional(),
    search: z.string().optional()
  })

/**
 * Schema para query params de receitas
 */
export const ReceitaQuerySchema = BaseQuerySchema
  .merge(DateFilterSchema)
  .merge(FinanceiroFilterBaseSchema)
  .extend({
    tipo: z.string().optional(),
    fonte: z.string().optional(),
    search: z.string().optional()
  })

/**
 * Schema para query params de publicações
 */
export const PublicacaoQuerySchema = BaseQuerySchema
  .merge(DateFilterSchema)
  .extend({
    tipo: z.string().optional(),
    categoria: z.string().optional(),
    search: z.string().optional()
  })

/**
 * Schema para query params de busca global
 */
export const BuscaQuerySchema = z.object({
  q: z.string().min(1, 'Termo de busca obrigatório'),
  tipo: z.enum(['todos', 'proposicoes', 'parlamentares', 'sessoes', 'noticias', 'publicacoes', 'normas']).optional(),
  limite: z.coerce.number().int().min(1).max(100).default(20),
  pagina: z.coerce.number().int().min(1).default(1)
})

/**
 * Schema para query params de calendário
 */
export const CalendarioQuerySchema = z.object({
  ano: z.coerce.number().int().min(2000).max(2100).default(new Date().getFullYear()),
  mes: z.coerce.number().int().min(1).max(12).default(new Date().getMonth() + 1),
  tipo: z.enum(['eventos', 'proximos']).optional(),
  limite: z.coerce.number().int().min(1).max(50).default(5)
})

/**
 * Schema para query params de streaming/painel
 */
export const PainelStreamingQuerySchema = z.object({
  ano: z.coerce.number().int().min(2000).max(2100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  tipo: z.enum(['sessoes', 'votacoes', 'presencas']).optional()
})

/**
 * Schema para query params de favoritos
 */
export const FavoritosQuerySchema = PaginationSchema.extend({
  tipo: z.string().optional()
})

/**
 * Valida um número inteiro de query param de forma segura
 * Retorna o valor padrão se inválido
 */
export function safeParseInt(
  value: string | null | undefined,
  defaultValue: number,
  min?: number,
  max?: number
): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue
  }

  const parsed = parseInt(value, 10)

  if (isNaN(parsed)) {
    return defaultValue
  }

  if (min !== undefined && parsed < min) {
    return min
  }

  if (max !== undefined && parsed > max) {
    return max
  }

  return parsed
}

/**
 * Extrai e valida parâmetros de paginação de forma segura
 */
export function extractPaginationParams(searchParams: URLSearchParams): {
  page: number
  limit: number
  skip: number
} {
  const page = safeParseInt(searchParams.get('page'), 1, 1)
  const limit = safeParseInt(searchParams.get('limit'), 20, 1, 100)
  const skip = (page - 1) * limit

  return { page, limit, skip }
}
