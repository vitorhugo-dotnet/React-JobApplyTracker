import { api, unwrap } from '@/lib/api'
import type { AuthResponse } from '@/types'
import {
  decodeCreationOptions,
  decodeRequestOptions,
  encodeCredential,
  isPasskeySupported,
} from '@/lib/webauthn'

interface PasskeyOptionsResponse {
  passkeyAvailable?: boolean
  challengeId: string
  publicKey: Record<string, unknown>
}

interface VerifyRequest {
  challengeId: string
  credential: Record<string, unknown>
}

export { isPasskeySupported }

export const getPasskeyStatus = () =>
  unwrap(api.get<{ hasPasskeys: boolean }>('/auth/passkey/me'))

/**
 * Register a passkey for the currently authenticated user. Fetches creation
 * options, prompts the platform authenticator, then verifies with the backend.
 */
export async function registerPasskey(): Promise<void> {
  const options = await unwrap(
    api.post<PasskeyOptionsResponse>('/auth/passkey/register/options', {}),
  )
  const credential = (await navigator.credentials.create({
    publicKey: decodeCreationOptions(options.publicKey as never),
  })) as PublicKeyCredential | null

  if (!credential) throw new Error('Passkey registration was cancelled.')

  const body: VerifyRequest = {
    challengeId: options.challengeId,
    credential: encodeCredential(credential),
  }
  await unwrap(api.post('/auth/passkey/register/verify', body))
}

/**
 * Authenticate with a discoverable passkey. The authenticator identifies the
 * account from the credential, so no email/username is required up front.
 */
export async function loginWithPasskey(): Promise<AuthResponse | null> {
  const options = await unwrap(
    api.post<PasskeyOptionsResponse>('/auth/passkey/login/options', {}),
  )
  if (options.passkeyAvailable === false) return null

  const credential = (await navigator.credentials.get({
    publicKey: decodeRequestOptions(options.publicKey as never),
  })) as PublicKeyCredential | null

  if (!credential) throw new Error('Passkey sign-in was cancelled.')

  const body: VerifyRequest = {
    challengeId: options.challengeId,
    credential: encodeCredential(credential),
  }
  return unwrap(api.post<AuthResponse>('/auth/passkey/login/verify', body))
}
