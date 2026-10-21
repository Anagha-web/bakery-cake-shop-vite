import { ShoppingBag } from 'lucide-react'
import { Link } from 'react-router'
import type { OrderStatus, PaymentStatus } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import {
  formatDateTime,
  formatMoney,
  fulfillmentLabel,
  orderStatuses,
  orderStatusMeta,
  paymentStatuses,
  paymentStatusMeta,
} from '../lib/format'
import { buildSearchFilter, PAGE_SIZE, pageRange } from '../lib/search'
import { unwrap, useAsync } from '../lib/useAsync'
import { useListParams } from '../lib/useListParams'
import { Badge, EmptyState, ErrorState, InlineAlert, LoadingState, PageHeader, Pagination, SearchInput } from '../ui'
import { inputClass } from '../ui-classes'

const FILTERS = ['status', 'payment'] as const

async function loadOrders(page: number, q: string, status: string, payment: string) {
  const [from, to] = pageRange(page)
  let query = supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_phone, fulfillment_type, requested_for, subtotal, status, payment_status, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status === 'open') query = query.not('status', 'in', '(completed,cancelled)')
  else if (orderStatuses.includes(status as OrderStatus)) query = query.eq('status', status as OrderStatus)
  if (paymentStatuses.includes(payment as PaymentStatus)) query = query.eq('payment_status', payment as PaymentStatus)

  const search = buildSearchFilter(q, { textColumns: ['customer_name', 'customer_email'], phoneKeyColumn: 'customer_phone_key', numberColumn: 'order_number' })
  if (search) query = query.or(search)

  const result = await query
  return { rows: unwrap(result), total: result.count ?? 0 }
}

export function OrdersPage() {
  const { page, q, filters, searchText, setSearchText, setFilter, setPage } = useListParams(FILTERS)
  const { status, data, error, reload } = useAsync(() => loadOrders(page, q, filters.status, filters.payment), [page, q, filters.status, filters.payment])
  const filtered = Boolean(q || filters.status || filters.payment)

  return (
    <>
      <PageHeader title="Orders" description="Orders placed through the website. Newest first." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput label="Search orders" value={searchText} onChange={setSearchText} placeholder="Order #, name, phone or email" />
        <select aria-label="Filter by status" value={filters.status} onChange={(e) => setFilter('status', e.target.value)} className={`${inputClass()} sm:w-48`}>
          <option value="">All statuses</option>
          <option value="open">Open (not completed/cancelled)</option>
          {orderStatuses.map((s) => (
            <option key={s} value={s}>
              {orderStatusMeta[s].label}
            </option>
          ))}
        </select>
        <select aria-label="Filter by payment" value={filters.payment} onChange={(e) => setFilter('payment', e.target.value)} className={`${inputClass()} sm:w-40`}>
          <option value="">All payments</option>
          {paymentStatuses.map((s) => (
            <option key={s} value={s}>
              {paymentStatusMeta[s].label}
            </option>
          ))}
        </select>
        {status === 'loading' && data && <span className="text-sm text-cocoa-light">Updating…</span>}
      </div>

      {status === 'error' && data && <InlineAlert onRetry={reload}>{error}</InlineAlert>}
      {status === 'loading' && !data && <LoadingState label="Loading orders" />}
      {status === 'error' && !data && <ErrorState message={error} onRetry={reload} />}

      {data && data.rows.length === 0 && (
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8" aria-hidden="true" />}
          title={filtered ? 'No orders match these filters' : 'No orders yet'}
          body={filtered ? 'Try a different search or clear the filters.' : 'Orders placed on the website will appear here.'}
        />
      )}

      {data && data.rows.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-cocoa/10 bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead className="bg-cream-dark/50 text-left text-cocoa-light">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Order</th>
                  <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                  <th scope="col" className="px-4 py-3 font-medium">Fulfilment</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Total</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cocoa/10">
                {data.rows.map((o) => (
                  <tr key={o.id} className="hover:bg-cream/60">
                    <td className="px-4 py-3">
                      <Link to={`/admin/orders/${o.id}`} className="font-semibold text-rose-dark underline-offset-2 hover:underline">
                        #{o.order_number}
                      </Link>
                      <span className="block text-xs text-cocoa-light">{formatDateTime(o.created_at)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block font-medium">{o.customer_name}</span>
                      <span className="block text-xs text-cocoa-light">{o.customer_phone}</span>
                    </td>
                    <td className="px-4 py-3">
                      {fulfillmentLabel[o.fulfillment_type]}
                      {o.requested_for && <span className="block text-xs text-cocoa-light">{formatDateTime(o.requested_for)}</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatMoney(o.subtotal)}</td>
                    <td className="px-4 py-3">
                      <span className="flex flex-wrap gap-1">
                        <Badge tone={orderStatusMeta[o.status].tone}>{orderStatusMeta[o.status].label}</Badge>
                        <Badge tone={paymentStatusMeta[o.payment_status].tone}>{paymentStatusMeta[o.payment_status].label}</Badge>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {data.rows.map((o) => (
              <li key={o.id}>
                <Link to={`/admin/orders/${o.id}`} className="block rounded-2xl border border-cocoa/10 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        #{o.order_number} · {o.customer_name}
                      </p>
                      <p className="text-xs text-cocoa-light">
                        {formatDateTime(o.created_at)} · {fulfillmentLabel[o.fulfillment_type]}
                      </p>
                    </div>
                    <p className="font-semibold tabular-nums">{formatMoney(o.subtotal)}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <Badge tone={orderStatusMeta[o.status].tone}>{orderStatusMeta[o.status].label}</Badge>
                    <Badge tone={paymentStatusMeta[o.payment_status].tone}>{paymentStatusMeta[o.payment_status].label}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
        </>
      )}
    </>
  )
}
