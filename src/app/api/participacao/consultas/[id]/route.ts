import { NextRequest } from 'next/server'
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
  buscarConsultaPorId,
  atualizarStatusConsulta,
  adicionarPergunta,
  removerPergunta,
  participarConsulta,
  buscarResultadosConsulta,
  publicarConsulta,
  encerrarConsulta
} from '@/lib/services/consulta-publica-service'

export const dynamic = 'force-dynamic'

const PerguntaSchema = z.object({
  ordem: z.number().int().min(1),
  texto: z.string().min(5, 'Texto e obrigatorio'),
  tipo: z.enum(['TEXTO_LIVRE', 'MULTIPLA_ESCOLHA', 'ESCALA', 'SIM_NAO']),
  obrigatoria: z.boolean().optional(),
  opcoes: z.array(z.string()).optional()
})

const ParticipacaoSchema = z.object({
  nome: z.string().optional(),
  email: z.string().email().optional(),
  cpf: z.string().optional(),
  bairro: z.string().optional(),
  respostas: z.array(z.object({
    perguntaId: z.string(),
    resposta: z.string()
  }))
})

/**
 * GET - Buscar consulta por ID ou resultados
 */
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = params.id
  const { searchParams } = new URL(request.url)
  const acao = searchParams.get('acao')

  // Resultados - pode ser público após encerramento
  if (acao === 'resultados') {
    const resultados = await buscarResultadosConsulta(id)
    return createSuccessResponse(resultados, 'Resultados da consulta')
  }

  const consulta = await buscarConsultaPorId(id)
  if (!consulta) {
    throw new NotFoundError('Consulta')
  }

  return createSuccessResponse(consulta, 'Consulta encontrada')
})

/**
 * PUT - Atualizar status da consulta
 * SEGURANÇA: Requer autenticação e permissão de participação
 */
export const PUT = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: rawId } = await context.params
  const id = validateId(rawId, 'Consulta')
  const body = await request.json()
  const { status } = body

  if (!status) {
    throw new ValidationError('Status é obrigatório')
  }

  const consulta = await atualizarStatusConsulta(id, status)
  return createSuccessResponse(consulta, 'Status atualizado')
}, { permissions: 'participacao.manage' })

/**
 * POST - Ações: pergunta, participar, publicar, encerrar
 */
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const id = params.id
  const { searchParams } = new URL(request.url)
  const acao = searchParams.get('acao')
  const body = await request.json()

  switch (acao) {
    case 'pergunta': {
      const session = await getServerSession(authOptions)
      if (!session) {
        throw new ValidationError('Não autorizado')
      }
      const data = PerguntaSchema.parse(body)
      const pergunta = await adicionarPergunta({
        consultaId: id,
        ...data
      })
      return createSuccessResponse(pergunta, 'Pergunta adicionada')
    }

    case 'participar': {
      const data = ParticipacaoSchema.parse(body)
      const participacao = await participarConsulta({
        consultaId: id,
        ...data
      })
      return createSuccessResponse(participacao, 'Participação registrada')
    }

    case 'publicar': {
      const session = await getServerSession(authOptions)
      if (!session) {
        throw new ValidationError('Não autorizado')
      }
      const consulta = await publicarConsulta(id)
      return createSuccessResponse(consulta, 'Consulta publicada')
    }

    case 'encerrar': {
      const session = await getServerSession(authOptions)
      if (!session) {
        throw new ValidationError('Não autorizado')
      }
      const consulta = await encerrarConsulta(id)
      return createSuccessResponse(consulta, 'Consulta encerrada')
    }

    default:
      throw new ValidationError('Ação inválida. Use: pergunta, participar, publicar ou encerrar')
  }
})

/**
 * DELETE - Remover pergunta
 * SEGURANÇA: Requer autenticação e permissão de participação
 */
export const DELETE = withAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { searchParams } = new URL(request.url)
  const perguntaId = searchParams.get('perguntaId')

  if (!perguntaId) {
    throw new ValidationError('ID da pergunta é obrigatório')
  }

  await removerPergunta(perguntaId)
  return createSuccessResponse({ perguntaId }, 'Pergunta removida')
}, { permissions: 'participacao.manage' })
