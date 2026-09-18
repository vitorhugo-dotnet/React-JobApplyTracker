import { expect, setupAuthed, test } from './support/fixtures'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

test.describe('Ask ApplyWell conversation regression', () => {
  test('sends a valid conversation UUID and accepts SSE plus structured errors', async ({ page }) => {
    await setupAuthed(page)

    let conversationId = ''
    let accept = ''
    await page.route('**/api/v1/assistant/chat', async (route) => {
      const body = route.request().postDataJSON() as { conversationId?: string }
      conversationId = body.conversationId ?? ''
      accept = route.request().headers().accept ?? ''
      return route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: [
          'event: token\ndata: {"content":"ok"}\n\n',
          'event: complete\ndata: {"sources":[]}\n\n',
        ].join(''),
      })
    })

    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Open Ask ApplyWell' }).click()
    const dialog = page.getByRole('dialog', { name: 'Ask ApplyWell' })
    await dialog.getByPlaceholder('Ask about your applications…').fill('hello')
    await dialog.getByRole('button', { name: 'Send message' }).click()
    await expect(dialog.getByText('ok')).toBeVisible()

    expect(conversationId).toMatch(UUID_PATTERN)
    expect(accept).toBe('text/event-stream, application/problem+json, application/json')
  })

  test('self-heals when IndexedDB history loading fails', async ({ page }) => {
    await setupAuthed(page)
    await page.addInitScript(() => {
      const originalGet = IDBObjectStore.prototype.get
      IDBObjectStore.prototype.get = function get(query: IDBValidKey | IDBKeyRange) {
        if (this.name === 'assistantHistory') {
          throw new DOMException('simulated assistant history read failure', 'UnknownError')
        }
        return originalGet.call(this, query)
      }
    })

    let conversationId = ''
    await page.route('**/api/v1/assistant/chat', async (route) => {
      const body = route.request().postDataJSON() as { conversationId?: string }
      conversationId = body.conversationId ?? ''
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
    await dialog.getByPlaceholder('Ask about your applications…').fill('recover')
    await dialog.getByRole('button', { name: 'Send message' }).click()

    await expect(dialog.getByText('Recovered.')).toBeVisible()
    expect(conversationId).toMatch(UUID_PATTERN)
  })

  test('clear creates a different conversation UUID', async ({ page }) => {
    await setupAuthed(page)

    const conversationIds: string[] = []
    await page.route('**/api/v1/assistant/chat', async (route) => {
      const body = route.request().postDataJSON() as { conversationId?: string; message: string }
      conversationIds.push(body.conversationId ?? '')
      return route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: [
          `event: token\\ndata: {"content":"answer for ${body.message}"}\\n\\n`,
          'event: complete\ndata: {"sources":[]}\n\n',
        ].join(''),
      })
    })

    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Open Ask ApplyWell' }).click()
    const dialog = page.getByRole('dialog', { name: 'Ask ApplyWell' })
    const input = dialog.getByPlaceholder('Ask about your applications…')

    await input.fill('first')
    await dialog.getByRole('button', { name: 'Send message' }).click()
    await expect(dialog.getByText('answer for first')).toBeVisible()

    await dialog.getByRole('button', { name: 'Clear conversation' }).click()

    await input.fill('second')
    await dialog.getByRole('button', { name: 'Send message' }).click()
    await expect(dialog.getByText('answer for second')).toBeVisible()

    expect(conversationIds).toHaveLength(2)
    expect(conversationIds[0]).toMatch(UUID_PATTERN)
    expect(conversationIds[1]).toMatch(UUID_PATTERN)
    expect(conversationIds[1]).not.toBe(conversationIds[0])
  })

  test('does not feed a JSON response into the SSE parser', async ({ page }) => {
    await setupAuthed(page)

    await page.route('**/api/v1/assistant/chat', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'this is not an SSE response' }),
      })
    })

    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Open Ask ApplyWell' }).click()
    const dialog = page.getByRole('dialog', { name: 'Ask ApplyWell' })
    await dialog.getByPlaceholder('Ask about your applications…').fill('wrong content type')
    await dialog.getByRole('button', { name: 'Send message' }).click()

    await expect(dialog.getByText('The assistant request could not be sent. Please try again.')).toBeVisible()
    await expect(dialog.getByText('The assistant is temporarily unavailable.')).toBeHidden()
  })
})
