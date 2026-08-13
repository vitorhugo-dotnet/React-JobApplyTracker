import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '@/lib/utils'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

/**
 * Run an async loader on mount and whenever `deps` change. Returns data,
 * loading, error, and a manual `reload`. The loader is wrapped so stale
 * responses from a superseded run are discarded.
 */
export function useAsync<T>(
  loader: () => Promise<T>,
  deps: unknown[],
  fallbackError = 'Something went wrong.',
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    loader()
      .then((result) => {
        if (active) setData(result)
      })
      .catch((err) => {
        if (active) setError(errorMessage(err, fallbackError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  return { data, loading, error, reload }
}
