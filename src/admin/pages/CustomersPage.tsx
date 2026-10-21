import { Users } from 'lucide-react'
import { Link } from 'react-router'
import { supabase } from '../../lib/supabase'
import { formatDate, formatMoney } from '../lib/format'
import { buildSearchFilter, PAGE_SIZE, pageRange } from '../lib/search'
import { unwrap, useAsync } from '../lib/useAsync'
import { useListParams } from '../lib/useListParams'
import { EmptyState, ErrorState, InlineAlert, LoadingState, PageHeader, Pagination, SearchInput } from '../ui'
import { inputClass } from '../ui-classes'

const FILTERS = ['sort'] as const

const SORTS = {
  recent: { column: 'last_seen_at', label: 'Most recent activity' },
  value: { column: 'total_order_value', label: 'Highest order value' },
  orders: { column: 'order_count', label: 'Most orders' },
} as const

async function loadCustomers(page: number, q: string, sort: string) {
  const [from, to] = pageRange(page)
  const order = SORTS[sort as keyof typeof SORTS] ?? SORTS.recent
  let query = supabase
    .from('customer_summaries')
    .select('*', { count: 'exact' })
    .order(order.column, { ascending: false })
    .order('phone_key')
    .range(from, to)
  const search = buildSearchFilter(q, { textColumns: ['customer_name', 'customer_email'], phoneKeyColumn: 'phone_key' })
  if (search) query = query.or(search)
  const result = await query
  return { rows: unwrap(result), total: result.count ?? 0 }
}

export function CustomersPage() {
  const { page, q, filters, searchText, setSearchText, setFilter, setPage } = useListParams(FILTERS)
  const { status, data, error, reload } = useAsync(() => loadCustomers(page, q, filters.sort), [page, q, filters.sort])

  return (
    <>
      <PageHeader
        title="Customers"
        description="Built from orders and custom cake requests, grouped by phone number (last 10 digits)."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput label="Search customers" value={searchText} onChange={setSearchText} placeholder="Name, phone or email" />
        <select aria-label="Sort customers" value={filters.sort || 'recent'} onChange={(e) => setFilter('sort', e.target.value === 'recent' ? '' : e.target.value)} className={`${inputClass()} sm:w-56`}>
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>
              {s.label}
            </option>
          ))}
        </select>
        {status === 'loading' && data && <span className="text-sm text-cocoa-light">Updating…</span>}
      </div>

      {status === 'error' && data && <InlineAlert onRetry={reload}>{error}</InlineAlert>}
      {status === 'loading' && !data && <LoadingState label="Loading customers" />}
      {status === 'error' && !data && <ErrorState message={error} onRetry={reload} />}

      {data && data.rows.length === 0 && (
        <EmptyState
          icon={<Users className="h-8 w-8" aria-hidden="true" />}
          title={q ? 'No customers match this search' : 'No customers yet'}
          body={q ? undefined : 'Customers appear here after their first order or custom cake request.'}
        />
      )}

      {data && data.rows.length > 0 && (
        <>
          <div className="overflow-hidden rounded-2xl border border-cocoa/10 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-cream-dark/50 text-left text-cocoa-light">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                  <th scope="col" className="hidden px-4 py-3 text-right font-medium sm:table-cell">Orders</th>
                  <th scope="col" className="hidden px-4 py-3 text-right font-medium sm:table-cell">Custom cakes</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Order value</th>
                  <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Last activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cocoa/10">
                {data.rows.map((c) => (
                  <tr key={c.phone_key} className="hover:bg-cream/60">
                    <td className="px-4 py-3">
                      <Link to={`/admin/customers/${c.phone_key}`} className="font-semibold text-rose-dark underline-offset-2 hover:underline">
                        {c.customer_name}
                      </Link>
                      <span className="block text-xs text-cocoa-light">
                        {c.customer_phone}
                        {c.customer_email && <span className="hidden lg:inline"> · {c.customer_email}</span>}
                      </span>
                      <span className="block text-xs text-cocoa-light sm:hidden">
                        {c.order_count} orders · {c.custom_request_count} custom
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">{c.order_count}</td>
                    <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">{c.custom_request_count}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{formatMoney(c.total_order_value)}</td>
                    <td className="hidden px-4 py-3 md:table-cell">{formatDate(c.last_seen_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
        </>
      )}
    </>
  )
}
