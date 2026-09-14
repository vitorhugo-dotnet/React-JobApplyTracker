import { type AssistantSource } from '@/api/assistant'
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
}

function getHistoryKey(): { storageKey: string; encryptionKey: Promise<CryptoKey> } | null {
  const userId = useAuthStore.getState().user?.id
  if (!userId) return null
  return {
    storageKey: `assistant-history:${userId}`,
    encryptionKey: getEncryptionKey(userId),
  }
}

export async function loadAssistantHistory(): Promise<AssistantMessage[]> {
  const key = getHistoryKey()
  if (!key) return []
  const db = await getDb()
  const entry = await db.get('assistantHistory', key.storageKey)
  if (!entry) return []
  try {
    const messages = await decryptData<unknown>(entry.data, await key.encryptionKey)
    return Array.isArray(messages) ? messages as AssistantMessage[] : []
  } catch {
    return []
  }
}

export async function saveAssistantHistory(messages: AssistantMessage[]): Promise<void> {
  const key = getHistoryKey()
  if (!key) return
  const db = await getDb()
  await db.put('assistantHistory', {
    key: key.storageKey,
    data: await encryptData(messages, await key.encryptionKey),
  })
}
