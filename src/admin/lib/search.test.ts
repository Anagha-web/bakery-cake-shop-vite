import { describe, expect, it } from 'vitest'
import { buildSearchFilter, cleanSearchTerm, pageRange } from './search'

const orders = { textColumns: ['customer_name', 'customer_email'], phoneKeyColumn: 'customer_phone_key', numberColumn: 'order_number' }

describe('cleanSearchTerm', () => {
  it('strips characters that have meaning in PostgREST filters', () => {
    expect(cleanSearchTerm('a,b(c)"d\'e\\f%g*h:i')).toBe('a b c d e f g h i')
    expect(cleanSearchTerm('   ')).toBe('')
  })
  it('limits the length', () => {
    expect(cleanSearchTerm('x'.repeat(100))).toHaveLength(60)
  })
})

describe('buildSearchFilter', () => {
  it('returns null for an empty search', () => {
    expect(buildSearchFilter('  ', orders)).toBeNull()
  })

  it('searches names and emails for text', () => {
    expect(buildSearchFilter('Asha', orders)).toBe('customer_name.ilike.%Asha%,customer_email.ilike.%Asha%')
  })

  it('matches phone numbers on the digits, whatever the format', () => {
    expect(buildSearchFilter('+91 98765 43210', orders)).toBe(
      'customer_name.ilike.%+91 98765 43210%,customer_email.ilike.%+91 98765 43210%,customer_phone_key.ilike.%9876543210%',
    )
  })

  it('matches order numbers exactly, with or without #', () => {
    expect(buildSearchFilter('#1001', orders)).toBe(
      'customer_name.ilike.%1001%,customer_email.ilike.%1001%,customer_phone_key.ilike.%1001%,order_number.eq.1001',
    )
  })

  it('cannot inject extra filter clauses', () => {
    const filter = buildSearchFilter('x),status.eq.completed,(y', orders)!
    expect(filter.split(',')).toHaveLength(2)
    expect(filter).not.toContain('(')
  })
})

describe('pageRange', () => {
  it('converts a 1-based page to an inclusive row range', () => {
    expect(pageRange(1)).toEqual([0, 19])
    expect(pageRange(3, 10)).toEqual([20, 29])
    expect(pageRange(0)).toEqual([0, 19])
    expect(pageRange(Number.NaN)).toEqual([0, 19])
  })
})
