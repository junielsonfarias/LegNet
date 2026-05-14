import { describe, it, expect } from 'vitest'
import {
  detectMimeFromBytes,
  safeUploadFolder,
  ALL_ALLOWED_MIME,
  ALLOWED_UPLOAD_FOLDERS,
  DEFAULT_UPLOAD_FOLDER,
} from '@/lib/security/file-validation'

describe('file-validation (F2.4)', () => {
  describe('detectMimeFromBytes', () => {
    it('detecta JPEG via assinatura FF D8 FF', () => {
      const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])
      expect(detectMimeFromBytes(buf)).toBe('image/jpeg')
    })

    it('detecta PNG via assinatura 89 50 4E 47 0D 0A 1A 0A', () => {
      const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
      expect(detectMimeFromBytes(buf)).toBe('image/png')
    })

    it('detecta GIF87a e GIF89a', () => {
      const gif87 = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0, 0, 0, 0, 0, 0])
      const gif89 = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0])
      expect(detectMimeFromBytes(gif87)).toBe('image/gif')
      expect(detectMimeFromBytes(gif89)).toBe('image/gif')
    })

    it('detecta WebP (RIFF + WEBP no offset 8)', () => {
      const buf = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0, 0, 0, 0,             // tamanho
        0x57, 0x45, 0x42, 0x50, // WEBP
      ])
      expect(detectMimeFromBytes(buf)).toBe('image/webp')
    })

    it('detecta PDF via assinatura %PDF', () => {
      const buf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0, 0, 0, 0])
      expect(detectMimeFromBytes(buf)).toBe('application/pdf')
    })

    it('retorna null para conteudo desconhecido (HTML, SVG, JS)', () => {
      const html = Buffer.from('<html><body>fake.png</body></html>')
      const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')
      const js = Buffer.from('alert("hack")')
      expect(detectMimeFromBytes(html)).toBeNull()
      expect(detectMimeFromBytes(svg)).toBeNull()
      expect(detectMimeFromBytes(js)).toBeNull()
    })

    it('retorna null para buffer pequeno demais (<12 bytes)', () => {
      expect(detectMimeFromBytes(Buffer.from([0xff, 0xd8]))).toBeNull()
      expect(detectMimeFromBytes(Buffer.from([]))).toBeNull()
    })

    it('aceita Uint8Array (alem de Buffer)', () => {
      const arr = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])
      expect(detectMimeFromBytes(arr)).toBe('image/jpeg')
    })
  })

  describe('safeUploadFolder', () => {
    it('aceita pastas da allowlist', () => {
      expect(safeUploadFolder('logos')).toBe('logos')
      expect(safeUploadFolder('parlamentares')).toBe('parlamentares')
      expect(safeUploadFolder('cotas-parlamentar')).toBe('cotas-parlamentar')
      expect(safeUploadFolder('noticias')).toBe('noticias')
    })

    it('cai no default para pastas fora da allowlist', () => {
      expect(safeUploadFolder('hacker')).toBe(DEFAULT_UPLOAD_FOLDER)
      expect(safeUploadFolder('etc-passwd')).toBe(DEFAULT_UPLOAD_FOLDER)
      expect(safeUploadFolder('admin')).toBe(DEFAULT_UPLOAD_FOLDER)
    })

    it('sanitiza caracteres especiais antes da checagem', () => {
      // '..' eh sanitizado para '' e cai no default
      expect(safeUploadFolder('..')).toBe(DEFAULT_UPLOAD_FOLDER)
      expect(safeUploadFolder('../etc')).toBe(DEFAULT_UPLOAD_FOLDER)
      // '/' eh removido; 'logos/admin' vira 'logosadmin' -> nao casa
      expect(safeUploadFolder('logos/admin')).toBe(DEFAULT_UPLOAD_FOLDER)
    })

    it('aceita null/undefined caindo no default', () => {
      expect(safeUploadFolder(null)).toBe(DEFAULT_UPLOAD_FOLDER)
      expect(safeUploadFolder(undefined)).toBe(DEFAULT_UPLOAD_FOLDER)
      expect(safeUploadFolder('')).toBe(DEFAULT_UPLOAD_FOLDER)
    })

    it('default eh "uploads"', () => {
      expect(DEFAULT_UPLOAD_FOLDER).toBe('uploads')
      expect(ALLOWED_UPLOAD_FOLDERS.has('uploads')).toBe(true)
    })
  })

  describe('ALL_ALLOWED_MIME', () => {
    it('contem os 5 tipos suportados', () => {
      expect(ALL_ALLOWED_MIME.has('image/jpeg')).toBe(true)
      expect(ALL_ALLOWED_MIME.has('image/png')).toBe(true)
      expect(ALL_ALLOWED_MIME.has('image/gif')).toBe(true)
      expect(ALL_ALLOWED_MIME.has('image/webp')).toBe(true)
      expect(ALL_ALLOWED_MIME.has('application/pdf')).toBe(true)
    })

    it('NAO contem tipos perigosos', () => {
      expect(ALL_ALLOWED_MIME.has('text/html')).toBe(false)
      expect(ALL_ALLOWED_MIME.has('image/svg+xml')).toBe(false)
      expect(ALL_ALLOWED_MIME.has('application/javascript')).toBe(false)
    })
  })
})
