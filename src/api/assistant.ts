import { refreshAccessToken, resolveBaseUrl } from '@/lib/api'
import { isValidAssistantConversationId } from '@/lib/assistantConversation'
import { createSseParser } from '@/lib/sse'
import { useAuthStore } from '@/store/authStore'

export type AssistantSource =
  | 'APPLICATION_SEARCH'
  | 'APPLICATION_DETAIL'
  | 'APPLICATION_STATS'
  | 'APPLICATION_TIMELINE'
  | 'DASHBOARD_SUMMARY'

export type AssistantErrorCode = 'RATE_LIMITED' | 'PROVIDER_UNAVAILABLE'

interface AssistantErrorPayload {
  code?: AssistantErrorCode
  message?: string
  retryAfterSeconds?: number
}

export class AssistantStreamError extends Error {
  readonly code: AssistantErrorCode
  readonly retryAfterSeconds?: number

  constructor(code: AssistantErrorCode, message: string, retryAfterSeconds?: number) {
    super(message)
    this.name = 'AssistantStreamError'
    this.code = code
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export class AssistantRequestError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'AssistantRequestError'
    this.status = status
  }
}

interface StreamHandlers {
  onToken: (content: string) => void
  onComplete: (sources: AssistantSource[]) => void
}

async function request(
  conversationId: string,
  message: string,
  signal: AbortSignal,
  token: string | null,
) {
  return fetch(`${resolveBaseUrl()}/assistant/chat`, {
    method: 'POST',
    credentials: 'include',
    signal,
    headers: {
      Accept: 'text/event-stream, application/problem+json, application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ conversationId, message }),
  })
}

export async function streamAssistantMessage(
  conversationId: string,
  message: string,
  handlers: StreamHandlers,
  signal: AbortSignal,
): Promise<void> {
  if (!isValidAssistantConversationId(conversationId)) {
    throw new AssistantRequestError('Assistant conversation is unavailable')
  }

  let response = await request(conversationId, message, signal, useAuthStore.getState().accessToken)
  if ([401, 403].includes(response.status)) {
    const token = await refreshAccessToken()
    response = await request(conversationId, message, signal, token)
  }
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
  if (!response.ok) {
    let message = 'Assistant request failed'
    if (contentType.includes('application/problem+json') || contentType.includes('application/json')) {
      try {
        const payload = await response.json() as {
          detail?: unknown
          message?: unknown
          error?: unknown
        }
        const candidate = payload.detail ?? payload.message ?? payload.error
        if (typeof candidate === 'string' && candidate.trim()) message = candidate
      } catch {
        // Preserve the generic request error when an error response has an invalid JSON body.
      }
    }
    throw new AssistantRequestError(message, response.status)
  }
  if (!contentType.includes('text/event-stream')) {
    throw new AssistantRequestError('Assistant response is not an SSE stream', response.status)
  }
  if (!response.body) throw new AssistantRequestError('Assistant response stream unavailable', response.status)

  let providerError: AssistantStreamError | null = null
  let completed = false
  const parser = createSseParser((event, raw) => {
    if (event === 'token') handlers.onToken((raw as { content?: string }).content ?? '')
    if (event === 'complete') {
      completed = true
      handlers.onComplete((raw as { sources?: AssistantSource[] }).sources ?? [])
    }
    if (event === 'error') {
      const payload = raw as AssistantErrorPayload
      const code = payload.code === 'RATE_LIMITED' ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE'
      const retryAfterSeconds = typeof payload.retryAfterSeconds === 'number'
        && Number.isFinite(payload.retryAfterSeconds)
        && payload.retryAfterSeconds >= 0
        ? Math.ceil(payload.retryAfterSeconds)
        : undefined
      providerError = new AssistantStreamError(
        code,
        payload.message ?? 'Assistant provider is unavailable',
        retryAfterSeconds,
      )
    }
  })
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    parser.push(decoder.decode(value, { stream: true }))
  }
  parser.push(decoder.decode())
  parser.finish()
  if (providerError) throw providerError
  if (!completed) throw new Error('Assistant stream ended before completion')
}
