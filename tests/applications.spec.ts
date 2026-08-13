import type { Page } from '@playwright/test'
import { test, expect, setupAuthed } from './support/fixtures'

test.describe('Applications list', () => {
  test('shows applications in the table view', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/applications')

    await expect(page.getByRole('heading', { name: 'Applications' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Senior Frontend Engineer' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Priya Nayar' })).toBeVisible()
  })

  test('filters by recruiter via search', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/applications')

    await page.getByPlaceholder('Search every field…').fill('Marcus')
    await expect(page.getByRole('cell', { name: 'Product Designer, Growth' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Senior Frontend Engineer' })).toHaveCount(0)
  })

  test('switches to board view', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/applications')

    await page.getByRole('tab', { name: 'Board' }).click()
    await expect(page.getByText('Senior Frontend Engineer')).toBeVisible()
  })

  test('the archived tab lists archived applications', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/applications')

    await page.getByRole('button', { name: /archived/i }).click()
    await expect(page.getByRole('cell', { name: 'Platform Engineer' })).toBeVisible()
  })

  test('shows an empty state when there are no active applications', async ({ page }) => {
    await setupAuthed(page, { empty: true })
    await page.goto('/applications')

    await expect(page.getByRole('heading', { name: 'No applications yet' })).toBeVisible()
  })

  test('archiving removes a row after confirmation', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/applications')

    const row = page.getByRole('row', { name: /Senior Frontend Engineer/ })
    await row.getByRole('button', { name: 'Archive' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Archive' }).click()

    await expect(page.getByRole('cell', { name: 'Senior Frontend Engineer' })).toHaveCount(0)
  })
})

test.describe('Restoring an archived application', () => {
  /** Record every request the page makes, so bodies and refetches can be asserted. */
  function recordRequests(page: Page) {
    const calls: { method: string; url: string; body: unknown }[] = []
    page.on('request', (request) => {
      if (!request.url().includes('/api/v1/applications')) return
      let body: unknown
      try {
        body = request.postDataJSON()
      } catch {
        body = undefined
      }
      calls.push({ method: request.method(), url: request.url(), body })
    })
    return calls
  }

  // Anchored so it does not also match the active "Web Platform Engineer" row.
  const ARCHIVED_ROW = /^Platform Engineer/

  // Matched by text, not by role: the loading spinners are role="status" too.
  const restoredNote = (page: Page) =>
    page.getByText('was restored to your active applications')

  /** Open the archived tab and return the row for the seeded archived application. */
  async function openArchivedTab(page: Page) {
    await page.goto('/applications')
    await page.getByRole('button', { name: /archived/i }).click()
    const row = page.getByRole('row', { name: ARCHIVED_ROW })
    await expect(row).toBeVisible()
    return row
  }

  test('sends a PATCH with a body of exactly { archived: false }', async ({ page }) => {
    await setupAuthed(page)
    const calls = recordRequests(page)
    const row = await openArchivedTab(page)

    await row.getByRole('button', { name: 'Restore' }).click()
    await expect(restoredNote(page)).toBeVisible()

    const patches = calls.filter((c) => c.method === 'PATCH')
    expect(patches).toHaveLength(1)
    expect(patches[0].url).toMatch(/\/api\/v1\/applications\/arch-1$/)
    // Exactly the archive flag — no padded booleans, no resent application.
    expect(patches[0].body).toEqual({ archived: false })
  })

  test('removes the row from the archived list', async ({ page }) => {
    await setupAuthed(page)
    const row = await openArchivedTab(page)

    await row.getByRole('button', { name: 'Restore' }).click()

    await expect(page.getByRole('cell', { name: 'Platform Engineer' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'No archived applications' })).toBeVisible()
  })

  test('refetches the active applications after a restore', async ({ page }) => {
    await setupAuthed(page)
    const calls = recordRequests(page)
    const row = await openArchivedTab(page)

    await row.getByRole('button', { name: 'Restore' }).click()
    await expect(restoredNote(page)).toBeVisible()
    // The archived list refetches straight away — the empty state proves it landed.
    await expect(page.getByRole('heading', { name: 'No archived applications' })).toBeVisible()

    const isActiveQuery = (c: { method: string; url: string }) =>
      c.method === 'GET' && c.url.includes('archived=false')
    const patchIndex = calls.findIndex((c) => c.method === 'PATCH')
    expect(patchIndex).toBeGreaterThanOrEqual(0)
    expect(
      calls.slice(patchIndex + 1).some((c) => c.method === 'GET' && c.url.includes('archived=true')),
    ).toBe(true)

    // …and the active query is invalidated, so switching tabs hits the network.
    const beforeSwitch = calls.filter(isActiveQuery).length
    await page.getByRole('button', { name: /^active/i }).click()
    await expect(page.getByRole('row', { name: ARCHIVED_ROW })).toBeVisible()
    expect(calls.filter(isActiveQuery).length).toBeGreaterThan(beforeSwitch)
  })

  test('leaves the status untouched', async ({ page }) => {
    await setupAuthed(page)
    const row = await openArchivedTab(page)
    await expect(row).toContainText('Rejected')

    await row.getByRole('button', { name: 'Restore' }).click()
    await expect(restoredNote(page)).toBeVisible()

    await page.getByRole('button', { name: /^active/i }).click()
    const restoredRow = page.getByRole('row', { name: ARCHIVED_ROW })
    await expect(restoredRow).toBeVisible()
    await expect(restoredRow).toContainText('Rejected')
  })

  test('shows an error and keeps the row when the request fails', async ({ page }) => {
    await setupAuthed(page)
    // Registered after the mock, so it wins for this one endpoint.
    await page.route('**/api/v1/applications/arch-1', async (route) => {
      if (route.request().method() !== 'PATCH') return route.fallback()
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Could not restore the application.' }),
      })
    })
    const row = await openArchivedTab(page)

    await row.getByRole('button', { name: 'Restore' }).click()

    await expect(page.getByRole('alert')).toContainText('Could not restore the application.')
    await expect(page.getByRole('cell', { name: 'Platform Engineer' })).toBeVisible()
    // The action stays available for a retry.
    await expect(row.getByRole('button', { name: 'Restore' })).toBeEnabled()
  })
})

