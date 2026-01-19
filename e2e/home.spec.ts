import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/')

    // Verificar título da página
    await expect(page).toHaveTitle(/Câmara Municipal|Portal/)

    // Verificar header
    await expect(page.locator('header')).toBeVisible()

    // Verificar footer
    await expect(page.locator('footer')).toBeVisible()
  })

  test('should have navigation links', async ({ page }) => {
    await page.goto('/')

    // Verificar links de navegação principais
    const nav = page.locator('nav, header')

    // Links esperados na navegação
    const expectedLinks = [
      'Parlamentares',
      'Legislativo',
      'Transparência'
    ]

    for (const linkText of expectedLinks) {
      const link = nav.getByRole('link', { name: new RegExp(linkText, 'i') })
      await expect(link.first()).toBeVisible()
    }
  })

  test('should be responsive', async ({ page }) => {
    await page.goto('/')

    // Verificar que a página carrega em diferentes tamanhos
    await page.setViewportSize({ width: 375, height: 667 }) // Mobile
    await expect(page.locator('body')).toBeVisible()

    await page.setViewportSize({ width: 768, height: 1024 }) // Tablet
    await expect(page.locator('body')).toBeVisible()

    await page.setViewportSize({ width: 1920, height: 1080 }) // Desktop
    await expect(page.locator('body')).toBeVisible()
  })
})
