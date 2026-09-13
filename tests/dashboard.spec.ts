import { test, expect, setupAuthed } from './support/fixtures'
import { MOCK_SUMMARY } from './support/data'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/dashboard')
  })

  test('renders metric cards from the summary endpoint', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Total Applications')).toBeVisible()
    await expect(page.getByText('36', { exact: true })).toBeVisible()
    await expect(page.getByText('Waiting Responses')).toBeVisible()
  })

  test('shows achievements and follow-up panels', async ({ page }) => {
    await expect(page.getByText('First Contact')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'To Send Later' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Overdue Follow-ups' })).toBeVisible()
  })

  test('shows gamification progress and Ghosting Rate in the unified dashboard', async ({ page }) => {
    await expect(page.getByText('Current rank')).toBeVisible()
    await expect(page.getByText('Day streak')).toBeVisible()
    await expect(page.getByText('Ghosting Rate')).toBeVisible()
    await expect(page.getByText('8%', { exact: true })).toBeVisible()
    await expect(page.getByText('3 ghosted')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Standard' })).not.toBeVisible()
    await expect(page.getByRole('tab', { name: 'Gamified' })).not.toBeVisible()
  })

  test('does not show a global search field in the top bar', async ({ page }) => {
    await expect(page.getByPlaceholder('Search…')).not.toBeVisible()
  })

  test('the sidebar shows the XP/level indicator', async ({ page }) => {
    await expect(page.getByRole('complementary').getByText('Level 7')).toBeVisible()
  })
})

test.describe('Dashboard edge cases', () => {
  test('keeps dashboard metrics available when the gamification profile is unavailable', async ({ page }) => {
    await setupAuthed(page)
    await page.route('**/api/v1/gamification/profile', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({}) }),
    )
    await page.goto('/dashboard')

    await expect(page.getByText('Total Applications')).toBeVisible()
    await expect(page.getByText('Current rank')).not.toBeVisible()
  })

  test('renders a zero Ghosting Rate without applications', async ({ page }) => {
    await setupAuthed(page)
    await page.route('**/api/v1/dashboard/summary', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_SUMMARY, totalApplications: 0, ghostingCount: 0 }),
      }),
    )
    await page.goto('/dashboard')

    const ghostingCard = page.getByText('Ghosting Rate').locator('..')
    await expect(ghostingCard).toBeVisible()
    await expect(ghostingCard.getByText('0%', { exact: true })).toBeVisible()
    await expect(ghostingCard.getByText('0 ghosted')).toBeVisible()
  })
})
