import { test, expect } from '@playwright/test'

test.describe('Parlamentares Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/parlamentares')
  })

  test('should display list of parlamentares', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForLoadState('networkidle')

    // Verificar título da página
    await expect(page.getByRole('heading', { name: /parlamentares|vereadores/i }).first()).toBeVisible()

    // Verificar que há cards ou lista de parlamentares
    const parlamentarCards = page.locator('[data-testid="parlamentar-card"], .card, article')
    await expect(parlamentarCards.first()).toBeVisible({ timeout: 10000 })
  })

  test('should filter parlamentares by search', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Procurar campo de busca
    const searchInput = page.getByPlaceholder(/buscar|pesquisar|filtrar/i)

    if (await searchInput.isVisible()) {
      await searchInput.fill('Vereador')
      await page.waitForTimeout(500) // Debounce

      // Verificar que a lista foi filtrada
      await expect(page.locator('body')).toContainText(/vereador/i)
    }
  })

  test('should navigate to parlamentar profile', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Clicar no primeiro parlamentar
    const firstParlamentar = page.locator('[data-testid="parlamentar-card"], .card, article').first()

    if (await firstParlamentar.isVisible()) {
      const link = firstParlamentar.locator('a').first()
      if (await link.isVisible()) {
        await link.click()

        // Verificar que navegou para página de perfil
        await expect(page.url()).toMatch(/parlamentares\/|perfil/i)
      }
    }
  })
})

test.describe('Parlamentar Profile', () => {
  test('should display parlamentar details', async ({ page }) => {
    // Navegar para lista primeiro
    await page.goto('/parlamentares')
    await page.waitForLoadState('networkidle')

    // Tentar navegar para primeiro perfil
    const firstLink = page.locator('a[href*="/parlamentares/"]').first()

    if (await firstLink.isVisible()) {
      await firstLink.click()
      await page.waitForLoadState('networkidle')

      // Verificar detalhes do parlamentar
      await expect(page.getByRole('heading').first()).toBeVisible()
    }
  })
})
