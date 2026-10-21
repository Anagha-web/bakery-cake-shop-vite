import type { CustomRequestStatus, Json, OrderStatus } from '../../lib/database.types'

export type DailyPoint = { date: string; orders: number; value: number }

export type DashboardStats = {
  orders: {
    total: number
    today: number
    pending: number
    open: number
    paid_revenue: number
    paid_revenue_month: number
    unpaid_open_value: number
    average_order_value: number
    by_status: Partial<Record<OrderStatus, number>>
    daily: DailyPoint[]
  }
  custom_requests: {
    total: number
    new: number
    awaiting_reply: number
    upcoming_7_days: number
    quoted_value: number
    by_status: Partial<Record<CustomRequestStatus, number>>
  }
  generated_at: string
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0)
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})
const counts = (v: unknown) => Object.fromEntries(Object.entries(obj(v)).map(([k, n]) => [k, num(n)]))

/** Validates the JSON returned by admin_dashboard_stats() into a typed object. */
export function parseDashboardStats(raw: Json): DashboardStats {
  const root = obj(raw)
  const o = obj(root.orders)
  const r = obj(root.custom_requests)
  const daily = Array.isArray(o.daily) ? o.daily : []
  return {
    orders: {
      total: num(o.total),
      today: num(o.today),
      pending: num(o.pending),
      open: num(o.open),
      paid_revenue: num(o.paid_revenue),
      paid_revenue_month: num(o.paid_revenue_month),
      unpaid_open_value: num(o.unpaid_open_value),
      average_order_value: num(o.average_order_value),
      by_status: counts(o.by_status),
      daily: daily.map((d) => {
        const p = obj(d)
        return { date: String(p.date ?? ''), orders: num(p.orders), value: num(p.value) }
      }),
    },
    custom_requests: {
      total: num(r.total),
      new: num(r.new),
      awaiting_reply: num(r.awaiting_reply),
      upcoming_7_days: num(r.upcoming_7_days),
      quoted_value: num(r.quoted_value),
      by_status: counts(r.by_status),
    },
    generated_at: String(root.generated_at ?? ''),
  }
}

/** A "nice" axis maximum (1, 2, 2.5 or 5 x 10^n) at or above the data maximum. */
export function niceMax(value: number) {
  if (value <= 0) return 1
  const exp = Math.pow(10, Math.floor(Math.log10(value)))
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (step * exp >= value) return step * exp
  }
  return 10 * exp
}
