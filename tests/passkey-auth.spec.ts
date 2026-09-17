import { test, expect, setupGuest } from './support/fixtures'
import { MOCK_USER } from './support/data'

const PASSKEY_OPTIONS = {
  passkeyAvailable: true,
  challengeId: '11111111-1111-1111-1111-111111111111',
  publicKey: {
    challenge: 'AQID',
    rpId: 'applywell.hugojava.dev',
    allowCredentials: [
      {
        id: 'BAUG',
        type: 'public-key',
        transports: ['internal'],
      },
    ],
    userVerification: 'preferred',
  },
}

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

  test('browser rejects a sibling hostname RP ID with SecurityError', async ({ page }) => {
    await setupGuest(page)
    await page.goto('/login')

    const exceptionName = await page.evaluate(async () => {
      try {
        await navigator.credentials.get({
          publicKey: {
            challenge: new Uint8Array([1, 2, 3, 4]),
            rpId: 'jobapply-api.hugojava.dev',
            timeout: 1000,
          },
        })
        return null
      } catch (error) {
        return error instanceof DOMException ? error.name : String(error)
      }
    })

    expect(exceptionName).toBe('SecurityError')
  })

  test('decodes WebAuthn request options and sends the assertion to verify', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'PublicKeyCredential', {
        configurable: true,
        value: class PublicKeyCredential {},
      })
      Object.defineProperty(navigator, 'credentials', {
        configurable: true,
        value: {
          create: async () => null,
          get: async ({ publicKey }: CredentialRequestOptions) => {
            const options = publicKey as PublicKeyCredentialRequestOptions
            ;(window as typeof window & { __passkeyDecoded?: unknown }).__passkeyDecoded = {
              challengeIsArrayBuffer: options.challenge instanceof ArrayBuffer,
              allowCredentialIdIsArrayBuffer: options.allowCredentials?.[0]?.id instanceof ArrayBuffer,
              rpId: options.rpId,
            }

            return {
              id: 'credential-id',
              type: 'public-key',
              rawId: new Uint8Array([1, 2, 3]).buffer,
              response: {
                clientDataJSON: new Uint8Array([4, 5]).buffer,
                authenticatorData: new Uint8Array([6, 7]).buffer,
                signature: new Uint8Array([8, 9]).buffer,
                userHandle: null,
              },
              getClientExtensionResults: () => ({}),
            }
          },
        },
      })
    })

    await setupGuest(page)

    let verifyBody: Record<string, unknown> | null = null
    await page.route('**/api/v1/auth/passkey/login/options', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(PASSKEY_OPTIONS),
      }))
    await page.route('**/api/v1/auth/passkey/login/verify', async (route) => {
      verifyBody = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'passkey-token', user: MOCK_USER }),
      })
    })

    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign in with a passkey' }).click()

    await expect.poll(() => verifyBody).not.toBeNull()

    const decoded = await page.evaluate(() =>
      (window as typeof window & {
        __passkeyDecoded?: {
          challengeIsArrayBuffer: boolean
          allowCredentialIdIsArrayBuffer: boolean
          rpId: string
        }
      }).__passkeyDecoded)

    expect(decoded).toEqual({
      challengeIsArrayBuffer: true,
      allowCredentialIdIsArrayBuffer: true,
      rpId: 'applywell.hugojava.dev',
    })
    expect(verifyBody).toMatchObject({
      challengeId: PASSKEY_OPTIONS.challengeId,
      credential: {
        id: 'credential-id',
        type: 'public-key',
        rawId: 'AQID',
        response: {
          clientDataJSON: 'BAU',
          authenticatorData: 'Bgc',
          signature: 'CAk',
          userHandle: null,
        },
      },
    })
  })

  test('logs unexpected WebAuthn DOMException details without exposing credential data', async ({ page }) => {
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
            throw new DOMException('RP ID does not match the current origin', 'SecurityError')
          },
        },
      })
    })

    await setupGuest(page)
    await page.route('**/api/v1/auth/passkey/login/options', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(PASSKEY_OPTIONS),
      }))

    const consoleErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })

    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign in with a passkey' }).click()

    await expect(page.getByText('Could not sign in with a passkey.')).toBeVisible()
    await expect.poll(() => consoleErrors.some((message) =>
      message.includes('SecurityError') && message.includes('RP ID does not match the current origin'))).toBe(true)
    expect(consoleErrors.join('\n')).not.toContain(PASSKEY_OPTIONS.challengeId)
    expect(consoleErrors.join('\n')).not.toContain(PASSKEY_OPTIONS.publicKey.challenge)
  })
})
