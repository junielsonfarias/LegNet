import { test, expect } from '@playwright/test'

test.describe('Transparência Portal', () => {
  test('should display transparency portal', async ({ page }) => {
    await page.goto('/transparencia')
    await page.waitForLoadState('networkidle')

    // Verificar título
    await expect(page.getByRole('heading', { name: /transparência/i }).first()).toBeVisible()

    // Verificar seções principais
    const sections = [
      /licitações|licitacoes/i,
      /contratos/i,
      /despesas/i,
      /receitas/i
    ]

    for (const section of sections) {
      const element = page.getByText(section).first()
      await expect(element).toBeVisible({ timeout: 5000 })
    }
  })

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/transparencia')
    await page.waitForLoadState('networkidle')

    // Testar navegação para licitações
    const licitacoesLink = page.getByRole('link', { name: /licitações|licitacoes/i }).first()

    if (await licitacoesLink.isVisible()) {
      await licitacoesLink.click()
      await expect(page.url()).toContain('licitacoes')
    }
  })

  test('should display legislation section', async ({ page }) => {
    await page.goto('/transparencia/leis')
    await page.waitForLoadState('networkidle')

    // Verificar seção de leis
    await expect(page.getByRole('heading', { name: /leis|legislação/i }).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Legislativo Portal', () => {
  test('should display legislative portal', async ({ page }) => {
    await page.goto('/legislativo')
    await page.waitForLoadState('networkidle')

    // Verificar título
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('should display sessions list', async ({ page }) => {
    await page.goto('/legislativo/sessoes')
    await page.waitForLoadState('networkidle')

    // Verificar título de sessões
    await expect(page.getByRole('heading', { name: /sessões|sessoes/i }).first()).toBeVisible({ timeout: 10000 })
  })

  test('should display propositions list', async ({ page }) => {
    await page.goto('/legislativo/proposicoes')
    await page.waitForLoadState('networkidle')

    // Verificar título de proposições
    await expect(page.getByRole('heading', { name: /proposições|proposicoes|projetos/i }).first()).toBeVisible({ timeout: 10000 })
  })
})
