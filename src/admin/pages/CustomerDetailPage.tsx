import { Mail, Phone } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { supabase } from '../../lib/supabase'
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatPlainDate,
  orderStatusMeta,
  paymentStatusMeta,
  requestStatusMeta,
  telHref,
} from '../lib/format'
import { unwrap, useAsync } from '../lib/useAsync'
import { Badge, Card, ErrorState, LoadingState, PageHeader } from '../ui'

async function loadCustomer(phoneKey: string) {
  if (!/^\d{1,10}$/.test(phoneKey)) return null
  const [summary, orders, requests] = await Promise.all([
    supabase.from('customer_summaries').select('*').eq('phone_key', phoneKey).maybeSingle().then(unwrap),
    supabase
      .from('orders')
      .select('id, order_number, subtotal, status, payment_status, fulfillment_type, created_at')
      .eq('customer_phone_key', phoneKey)
      .order('created_at', { ascending: false })
      .limit(200)
      .then(unwrap),
    supabase
      .from('custom_cake_requests')
      .select('id, request_number, occasion, event_date, status, quoted_price, created_at')
      .eq('customer_phone_key', phoneKey)
      .order('created_at', { ascending: false })
      .limit(200)
      .then(unwrap),
  ])
  return summary ? { summary, orders, requests } : null
}

export function CustomerDetailPage() {
  const { phoneKey = '' } = useParams()
  const { status, data, error, reload } = useAsync(() => loadCustomer(phoneKey), [phoneKey])

  if (status === 'loading' && !data) return <LoadingState label="Loading customer" />
  if (status === 'error' && !data) return <ErrorState message={error} onRetry={reload} />
  if (!data) {
    return (
      <>
        <PageHeader title="Customer not found" back={{ to: '/admin/customers', label: 'All customers' }} />
        <ErrorState message="No orders or requests were found for this phone number." />
      </>
    )
  }

  const { summary: c, orders, requests } = data
  return (
    <>
      <PageHeader
        back={{ to: '/admin/customers', label: 'All customers' }}
        title={c.customer_name}
        description={`Customer since ${formatDate(c.first_seen_at)}`}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={telHref(c.customer_phone)} className="inline-flex items-center gap-2 text-rose-dark underline">
                <Phone className="h-4 w-4" aria-hidden="true" /> {c.customer_phone}
              </a>
            </li>
            {c.customer_email && (
              <li>
                <a href={`mailto:${c.customer_email}`} className="inline-flex items-center gap-2 break-all text-rose-dark underline">
                  <Mail className="h-4 w-4 shrink-0" aria-hidden="true" /> {c.customer_email}
                </a>
              </li>
            )}
          </ul>
        </Card>
        <Card>
          <p className="text-sm text-cocoa-light">Orders</p>
          <p className="font-serif text-2xl font-bold tabular-nums">{c.order_count}</p>
        </Card>
        <Card>
          <p className="text-sm text-cocoa-light">Order value</p>
          <p className="font-serif text-2xl font-bold tabular-nums">{formatMoney(c.total_order_value)}</p>
          <p className="text-xs text-cocoa-light">Excludes cancelled</p>
        </Card>
        <Card>
          <p className="text-sm text-cocoa-light">Custom cake requests</p>
          <p className="font-serif text-2xl font-bold tabular-nums">{c.custom_request_count}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Orders">
          {orders.length === 0 ? (
            <p className="text-sm text-cocoa-light">No orders.</p>
          ) : (
            <ul className="-mx-2 divide-y divide-cocoa/10">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link to={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-cream">
                    <span>
                      <span className="block text-sm font-medium">#{o.order_number}</span>
                      <span className="block text-xs text-cocoa-light">{formatDateTime(o.created_at)}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold tabular-nums">{formatMoney(o.subtotal)}</span>
                      <span className="flex gap-1">
                        <Badge tone={orderStatusMeta[o.status].tone}>{orderStatusMeta[o.status].label}</Badge>
                        <Badge tone={paymentStatusMeta[o.payment_status].tone}>{paymentStatusMeta[o.payment_status].label}</Badge>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Custom cake requests">
          {requests.length === 0 ? (
            <p className="text-sm text-cocoa-light">No custom cake requests.</p>
          ) : (
            <ul className="-mx-2 divide-y divide-cocoa/10">
              {requests.map((r) => (
                <li key={r.id}>
                  <Link to={`/admin/custom-requests/${r.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-cream">
                    <span>
                      <span className="block text-sm font-medium">
                        #{r.request_number} · {r.occasion ?? 'Custom cake'}
                      </span>
                      <span className="block text-xs text-cocoa-light">Event {formatPlainDate(r.event_date)}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold tabular-nums">{r.quoted_price != null ? formatMoney(r.quoted_price) : 'Not quoted'}</span>
                      <Badge tone={requestStatusMeta[r.status].tone}>{requestStatusMeta[r.status].label}</Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
