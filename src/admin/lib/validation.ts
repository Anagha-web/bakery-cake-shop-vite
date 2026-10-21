// Client-side validation mirroring the database constraints, so staff see
// problems next to the field instead of as a database error.

export type FieldErrors<K extends string> = Partial<Record<K, string>>

export type Result<T, K extends string> = { ok: true; value: T } | { ok: false; errors: FieldErrors<K> }

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function slugify(input: string) {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')
}

/** Parses a rupee amount with at most 2 decimals. Returns null if invalid. */
export function parseMoney(input: string, max = 99_999_999.99): number | null {
  const trimmed = input.trim().replace(/,/g, '')
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(trimmed)) return null
  const value = Number(trimmed)
  return value <= max ? value : null
}

export function isHttpsUrl(input: string) {
  try {
    return new URL(input).protocol === 'https:' && /^https:\/\//.test(input)
  } catch {
    return false
  }
}

const optional = (value: string) => {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function parseSortOrder(input: string): number | null {
  const trimmed = input.trim()
  if (trimmed === '') return 0
  if (!/^-?\d{1,6}$/.test(trimmed)) return null
  return Number(trimmed)
}

export type ProductFormValues = {
  name: string
  slug: string
  category_id: string
  description: string
  price: string
  unit: string
  image_url: string
  sort_order: string
  is_featured: boolean
  is_active: boolean
  is_available: boolean
}

export type ProductField = keyof ProductFormValues

export type ProductPayload = {
  name: string
  slug: string
  category_id: string
  description: string | null
  price: number
  unit: string
  image_url: string | null
  sort_order: number
  is_featured: boolean
  is_active: boolean
  is_available: boolean
}

export function validateProduct(values: ProductFormValues): Result<ProductPayload, ProductField> {
  const errors: FieldErrors<ProductField> = {}
  const name = values.name.trim()
  const slug = values.slug.trim()
  const unit = values.unit.trim()
  const description = optional(values.description)
  const imageUrl = optional(values.image_url)
  const price = parseMoney(values.price)
  const sortOrder = parseSortOrder(values.sort_order)

  if (!name) errors.name = 'Enter a product name.'
  else if (name.length > 120) errors.name = 'Keep the name to 120 characters or fewer.'

  if (!slug) errors.slug = 'Enter a URL slug.'
  else if (!SLUG_PATTERN.test(slug)) errors.slug = 'Use lowercase letters, numbers and single hyphens, e.g. "chocolate-cake".'

  if (!values.category_id) errors.category_id = 'Choose a category.'

  if (description && description.length > 1000) errors.description = 'Keep the description to 1000 characters or fewer.'

  if (values.price.trim() === '') errors.price = 'Enter a price.'
  else if (price === null) errors.price = 'Enter a valid amount in rupees, e.g. 1299 or 1299.50.'

  if (!unit) errors.unit = 'Enter a unit, e.g. "1 kg" or "Box of 6".'
  else if (unit.length > 40) errors.unit = 'Keep the unit to 40 characters or fewer.'

  if (imageUrl && !isHttpsUrl(imageUrl)) errors.image_url = 'Use a full image link starting with https://'

  if (sortOrder === null) errors.sort_order = 'Use a whole number.'

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    value: {
      name,
      slug,
      category_id: values.category_id,
      description,
      price: price as number,
      unit,
      image_url: imageUrl,
      sort_order: sortOrder as number,
      is_featured: values.is_featured,
      is_active: values.is_active,
      is_available: values.is_available,
    },
  }
}

export type CategoryFormValues = {
  name: string
  slug: string
  tagline: string
  image_url: string
  sort_order: string
  is_active: boolean
}

export type CategoryField = keyof CategoryFormValues

export type CategoryPayload = {
  name: string
  slug: string
  tagline: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
}

export function validateCategory(values: CategoryFormValues): Result<CategoryPayload, CategoryField> {
  const errors: FieldErrors<CategoryField> = {}
  const name = values.name.trim()
  const slug = values.slug.trim()
  const tagline = optional(values.tagline)
  const imageUrl = optional(values.image_url)
  const sortOrder = parseSortOrder(values.sort_order)

  if (!name) errors.name = 'Enter a category name.'
  else if (name.length > 60) errors.name = 'Keep the name to 60 characters or fewer.'

  if (!slug) errors.slug = 'Enter a URL slug.'
  else if (!SLUG_PATTERN.test(slug)) errors.slug = 'Use lowercase letters, numbers and single hyphens, e.g. "cupcakes".'

  if (tagline && tagline.length > 120) errors.tagline = 'Keep the tagline to 120 characters or fewer.'
  if (imageUrl && !isHttpsUrl(imageUrl)) errors.image_url = 'Use a full image link starting with https://'
  if (sortOrder === null) errors.sort_order = 'Use a whole number.'

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    value: { name, slug, tagline, image_url: imageUrl, sort_order: sortOrder as number, is_active: values.is_active },
  }
}

export type QuoteFormValues = { status: string; quoted_price: string; staff_notes: string }
export type QuoteField = keyof QuoteFormValues
export type QuotePayload = { quoted_price: number | null; staff_notes: string | null }

const QUOTE_REQUIRED = new Set(['quoted', 'confirmed', 'completed'])

export function validateQuote(values: QuoteFormValues): Result<QuotePayload, QuoteField> {
  const errors: FieldErrors<QuoteField> = {}
  const priceText = values.quoted_price.trim()
  const price = priceText === '' ? null : parseMoney(priceText, 10_000_000)
  const notes = optional(values.staff_notes)

  if (priceText !== '' && price === null) errors.quoted_price = 'Enter a valid amount in rupees, e.g. 2500.'
  else if (price === null && QUOTE_REQUIRED.has(values.status)) errors.quoted_price = 'Add the quoted price before marking the request as quoted or confirmed.'

  if (notes && notes.length > 2000) errors.staff_notes = 'Keep notes to 2000 characters or fewer.'

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, value: { quoted_price: price, staff_notes: notes } }
}

export function validateLogin(email: string, password: string): FieldErrors<'email' | 'password'> {
  const errors: FieldErrors<'email' | 'password'> = {}
  if (!email.trim()) errors.email = 'Enter your email address.'
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) errors.email = 'Enter a valid email address.'
  if (!password) errors.password = 'Enter your password.'
  return errors
}
