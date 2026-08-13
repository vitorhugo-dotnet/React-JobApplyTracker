import { test, expect, setupAuthed } from './support/fixtures'

test.describe('Exports', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/exports')
  })

  test('renders the manual export, schedules and history panels', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Exports', exact: true })).toBeVisible()
    await expect(page.getByText('Manual export')).toBeVisible()
    await expect(page.getByText('Scheduled exports')).toBeVisible()
    await expect(page.getByText('History', { exact: true })).toBeVisible()
  })

  test('downloads a CSV and reports how many rows it holds', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download CSV' }).click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('applywell-applications-2026-07-16.csv')
    await expect(page.getByText(/rows? → applywell-applications/)).toBeVisible()
  })

  test('switches the format to XLSX', async ({ page }) => {
    await page.getByRole('tab', { name: 'XLSX' }).click()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download XLSX' }).click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('applywell-applications-2026-07-16.xlsx')
  })

  test('sends the selected filters with the request', async ({ page }) => {
    await page.getByRole('button', { name: 'RH', exact: true }).click()
    await page.getByLabel('Organization').fill('ACME')

    const requestPromise = page.waitForRequest(
      (request) => request.url().includes('/exports/applications') && request.method() === 'POST',
    )
    await page.getByRole('button', { name: 'Download CSV' }).click()

    const body = (await requestPromise).postDataJSON() as {
      format: string
      filters: { status: string[]; organization: string }
    }
    expect(body.format).toBe('CSV')
    expect(body.filters.status).toEqual(['RH'])
    expect(body.filters.organization).toBe('ACME')
  })

  test('creates a recurring export schedule', async ({ page }) => {
    await page.getByRole('button', { name: '+ New schedule' }).click()
    await page.getByLabel('Name').fill('Daily applications backup')
    await page.getByRole('button', { name: 'Save schedule' }).click()

    await expect(page.getByText('Daily applications backup')).toBeVisible()
    await expect(page.getByText(/Daily at 20:00/)).toBeVisible()
  })

  test('asks for the weekday when the recurrence is weekly', async ({ page }) => {
    await page.getByRole('button', { name: '+ New schedule' }).click()
    await expect(page.getByLabel('Day of week')).toHaveCount(0)

    await page.getByLabel('Frequency').selectOption('WEEKLY')
    await expect(page.getByLabel('Day of week')).toBeVisible()
  })

  test('pauses a schedule', async ({ page }) => {
    await page.getByRole('button', { name: '+ New schedule' }).click()
    await page.getByLabel('Name').fill('Weekly backup')
    await page.getByRole('button', { name: 'Save schedule' }).click()
    await expect(page.getByText('Weekly backup')).toBeVisible()

    await page.getByRole('switch', { name: 'Enable Weekly backup' }).click()
    await expect(page.getByText('Paused')).toBeVisible()
  })

  test('runs a schedule on demand and records it in the history', async ({ page }) => {
    await page.getByRole('button', { name: '+ New schedule' }).click()
    await page.getByLabel('Name').fill('On demand backup')
    await page.getByRole('button', { name: 'Save schedule' }).click()
    await expect(page.getByText('On demand backup')).toBeVisible()

    await page.getByRole('button', { name: 'Run now' }).click()

    // `exact` keeps this off the "Run now" button, which is still on screen.
    await expect(page.getByText('run now', { exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'PENDING' })).toBeVisible()
  })

  test('deletes a schedule after confirmation', async ({ page }) => {
    await page.getByRole('button', { name: '+ New schedule' }).click()
    await page.getByLabel('Name').fill('Temporary backup')
    await page.getByRole('button', { name: 'Save schedule' }).click()
    await expect(page.getByText('Temporary backup')).toBeVisible()

    await page.getByRole('button', { name: 'Delete', exact: true }).click()
    await page.getByRole('button', { name: 'Delete', exact: true }).last().click()

    await expect(page.getByText('No schedules yet.')).toBeVisible()
  })
})
