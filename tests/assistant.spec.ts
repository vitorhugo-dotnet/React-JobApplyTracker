import { test, expect, setupAuthed } from './support/fixtures'

test.describe('Ask ApplyWell assistant', () => {
  test('streams an answer in the desktop popup', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await setupAuthed(page)
    await page.goto('/dashboard')

    await page.getByRole('button', { name: 'Open Ask ApplyWell' }).click()
    const dialog = page.getByRole('dialog', { name: 'Ask ApplyWell' })
    await expect(dialog).toBeVisible()

    await dialog.getByPlaceholder('Ask about your applications…').fill('How many applications?')
    await dialog.getByRole('button', { name: 'Send message' }).click()

    await expect(dialog.getByText('You have 24 applications.')).toBeVisible()
    await expect(dialog.getByText('Application statistics')).toBeVisible()
    await expect(dialog.getByText('Powered by Gemini')).toBeHidden()
    await expect(dialog.getByRole('button', { name: 'Send message' })).toBeDisabled()
    await dialog.getByRole('button', { name: 'Close Ask ApplyWell' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: 'Open Ask ApplyWell' })).toBeFocused()
  })

  test('reuses the same conversation ID for subsequent messages', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await setupAuthed(page)

    const requests: Array<{ conversationId?: string; message: string }> = []
    await page.route('**/api/v1/assistant/chat', async (route) => {
      const body = route.request().postDataJSON() as { conversationId?: string; message: string }
      requests.push(body)
      const answer = body.message === 'first message' ? 'First answer.' : 'Second answer.'
      return route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: [
          `event: token\ndata: {"content":"${answer}"}\n\n`,
          'event: complete\ndata: {"sources":[]}\n\n',
        ].join(''),
      })
    })

    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Open Ask ApplyWell' }).click()
    const dialog = page.getByRole('dialog', { name: 'Ask ApplyWell' })
    const input = dialog.getByPlaceholder('Ask about your applications…')

    await input.fill('first message')
    await dialog.getByRole('button', { name: 'Send message' }).click()
    await expect(dialog.getByText('First answer.')).toBeVisible()

    await input.fill('second message')
    await dialog.getByRole('button', { name: 'Send message' }).click()
    await expect(dialog.getByText('Second answer.')).toBeVisible()

    expect(requests).toHaveLength(2)
    expect(requests[0].conversationId).toMatch(/^[0-9a-f-]{36}$/)
    expect(requests[1].conversationId).toBe(requests[0].conversationId)
  })

  test('regenerates an invalid persisted conversation ID before sending', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await setupAuthed(page)
    await page.goto('/dashboard')

    await page.evaluate(async () => {
      const [{ getDb }, { encryptData, getEncryptionKey }] = await Promise.all([
        import('../src/lib/db.ts'),
        import('../src/lib/crypto.ts'),
      ])
      const db = await getDb()
      const key = await getEncryptionKey('user-1')
      await db.put('assistantHistory', {
        key: 'assistant-history:user-1',
        data: await encryptData({ conversationId: '', messages: [] }, key),
      })
    })

    let sentConversationId: string | undefined
    await page.route('**/api/v1/assistant/chat', async (route) => {
      const body = route.request().postDataJSON() as { conversationId?: string; message: string }
      sentConversationId = body.conversationId
      return route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: [
          'event: token\ndata: {"content":"Recovered conversation."}\n\n',
          'event: complete\ndata: {"sources":[]}\n\n',
        ].join(''),
      })
    })

    await page.getByRole('button', { name: 'Open Ask ApplyWell' }).click()
    const dialog = page.getByRole('dialog', { name: 'Ask ApplyWell' })
    await dialog.getByPlaceholder('Ask about your applications…').fill('hello')
    await dialog.getByRole('button', { name: 'Send message' }).click()

    await expect(dialog.getByText('Recovered conversation.')).toBeVisible()
    expect(sentConversationId).toMatch(/^[0-9a-f-]{36}$/)
  })

  test('shows a clean UI error for HTTP validation failures before SSE starts', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await setupAuthed(page)

    await page.route('**/api/v1/assistant/chat', async (route) => {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          fieldErrors: { conversationId: 'Conversation ID is required' },
        }),
      })
    })

    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Open Ask ApplyWell' }).click()
    const dialog = page.getByRole('dialog', { name: 'Ask ApplyWell' })
    await dialog.getByPlaceholder('Ask about your applications…').fill('trigger validation')
    await dialog.getByRole('button', { name: 'Send message' }).click()

    await expect(dialog.getByText('The assistant request could not be sent. Please try again.')).toBeVisible()
    await expect(dialog.getByText('Thinking…')).toBeHidden()
  })

  test('retries the assistant request after refreshing an expired access token', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await setupAuthed(page)

    const refreshedToken = 'mock-refreshed-access-token'
    let assistantAttempts = 0
    let refreshAttempts = 0

    await page.route('**/api/v1/assistant/chat', async (route) => {
      assistantAttempts += 1
      if (assistantAttempts === 1) {
        return route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Forbidden' }),
        })
      }

      expect(route.request().headers().authorization).toBe(`Bearer ${refreshedToken}`)
      const events = [
        'event: token\ndata: {"content":"You have "}\n\n',
        'event: token\ndata: {"content":"24 applications."}\n\n',
        'event: complete\ndata: {"sources":["APPLICATION_STATS"]}\n\n',
      ].join('')
      return route.fulfill({ status: 200, contentType: 'text/event-stream', body: events })
    })

    await page.route('**/api/v1/auth/refresh', async (route) => {
      refreshAttempts += 1
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: refreshedToken }),
      })
    })

    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Open Ask ApplyWell' }).click()
    const dialog = page.getByRole('dialog', { name: 'Ask ApplyWell' })

    await dialog.getByPlaceholder('Ask about your applications…').fill('How many applications?')
    await dialog.getByRole('button', { name: 'Send message' }).click()

    await expect(dialog.getByText('You have 24 applications.')).toBeVisible()
    await expect(dialog.getByText('Thinking…')).toBeHidden()
    expect(refreshAttempts).toBe(1)
    expect(assistantAttempts).toBe(2)
  })

  test('opens as a full-screen chat from the mobile Speed Dial', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await setupAuthed(page)
    await page.goto('/dashboard')

    await expect(page.getByRole('button', { name: 'Open Ask ApplyWell' })).toBeHidden()
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await page.getByRole('button', { name: 'Ask ApplyWell' }).click()

    const dialog = page.getByRole('dialog', { name: 'Ask ApplyWell' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveCSS('position', 'fixed')
    await expect(dialog).toHaveCSS('inset', '0px')
    await expect(dialog.getByRole('button', { name: 'Back' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused()
  })

  test('shows a retry action after a sanitized provider error', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await setupAuthed(page)
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Open Ask ApplyWell' }).click()

    const dialog = page.getByRole('dialog', { name: 'Ask ApplyWell' })
    await dialog.getByPlaceholder('Ask about your applications…').fill('trigger error')
    await dialog.getByRole('button', { name: 'Send message' }).click()

    await expect(dialog.getByText('The assistant is temporarily unavailable.')).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Retry' })).toBeVisible()
  })

  test('marks the originating user message as failed and retries it without duplication', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await setupAuthed(page)

    let attempts = 0
    const conversationIds: string[] = []
    await page.route('**/api/v1/assistant/chat', async (route) => {
      attempts += 1
      const body = route.request().postDataJSON() as { message: string; conversationId?: string }
      conversationIds.push(body.conversationId ?? '')

      if (attempts === 1) {
        return route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: 'event: error\ndata: {"code":"PROVIDER_UNAVAILABLE","message":"Assistant provider is unavailable"}\n\n',
        })
      }

      return route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: [
          'event: token\ndata: {"content":"Recovered."}\n\n',
          'event: complete\ndata: {"sources":[]}\n\n',
        ].join(''),
      })
    })

    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Open Ask ApplyWell' }).click()
    const dialog = page.getByRole('dialog', { name: 'Ask ApplyWell' })

    await dialog.getByPlaceholder('Ask about your applications…').fill('retry me')
    await dialog.getByRole('button', { name: 'Send message' }).click()

    await expect(dialog.getByLabel('Message failed')).toBeVisible()
    const retry = dialog.getByRole('button', { name: 'Retry message' })
    await expect(retry).toBeVisible()
    await retry.click()

    await expect(dialog.getByText('Recovered.')).toBeVisible()
    await expect(dialog.getByText('retry me')).toHaveCount(1)
    await expect(dialog.getByLabel('Message failed')).toBeHidden()
    expect(attempts).toBe(2)
    expect(conversationIds[0]).toMatch(/^[0-9a-f-]{36}$/)
    expect(conversationIds[1]).toBe(conversationIds[0])
  })

  test('uses the provider retry delay for a manual rate-limit countdown', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await setupAuthed(page)

    let attempts = 0
    await page.route('**/api/v1/assistant/chat', async (route) => {
      attempts += 1
      return route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'event: error\ndata: {"code":"RATE_LIMITED","message":"Gemini rate limit exceeded","retryAfterSeconds":2}\n\n',
      })
    })

    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Open Ask ApplyWell' }).click()
    const dialog = page.getByRole('dialog', { name: 'Ask ApplyWell' })

    await dialog.getByPlaceholder('Ask about your applications…').fill('rate limited')
    await dialog.getByRole('button', { name: 'Send message' }).click()

    const retry = dialog.getByRole('button', { name: 'Retry message' })
    await expect(retry).toBeDisabled()
    await expect(dialog.getByText(/Rate limit reached\. Try again in [12]s\./)).toBeVisible()
    await expect(retry).toBeEnabled({ timeout: 4_000 })
    expect(attempts).toBe(1)
  })

  test('restores a completed conversation after a page reload', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await setupAuthed(page)
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Open Ask ApplyWell' }).click()

    const dialog = page.getByRole('dialog', { name: 'Ask ApplyWell' })
    await dialog.getByPlaceholder('Ask about your applications…').fill('How many applications?')
    await dialog.getByRole('button', { name: 'Send message' }).click()
    await expect(dialog.getByText('You have 24 applications.')).toBeVisible()

    await page.reload()
    await page.getByRole('button', { name: 'Open Ask ApplyWell' }).click()
    await expect(page.getByRole('dialog', { name: 'Ask ApplyWell' }).getByText('How many applications?')).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Ask ApplyWell' }).getByText('You have 24 applications.')).toBeVisible()
  })

  test('clears the persisted conversation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await setupAuthed(page)
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Open Ask ApplyWell' }).click()

    const dialog = page.getByRole('dialog', { name: 'Ask ApplyWell' })
    await dialog.getByPlaceholder('Ask about your applications…').fill('How many applications?')
    await dialog.getByRole('button', { name: 'Send message' }).click()
    await expect(dialog.getByText('You have 24 applications.')).toBeVisible()

    await dialog.getByRole('button', { name: 'Clear conversation' }).click()
    await expect(dialog.getByText('How many applications?')).toBeHidden()

    await page.reload()
    await page.getByRole('button', { name: 'Open Ask ApplyWell' }).click()
    await expect(page.getByRole('dialog', { name: 'Ask ApplyWell' }).getByText('How many applications?')).toBeHidden()
  })

  test('preserves a prompt when the page reloads during a response', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await setupAuthed(page)
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Open Ask ApplyWell' }).click()

    const dialog = page.getByRole('dialog', { name: 'Ask ApplyWell' })
    await dialog.getByPlaceholder('Ask about your applications…').fill('slow response')
    await dialog.getByRole('button', { name: 'Send message' }).click()
    await expect(dialog.getByText('slow response')).toBeVisible()

    await page.reload()
    await page.getByRole('button', { name: 'Open Ask ApplyWell' }).click()
    await expect(page.getByRole('dialog', { name: 'Ask ApplyWell' }).getByText('slow response')).toBeVisible()
  })

  test('renders safe Markdown and sanitized HTML from the assistant', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await setupAuthed(page)
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Open Ask ApplyWell' }).click()

    const dialog = page.getByRole('dialog', { name: 'Ask ApplyWell' })
    await dialog.getByPlaceholder('Ask about your applications…').fill('render rich content')
    await dialog.getByRole('button', { name: 'Send message' }).click()

    await expect(dialog.getByText('important')).toHaveCSS('font-weight', '700')
    await expect(dialog.getByRole('link', { name: 'ApplyWell' })).toHaveAttribute('href', 'https://applywell.hugojava.dev/')
    await expect(dialog.getByText('Safe HTML')).toBeVisible()
    await expect(dialog.locator('script')).toHaveCount(0)
    await expect(dialog.locator('img[src="x"]')).toHaveCount(0)
  })
})
