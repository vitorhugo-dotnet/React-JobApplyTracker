import { test, expect, setupGuest } from './support/fixtures'

test.describe('Authentication', () => {
  test('guests are redirected to the login screen', async ({ page }) => {
    await setupGuest(page)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('a user can sign in and land on the dashboard', async ({ page }) => {
    await setupGuest(page)
    await page.goto('/login')

    await page.getByLabel('Email').fill('jordan@diaz.dev')
    await page.getByLabel('Password').fill('supersecret')
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('passkey sign-in starts without requiring an email', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'PublicKeyCredential', {
        configurable: true,
        value: class PublicKeyCredential {},
      })
      Object.defineProperty(navigator, 'credentials', {
        configurable: true,
        value: {
          create: async () => null,
          get: async () => {
            throw new DOMException('cancelled', 'NotAllowedError')
          },
        },
      })
    })
    await setupGuest(page)

    let optionsBody: unknown
    await page.route('**/api/v1/auth/passkey/login/options', async (route) => {
      optionsBody = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          passkeyAvailable: true,
          challengeId: 'challenge-1',
          publicKey: { challenge: 'AQID' },
        }),
      })
    })

    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign in with a passkey' }).click()

    await expect.poll(() => optionsBody).toEqual({})
    await expect(page.getByText('Enter your email address above, then sign in with a passkey.')).toHaveCount(0)
  })

  test('the register screen creates a session', async ({ page }) => {
    await setupGuest(page)
    await page.goto('/register')

    await page.getByLabel('Full name').fill('New User')
    await page.getByLabel('Email').fill('new@user.dev')
    await page.getByLabel('Password').fill('supersecret')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
