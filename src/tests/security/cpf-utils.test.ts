import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  normalizeCpf,
  formatCpf,
  maskCpf,
  maskCpfOrCnpj,
  hashCpf,
  encryptCpf,
  decryptCpf,
  isValidCpfFormat
} from '@/lib/security/cpf-utils'

const TEST_KEY = 'a'.repeat(64)
beforeEach(() => {
  vi.stubEnv('ENCRYPTION_KEY', TEST_KEY)
})

describe('cpf-utils', () => {
  describe('normalizeCpf', () => {
    it('remove pontos e tracos', () => {
      expect(normalizeCpf('123.456.789-09')).toBe('12345678909')
      expect(normalizeCpf('12345678909')).toBe('12345678909')
      expect(normalizeCpf(' 123.456.789-09 ')).toBe('12345678909')
    })
  })

  describe('formatCpf', () => {
    it('formata CPF puro para padrao XXX.XXX.XXX-XX', () => {
      expect(formatCpf('12345678909')).toBe('123.456.789-09')
    })
    it('retorna inalterado se nao for 11 digitos', () => {
      expect(formatCpf('123')).toBe('123')
    })
  })

  describe('maskCpf', () => {
    it('mascara mantendo 3 primeiros e 2 ultimos digitos', () => {
      expect(maskCpf('12345678909')).toBe('123.***.***-09')
      expect(maskCpf('123.456.789-09')).toBe('123.***.***-09')
    })
    it('retorna string vazia para null/undefined', () => {
      expect(maskCpf(null)).toBe('')
      expect(maskCpf(undefined)).toBe('')
    })
  })

  describe('maskCpfOrCnpj', () => {
    it('mascara CPF (11 digitos)', () => {
      expect(maskCpfOrCnpj('12345678909')).toBe('123.***.***-09')
    })
    it('NAO mascara CNPJ (14 digitos) - publico por transparencia', () => {
      expect(maskCpfOrCnpj('12345678000190')).toBe('12345678000190')
      expect(maskCpfOrCnpj('12.345.678/0001-90')).toBe('12.345.678/0001-90')
    })
  })

  describe('hashCpf', () => {
    it('hash deterministico - mesmo CPF gera mesmo hash', () => {
      const a = hashCpf('123.456.789-09')
      const b = hashCpf('12345678909')
      expect(a).toBe(b)
    })
    it('CPFs diferentes geram hashes diferentes', () => {
      expect(hashCpf('11111111111')).not.toBe(hashCpf('22222222222'))
    })
  })

  describe('encryptCpf + decryptCpf', () => {
    it('round-trip preserva o valor normalizado', () => {
      const encrypted = encryptCpf('123.456.789-09')
      expect(decryptCpf(encrypted)).toBe('12345678909')
    })
    it('encrypt gera ciphertexts diferentes (IV aleatorio)', () => {
      const a = encryptCpf('12345678909')
      const b = encryptCpf('12345678909')
      expect(a).not.toBe(b)
    })
    it('decryptCpf aceita texto plano (legado)', () => {
      expect(decryptCpf('12345678909')).toBe('12345678909')
    })
  })

  describe('isValidCpfFormat', () => {
    it('aceita 11 digitos validos', () => {
      expect(isValidCpfFormat('12345678909')).toBe(true)
      expect(isValidCpfFormat('123.456.789-09')).toBe(true)
    })
    it('rejeita CPF com todos digitos iguais', () => {
      expect(isValidCpfFormat('11111111111')).toBe(false)
    })
    it('rejeita formato errado', () => {
      expect(isValidCpfFormat('123')).toBe(false)
      expect(isValidCpfFormat('')).toBe(false)
    })
  })
})
