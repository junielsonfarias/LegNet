/**
 * Servico de Streaming de Video
 * Integra com YouTube, Vimeo e outras plataformas de video
 *
 * Funcionalidades:
 * - Embed de YouTube Live
 * - Embed de Vimeo
 * - Gerenciamento de transmissoes
 * - Historico de videos
 * - Links para gravacoes
 */

import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'

const logger = createLogger('streaming')

// Tipos
export interface ConfiguracaoStreaming {
  plataforma: 'youtube' | 'vimeo' | 'facebook' | 'outro'
  canalId?: string
  apiKey?: string
  embedUrl?: string
  chatHabilitado: boolean
  autoplay: boolean
  muteInicial: boolean
}

export interface TransmissaoAtiva {
  id: string
  sessaoId: string
  url: string
  embedUrl: string
  plataforma: 'youtube' | 'vimeo' | 'facebook' | 'outro'
  titulo: string
  status: 'AGENDADA' | 'AO_VIVO' | 'FINALIZADA' | 'ARQUIVADA'
  inicioTransmissao?: Date
  fimTransmissao?: Date
  visualizacoes?: number
  chatUrl?: string
}

export interface VideoGravado {
  id: string
  sessaoId: string
  titulo: string
  url: string
  thumbnailUrl?: string
  duracao?: number // em segundos
  dataGravacao: Date
  visualizacoes: number
  plataforma: 'youtube' | 'vimeo' | 'outro'
}

/**
 * Extrai ID do video do YouTube a partir da URL
 */
export function extrairYouTubeId(url: string): string | null {
  const regexes = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
  ]

  for (const regex of regexes) {
    const match = url.match(regex)
    if (match) {
      return match[1]
    }
  }

  return null
}

/**
 * Extrai ID do video do Vimeo a partir da URL
 */
export function extrairVimeoId(url: string): string | null {
  const regex = /vimeo\.com\/(?:video\/)?(\d+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

/**
 * Gera URL de embed para YouTube
 */
export function gerarEmbedYouTube(videoId: string, options: {
  autoplay?: boolean
  mute?: boolean
  showControls?: boolean
  modestBranding?: boolean
} = {}): string {
  const { autoplay = false, mute = false, showControls = true, modestBranding = true } = options

  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: mute ? '1' : '0',
    controls: showControls ? '1' : '0',
    modestbranding: modestBranding ? '1' : '0',
    rel: '0',
    playsinline: '1'
  })

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}

/**
 * Gera URL de embed para Vimeo
 */
export function gerarEmbedVimeo(videoId: string, options: {
  autoplay?: boolean
  mute?: boolean
  loop?: boolean
  title?: boolean
  byline?: boolean
  portrait?: boolean
} = {}): string {
  const { autoplay = false, mute = false, loop = false, title = true, byline = false, portrait = false } = options

  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    muted: mute ? '1' : '0',
    loop: loop ? '1' : '0',
    title: title ? '1' : '0',
    byline: byline ? '1' : '0',
    portrait: portrait ? '1' : '0'
  })

  return `https://player.vimeo.com/video/${videoId}?${params.toString()}`
}

/**
 * Detecta plataforma e gera URL de embed automaticamente
 */
export function gerarEmbedAutomatico(url: string, options: {
  autoplay?: boolean
  mute?: boolean
} = {}): { embedUrl: string; plataforma: 'youtube' | 'vimeo' | 'outro' } | null {
  // Tentar YouTube
  const youtubeId = extrairYouTubeId(url)
  if (youtubeId) {
    return {
      embedUrl: gerarEmbedYouTube(youtubeId, options),
      plataforma: 'youtube'
    }
  }

  // Tentar Vimeo
  const vimeoId = extrairVimeoId(url)
  if (vimeoId) {
    return {
      embedUrl: gerarEmbedVimeo(vimeoId, options),
      plataforma: 'vimeo'
    }
  }

  return null
}

/**
 * Gera URL de chat do YouTube Live
 */
