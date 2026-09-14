import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { useAuthStore } from '@/store/authStore'
import {
  buildCacheKey,
  cacheApiResponse,
  getCachedApiResponse,
  invalidateCacheForMutation,
} from './offlineStore'
import { enqueueOfflineMutation, type SyncQueueItem } from './syncQueue'

export function resolveBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL
  const base = (configured || 'http://localhost:8080').replace(/\/+$/, '')
  if (base.endsWith('/api/v1')) return base
  if (base.endsWith('/api')) return `${base}/v1`
  return `${base}/api/v1`
}

export const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

const REFRESH_ENDPOINT = '/auth/refresh'
const AUTH_FAILURE = new Set([401, 403])
const NO_CACHE_PREFIXES = ['/auth/']
const MUTATION_METHODS = new Set(['post', 'put', 'patch', 'delete'])

function shouldCache(url: string): boolean {
  return !NO_CACHE_PREFIXES.some((p) => url.startsWith(p))
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Single-flight refresh: concurrent 401s share one refresh round-trip.
let refreshPromise: Promise<string> | null = null

export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ accessToken: string }>(
        `${api.defaults.baseURL}${REFRESH_ENDPOINT}`,
        {},
        { withCredentials: true },
      )
      .then((res) => {
        const token = res.data.accessToken
        useAuthStore.getState().setTokens(token)
        return token
      })
      .catch((error) => {
        useAuthStore.getState().logout()
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

api.interceptors.response.use(
  async (response) => {
    const method = response.config.method?.toLowerCase()
    const url = response.config.url
    if (!url) return response

    if (method === 'get' && shouldCache(url)) {
      const key = buildCacheKey(url, response.config.params as Record<string, unknown> | undefined)
      cacheApiResponse(key, response.data).catch(() => {})
    } else if (url && MUTATION_METHODS.has(method || '')) {
      invalidateCacheForMutation(url).catch(() => {})
    }

    return response
  },
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status

    // Offline: no HTTP response and the browser confirms no network.
    if (!status && !navigator.onLine && original?.url) {
      const method = original.method?.toLowerCase() ?? ''
      const key = buildCacheKey(
        original.url,
        original.params as Record<string, unknown> | undefined,
      )

      if (method === 'get' && shouldCache(original.url)) {
        const cached = await getCachedApiResponse(key)
        if (cached) {
          return {
            data: cached,
            status: 200,
            statusText: 'cached',
            headers: {},
            config: original,
            request: null,
          } as AxiosResponse
        }
      }

      if (MUTATION_METHODS.has(method)) {
        const raw = original.data
        const payload = raw
          ? typeof raw === 'string'
            ? (JSON.parse(raw) as unknown)
            : raw
          : undefined
        await enqueueOfflineMutation({
          method: method.toUpperCase() as SyncQueueItem['method'],
          url: original.url,
          payload,
        })
        const queued = Object.assign(new Error('Request queued for offline sync'), {
          isOfflineQueued: true as const,
        })
        return Promise.reject(queued)
      }
    }

    if (!original || !status || !AUTH_FAILURE.has(status) || original._retry) {
      return Promise.reject(error)
    }

    if (original.url === REFRESH_ENDPOINT) {
      refreshPromise = null
      useAuthStore.getState().logout()
      return Promise.reject(error)
    }

    original._retry = true

    const token = await refreshAccessToken()
    original.headers.Authorization = `Bearer ${token}`
    return api(original)
  },
)

export const unwrap = <T>(p: Promise<AxiosResponse<T>>): Promise<T> => p.then((r) => r.data)
