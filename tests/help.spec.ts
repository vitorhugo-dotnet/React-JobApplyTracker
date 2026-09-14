import { test, expect, setupAuthed } from './support/fixtures'

test.describe('Help page', () => {
  test('opens help from navigation and explains archive separately from status', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await setupAuthed(page)
    await page.goto('/dashboard')

    await page.getByRole('link', { name: 'Help' }).first().click()

    await expect(page).toHaveURL(/\/help$/)
    await expect(page.getByRole('heading', { name: 'How to use Applywell' })).toBeVisible()
    await expect(page.getByText('Changing a status and archiving are different actions.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Manage applications' })).toHaveAttribute('href', '/applications')
  })
})
