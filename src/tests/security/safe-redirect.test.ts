import { describe, it, expect } from 'vitest'
import { isSafeRedirect, safeRedirect, DEFAULT_SAFE_REDIRECT } from '@/lib/security/safe-redirect'

describe('safe-redirect (F2.2)', () => {
  describe('isSafeRedirect', () => {
    it('aceita paths internos comecando com /', () => {
      expect(isSafeRedirect('/admin')).toBe(true)
      expect(isSafeRedirect('/admin/proposicoes')).toBe(true)
      expect(isSafeRedirect('/')).toBe(true)
      expect(isSafeRedirect('/?tab=x')).toBe(true)
      expect(isSafeRedirect('/parlamentar/votacao')).toBe(true)
    })

    it('rejeita URLs absolutas externas', () => {
      expect(isSafeRedirect('https://evil.example')).toBe(false)
      expect(isSafeRedirect('http://localhost:3000/admin')).toBe(false)
      expect(isSafeRedirect('ftp://server')).toBe(false)
    })

    it('rejeita protocol-relative (//evil.example)', () => {
      expect(isSafeRedirect('//evil.example')).toBe(false)
      expect(isSafeRedirect('//evil.example/admin')).toBe(false)
    })

    it('rejeita backslash variant (/\\evil.example — browsers normalizam para //)', () => {
      expect(isSafeRedirect('/\\evil.example')).toBe(false)
    })

    it('rejeita javascript: e outros esquemas perigosos colados no path', () => {
      expect(isSafeRedirect('javascript:alert(1)')).toBe(false)
      expect(isSafeRedirect('data:text/html,<script>alert(1)</script>')).toBe(false)
    })

    it('rejeita string vazia, null e undefined', () => {
      expect(isSafeRedirect('')).toBe(false)
      expect(isSafeRedirect(null)).toBe(false)
      expect(isSafeRedirect(undefined)).toBe(false)
    })

    it('rejeita strings com control chars', () => {
      expect(isSafeRedirect('/admin\x00')).toBe(false)
      expect(isSafeRedirect('/admin\n')).toBe(false)
    })

    it('rejeita tipos nao-string', () => {
      // @ts-expect-error — testando defesa contra erros de tipagem em runtime
      expect(isSafeRedirect(123)).toBe(false)
      // @ts-expect-error
      expect(isSafeRedirect({})).toBe(false)
    })
  })

  describe('safeRedirect', () => {
    it('retorna o valor quando seguro', () => {
      expect(safeRedirect('/admin')).toBe('/admin')
      expect(safeRedirect('/parlamentar')).toBe('/parlamentar')
    })

    it('cai no fallback default quando invalido', () => {
      expect(safeRedirect('https://evil.example')).toBe(DEFAULT_SAFE_REDIRECT)
      expect(safeRedirect('//evil.example')).toBe(DEFAULT_SAFE_REDIRECT)
      expect(safeRedirect(null)).toBe(DEFAULT_SAFE_REDIRECT)
    })

    it('respeita fallback customizado', () => {
      expect(safeRedirect('https://evil.example', '/parlamentar')).toBe('/parlamentar')
      expect(safeRedirect(null, '/')).toBe('/')
    })
  })
})
