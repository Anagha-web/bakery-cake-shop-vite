// Builds PostgREST `or=(...)` filters from free-text search. Characters that
// have meaning in the filter syntax are stripped so a search can never break
// (or widen) the query.

const UNSAFE = /[,()"'\\%*:]/g

export function cleanSearchTerm(input: string) {
  return input.replace(UNSAFE, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
}

type SearchOptions = {
  /** Text columns matched with a case-insensitive "contains". */
  textColumns: string[]
  /** Column holding the 10-digit phone key, matched against the digits typed. */
  phoneKeyColumn?: string
  /** Integer reference column (order / request number) matched exactly. */
  numberColumn?: string
}

/** Returns the `or` filter string, or null when there is nothing to search. */
export function buildSearchFilter(input: string, options: SearchOptions): string | null {
  const term = cleanSearchTerm(input).replace(/^#/, '')
  if (!term) return null

  const clauses = options.textColumns.map((column) => `${column}.ilike.%${term}%`)

  const digits = term.replace(/\D/g, '')
  if (options.phoneKeyColumn && digits.length >= 3 && /^[\d\s+()-]+$/.test(term)) {
    clauses.push(`${options.phoneKeyColumn}.ilike.%${digits.slice(-10)}%`)
  }
  if (options.numberColumn && /^\d{1,9}$/.test(term)) {
    clauses.push(`${options.numberColumn}.eq.${term}`)
  }
  return clauses.join(',')
}

export const PAGE_SIZE = 20

export function pageRange(page: number, pageSize = PAGE_SIZE): [number, number] {
  const safe = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
  const from = (safe - 1) * pageSize
  return [from, from + pageSize - 1]
}
