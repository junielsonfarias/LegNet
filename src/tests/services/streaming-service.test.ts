/**
 * Testes do Servico de Streaming
 */

import {
  extrairYouTubeId,
  extrairVimeoId,
  gerarEmbedYouTube,
  gerarEmbedVimeo,
  gerarEmbedAutomatico,
  validarUrlStreaming,
  gerarPlayerConfig,
  PLATAFORMAS_SUPORTADAS
} from '@/lib/services/streaming-service'

// Mock do Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    sessao: {
      findMany: jest.fn()
    }
  }
}))

// Mock do logger
jest.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}))

describe('Streaming Service', () => {
  describe('extrairYouTubeId', () => {
    it('deve extrair ID de URL padrao do YouTube', () => {
      expect(extrairYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('deve extrair ID de URL curta youtu.be', () => {
      expect(extrairYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('deve extrair ID de URL de live', () => {
      expect(extrairYouTubeId('https://www.youtube.com/live/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('deve extrair ID de URL de embed', () => {
      expect(extrairYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('deve retornar null para URL invalida', () => {
      expect(extrairYouTubeId('https://example.com/video')).toBeNull()
      expect(extrairYouTubeId('https://vimeo.com/123456789')).toBeNull()
      expect(extrairYouTubeId('')).toBeNull()
    })
  })

  describe('extrairVimeoId', () => {
    it('deve extrair ID de URL padrao do Vimeo', () => {
      expect(extrairVimeoId('https://vimeo.com/123456789')).toBe('123456789')
    })

    it('deve extrair ID de URL com /video/', () => {
      expect(extrairVimeoId('https://vimeo.com/video/123456789')).toBe('123456789')
    })

    it('deve retornar null para URL invalida', () => {
      expect(extrairVimeoId('https://youtube.com/watch?v=abc')).toBeNull()
      expect(extrairVimeoId('https://example.com')).toBeNull()
      expect(extrairVimeoId('')).toBeNull()
    })
  })

  describe('gerarEmbedYouTube', () => {
    it('deve gerar URL de embed correta', () => {
      const embedUrl = gerarEmbedYouTube('dQw4w9WgXcQ')
      expect(embedUrl).toContain('https://www.youtube.com/embed/dQw4w9WgXcQ')
    })

    it('deve incluir parametro autoplay quando especificado', () => {
      const embedUrl = gerarEmbedYouTube('dQw4w9WgXcQ', { autoplay: true })
      expect(embedUrl).toContain('autoplay=1')
    })

    it('deve incluir parametro mute quando especificado', () => {
      const embedUrl = gerarEmbedYouTube('dQw4w9WgXcQ', { mute: true })
      expect(embedUrl).toContain('mute=1')
    })

    it('deve incluir modestbranding por padrao', () => {
      const embedUrl = gerarEmbedYouTube('dQw4w9WgXcQ')
      expect(embedUrl).toContain('modestbranding=1')
    })
  })

  describe('gerarEmbedVimeo', () => {
    it('deve gerar URL de embed correta', () => {
      const embedUrl = gerarEmbedVimeo('123456789')
      expect(embedUrl).toContain('https://player.vimeo.com/video/123456789')
    })

    it('deve incluir parametro autoplay quando especificado', () => {
      const embedUrl = gerarEmbedVimeo('123456789', { autoplay: true })
      expect(embedUrl).toContain('autoplay=1')
    })

    it('deve incluir parametro muted quando especificado', () => {
      const embedUrl = gerarEmbedVimeo('123456789', { mute: true })
      expect(embedUrl).toContain('muted=1')
    })
  })

  describe('gerarEmbedAutomatico', () => {
    it('deve detectar YouTube e gerar embed', () => {
      const result = gerarEmbedAutomatico('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      expect(result).not.toBeNull()
      expect(result?.plataforma).toBe('youtube')
      expect(result?.embedUrl).toContain('youtube.com/embed')
    })

    it('deve detectar Vimeo e gerar embed', () => {
      const result = gerarEmbedAutomatico('https://vimeo.com/123456789')
      expect(result).not.toBeNull()
      expect(result?.plataforma).toBe('vimeo')
      expect(result?.embedUrl).toContain('player.vimeo.com')
    })

    it('deve retornar null para URL nao suportada', () => {
      const result = gerarEmbedAutomatico('https://example.com/video')
      expect(result).toBeNull()
    })
  })

  describe('validarUrlStreaming', () => {
    it('deve validar URL do YouTube', () => {
      const result = validarUrlStreaming('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      expect(result.valida).toBe(true)
      expect(result.plataforma).toBe('youtube')
    })

    it('deve validar URL do Vimeo', () => {
      const result = validarUrlStreaming('https://vimeo.com/123456789')
      expect(result.valida).toBe(true)
      expect(result.plataforma).toBe('vimeo')
    })

    it('deve validar URL do Facebook', () => {
      const result = validarUrlStreaming('https://www.facebook.com/video/123')
      expect(result.valida).toBe(true)
      expect(result.plataforma).toBe('facebook')
    })

    it('deve invalidar URL vazia', () => {
      const result = validarUrlStreaming('')
      expect(result.valida).toBe(false)
      expect(result.mensagem).toBeDefined()
    })

    it('deve invalidar URL mal formada', () => {
      const result = validarUrlStreaming('not-a-valid-url')
      expect(result.valida).toBe(false)
    })
  })

  describe('gerarPlayerConfig', () => {
    it('deve gerar config para YouTube', () => {
      const config = gerarPlayerConfig('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      expect(config.type).toBe('youtube')
      expect(config.videoId).toBe('dQw4w9WgXcQ')
      expect(config.embedUrl).toBeDefined()
      expect(config.chatUrl).toBeDefined()
    })

    it('deve gerar config para Vimeo', () => {
      const config = gerarPlayerConfig('https://vimeo.com/123456789')
      expect(config.type).toBe('vimeo')
      expect(config.videoId).toBe('123456789')
      expect(config.embedUrl).toBeDefined()
    })

    it('deve retornar unsupported para URL desconhecida', () => {
      const config = gerarPlayerConfig('https://example.com/video')
      expect(config.type).toBe('unsupported')
    })

    it('deve ter aspect ratio 16/9', () => {
      const config = gerarPlayerConfig('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      expect(config.aspectRatio).toBe('16/9')
    })
  })

  describe('PLATAFORMAS_SUPORTADAS', () => {
    it('deve incluir youtube', () => {
      expect(PLATAFORMAS_SUPORTADAS).toContain('youtube')
    })

    it('deve incluir vimeo', () => {
      expect(PLATAFORMAS_SUPORTADAS).toContain('vimeo')
    })

    it('deve incluir facebook', () => {
      expect(PLATAFORMAS_SUPORTADAS).toContain('facebook')
    })

    it('deve incluir outro', () => {
      expect(PLATAFORMAS_SUPORTADAS).toContain('outro')
    })
  })
})