export function gerarChatYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}`
}

/**
 * Inicia transmissao para uma sessao
 */
export async function iniciarTransmissao(
  sessaoId: string,
  url: string,
  titulo?: string
): Promise<TransmissaoAtiva | null> {
  const embed = gerarEmbedAutomatico(url, { autoplay: true, mute: false })
  if (!embed) {
    logger.error('URL de video invalida', { action: 'iniciar_transmissao', url })
    return null
  }

  const transmissao: TransmissaoAtiva = {
    id: `transmissao-${sessaoId}-${Date.now()}`,
    sessaoId,
    url,
    embedUrl: embed.embedUrl,
    plataforma: embed.plataforma,
    titulo: titulo || `Sessão ${sessaoId}`,
    status: 'AO_VIVO',
    inicioTransmissao: new Date(),
    chatUrl: embed.plataforma === 'youtube' ? gerarChatYouTubeUrl(extrairYouTubeId(url)!) : undefined
  }

  logger.info('Transmissao iniciada', {
    action: 'iniciar_transmissao',
    sessaoId,
    plataforma: embed.plataforma,
    url
  })

  return transmissao
}

/**
 * Finaliza transmissao
 */
export async function finalizarTransmissao(transmissaoId: string): Promise<void> {
  logger.info('Transmissao finalizada', {
    action: 'finalizar_transmissao',
    transmissaoId
  })
}

/**
 * Busca videos gravados de sessoes anteriores
 */
export async function buscarVideosGravados(
  filtros: {
    ano?: number
    tipo?: string
    parlamentarId?: string
    limit?: number
    offset?: number
  } = {}
): Promise<VideoGravado[]> {
  // Buscar sessoes com videos (campo ata pode conter link do video)
  const sessoes = await prisma.sessao.findMany({
    where: {
      status: 'CONCLUIDA',
      ata: { not: null },
      ...(filtros.ano && {
        data: {
          gte: new Date(filtros.ano, 0, 1),
          lt: new Date(filtros.ano + 1, 0, 1)
        }
      }),
      ...(filtros.tipo && { tipo: filtros.tipo as any })
    },
    orderBy: { data: 'desc' },
    take: filtros.limit || 20,
    skip: filtros.offset || 0
  })

  // Converter para formato de video (se ata contiver URL de video)
  const videos: VideoGravado[] = []

  for (const sessao of sessoes) {
    if (sessao.ata && (sessao.ata.includes('youtube') || sessao.ata.includes('vimeo'))) {
      const embed = gerarEmbedAutomatico(sessao.ata)
      if (embed) {
        videos.push({
          id: `video-${sessao.id}`,
          sessaoId: sessao.id,
          titulo: `${sessao.tipo} ${sessao.numero} - ${sessao.data.toLocaleDateString('pt-BR')}`,
          url: sessao.ata,
          thumbnailUrl: embed.plataforma === 'youtube'
            ? `https://img.youtube.com/vi/${extrairYouTubeId(sessao.ata)}/hqdefault.jpg`
            : undefined,
          dataGravacao: sessao.data,
          visualizacoes: 0,
          plataforma: embed.plataforma
        })
      }
    }
  }

  return videos
}

/**
 * Gera componente de player de video (para uso no frontend)
 */
export function gerarPlayerConfig(url: string): {
  type: 'youtube' | 'vimeo' | 'iframe' | 'unsupported'
  embedUrl?: string
  videoId?: string
  chatUrl?: string
  aspectRatio: string
} {
  const youtubeId = extrairYouTubeId(url)
  if (youtubeId) {
    return {
      type: 'youtube',
      embedUrl: gerarEmbedYouTube(youtubeId, { autoplay: true }),
      videoId: youtubeId,
      chatUrl: gerarChatYouTubeUrl(youtubeId),
      aspectRatio: '16/9'
    }
  }

  const vimeoId = extrairVimeoId(url)
  if (vimeoId) {
    return {
      type: 'vimeo',
      embedUrl: gerarEmbedVimeo(vimeoId, { autoplay: true }),
      videoId: vimeoId,
      aspectRatio: '16/9'
    }
  }

  // Verificar se e uma URL de iframe generica
  if (url.includes('embed') || url.includes('player')) {
    return {
      type: 'iframe',
      embedUrl: url,
      aspectRatio: '16/9'
    }
  }

  return {
    type: 'unsupported',
    aspectRatio: '16/9'
  }
}

/**
 * Valida URL de streaming
 */
export function validarUrlStreaming(url: string): {
  valida: boolean
  plataforma?: 'youtube' | 'vimeo' | 'facebook' | 'outro'
  mensagem?: string
} {
  if (!url || url.trim() === '') {
    return { valida: false, mensagem: 'URL nao pode estar vazia' }
  }

  try {
    new URL(url)
  } catch {
    return { valida: false, mensagem: 'URL invalida' }
  }

  if (extrairYouTubeId(url)) {
    return { valida: true, plataforma: 'youtube' }
  }

  if (extrairVimeoId(url)) {
    return { valida: true, plataforma: 'vimeo' }
  }

  if (url.includes('facebook.com')) {
    return { valida: true, plataforma: 'facebook' }
  }

  return { valida: true, plataforma: 'outro' }
}

/**
 * Buscar informacoes do video (mock - em producao usar APIs das plataformas)
 */
export async function buscarInfoVideo(url: string): Promise<{
  titulo?: string
  descricao?: string
  duracao?: number
  thumbnail?: string
  autor?: string
} | null> {
  const youtubeId = extrairYouTubeId(url)
  if (youtubeId) {
    // Em producao, usar YouTube Data API
    return {
      titulo: 'Video do YouTube',
      thumbnail: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    }
  }

  const vimeoId = extrairVimeoId(url)
  if (vimeoId) {
    // Em producao, usar Vimeo API
    return {
      titulo: 'Video do Vimeo'
    }
  }

  return null
}

/**
 * Exporta constantes uteis
 */
export const PLATAFORMAS_SUPORTADAS = ['youtube', 'vimeo', 'facebook', 'outro'] as const

export const CONFIGURACAO_PADRAO: ConfiguracaoStreaming = {
  plataforma: 'youtube',
  chatHabilitado: true,
  autoplay: true,
  muteInicial: false
}
