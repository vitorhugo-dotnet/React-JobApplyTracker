import { test, expect, setupAuthed } from './support/fixtures'
import { MOCK_GITHUB_PROFILE } from './support/data'

/** The reference is the numeric user ID, so a renamed account keeps the same ID. */
const RENAMED_PROFILE = {
  ...MOCK_GITHUB_PROFILE,
  login: 'vitorhugo-renamed',
  htmlUrl: 'https://github.com/vitorhugo-renamed',
}

test.describe('Developer Tools source code link', () => {
  test('links to the profile resolved from the stable GitHub user ID', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/developer')

    await expect(page.getByRole('link', { name: 'vitorhugo-dotnet' })).toBeVisible()
    await expect(page.getByRole('link', { name: /View on GitHub/ })).toHaveAttribute(
      'href',
      'https://github.com/vitorhugo-dotnet',
    )
  })

  test('follows a username change without reconfiguration', async ({ page }) => {
    await setupAuthed(page)
    await page.route('**/api/v1/github/profile', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(RENAMED_PROFILE),
      }),
    )
    await page.goto('/developer')

    await expect(page.getByRole('link', { name: 'vitorhugo-renamed' })).toBeVisible()
    await expect(page.getByRole('link', { name: /View on GitHub/ })).toHaveAttribute(
      'href',
      'https://github.com/vitorhugo-renamed',
    )
  })

  test('still renders a usable link when the profile cannot be resolved', async ({ page }) => {
    await setupAuthed(page)
    await page.route('**/api/v1/github/profile', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'GitHub profile could not be resolved' }),
      }),
    )
    await page.goto('/developer')

    await expect(page.getByRole('link', { name: /View on GitHub/ })).toHaveAttribute(
      'href',
      /^https:\/\/github\.com\/.+/,
    )
  })
})
