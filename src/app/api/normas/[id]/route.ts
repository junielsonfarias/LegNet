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
  buscarNormaPorId,
  atualizarNorma,
  adicionarArtigo,
  adicionarParagrafo,
  registrarAlteracao,
  buscarVersoes,
  buscarVersao
} from '@/lib/services/norma-juridica-service'
import {
  compilarNorma,
  compararVersoes,
  indexarNorma
} from '@/lib/services/compilacao-service'

export const dynamic = 'force-dynamic'

const AtualizarNormaSchema = z.object({
  situacao: z.enum([
    'VIGENTE', 'REVOGADA', 'REVOGADA_PARCIALMENTE', 'COM_ALTERACOES', 'SUSPENSA'
  ]).optional(),
  ementa: z.string().optional(),
  texto: z.string().optional(),
  textoCompilado: z.string().optional(),
  assunto: z.string().optional(),
  indexacao: z.string().optional(),
  observacao: z.string().optional()
})

const ArtigoSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório'),
  caput: z.string().min(1, 'Caput é obrigatório'),
  vigente: z.boolean().optional()
})

const ParagrafoSchema = z.object({
  artigoId: z.string().min(1, 'Artigo é obrigatório'),
  tipo: z.enum(['PARAGRAFO', 'INCISO', 'ALINEA']),
  numero: z.string().optional(),
  texto: z.string().min(1, 'Texto é obrigatório'),
  vigente: z.boolean().optional()
})

const AlteracaoSchema = z.object({
  normaAlteradoraId: z.string().min(1, 'Norma alteradora é obrigatória'),
  tipoAlteracao: z.enum(['REVOGACAO', 'REVOGACAO_PARCIAL', 'ALTERACAO', 'ACRESCIMO', 'NOVA_REDACAO']),
  artigoAlterado: z.string().optional(),
  descricao: z.string().min(1, 'Descrição é obrigatória')
})

/**
 * GET - Buscar norma por ID
 */
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = params.id
  const { searchParams } = new URL(request.url)
  const acao = searchParams.get('acao')

  // Texto compilado - público
  if (acao === 'compilado') {
    const compilacao = await compilarNorma(id)
    return createSuccessResponse(compilacao, 'Texto compilado')
  }

  // Histórico de versões - público
  if (acao === 'versoes') {
    const versoes = await buscarVersoes(id)
    return createSuccessResponse(versoes, 'Versões da norma')
  }

  // Versão específica
  if (acao === 'versao') {
    const versaoNum = searchParams.get('numero')
    if (!versaoNum) {
      throw new ValidationError('Número da versão é obrigatório')
    }
    const versao = await buscarVersao(id, parseInt(versaoNum))
    if (!versao) {
      throw new NotFoundError('Versão')
    }
    return createSuccessResponse(versao, 'Versão encontrada')
  }

  // Comparar versões
  if (acao === 'comparar') {
    const versaoA = searchParams.get('versaoA')
    const versaoB = searchParams.get('versaoB')
    if (!versaoA || !versaoB) {
      throw new ValidationError('Versões A e B são obrigatórias')
    }
    const comparacao = await compararVersoes(id, parseInt(versaoA), parseInt(versaoB))
    return createSuccessResponse(comparacao, 'Comparação de versões')
  }

  // Buscar norma completa
  const norma = await buscarNormaPorId(id)
  if (!norma) {
    throw new NotFoundError('Norma')
  }

  return createSuccessResponse(norma, 'Norma encontrada')
})

/**
 * PUT - Atualizar norma
 */
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new ValidationError('Não autorizado')
  }

  const id = validateId(params.id, 'Norma')
  const body = await request.json()
  const validatedData = AtualizarNormaSchema.parse(body)

  const norma = await atualizarNorma(id, validatedData)

  return createSuccessResponse(norma, 'Norma atualizada')
})

/**
 * POST - Ações específicas: artigo, paragrafo, alteracao, compilar, indexar
 */
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new ValidationError('Não autorizado')
  }

  const id = validateId(params.id, 'Norma')
  const { searchParams } = new URL(request.url)
  const acao = searchParams.get('acao')
  const body = await request.json().catch(() => ({}))

  switch (acao) {
    case 'artigo': {
      const data = ArtigoSchema.parse(body)
      const artigo = await adicionarArtigo({
        normaId: id,
        ...data
      })
      return createSuccessResponse(artigo, 'Artigo adicionado')
    }

    case 'paragrafo': {
      const data = ParagrafoSchema.parse(body)
      const paragrafo = await adicionarParagrafo(data)
      return createSuccessResponse(paragrafo, 'Parágrafo adicionado')
    }

    case 'alteracao': {
      const data = AlteracaoSchema.parse(body)
      const alteracao = await registrarAlteracao({
        normaAlteradaId: id,
        ...data
      })
      return createSuccessResponse(alteracao, 'Alteração registrada')
    }

    case 'compilar': {
      const compilacao = await compilarNorma(id)
      return createSuccessResponse(compilacao, 'Norma compilada')
    }

    case 'indexar': {
      const indexacao = await indexarNorma(id)
      return createSuccessResponse({ indexacao }, 'Norma indexada')
    }

    default:
      throw new ValidationError('Ação inválida. Use: artigo, paragrafo, alteracao, compilar ou indexar')
  }
})
