import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logging/logger'

const log = createLogger('services/transmissao')

export interface TransmissaoConfig {
  ativa: boolean
  url: string | null
  plataforma: string | null
  embedHtml: string | null
  titulo: string | null
  aviso: string | null
}

const CHAVES = [
  'transmissao_ativa',
  'transmissao_url',
  'transmissao_plataforma',
  'transmissao_embed_html',
  'transmissao_titulo',
  'transmissao_aviso',
] as const

const EMPTY: TransmissaoConfig = {
  ativa: false,
  url: null,
  plataforma: null,
  embedHtml: null,
  titulo: null,
  aviso: null,
}

export async function getTransmissaoConfig(): Promise<TransmissaoConfig> {
  try {
    const rows = await prisma.configuracao.findMany({
      where: { chave: { in: [...CHAVES] } },
      select: { chave: true, valor: true },
    })
    const mapa: Record<string, string> = {}
    rows.forEach((r) => {
      mapa[r.chave] = r.valor
    })
    const ativa = mapa['transmissao_ativa']?.trim().toLowerCase() === 'sim'
    return {
      ativa,
      url: mapa['transmissao_url']?.trim() || null,
      plataforma: mapa['transmissao_plataforma']?.trim() || null,
      embedHtml: mapa['transmissao_embed_html']?.trim() || null,
      titulo: mapa['transmissao_titulo']?.trim() || null,
      aviso: mapa['transmissao_aviso']?.trim() || null,
    }
  } catch (error) {
    log.error('Erro ao carregar configuracao de transmissao', error)
    return EMPTY
  }
}

/**
 * Converte URLs comuns de YouTube/Vimeo em URL de embed. Devolve null se nao
 * for possivel converter — nesse caso o consumidor deve cair no link externo.
 */
export function urlToEmbed(url: string | null): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    // YouTube watch -> embed
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname === '/watch') {
        const v = u.searchParams.get('v')
        if (v) return `https://www.youtube.com/embed/${v}`
      }
      if (u.pathname.startsWith('/live/')) {
        const id = u.pathname.split('/')[2]
        if (id) return `https://www.youtube.com/embed/${id}`
      }
      // canal/@: nao tem embed direto da "live" sem id; deixa pro link externo
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1)
      if (id) return `https://www.youtube.com/embed/${id}`
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean)[0]
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`
    }
  } catch {
    /* invalid url */
  }
  return null
}
