import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  criarNorma,
  listarNormas,
  getEstatisticasNormas,
  buscarNormasFullText
} from '@/lib/services/norma-juridica-service'

export const dynamic = 'force-dynamic'

const CriarNormaSchema = z.object({
  tipo: z.enum([
    'LEI_ORDINARIA', 'LEI_COMPLEMENTAR', 'DECRETO_LEGISLATIVO',
    'RESOLUCAO', 'EMENDA_LEI_ORGANICA', 'LEI_ORGANICA', 'REGIMENTO_INTERNO'
  ]),
  numero: z.number().int().positive('Número é obrigatório'),
  ano: z.number().int().min(1900).max(2100),
  data: z.string().datetime(),
  dataPublicacao: z.string().datetime().optional(),
  dataVigencia: z.string().datetime().optional(),
  ementa: z.string().min(10, 'Ementa é obrigatória'),
  preambulo: z.string().optional(),
  texto: z.string().min(10, 'Texto é obrigatório'),
  assunto: z.string().optional(),
  indexacao: z.string().optional(),
  observacao: z.string().optional(),
  proposicaoOrigemId: z.string().optional()
})

const FiltrosSchema = z.object({
  tipo: z.enum([
    'LEI_ORDINARIA', 'LEI_COMPLEMENTAR', 'DECRETO_LEGISLATIVO',
    'RESOLUCAO', 'EMENDA_LEI_ORGANICA', 'LEI_ORGANICA', 'REGIMENTO_INTERNO'
  ]).optional(),
  situacao: z.enum([
    'VIGENTE', 'REVOGADA', 'REVOGADA_PARCIALMENTE', 'COM_ALTERACOES', 'SUSPENSA'
  ]).optional(),
  ano: z.coerce.number().optional(),
  busca: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
})

/**
 * GET - Listar normas ou buscar
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const acao = searchParams.get('acao')

  // Busca pública não requer autenticação
  if (acao === 'busca') {
    const termo = searchParams.get('termo')
    if (!termo) {
      throw new ValidationError('Termo de busca é obrigatório')
    }
    const resultados = await buscarNormasFullText(termo)
    return createSuccessResponse(resultados, 'Resultados da busca')
  }

  // Estatísticas
  if (acao === 'estatisticas') {
    const session = await getServerSession(authOptions)
    if (!session) {
      throw new ValidationError('Não autorizado')
    }
    const ano = searchParams.get('ano')
    const stats = await getEstatisticasNormas(ano ? parseInt(ano) : undefined)
    return createSuccessResponse(stats, 'Estatísticas de normas')
  }

  // Listar com filtros
  const filtrosRaw: Record<string, string | undefined> = {}
  searchParams.forEach((value, key) => {
    filtrosRaw[key] = value
  })

  const filtros = FiltrosSchema.parse(filtrosRaw)

  const resultado = await listarNormas(
    {
      tipo: filtros.tipo,
      situacao: filtros.situacao,
      ano: filtros.ano,
      busca: filtros.busca
    },
    filtros.page,
    filtros.limit
  )

  return createSuccessResponse(resultado, 'Normas listadas')
})

/**
 * POST - Criar nova norma
 * SEGURANÇA: Requer autenticação e permissão de gestão legislativa
 */
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = CriarNormaSchema.parse(body)

  const norma = await criarNorma({
    ...validatedData,
    data: new Date(validatedData.data),
    dataPublicacao: validatedData.dataPublicacao ? new Date(validatedData.dataPublicacao) : undefined,
    dataVigencia: validatedData.dataVigencia ? new Date(validatedData.dataVigencia) : undefined
  })

  return createSuccessResponse(norma, 'Norma criada com sucesso')
}, { permissions: 'proposicao.manage' })
