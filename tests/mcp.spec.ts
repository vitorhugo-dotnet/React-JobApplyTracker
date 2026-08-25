import { test, expect, setupAuthed } from './support/fixtures'

const ENDPOINT = 'https://jobapply-api.hugojava.dev/mcp'

const OFFICIAL_DOCS = [
  'https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt',
  'https://developers.openai.com/codex/mcp/',
  'https://docs.claude.com/en/docs/claude-code/mcp',
  'https://modelcontextprotocol.io/docs/getting-started/intro',
]

test.describe('MCP integration page', () => {
  test('is reachable from the System section of the sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await setupAuthed(page)
    await page.goto('/dashboard')

    await page.locator('aside').getByRole('link', { name: 'MCP', exact: true }).click()

    await expect(page).toHaveURL(/\/mcp$/)
    await expect(page.getByRole('heading', { name: 'MCP Integration', level: 1 })).toBeVisible()
    // Breadcrumb resolves the item to its sidebar section.
    await expect(page.getByLabel('Breadcrumb')).toContainText('System')
  })

  test('is reachable from the mobile navigation menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await setupAuthed(page)
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await page.getByRole('link', { name: 'MCP', exact: true }).click()

    await expect(page).toHaveURL(/\/mcp$/)
    await expect(page.getByRole('heading', { name: 'MCP Integration', level: 1 })).toBeVisible()
  })

  test('can be opened directly by URL', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/mcp')

    await expect(page.getByRole('heading', { name: 'MCP Integration', level: 1 })).toBeVisible()
  })

  test('shows the endpoint and copies it to the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await setupAuthed(page)
    await page.goto('/mcp')

    await expect(page.getByLabel('Server URL')).toHaveValue(ENDPOINT)

    await page.getByRole('button', { name: 'Copy endpoint', exact: true }).click()

    await expect(page.getByRole('button', { name: 'endpoint copied', exact: true })).toBeVisible()
    const clipboard = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboard).toBe(ENDPOINT)
  })

  test('documents the OAuth flow and warns against manual credentials', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/mcp')

    await expect(page.getByText(/authenticated with\s+OAuth/i)).toBeVisible()
    await expect(page.getByText(/Never paste an access token, API key or password/i)).toBeVisible()
  })

  test('has a setup guide per client with a link to the official documentation', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/mcp')

    for (const client of ['ChatGPT', 'Codex', 'Claude / Claude Code', 'Other MCP clients']) {
      await expect(page.getByRole('heading', { name: client, level: 3 })).toBeVisible()
    }

    for (const href of OFFICIAL_DOCS) {
      const link = page.locator(`a[href="${href}"]`).first()
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })

  test('shows ready-to-paste client configuration containing the endpoint', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/mcp')

    await expect(page.getByText(`[mcp_servers.applywell]`)).toBeVisible()
    await expect(page.getByText(`claude mcp add --transport http applywell ${ENDPOINT}`)).toBeVisible()
  })

  test('never renders a token, secret or credential input', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/mcp')

    await expect(page.locator('input[type="password"]')).toHaveCount(0)
    // The only field is the read-only endpoint.
    const inputs = page.locator('main input')
    for (let i = 0; i < (await inputs.count()); i += 1) {
      await expect(inputs.nth(i)).toHaveAttribute('readonly', '')
    }
  })

  test('renders in dark mode without losing contrast tokens', async ({ page }) => {
    await setupAuthed(page)
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'))
    await page.goto('/mcp')

    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.getByRole('heading', { name: 'MCP Integration', level: 1 })).toBeVisible()
    await expect(page.getByLabel('Server URL')).toHaveValue(ENDPOINT)
  })
})
