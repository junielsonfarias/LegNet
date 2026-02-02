/**
 * API do Painel - Controle de Streaming
 * POST: Configura/Inicia/Finaliza transmissao
 * GET: Busca informacoes da transmissao
 * SEGURANÇA: POST requer permissão painel.manage
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/permissions'
import { withErrorHandler, createSuccessResponse, ValidationError, NotFoundError } from '@/lib/error-handler'
import {
  iniciarTransmissao,
  validarUrlStreaming,
  gerarPlayerConfig,
  buscarVideosGravados
} from '@/lib/services/streaming-service'
import { configurarTransmissao, getEstadoPainel } from '@/lib/services/painel-tempo-real-service'

export const dynamic = 'force-dynamic'

// Schema de validação
const StreamingSchema = z.object({
  sessaoId: z.string().min(1, 'sessaoId é obrigatório'),
  acao: z.enum(['iniciar', 'parar', 'configurar'], {
    errorMap: () => ({ message: 'Ação inválida. Use: iniciar, parar, configurar' })
  }),
  url: z.string().url().optional(),
  titulo: z.string().optional(),
  plataforma: z.enum(['youtube', 'vimeo', 'outro']).optional()
})

/**
 * POST - Controle de streaming
 * SEGURANÇA: Requer permissão painel.manage
 */
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json()

  const validation = StreamingSchema.safeParse(body)
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message)
  }

  const { sessaoId, acao, url, titulo, plataforma } = validation.data

  switch (acao) {
    case 'iniciar': {
      if (!url) {
        throw new ValidationError('URL é obrigatória para iniciar transmissão')
      }

      // Validar URL
      const validacao = validarUrlStreaming(url)
      if (!validacao.valida) {
        throw new ValidationError(validacao.mensagem || 'URL inválida')
      }

      // Iniciar transmissão
      const transmissao = await iniciarTransmissao(sessaoId, url, titulo)
      if (!transmissao) {
        throw new ValidationError('Erro ao iniciar transmissão. URL pode não ser suportada.')
      }

      // Atualizar estado do painel
      await configurarTransmissao(
        sessaoId,
        url,
        validacao.plataforma as 'youtube' | 'vimeo' | 'outro',
        true
      )

      return createSuccessResponse(transmissao, 'Transmissão iniciada')
    }

    case 'parar': {
      await configurarTransmissao(sessaoId, '', 'outro', false)
      return createSuccessResponse({ stopped: true }, 'Transmissão parada')
    }

    case 'configurar': {
      if (!url || !plataforma) {
        throw new ValidationError('URL e plataforma são obrigatórios')
      }
      await configurarTransmissao(sessaoId, url, plataforma, true)
      return createSuccessResponse({ configured: true }, 'Transmissão configurada')
    }

    default:
      throw new ValidationError('Ação inválida')
  }
}, { permissions: 'painel.manage' })

/**
 * GET - Buscar informações de streaming
 * Rota pública (para exibição no painel público)
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const sessaoId = searchParams.get('sessaoId')
  const tipo = searchParams.get('tipo') || 'atual'

  // Histórico de vídeos gravados
  if (tipo === 'historico') {
    const ano = searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : undefined
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const videos = await buscarVideosGravados({ ano, limit, offset })

    return createSuccessResponse(videos, 'Vídeos listados')
  }

  // Transmissão atual
  if (!sessaoId) {
    throw new ValidationError('sessaoId é obrigatório')
  }

  const estado = await getEstadoPainel(sessaoId)

  if (!estado) {
    throw new NotFoundError('Sessão')
  }

  // Gerar config do player se tiver URL
  const playerConfig = estado.transmissao.url
    ? gerarPlayerConfig(estado.transmissao.url)
    : null

  return createSuccessResponse({
    transmissao: estado.transmissao,
    playerConfig
  }, 'Informações de streaming')
})
