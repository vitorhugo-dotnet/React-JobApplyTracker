import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export interface CachedEntry {
  key: string
  data: string
  timestamp: number
  ttl: number
}

export interface SyncQueueItem {
  id: string
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  payload?: unknown
  createdAt: number
  retries: number
}

export interface AssistantHistoryEntry {
  key: string
  data: string
}

interface AppDB extends DBSchema {
  apiCache: {
    key: string
    value: CachedEntry
    indexes: { timestamp: number }
  }
  syncQueue: {
    key: string
    value: SyncQueueItem
    indexes: { createdAt: number }
  }
  assistantHistory: {
    key: string
    value: AssistantHistoryEntry
  }
}

let _db: IDBPDatabase<AppDB> | null = null

export async function getDb(): Promise<IDBPDatabase<AppDB>> {
  if (_db) return _db
  _db = await openDB<AppDB>('applywell', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const cache = db.createObjectStore('apiCache', { keyPath: 'key' })
        cache.createIndex('timestamp', 'timestamp')

        const queue = db.createObjectStore('syncQueue', { keyPath: 'id' })
        queue.createIndex('createdAt', 'createdAt')
      }
      if (oldVersion < 2) {
        db.createObjectStore('assistantHistory', { keyPath: 'key' })
      }
    },
  })
  return _db
}
