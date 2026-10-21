import { describe, expect, it } from 'vitest'
import { isHttpsUrl, parseMoney, slugify, validateCategory, validateLogin, validateProduct, validateQuote, type ProductFormValues } from './validation'

const product = (overrides: Partial<ProductFormValues> = {}): ProductFormValues => ({
  name: 'Chocolate Cake',
  slug: 'chocolate-cake',
  category_id: '11111111-1111-1111-1111-111111111111',
  description: '',
  price: '1299',
  unit: '1 kg',
  image_url: '',
  sort_order: '0',
  is_featured: false,
  is_active: true,
  is_available: true,
  ...overrides,
})

describe('slugify', () => {
  it('makes database-valid slugs', () => {
    expect(slugify('Belgian Chocolate Truffle Cake')).toBe('belgian-chocolate-truffle-cake')
    expect(slugify('  Crème brûlée & Co.  ')).toBe('creme-brulee-and-co')
    expect(slugify('---')).toBe('')
    expect(slugify('A'.repeat(100))).toHaveLength(80)
  })
})

describe('parseMoney', () => {
  it('accepts rupee amounts with up to 2 decimals', () => {
    expect(parseMoney('1299')).toBe(1299)
    expect(parseMoney(' 1,299.50 ')).toBe(1299.5)
    expect(parseMoney('0')).toBe(0)
  })
  it('rejects invalid amounts', () => {
    for (const bad of ['', '-5', '12.345', 'abc', '1e3', '₹100', '100000000']) expect(parseMoney(bad)).toBeNull()
  })
  it('respects the maximum', () => {
    expect(parseMoney('5000', 1000)).toBeNull()
  })
})

describe('isHttpsUrl', () => {
  it('only allows https links', () => {
    expect(isHttpsUrl('https://images.unsplash.com/photo-1?w=800')).toBe(true)
    expect(isHttpsUrl('http://example.com/a.jpg')).toBe(false)
    expect(isHttpsUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpsUrl('not a url')).toBe(false)
  })
})

describe('validateProduct', () => {
  it('returns a clean payload for valid input', () => {
    const result = validateProduct(product({ name: '  Chocolate Cake ', description: '  ', price: '1299.5', sort_order: '' }))
    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({ name: 'Chocolate Cake', description: null, image_url: null, price: 1299.5, sort_order: 0 }),
    })
  })

  it('reports every invalid field', () => {
    const result = validateProduct(
      product({ name: '', slug: 'Bad Slug', category_id: '', price: '-1', unit: '', image_url: 'http://x.com/a.jpg', sort_order: '1.5', description: 'x'.repeat(1001) }),
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(['category_id', 'description', 'image_url', 'name', 'price', 'slug', 'sort_order', 'unit'])
    }
  })

  it('requires a price', () => {
    const result = validateProduct(product({ price: ' ' }))
    expect(!result.ok && result.errors.price).toBe('Enter a price.')
  })
})

describe('validateCategory', () => {
  it('accepts valid input and trims optional fields to null', () => {
    const result = validateCategory({ name: 'Savouries', slug: 'savouries', tagline: ' ', image_url: '', sort_order: '6', is_active: true })
    expect(result).toEqual({ ok: true, value: { name: 'Savouries', slug: 'savouries', tagline: null, image_url: null, sort_order: 6, is_active: true } })
  })
  it('rejects names over 60 characters and bad slugs', () => {
    const result = validateCategory({ name: 'x'.repeat(61), slug: 'a--b', tagline: '', image_url: '', sort_order: '0', is_active: true })
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(['name', 'slug'])
  })
})

describe('validateQuote', () => {
  it('requires a price once quoted or confirmed', () => {
    for (const status of ['quoted', 'confirmed', 'completed']) {
      expect(validateQuote({ status, quoted_price: '', staff_notes: '' }).ok).toBe(false)
    }
    expect(validateQuote({ status: 'contacted', quoted_price: '', staff_notes: '' })).toEqual({ ok: true, value: { quoted_price: null, staff_notes: null } })
  })
  it('parses the price and keeps notes', () => {
    expect(validateQuote({ status: 'quoted', quoted_price: '2500', staff_notes: ' Two tier ' })).toEqual({
      ok: true,
      value: { quoted_price: 2500, staff_notes: 'Two tier' },
    })
  })
  it('rejects a bad price', () => {
    const result = validateQuote({ status: 'new', quoted_price: 'abc', staff_notes: '' })
    expect(!result.ok && result.errors.quoted_price).toBeTruthy()
  })
})

describe('validateLogin', () => {
  it('validates email and password', () => {
    expect(validateLogin('', '')).toEqual({ email: 'Enter your email address.', password: 'Enter your password.' })
    expect(validateLogin('owner@bakery', 'x').email).toBe('Enter a valid email address.')
    expect(validateLogin('owner@bakery.in', 'secret')).toEqual({})
  })
})
