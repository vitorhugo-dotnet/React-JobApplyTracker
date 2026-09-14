import { refreshAccessToken, resolveBaseUrl } from '@/lib/api'
import { createSseParser } from '@/lib/sse'
import { useAuthStore } from '@/store/authStore'

export type AssistantSource =
  | 'APPLICATION_SEARCH'
  | 'APPLICATION_DETAIL'
  | 'APPLICATION_STATS'
  | 'APPLICATION_TIMELINE'
  | 'DASHBOARD_SUMMARY'

interface StreamHandlers {
  onToken: (content: string) => void
  onComplete: (sources: AssistantSource[]) => void
}

async function request(message: string, signal: AbortSignal, token: string | null) {
  return fetch(`${resolveBaseUrl()}/assistant/chat`, {
    method: 'POST',
    credentials: 'include',
    signal,
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message }),
  })
}

export async function streamAssistantMessage(
  message: string,
  handlers: StreamHandlers,
  signal: AbortSignal,
): Promise<void> {
  let response = await request(message, signal, useAuthStore.getState().accessToken)
  if ([401, 403].includes(response.status)) {
    const token = await refreshAccessToken()
    response = await request(message, signal, token)
  }
  if (!response.ok || !response.body) throw new Error('Assistant request failed')

  let providerError: Error | null = null
  let completed = false
  const parser = createSseParser((event, raw) => {
    if (event === 'token') handlers.onToken((raw as { content?: string }).content ?? '')
    if (event === 'complete') {
      completed = true
      handlers.onComplete((raw as { sources?: AssistantSource[] }).sources ?? [])
    }
    if (event === 'error') providerError = new Error('Assistant provider is unavailable')
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
