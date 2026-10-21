import { CakeSlice } from 'lucide-react'
import { Link } from 'react-router'
import type { CustomRequestStatus } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import { daysUntil, formatDate, formatMoney, formatPlainDate, requestStatuses, requestStatusMeta, todayInIndia } from '../lib/format'
import { buildSearchFilter, PAGE_SIZE, pageRange } from '../lib/search'
import { unwrap, useAsync } from '../lib/useAsync'
import { useListParams } from '../lib/useListParams'
import { Badge, EmptyState, ErrorState, InlineAlert, LoadingState, PageHeader, Pagination, SearchInput } from '../ui'
import { inputClass } from '../ui-classes'

const FILTERS = ['status', 'when'] as const

async function loadRequests(page: number, q: string, status: string, when: string) {
  const [from, to] = pageRange(page)
  const upcomingFirst = when !== 'past' && when !== 'recent'
  let query = supabase
    .from('custom_cake_requests')
    .select('id, request_number, customer_name, customer_phone, occasion, event_date, status, quoted_price, budget, created_at', { count: 'exact' })
    .range(from, to)

  if (when === 'recent') query = query.order('created_at', { ascending: false })
  else query = query.order('event_date', { ascending: upcomingFirst }).order('created_at', { ascending: false })

  const today = todayInIndia()
  if (when === 'upcoming' || when === '') query = query.gte('event_date', today)
  if (when === 'past') query = query.lt('event_date', today)

  if (status === 'active') query = query.not('status', 'in', '(completed,declined,cancelled)')
  else if (requestStatuses.includes(status as CustomRequestStatus)) query = query.eq('status', status as CustomRequestStatus)

  const search = buildSearchFilter(q, {
    textColumns: ['customer_name', 'occasion', 'flavour'],
    phoneKeyColumn: 'customer_phone_key',
    numberColumn: 'request_number',
  })
  if (search) query = query.or(search)

  const result = await query
  return { rows: unwrap(result), total: result.count ?? 0 }
}

export function CustomRequestsPage() {
  const { page, q, filters, searchText, setSearchText, setFilter, setPage } = useListParams(FILTERS)
  const { status, data, error, reload } = useAsync(
    () => loadRequests(page, q, filters.status, filters.when),
    [page, q, filters.status, filters.when],
  )
  const filtered = Boolean(q || filters.status || filters.when)

  return (
    <>
      <PageHeader title="Custom cake requests" description="Requests from the custom cake form. Upcoming events first." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput label="Search requests" value={searchText} onChange={setSearchText} placeholder="Request #, name, phone, occasion" />
        <select aria-label="Filter by status" value={filters.status} onChange={(e) => setFilter('status', e.target.value)} className={`${inputClass()} sm:w-48`}>
          <option value="">All statuses</option>
          <option value="active">Active (not closed)</option>
          {requestStatuses.map((s) => (
            <option key={s} value={s}>
              {requestStatusMeta[s].label}
            </option>
          ))}
        </select>
        <select aria-label="Event date" value={filters.when} onChange={(e) => setFilter('when', e.target.value)} className={`${inputClass()} sm:w-48`}>
          <option value="">Upcoming events</option>
          <option value="past">Past events</option>
          <option value="recent">All, newest request first</option>
        </select>
        {status === 'loading' && data && <span className="text-sm text-cocoa-light">Updating…</span>}
      </div>

      {status === 'error' && data && <InlineAlert onRetry={reload}>{error}</InlineAlert>}
      {status === 'loading' && !data && <LoadingState label="Loading requests" />}
      {status === 'error' && !data && <ErrorState message={error} onRetry={reload} />}

      {data && data.rows.length === 0 && (
        <EmptyState
          icon={<CakeSlice className="h-8 w-8" aria-hidden="true" />}
          title={filtered ? 'No requests match these filters' : 'No upcoming custom cake requests'}
          body={filtered ? 'Try a different search or filter.' : 'Choose "All, newest request first" to see older requests.'}
        />
      )}

      {data && data.rows.length > 0 && (
        <>
          <ul className="space-y-3">
            {data.rows.map((r) => {
              const days = daysUntil(r.event_date)
              return (
                <li key={r.id}>
                  <Link
                    to={`/admin/custom-requests/${r.id}`}
                    className="flex flex-col gap-3 rounded-2xl border border-cocoa/10 bg-white p-4 shadow-sm transition hover:border-rose/60 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">
                        #{r.request_number} · {r.customer_name}
                      </p>
                      <p className="text-sm text-cocoa-light">
                        {r.occasion ?? 'Custom cake'} · {r.customer_phone}
                      </p>
                      <p className="mt-1 text-xs text-cocoa-light">Received {formatDate(r.created_at)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:justify-end sm:text-right">
                      <div>
                        <p className="text-sm font-medium">{formatPlainDate(r.event_date)}</p>
                        <p className={`text-xs ${days >= 0 && days <= 2 ? 'font-semibold text-rose-dark' : 'text-cocoa-light'}`}>
                          {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : days > 0 ? `In ${days} days` : `${-days} days ago`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold tabular-nums">{r.quoted_price != null ? formatMoney(r.quoted_price) : 'Not quoted'}</p>
                        {r.budget != null && <p className="text-xs text-cocoa-light">Budget {formatMoney(r.budget)}</p>}
                      </div>
                      <Badge tone={requestStatusMeta[r.status].tone}>{requestStatusMeta[r.status].label}</Badge>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
          <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
        </>
      )}
    </>
  )
}
