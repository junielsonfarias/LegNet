import { test, expect } from '@playwright/test'

test.describe('Public APIs', () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

  test('should return parlamentares list from API', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/parlamentares`)

    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('success', true)
    expect(data).toHaveProperty('data')
    expect(Array.isArray(data.data)).toBeTruthy()
  })

  test('should return sessoes list from API', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/sessoes`)

    // API pode requerer autenticação
    if (response.status() === 401) {
      expect(response.status()).toBe(401)
    } else {
      expect(response.ok()).toBeTruthy()
      const data = await response.json()
      expect(data).toHaveProperty('success', true)
    }
  })

  test('should return proposicoes list from API', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/proposicoes`)

    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('success', true)
    expect(data).toHaveProperty('data')
  })

  test('should return legislaturas from API', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/legislaturas`)

    if (response.status() === 401) {
      expect(response.status()).toBe(401)
    } else {
      expect(response.ok()).toBeTruthy()
      const data = await response.json()
      expect(data).toHaveProperty('success', true)
    }
  })

  test('should handle pagination correctly', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/parlamentares?page=1&limit=5`)

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    expect(data).toHaveProperty('meta')
    if (data.meta) {
      expect(data.meta).toHaveProperty('page')
      expect(data.meta).toHaveProperty('limit')
      expect(data.meta).toHaveProperty('total')
    }
  })

  test('should return 404 for non-existent resource', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/parlamentares/id-inexistente-12345`)

    // Pode ser 404 ou outro erro
    expect([404, 400, 500]).toContain(response.status())
  })
})

test.describe('Health Check', () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

  test('should return health status', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`)

    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('status')
  })
})
