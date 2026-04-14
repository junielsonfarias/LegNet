/**
 * Testes unitários para src/lib/rate-limit.ts (Fase 1).
 *
 * Verifica o comportamento do backend em memória (default quando
 * UPSTASH_REDIS_REST_URL/TOKEN não estão definidos).
 */

// Garante que o módulo resolve para o backend em memória
const origUrl = process.env.UPSTASH_REDIS_REST_URL
const origToken = process.env.UPSTASH_REDIS_REST_TOKEN

beforeAll(() => {
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
})

afterAll(() => {
  if (origUrl !== undefined) process.env.UPSTASH_REDIS_REST_URL = origUrl
  if (origToken !== undefined) process.env.UPSTASH_REDIS_REST_TOKEN = origToken
})

beforeEach(() => {
  // Limpa o store in-memory global entre testes
  const g = globalThis as unknown as {
    __CAMARA_RATE_LIMITER__?: Map<string, unknown>
    __CAMARA_RL_LAST_CLEANUP__?: number
  }
  g.__CAMARA_RATE_LIMITER__ = new Map()
  g.__CAMARA_RL_LAST_CLEANUP__ = Date.now()
})

import { allowRequest, rateLimitBackend } from '@/lib/rate-limit'

describe('rateLimitBackend', () => {
  it('reporta "memory" quando Upstash não está configurado', () => {
    expect(rateLimitBackend).toBe('memory')
  })
})

describe('allowRequest — backend memória', () => {
  it('permite a primeira requisição para uma chave nova', async () => {
    const ok = await allowRequest('user-1:api', 5, 60_000)
    expect(ok).toBe(true)
  })

  it('permite até atingir o limite', async () => {
    const key = 'user-2:api'
    const results: boolean[] = []
    for (let i = 0; i < 5; i++) {
      results.push(await allowRequest(key, 5, 60_000))
    }
    expect(results.every((r) => r === true)).toBe(true)
  })

  it('bloqueia a requisição que excede o limite', async () => {
    const key = 'user-3:api'
    for (let i = 0; i < 3; i++) {
      await allowRequest(key, 3, 60_000)
    }
    const blocked = await allowRequest(key, 3, 60_000)
    expect(blocked).toBe(false)
  })

  it('chaves diferentes têm janelas independentes', async () => {
    await allowRequest('a', 2, 60_000)
    await allowRequest('a', 2, 60_000)
    const aBlocked = await allowRequest('a', 2, 60_000)
    const bAllowed = await allowRequest('b', 2, 60_000)

    expect(aBlocked).toBe(false)
    expect(bAllowed).toBe(true)
  })

  it('libera após expiração da janela', async () => {
    const key = 'user-4:api'
    // Janela curta: 50ms
    await allowRequest(key, 1, 50)
    const blocked = await allowRequest(key, 1, 50)
    expect(blocked).toBe(false)

    // Aguarda expiração
    await new Promise((r) => setTimeout(r, 80))

    const afterExpiry = await allowRequest(key, 1, 50)
    expect(afterExpiry).toBe(true)
  })

  it('limite de 1 permite exatamente 1 requisição por janela', async () => {
    const key = 'user-5:api'
    const first = await allowRequest(key, 1, 60_000)
    const second = await allowRequest(key, 1, 60_000)

    expect(first).toBe(true)
    expect(second).toBe(false)
  })
})
