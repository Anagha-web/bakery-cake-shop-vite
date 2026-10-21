import { CakeSlice, ShoppingBag } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth-context'
import { DailyOrdersChart } from '../components/DailyOrdersChart'
import { parseDashboardStats } from '../lib/dashboard'
import {
  daysUntil,
  formatDateTime,
  formatMoney,
  formatPlainDate,
  orderStatuses,
  orderStatusMeta,
  paymentStatusMeta,
  requestStatusMeta,
  todayInIndia,
} from '../lib/format'
import { unwrap, useAsync } from '../lib/useAsync'
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader } from '../ui'

function StatTile({ label, value, hint, to }: { label: string; value: ReactNode; hint?: ReactNode; to?: string }) {
  const body = (
    <>
      <p className="text-sm text-cocoa-light">{label}</p>
      <p className="mt-1 font-serif text-2xl font-bold tabular-nums sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-cocoa-light">{hint}</p>}
    </>
  )
  const cls = 'block rounded-2xl border border-cocoa/10 bg-white p-4 shadow-sm sm:p-5'
  return to ? (
    <Link to={to} className={`${cls} transition hover:border-rose/60 hover:shadow-md`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

async function loadDashboard() {
  const today = todayInIndia()
  const [stats, recent, upcoming] = await Promise.all([
    supabase.rpc('admin_dashboard_stats').then(unwrap),
    supabase
      .from('orders')
      .select('id, order_number, customer_name, subtotal, status, payment_status, created_at')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(unwrap),
    supabase
      .from('custom_cake_requests')
      .select('id, request_number, customer_name, occasion, event_date, status')
      .gte('event_date', today)
      .not('status', 'in', '(declined,cancelled,completed)')
      .order('event_date')
      .limit(6)
      .then(unwrap),
  ])
  return { stats: parseDashboardStats(stats), recent, upcoming }
}

export function DashboardPage() {
  const { staff } = useAuth()
  const { status, data, error, reload } = useAsync(loadDashboard, [])

  return (
    <>
      <PageHeader
        title={`Hello, ${staff?.full_name.split(' ')[0] ?? 'there'}`}
        description={data ? `Figures as of ${formatDateTime(data.stats.generated_at)}` : 'Your bakery at a glance'}
      />

      {status === 'loading' && !data && <LoadingState label="Loading dashboard" />}
      {status === 'error' && !data && <ErrorState message={error} onRetry={reload} />}

      {data && (
        <div className="space-y-6">
          <section aria-labelledby="orders-heading">
            <h2 id="orders-heading" className="sr-only">
              Orders
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatTile label="Orders today" value={data.stats.orders.today} hint={`${data.stats.orders.total} all time`} />
              <StatTile label="Pending orders" value={data.stats.orders.pending} hint="Waiting to be confirmed" to="/admin/orders?status=pending" />
              <StatTile label="Open orders" value={data.stats.orders.open} hint="Not completed or cancelled" to="/admin/orders?status=open" />
              <StatTile label="Average order" value={formatMoney(data.stats.orders.average_order_value)} hint="Excludes cancelled" />
            </div>
          </section>

          <section aria-labelledby="revenue-heading">
            <h2 id="revenue-heading" className="sr-only">
              Revenue
            </h2>
            <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
              <StatTile label="Paid revenue this month" value={formatMoney(data.stats.orders.paid_revenue_month)} hint="Orders marked as paid" />
              <StatTile label="Paid revenue, all time" value={formatMoney(data.stats.orders.paid_revenue)} />
              <StatTile
                label="Awaiting payment"
                value={formatMoney(data.stats.orders.unpaid_open_value)}
                hint="Unpaid, not cancelled"
                to="/admin/orders?payment=unpaid"
              />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Order value" className="lg:col-span-2">
              <DailyOrdersChart data={data.stats.orders.daily} />
            </Card>
            <Card title="Orders by status">
              {data.stats.orders.total === 0 ? (
                <p className="text-sm text-cocoa-light">No orders yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {orderStatuses.map((s) => (
                    <li key={s}>
                      <Link to={`/admin/orders?status=${s}`} className="flex items-center justify-between rounded-lg px-1 py-0.5 hover:bg-cream">
                        <Badge tone={orderStatusMeta[s].tone}>{orderStatusMeta[s].label}</Badge>
                        <span className="text-sm font-semibold tabular-nums">{data.stats.orders.by_status[s] ?? 0}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <section aria-labelledby="custom-heading">
            <h2 id="custom-heading" className="mb-3 font-semibold">
              Custom cake requests
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatTile label="New requests" value={data.stats.custom_requests.new} to="/admin/custom-requests?status=new" />
              <StatTile label="Awaiting reply" value={data.stats.custom_requests.awaiting_reply} hint="New or contacted" />
              <StatTile label="Events in next 7 days" value={data.stats.custom_requests.upcoming_7_days} hint="Not declined or cancelled" />
              <StatTile label="Quoted value" value={formatMoney(data.stats.custom_requests.quoted_value)} hint="Quoted or confirmed" />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Latest orders" actions={<Link to="/admin/orders" className="text-sm font-medium text-rose-dark underline">View all</Link>}>
              {data.recent.length === 0 ? (
                <EmptyState icon={<ShoppingBag className="h-8 w-8" aria-hidden="true" />} title="No orders yet" body="Orders placed on the website will appear here." />
              ) : (
                <ul className="-mx-2 divide-y divide-cocoa/10">
                  {data.recent.map((o) => (
                    <li key={o.id}>
                      <Link to={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-cream">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            #{o.order_number} · {o.customer_name}
                          </span>
                          <span className="block text-xs text-cocoa-light">{formatDateTime(o.created_at)}</span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
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

            <Card
              title="Upcoming custom cakes"
              actions={<Link to="/admin/custom-requests" className="text-sm font-medium text-rose-dark underline">View all</Link>}
            >
              {data.upcoming.length === 0 ? (
                <EmptyState icon={<CakeSlice className="h-8 w-8" aria-hidden="true" />} title="Nothing coming up" body="Active custom cake requests with upcoming event dates appear here." />
              ) : (
                <ul className="-mx-2 divide-y divide-cocoa/10">
                  {data.upcoming.map((r) => {
                    const days = daysUntil(r.event_date)
                    return (
                      <li key={r.id}>
                        <Link to={`/admin/custom-requests/${r.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-cream">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              #{r.request_number} · {r.customer_name}
                            </span>
                            <span className="block text-xs text-cocoa-light">
                              {r.occasion ?? 'Custom cake'} · {formatPlainDate(r.event_date)}
                            </span>
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-xs font-semibold">{days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}</span>
                            <Badge tone={requestStatusMeta[r.status].tone}>{requestStatusMeta[r.status].label}</Badge>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
