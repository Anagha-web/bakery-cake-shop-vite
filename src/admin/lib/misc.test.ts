import { describe, expect, it } from 'vitest'
import { niceMax, parseDashboardStats } from './dashboard'
import { errorMessage, PermissionError } from './errors'
import { daysUntil, formatMoney, formatPlainDate, telHref, todayInIndia } from './format'

describe('errorMessage', () => {
  it('explains known database errors', () => {
    expect(errorMessage({ code: '23505', message: 'duplicate key value violates unique constraint "products_slug_key"' })).toMatch(/slug/)
    expect(errorMessage({ code: '42501', message: 'permission denied for table orders' })).toMatch(/permission/)
    expect(errorMessage({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toBe('Incorrect email or password.')
    expect(errorMessage(new PermissionError())).toMatch(/permission/)
  })
  it('explains network failures', () => {
    expect(errorMessage(new TypeError('Failed to fetch'))).toMatch(/internet connection/)
  })
  it('falls back to the message, then a generic text', () => {
    expect(errorMessage({ message: 'Something specific' })).toBe('Something specific')
    expect(errorMessage({})).toBe('Something went wrong. Please try again.')
  })
})

describe('format helpers', () => {
  it('formats rupees', () => {
    expect(formatMoney(1299)).toBe('₹1,299')
    expect(formatMoney(123456.5)).toBe('₹1,23,456.5')
    expect(formatMoney(null)).toBe('—')
  })
  it('formats date-only values without shifting the day', () => {
    expect(formatPlainDate('2026-10-25')).toContain('25')
    expect(formatPlainDate('2026-10-25')).toContain('Oct')
  })
  it('uses India time for "today"', () => {
    // 20:00 UTC on 20 Oct is 01:30 on 21 Oct in India.
    expect(todayInIndia(new Date('2026-10-20T20:00:00Z'))).toBe('2026-10-21')
    expect(daysUntil('2026-10-23', new Date('2026-10-20T20:00:00Z'))).toBe(2)
    expect(daysUntil('2026-10-20', new Date('2026-10-20T20:00:00Z'))).toBe(-1)
  })
  it('builds tel: links', () => {
    expect(telHref('+91 98765 43210')).toBe('tel:+919876543210')
  })
})

describe('parseDashboardStats', () => {
  it('reads the database function output', () => {
    const stats = parseDashboardStats({
      orders: {
        total: 3,
        today: 3,
        pending: 2,
        open: 3,
        paid_revenue: 2598,
        paid_revenue_month: 2598,
        unpaid_open_value: 1528,
        average_order_value: 1375.33,
        by_status: { pending: 2, confirmed: 1 },
        daily: [{ date: '2026-10-21', orders: 3, value: 4126 }],
      },
      custom_requests: { total: 1, new: 0, awaiting_reply: 0, upcoming_7_days: 1, quoted_value: 2500, by_status: { quoted: 1 } },
      generated_at: '2026-10-21T10:00:00Z',
    })
    expect(stats.orders.pending).toBe(2)
    expect(stats.orders.by_status).toEqual({ pending: 2, confirmed: 1 })
    expect(stats.orders.daily).toEqual([{ date: '2026-10-21', orders: 3, value: 4126 }])
    expect(stats.custom_requests.quoted_value).toBe(2500)
  })
  it('tolerates missing or malformed fields', () => {
    const stats = parseDashboardStats(null)
    expect(stats.orders.total).toBe(0)
    expect(stats.orders.daily).toEqual([])
    expect(stats.custom_requests.by_status).toEqual({})
  })
})

describe('niceMax', () => {
  it('rounds the axis up to a readable number', () => {
    expect(niceMax(0)).toBe(1)
    expect(niceMax(4126)).toBe(5000)
    expect(niceMax(1299)).toBe(2000)
    expect(niceMax(2400)).toBe(2500)
    expect(niceMax(10000)).toBe(10000)
  })
})
