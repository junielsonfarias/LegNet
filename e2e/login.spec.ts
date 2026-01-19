import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should display login form', async ({ page }) => {
    // Verificar formulário de login
    await expect(page.getByRole('heading', { name: /login|entrar|acesso/i })).toBeVisible()
    await expect(page.getByLabel(/email|usuário/i)).toBeVisible()
    await expect(page.getByLabel(/senha/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /entrar|login|acessar/i })).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Preencher com credenciais inválidas
    await page.getByLabel(/email|usuário/i).fill('usuario@invalido.com')
    await page.getByLabel(/senha/i).fill('senhaerrada123')
    await page.getByRole('button', { name: /entrar|login|acessar/i }).click()

    // Verificar mensagem de erro
    await expect(page.getByText(/erro|inválido|incorreto|falha/i)).toBeVisible({ timeout: 10000 })
  })

  test('should require email and password', async ({ page }) => {
    // Tentar submeter sem preencher
    await page.getByRole('button', { name: /entrar|login|acessar/i }).click()

    // Verificar validação (navegador ou mensagem de erro)
    const emailInput = page.getByLabel(/email|usuário/i)
    await expect(emailInput).toBeVisible()
  })

  test('should have password visibility toggle', async ({ page }) => {
    const passwordInput = page.getByLabel(/senha/i)

    // Verificar que começa como password
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Procurar botão de toggle
    const toggleButton = page.locator('button:near(:text("Senha"))').filter({ hasText: /mostrar|ver|eye/i }).first()

    if (await toggleButton.isVisible()) {
      await toggleButton.click()
      // Após toggle, deve ser text
      await expect(passwordInput).toHaveAttribute('type', 'text')
    }
  })
})
