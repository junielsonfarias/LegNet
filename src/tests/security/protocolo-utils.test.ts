import { describe, it, expect, beforeAll } from 'vitest'
import { randomBytes } from 'crypto'

// Configura ENCRYPTION_KEY antes de qualquer import que use encryption
beforeAll(() => {
  if (!process.env.ENCRYPTION_KEY) {
    process.env.ENCRYPTION_KEY = randomBytes(32).toString('hex')
  }
})

import { protectCpfCnpj, readCpfCnpj, hashCpfCnpj } from '@/lib/security/protocolo-utils'
import { isEncrypted } from '@/lib/security/encryption'

describe('protectCpfCnpj (P0-6)', () => {
  it('CPF (PESSOA_FISICA): criptografa + hash', () => {
    const result = protectCpfCnpj('12345678909', 'PESSOA_FISICA')

    expect(result.stored).not.toBe('12345678909')
    expect(isEncrypted(result.stored!)).toBe(true)
    expect(result.hash).toBeTruthy()
    expect(result.hash).not.toBe('12345678909')
  })

  it('CPF formatado (com pontos): aceita e criptografa apenas digitos', () => {
    const result = protectCpfCnpj('123.456.789-09', 'PESSOA_FISICA')

    expect(isEncrypted(result.stored!)).toBe(true)
    expect(result.hash).toBeTruthy()
  })

  it('CNPJ (PESSOA_JURIDICA): texto plano + hash (dado publico)', () => {
    const result = protectCpfCnpj('12345678000199', 'PESSOA_JURIDICA')

    expect(result.stored).toBe('12345678000199')
    expect(isEncrypted(result.stored!)).toBe(false)
    expect(result.hash).toBeTruthy()
  })

  it('CNPJ formatado: normaliza para digitos', () => {
    const result = protectCpfCnpj('12.345.678/0001-99', 'PESSOA_JURIDICA')

    expect(result.stored).toBe('12345678000199')
    expect(result.hash).toBeTruthy()
  })

  it('inferencia automatica: 11 digitos sem tipo = CPF', () => {
    const result = protectCpfCnpj('12345678909', null)

    expect(isEncrypted(result.stored!)).toBe(true)
    expect(result.hash).toBeTruthy()
  })

  it('inferencia automatica: 14 digitos sem tipo = CNPJ', () => {
    const result = protectCpfCnpj('12345678000199', null)

    expect(isEncrypted(result.stored!)).toBe(false)
    expect(result.stored).toBe('12345678000199')
    expect(result.hash).toBeTruthy()
  })

  it('valor null/undefined: retorna { stored: null, hash: null }', () => {
    expect(protectCpfCnpj(null, 'PESSOA_FISICA')).toEqual({ stored: null, hash: null })
    expect(protectCpfCnpj(undefined, 'PESSOA_FISICA')).toEqual({ stored: null, hash: null })
    expect(protectCpfCnpj('', 'PESSOA_FISICA')).toEqual({ stored: null, hash: null })
  })

  it('IDEMPOTENCIA: valor ja criptografado nao recriptografa (backfill seguro)', () => {
    const original = protectCpfCnpj('12345678909', 'PESSOA_FISICA')
    expect(isEncrypted(original.stored!)).toBe(true)

    // Tentando proteger de novo - deve retornar o mesmo
    const second = protectCpfCnpj(original.stored, 'PESSOA_FISICA')
    expect(second.stored).toBe(original.stored) // mesma string criptografada
  })

  it('valor indeterminado (formato invalido): salva como veio, sem hash', () => {
    const result = protectCpfCnpj('abc123', 'PESSOA_FISICA')

    expect(result.stored).toBe('abc123') // mantem como veio
    expect(result.hash).toBeNull() // sem hash (audit log devera flaggar)
  })
})

describe('readCpfCnpj (P0-6)', () => {
  it('CPF criptografado: mascara por padrao (***.***.***-XX)', () => {
    const protected_ = protectCpfCnpj('12345678909', 'PESSOA_FISICA')
    const result = readCpfCnpj(protected_.stored, 'PESSOA_FISICA')

    expect(result).toBe('***.***.***-09')
  })

  it('CPF criptografado com unmask=true: descriptografa e retorna puro', () => {
    const protected_ = protectCpfCnpj('12345678909', 'PESSOA_FISICA')
    const result = readCpfCnpj(protected_.stored, 'PESSOA_FISICA', { unmask: true })

    expect(result).toBe('12345678909')
  })

  it('CNPJ texto plano: retorna como esta (dado publico)', () => {
    const protected_ = protectCpfCnpj('12345678000199', 'PESSOA_JURIDICA')
    const result = readCpfCnpj(protected_.stored, 'PESSOA_JURIDICA')

    expect(result).toBe('12345678000199')
  })

  it('null/undefined retorna null', () => {
    expect(readCpfCnpj(null, 'PESSOA_FISICA')).toBeNull()
    expect(readCpfCnpj(undefined, 'PESSOA_FISICA')).toBeNull()
  })

  it('CPF legado em texto plano (pre-backfill): mascara como fallback de seguranca', () => {
    // Cenario: dado antigo nao criptografado ainda no banco
    const result = readCpfCnpj('12345678909', 'PESSOA_FISICA')

    expect(result).toBe('***.***.***-09')
  })
})

describe('hashCpfCnpj (P0-6 - busca exata sem decriptar)', () => {
  it('mesmo CPF gera mesmo hash (deterministico)', () => {
    const h1 = hashCpfCnpj('12345678909')
    const h2 = hashCpfCnpj('12345678909')

    expect(h1).toBe(h2)
  })

  it('aceita formatado e nao formatado (normaliza para digitos)', () => {
    const h1 = hashCpfCnpj('12345678909')
    const h2 = hashCpfCnpj('123.456.789-09')

    expect(h1).toBe(h2)
  })

  it('CPFs diferentes geram hashes diferentes', () => {
    const h1 = hashCpfCnpj('12345678909')
    const h2 = hashCpfCnpj('98765432100')

    expect(h1).not.toBe(h2)
  })

  it('hash nao revela valor original (irreversivel)', () => {
    const h = hashCpfCnpj('12345678909')

    expect(h).not.toContain('12345678909')
    expect(h).not.toContain('123')
    expect(h.length).toBeGreaterThanOrEqual(40) // SHA-256 hex tem 64 chars
  })
})
