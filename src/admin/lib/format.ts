import type { CustomRequestStatus, FulfillmentType, OrderStatus, PaymentStatus } from '../../lib/database.types'

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export const formatMoney = (amount: number | null | undefined) => (amount == null ? '—' : inr.format(amount))

const dateTime = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const shortDate = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })

export const formatDateTime = (iso: string | null | undefined) => (iso ? dateTime.format(new Date(iso)) : '—')
export const formatDate = (iso: string | null | undefined) => (iso ? shortDate.format(new Date(iso)) : '—')

// Date-only columns ("2026-10-25") have no time zone; format them as written.
const plainDate = new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
export const formatPlainDate = (value: string | null | undefined) => (value ? plainDate.format(new Date(`${value.slice(0, 10)}T00:00:00Z`)) : '—')

/** Today's date in India as YYYY-MM-DD. */
export const todayInIndia = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)

/** Whole days from today (India) until a YYYY-MM-DD date; negative if past. */
export const daysUntil = (value: string, now = new Date()) => {
  const target = Date.parse(`${value.slice(0, 10)}T00:00:00Z`)
  const today = Date.parse(`${todayInIndia(now)}T00:00:00Z`)
  return Math.round((target - today) / 86_400_000)
}

type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'accent'

export const orderStatusMeta: Record<OrderStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'info' },
  preparing: { label: 'Preparing', tone: 'accent' },
  ready: { label: 'Ready', tone: 'accent' },
  out_for_delivery: { label: 'Out for delivery', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
}

export const paymentStatusMeta: Record<PaymentStatus, { label: string; tone: Tone }> = {
  unpaid: { label: 'Unpaid', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  refunded: { label: 'Refunded', tone: 'neutral' },
}

export const requestStatusMeta: Record<CustomRequestStatus, { label: string; tone: Tone }> = {
  new: { label: 'New', tone: 'warning' },
  contacted: { label: 'Contacted', tone: 'info' },
  quoted: { label: 'Quoted', tone: 'accent' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  completed: { label: 'Completed', tone: 'neutral' },
  declined: { label: 'Declined', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
}

export const fulfillmentLabel: Record<FulfillmentType, string> = { pickup: 'Pickup', delivery: 'Delivery' }

export const orderStatuses = Object.keys(orderStatusMeta) as OrderStatus[]
export const paymentStatuses = Object.keys(paymentStatusMeta) as PaymentStatus[]
export const requestStatuses = Object.keys(requestStatusMeta) as CustomRequestStatus[]

export type { Tone }

/** Digits only, for tel: links. */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`
