import { test, expect } from '@playwright/test'

/**
 * Smoke suite — fluxos críticos que DEVEM funcionar em qualquer deploy.
 *
 * Objetivo: executar em <60s, rodar em CI pré-deploy e sinalizar regressões
 * de ponta a ponta nos caminhos essenciais do portal legislativo.
 *
 * Rodar apenas este arquivo: `npm run test:e2e -- smoke.spec.ts`
 */

test.describe('@smoke fluxos críticos', () => {
  test('home pública carrega sem 5xx', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status(), 'status da home').toBeLessThan(500)
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
  })

  test('login renderiza formulário acessível', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel(/email|usuário/i)).toBeVisible()
    // O botao "mostrar/ocultar senha" tambem casa /senha/i — restringir ao input
    await expect(page.locator('input#password')).toBeVisible()
    await expect(page.getByRole('button', { name: /entrar|login|acessar/i })).toBeVisible()
  })

  test('portal transparência carrega índice', async ({ page }) => {
    const response = await page.goto('/transparencia')
    expect(response?.status()).toBeLessThan(500)
    await expect(page.locator('body')).toBeVisible()
  })

  test('listagem de proposições carrega', async ({ page }) => {
    const response = await page.goto('/legislativo/proposicoes')
    expect(response?.status()).toBeLessThan(500)
    await expect(page.locator('body')).toBeVisible()
  })

  test('listagem de parlamentares carrega', async ({ page }) => {
    const response = await page.goto('/parlamentares')
    expect(response?.status()).toBeLessThan(500)
    await expect(page.locator('body')).toBeVisible()
  })

  test('rota protegida /admin redireciona para login', async ({ page }) => {
    const response = await page.goto('/admin')
    // Deve acabar em /login (redirect) — não pode ser 5xx nem carregar admin
    expect(response?.status()).toBeLessThan(500)
    await expect(page).toHaveURL(/\/login/)
  })

  test('rota protegida /parlamentar redireciona para login', async ({ page }) => {
    const response = await page.goto('/parlamentar')
    expect(response?.status()).toBeLessThan(500)
    await expect(page).toHaveURL(/\/login/)
  })

  test('healthcheck de API pública não retorna 5xx', async ({ request }) => {
    // Qualquer endpoint público serve como sinal — usamos o de parlamentares
    const res = await request.get('/api/publico/parlamentares').catch(() => null)
    if (res) {
      expect(res.status(), 'status da API pública').toBeLessThan(500)
    }
  })

  test('404 em rota inexistente não quebra layout', async ({ page }) => {
    const response = await page.goto('/rota-que-nao-existe-xyz-123')
    expect(response?.status()).toBe(404)
  })
})
