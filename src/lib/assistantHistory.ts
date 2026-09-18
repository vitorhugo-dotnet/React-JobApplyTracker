import { isValidAssistantConversationId, type AssistantErrorCode, type AssistantSource } from '@/api/assistant'
import { decryptData, encryptData, getEncryptionKey } from '@/lib/crypto'
import { getDb } from '@/lib/db'
import { useAuthStore } from '@/store/authStore'

export interface AssistantMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  sources?: AssistantSource[]
  failed?: boolean
  prompt?: string
  responseId?: number
  errorCode?: AssistantErrorCode
  retryAvailableAt?: number
}

export interface AssistantHistoryState {
  conversationId: string
  messages: AssistantMessage[]
}

function getHistoryKey(): { storageKey: string; encryptionKey: Promise<CryptoKey> } | null {
  const userId = useAuthStore.getState().user?.id
  if (!userId) return null
  return {
    storageKey: `assistant-history:${userId}`,
    encryptionKey: getEncryptionKey(userId),
  }
}

function newHistory(messages: AssistantMessage[] = []): AssistantHistoryState {
  return {
    conversationId: crypto.randomUUID(),
    messages,
  }
}

export async function loadAssistantHistory(): Promise<AssistantHistoryState> {
  const key = getHistoryKey()
  if (!key) return newHistory()

  const db = await getDb()
  const entry = await db.get('assistantHistory', key.storageKey)
  if (!entry) return newHistory()

  try {
    const stored = await decryptData<unknown>(entry.data, await key.encryptionKey)
    if (Array.isArray(stored)) return newHistory(stored as AssistantMessage[])

    if (stored && typeof stored === 'object') {
      const history = stored as AssistantHistoryState
      if (Array.isArray(history.messages)) {
        if (isValidAssistantConversationId(history.conversationId)) return history
        return newHistory(history.messages)
      }
    }
  } catch {
    return newHistory()
  }

  return newHistory()
}

export async function saveAssistantHistory(
  conversationId: string,
  messages: AssistantMessage[],
): Promise<void> {
  const key = getHistoryKey()
  if (!key) return

  const db = await getDb()
  await db.put('assistantHistory', {
    key: key.storageKey,
    data: await encryptData({ conversationId, messages }, await key.encryptionKey),
  })
}
