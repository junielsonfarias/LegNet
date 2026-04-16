import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock env antes de importar
const TEST_KEY = 'a'.repeat(64) // 32 bytes hex valido
beforeEach(() => {
  vi.stubEnv('ENCRYPTION_KEY', TEST_KEY)
})

describe('encryption', () => {
  it('encrypt e decrypt retornam o valor original', async () => {
    const { encrypt, decrypt } = await import('@/lib/security/encryption')
    const original = 'dados-sensiveis-123'
    const encrypted = encrypt(original)
    expect(decrypt(encrypted)).toBe(original)
  })

  it('encrypted tem formato iv:tag:ciphertext', async () => {
    const { encrypt } = await import('@/lib/security/encryption')
    const encrypted = encrypt('teste')
    const parts = encrypted.split(':')
    expect(parts).toHaveLength(3)
    expect(parts[0]).toHaveLength(24)  // 12 bytes hex
    expect(parts[1]).toHaveLength(32)  // 16 bytes hex
    expect(parts[2].length).toBeGreaterThan(0)
  })

  it('cada encrypt gera resultado diferente (IV aleatorio)', async () => {
    const { encrypt } = await import('@/lib/security/encryption')
    const a = encrypt('mesmo-dado')
    const b = encrypt('mesmo-dado')
    expect(a).not.toBe(b)
  })

  it('isEncrypted detecta formato correto', async () => {
    const { encrypt, isEncrypted } = await import('@/lib/security/encryption')
    expect(isEncrypted(encrypt('teste'))).toBe(true)
    expect(isEncrypted('texto-normal')).toBe(false)
    expect(isEncrypted('')).toBe(false)
  })

  it('safeDecrypt retorna original para dados nao criptografados', async () => {
    const { safeDecrypt } = await import('@/lib/security/encryption')
    expect(safeDecrypt('texto-simples')).toBe('texto-simples')
  })

  it('safeDecrypt descriptografa dados criptografados', async () => {
    const { encrypt, safeDecrypt } = await import('@/lib/security/encryption')
    const encrypted = encrypt('secreto')
    expect(safeDecrypt(encrypted)).toBe('secreto')
  })

  it('ensureEncrypted nao criptografa duas vezes', async () => {
    const { encrypt, ensureEncrypted, decrypt } = await import('@/lib/security/encryption')
    const encrypted = encrypt('dado')
    const doubled = ensureEncrypted(encrypted)
    expect(doubled).toBe(encrypted) // nao re-criptografou
    expect(decrypt(doubled)).toBe('dado')
  })

  it('hashForSearch gera hash deterministico', async () => {
    const { hashForSearch } = await import('@/lib/security/encryption')
    const a = hashForSearch('email@teste.com')
    const b = hashForSearch('email@teste.com')
    expect(a).toBe(b)
    expect(a).toHaveLength(64) // SHA-256
  })

  it('hashForSearch normaliza case e espacos', async () => {
    const { hashForSearch } = await import('@/lib/security/encryption')
    expect(hashForSearch('Email@Teste.com ')).toBe(hashForSearch('email@teste.com'))
  })

  it('decrypt falha com dados corrompidos', async () => {
    const { decrypt } = await import('@/lib/security/encryption')
    expect(() => decrypt('invalido')).toThrow('Formato invalido')
  })
})
