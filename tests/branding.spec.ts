import { test, expect, setupAuthed } from './support/fixtures'

test.describe('Branding', () => {
  test('uses logo and favicon variants that match the selected theme', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'light'))
    await setupAuthed(page)
    await page.goto('/dashboard')

    const lightLogo = page.getByTestId('brand-logo-light')
    const darkLogo = page.getByTestId('brand-logo-dark')
    const favicon = page.locator('link[rel="icon"]')

    await expect(lightLogo).toBeVisible()
    await expect(darkLogo).toBeHidden()
    await expect(favicon).toHaveAttribute('href', '/favicon-light.svg')

    await page.getByRole('button', { name: 'Switch to dark mode' }).click()

    await expect(lightLogo).toBeHidden()
    await expect(darkLogo).toBeVisible()
    await expect(favicon).toHaveAttribute('href', '/favicon-dark.svg')

    await page.getByRole('button', { name: 'Open Ask ApplyWell' }).click()
    await expect(page.getByRole('dialog', { name: 'Ask ApplyWell' }).getByTestId('brand-logo-dark')).toBeVisible()
  })

  test('uses the dark logo on authentication screens when dark mode is persisted', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'))
    await setupAuthed(page)
    await page.goto('/login')

    await expect(page.getByTestId('brand-logo-light')).toBeHidden()
    await expect(page.getByTestId('brand-logo-dark')).toBeVisible()
  })
})
