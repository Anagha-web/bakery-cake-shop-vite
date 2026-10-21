import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

/**
 * List filters kept in the URL (so they survive reloads and back/forward).
 * The search box is debounced before it reaches the URL and the query.
 */
export function useListParams<K extends string>(filterKeys: readonly K[]) {
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const q = params.get('q') ?? ''
  const filters = Object.fromEntries(filterKeys.map((k) => [k, params.get(k) ?? ''])) as Record<K, string>

  const [searchText, setSearchText] = useState(q)

  const update = useCallback(
    (changes: Record<string, string | number | null>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === '' || (key === 'page' && value === 1)) next.delete(key)
            else next.set(key, String(value))
          }
          // Changing any filter returns to the first page.
          if (!('page' in changes)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  useEffect(() => {
    if (searchText === q) return
    const timer = window.setTimeout(() => update({ q: searchText.trim() }), 300)
    return () => window.clearTimeout(timer)
  }, [searchText, q, update])

  return {
    page,
    q,
    filters,
    searchText,
    setSearchText,
    setFilter: (key: K, value: string) => update({ [key]: value }),
    setPage: (p: number) => update({ page: p }),
  }
}
