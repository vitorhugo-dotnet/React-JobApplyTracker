import { test, expect, setupGuest } from './support/fixtures'

test.describe('Passkey authentication', () => {
  test('can start passkey sign-in with an empty email field', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'PublicKeyCredential', {
        configurable: true,
        value: class PublicKeyCredential {},
      })
      Object.defineProperty(navigator, 'credentials', {
        configurable: true,
        value: {
          create: async () => null,
          get: async () => null,
        },
      })
    })

    await setupGuest(page)

    let requestBody: string | null = null
    await page.route('**/api/v1/auth/passkey/login/options', async (route) => {
      requestBody = route.request().postData()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ passkeyAvailable: false }),
      })
    })

    await page.goto('/login')
    await expect(page.getByLabel('Email')).toHaveValue('')

    await page.getByRole('button', { name: 'Sign in with a passkey' }).click()

    await expect.poll(() => requestBody).toBe('{}')
    await expect(page.getByText('Enter your email address above, then sign in with a passkey.')).toHaveCount(0)
    await expect(page.getByText('No passkey is registered for this account.')).toBeVisible()
  })
})
