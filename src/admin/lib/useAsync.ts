import { useCallback, useEffect, useState, type DependencyList } from 'react'
import { errorMessage } from './errors'

export type AsyncState<T> =
  | { status: 'loading'; data?: T; error?: undefined }
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: T; error: string }

/**
 * Runs `load` whenever `deps` change and tracks loading / success / error.
 * Previous data is kept while reloading so lists don't flash empty.
 */
export function useAsync<T>(load: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ status: 'loading', data: s.data }))
    load().then(
      (data) => !cancelled && setState({ status: 'success', data }),
      (error: unknown) => !cancelled && setState((s) => ({ status: 'error', data: s.data, error: errorMessage(error) })),
    )
    return () => {
      cancelled = true
    }
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { ...state, reload }
}

/** Throws the Supabase error if present, otherwise returns the data. */
type SuccessData<R> = R extends { error: null; data: infer D } ? D : never

export function unwrap<R extends { data: unknown; error: unknown }>(result: R): SuccessData<R> {
  if (result.error) throw result.error
  return result.data as SuccessData<R>
}
