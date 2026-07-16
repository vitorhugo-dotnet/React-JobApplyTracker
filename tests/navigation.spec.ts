import { test, expect, setupAuthed } from './support/fixtures'

const buyMeACoffeeUrl = 'https://www.buymeacoffee.com/vitorhugo1207'

test.describe('Buy Me a Coffee navigation', () => {
  test('shows a safe external link in the desktop topbar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await setupAuthed(page)
    await page.goto('/dashboard')

    const link = page.getByRole('link', { name: 'Buy me a coffee' }).first()

    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', buyMeACoffeeUrl)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('shows a safe external link in the mobile navigation menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await setupAuthed(page)
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Open navigation' }).click()

    const link = page.getByRole('link', { name: 'Buy me a coffee' }).last()

    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', buyMeACoffeeUrl)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
