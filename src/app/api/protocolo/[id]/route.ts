import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandler,
  createSuccessResponse,
  ValidationError,
  NotFoundError,
  validateId
} from '@/lib/error-handler'
import { withAuth } from '@/lib/auth/permissions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  buscarProtocoloPorId,
  buscarProtocoloPorCodigo,
  atualizarProtocolo,
  arquivarProtocolo,
  tramitarProtocolo,
  adicionarAnexo,
  converterEmProposicao
} from '@/lib/services/protocolo-service'

export const dynamic = 'force-dynamic'

const AtualizarProtocoloSchema = z.object({
  situacao: z.enum(['ABERTO', 'EM_TRAMITACAO', 'RESPONDIDO', 'ARQUIVADO', 'DEVOLVIDO', 'CANCELADO']).optional(),
  prazoResposta: z.string().datetime().optional(),
  prioridade: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']).optional(),
  descricao: z.string().optional()
})

const TramitarSchema = z.object({
  unidadeOrigem: z.string().min(1, 'Unidade de origem é obrigatória'),
  unidadeDestino: z.string().min(1, 'Unidade de destino é obrigatória'),
  acao: z.string().min(1, 'Ação é obrigatória'),
  despacho: z.string().optional()
})

const ArquivarSchema = z.object({
  motivo: z.string().optional()
})

const ConverterSchema = z.object({
  tipoProposicao: z.string().min(1, 'Tipo de proposição é obrigatório'),
  autorId: z.string().min(1, 'Autor é obrigatório')
})

const AnexoSchema = z.object({
  titulo: z.string().min(1, 'Título do anexo é obrigatório'),
  arquivo: z.string().min(1, 'Caminho do arquivo é obrigatório'),
  tamanho: z.number().optional(),
  tipoMime: z.string().optional()
})

/**
 * GET - Buscar protocolo por ID ou código
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

  // Se o ID começa com 'PROT', é um código de etiqueta
  let protocolo
  if (id.startsWith('PROT')) {
    protocolo = await buscarProtocoloPorCodigo(id)
  } else {
    protocolo = await buscarProtocoloPorId(id)
  }

  if (!protocolo) {
    throw new NotFoundError('Protocolo')
  }

  return createSuccessResponse(protocolo, 'Protocolo encontrado')
})

/**
 * PUT - Atualizar protocolo
 * SEGURANÇA: Requer autenticação e permissão de protocolo
 */
export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Protocolo')
  const body = await request.json()
  const validatedData = AtualizarProtocoloSchema.parse(body)

  const protocolo = await atualizarProtocolo(id, {
    ...validatedData,
    prazoResposta: validatedData.prazoResposta ? new Date(validatedData.prazoResposta) : undefined
  })

  return createSuccessResponse(protocolo, 'Protocolo atualizado')
}, { permissions: 'protocolo.manage' })

/**
 * POST - Ações específicas: tramitar, arquivar, anexo, converter
 * SEGURANÇA: Requer autenticação e permissão de protocolo
 */
export const POST = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions)
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Protocolo')
  const { searchParams } = new URL(request.url)
  const acao = searchParams.get('acao')
  const body = await request.json()

  switch (acao) {
    case 'tramitar': {
      const data = TramitarSchema.parse(body)
      const resultado = await tramitarProtocolo(id, {
        ...data,
        usuarioId: session?.user ? (session.user as any).id : undefined
      })
      return createSuccessResponse(resultado, 'Protocolo tramitado')
    }

    case 'arquivar': {
      const data = ArquivarSchema.parse(body)
      const protocolo = await arquivarProtocolo(
        id,
        data.motivo,
        session?.user ? (session.user as any).id : undefined
      )
      return createSuccessResponse(protocolo, 'Protocolo arquivado')
    }

    case 'anexo': {
      const data = AnexoSchema.parse(body)
      const anexo = await adicionarAnexo(
        id,
        data.titulo,
        data.arquivo,
        data.tamanho,
        data.tipoMime
      )
      return createSuccessResponse(anexo, 'Anexo adicionado')
    }

    case 'converter': {
      const data = ConverterSchema.parse(body)
      const proposicao = await converterEmProposicao(
        id,
        data.tipoProposicao,
        data.autorId
      )
      return createSuccessResponse(proposicao, 'Protocolo convertido em proposição')
    }

    default:
      throw new ValidationError('Ação inválida. Use: tramitar, arquivar, anexo ou converter')
  }
}, { permissions: 'protocolo.manage' })
