import { test, expect } from '@playwright/test'

test.describe('Legislative Public Pages', () => {
  test('should load proposicoes page', async ({ page }) => {
    await page.goto('/legislativo/proposicoes')

    // Page should load
    await expect(page).toHaveURL(/proposicoes/)

    // Should have a title or header
    const header = page.locator('h1, h2').first()
    await expect(header).toBeVisible()
  })

  test('should load sessoes page', async ({ page }) => {
    await page.goto('/legislativo/sessoes')

    await expect(page).toHaveURL(/sessoes/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should load comissoes page', async ({ page }) => {
    await page.goto('/legislativo/comissoes')

    await expect(page).toHaveURL(/comissoes/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should load normas page', async ({ page }) => {
    await page.goto('/legislativo/normas')

    await expect(page).toHaveURL(/normas/)
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Legislative APIs', () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

  test('should return proposicoes with correct structure', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/proposicoes`)

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    expect(data).toHaveProperty('success', true)
    expect(data).toHaveProperty('data')
    expect(Array.isArray(data.data)).toBeTruthy()

    if (data.data.length > 0) {
      const proposicao = data.data[0]
      expect(proposicao).toHaveProperty('id')
      expect(proposicao).toHaveProperty('tipo')
      expect(proposicao).toHaveProperty('numero')
      expect(proposicao).toHaveProperty('ano')
    }
  })

  test('should filter proposicoes by tipo', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/proposicoes?tipo=PROJETO_DE_LEI`)

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    expect(data).toHaveProperty('success', true)
    for (const prop of data.data) {
      expect(prop.tipo).toBe('PROJETO_DE_LEI')
    }
  })

  test('should filter proposicoes by ano', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/proposicoes?ano=2026`)

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    expect(data).toHaveProperty('success', true)
    for (const prop of data.data) {
      expect(prop.ano).toBe(2026)
    }
  })

  test('should return comissoes list', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/comissoes`)

    if (response.status() !== 401) {
      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
    }
  })

  test('should return tramitacoes for proposicao', async ({ request }) => {
    // First get a proposicao
    const propResponse = await request.get(`${BASE_URL}/api/proposicoes?limit=1`)
    const propData = await propResponse.json()

    if (propData.data && propData.data.length > 0) {
      const propId = propData.data[0].id
      const tramResponse = await request.get(`${BASE_URL}/api/proposicoes/${propId}/tramitacoes`)

      if (tramResponse.status() !== 401) {
        const tramData = await tramResponse.json()
        expect(tramData).toHaveProperty('success')
      }
    }
  })
})

test.describe('Public Integration APIs', () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

  test('should return sessoes from public integration API', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/integracoes/public/sessoes`)

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    expect(data).toHaveProperty('success', true)
    expect(data).toHaveProperty('data')
  })

  test('should return proposicoes from public integration API', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/integracoes/public/proposicoes`)

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    expect(data).toHaveProperty('success', true)
    expect(data).toHaveProperty('data')
  })
})