test.describe('Status and archive independence', () => {
  test('moving an application to Rejected does not archive it', async ({ page }) => {
    await setupAuthed(page)
    const mutations: string[] = []
    page.on('request', (request) => {
      if (['PATCH', 'PUT', 'POST', 'DELETE'].includes(request.method())) {
        mutations.push(`${request.method()} ${new URL(request.url()).pathname}`)
      }
    })

    await page.goto('/applications/app-2/edit')
    await page.getByLabel('Status').selectOption('Rejected')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page).toHaveURL(/\/applications$/)

    // Still on the active tab, with the new status.
    const row = page.getByRole('row', { name: /Product Designer, Growth/ })
    await expect(row).toBeVisible()
    await expect(row).toContainText('Rejected')

    // Nothing archived it behind the user's back.
    expect(mutations.filter((m) => m.includes('/archive'))).toEqual([])
    expect(mutations.filter((m) => m === 'PATCH /api/v1/applications/app-2')).toEqual([])

    await page.getByRole('button', { name: /archived/i }).click()
    await expect(page.getByRole('cell', { name: 'Product Designer, Growth' })).toHaveCount(0)
  })
})

test.describe('Application form', () => {
  test('creates an application and returns to the list', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/applications')

    await page.getByRole('button', { name: 'New Application' }).click()
    await expect(page.getByRole('heading', { name: 'New Application' })).toBeVisible()

    await page.getByLabel('Vacancy Name').fill('QA Engineer')
    await page.getByLabel('Organization').fill('Playwright Inc')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page).toHaveURL(/\/applications$/)
    await expect(page.getByRole('cell', { name: 'QA Engineer' })).toBeVisible()
  })

  test('shows the unsaved-changes banner while editing', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/applications/new')

    await page.getByLabel('Vacancy Name').fill('Typing triggers dirty state')
    await expect(page.getByText('You have unsaved changes.')).toBeVisible()
  })

  test('requires a vacancy name', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/applications/new')

    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Vacancy name is required')).toBeVisible()
  })
})
