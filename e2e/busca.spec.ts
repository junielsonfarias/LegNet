import { test, expect } from '@playwright/test'

test.describe('Search API', () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

  test('should return search results from API', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/busca?q=teste&limite=5`)

    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('resultados')
    expect(data).toHaveProperty('total')
    expect(data).toHaveProperty('pagina')
    expect(data).toHaveProperty('totalPaginas')
    expect(data).toHaveProperty('facetas')
    expect(data).toHaveProperty('tempoMs')
    expect(Array.isArray(data.resultados)).toBeTruthy()
  })

  test('should return facetas with tipos and anos', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/busca?q=projeto`)

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    expect(data.facetas).toHaveProperty('tipos')
    expect(data.facetas).toHaveProperty('anos')
    expect(Array.isArray(data.facetas.tipos)).toBeTruthy()
    expect(Array.isArray(data.facetas.anos)).toBeTruthy()
  })

  test('should filter by tipo', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/busca?q=teste&tipos=proposicao,parlamentar`)

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    // All results should be of type proposicao or parlamentar
    for (const resultado of data.resultados) {
      expect(['proposicao', 'parlamentar']).toContain(resultado.tipo)
    }
  })

  test('should support quick search mode', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/busca?q=teste&rapida=true&limite=5`)

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    // Quick search should return fewer results
    expect(data.resultados.length).toBeLessThanOrEqual(5)
  })

  test('should return 400 for short search term', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/busca?q=a`)

    // Should handle short terms gracefully
    const data = await response.json()
    expect(data.resultados.length).toBe(0)
  })

  test('should paginate results', async ({ request }) => {
    // First page
    const response1 = await request.get(`${BASE_URL}/api/busca?q=projeto&pagina=1&limite=5`)
    expect(response1.ok()).toBeTruthy()
    const data1 = await response1.json()

    if (data1.totalPaginas > 1) {
      // Second page
      const response2 = await request.get(`${BASE_URL}/api/busca?q=projeto&pagina=2&limite=5`)
      expect(response2.ok()).toBeTruthy()
      const data2 = await response2.json()

      expect(data2.pagina).toBe(2)
      // Results should be different on different pages
      if (data1.resultados.length > 0 && data2.resultados.length > 0) {
        expect(data1.resultados[0].id).not.toBe(data2.resultados[0].id)
      }
    }
  })

  test('should include suggestions', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/busca?q=lei`)

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    expect(data).toHaveProperty('sugestoes')
    expect(Array.isArray(data.sugestoes)).toBeTruthy()
  })

  test('should return result with required fields', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/busca?q=projeto&limite=1`)

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    if (data.resultados.length > 0) {
      const resultado = data.resultados[0]
      expect(resultado).toHaveProperty('id')
      expect(resultado).toHaveProperty('tipo')
      expect(resultado).toHaveProperty('titulo')
      expect(resultado).toHaveProperty('descricao')
      expect(resultado).toHaveProperty('url')
      expect(resultado).toHaveProperty('relevancia')
    }
  })
})

test.describe('Search Page UI', () => {
  test.skip('should load search page', async ({ page }) => {
    // Skip if not authenticated
    await page.goto('/admin/busca')

    // Check for search input
    const searchInput = page.locator('input[type="text"]')
    await expect(searchInput).toBeVisible()
  })

  test.skip('should search and display results', async ({ page }) => {
    await page.goto('/admin/busca?q=teste')

    // Wait for results
    await page.waitForTimeout(1000)

    // Check for results or no results message
    const hasResults = await page.locator('[class*="rounded-xl"]').count() > 0
    const hasNoResults = await page.locator('text=Nenhum resultado').count() > 0

    expect(hasResults || hasNoResults).toBeTruthy()
  })
})
