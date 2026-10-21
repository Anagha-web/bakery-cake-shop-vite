import { Check, ImageOff, Package, Pencil, Plus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import type { Product } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth-context'
import { errorMessage, PermissionError } from '../lib/errors'
import { formatMoney } from '../lib/format'
import { cleanSearchTerm } from '../lib/search'
import { unwrap, useAsync } from '../lib/useAsync'
import { useListParams } from '../lib/useListParams'
import { parseMoney } from '../lib/validation'
import { useToast } from '../toast-context'
import { Badge, EmptyState, ErrorState, InlineAlert, LoadingState, PageHeader, SearchInput, Toggle } from '../ui'
import { buttonClass, inputClass } from '../ui-classes'

const FILTERS = ['category', 'show'] as const

type ProductRow = Product & { categories: { name: string; is_active: boolean } | null }

async function loadProducts() {
  const [products, categories] = await Promise.all([
    supabase.from('products').select('*, categories(name, is_active)').order('sort_order').order('name').then(unwrap),
    supabase.from('categories').select('id, name').order('sort_order').order('name').then(unwrap),
  ])
  return { products: products as ProductRow[], categories }
}

/** Updates one product and checks the database actually accepted it. */
async function updateProduct(id: string, changes: Partial<Pick<Product, 'price' | 'is_available' | 'is_active'>>) {
  const rows = unwrap(await supabase.from('products').update(changes).eq('id', id).select('*, categories(name, is_active)'))
  if (rows.length === 0) throw new PermissionError()
  return rows[0] as ProductRow
}

export function ProductsPage() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const { filters, searchText, setSearchText, setFilter, q } = useListParams(FILTERS)
  const { status, data, error, reload } = useAsync(loadProducts, [])
  // Rows edited in place since the list loaded; tied to that load so a reload
  // (fresh data from the server) discards them.
  const [edits, setEdits] = useState<{ base: unknown; rows: Record<string, ProductRow> }>({ base: null, rows: {} })
  const overrides = edits.base === data ? edits.rows : {}
  const [busy, setBusy] = useState<string | null>(null)

  const products = (data?.products ?? []).map((p) => overrides[p.id] ?? p)
  const term = cleanSearchTerm(q).toLowerCase()
  const visible = products.filter((p) => {
    if (filters.category && p.category_id !== filters.category) return false
    if (filters.show === 'available' && !(p.is_active && p.is_available)) return false
    if (filters.show === 'sold_out' && !(p.is_active && !p.is_available)) return false
    if (filters.show === 'hidden' && p.is_active) return false
    if (term && !`${p.name} ${p.slug} ${p.description ?? ''}`.toLowerCase().includes(term)) return false
    return true
  })

  const apply = async (product: ProductRow, changes: Parameters<typeof updateProduct>[1], message: string) => {
    setBusy(product.id)
    try {
      const updated = await updateProduct(product.id, changes)
      setEdits((e) => ({ base: data, rows: { ...(e.base === data ? e.rows : {}), [product.id]: updated } }))
      toast.success(message)
      return true
    } catch (e) {
      toast.error(errorMessage(e))
      return false
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Products"
        description={isAdmin ? 'Manage the menu, prices and availability.' : 'View the menu. Only admins can change products.'}
        actions={
          isAdmin && (
            <Link to="/admin/products/new" className={buttonClass()}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New product
            </Link>
          )
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput label="Search products" value={searchText} onChange={setSearchText} placeholder="Search by name" />
        <select aria-label="Filter by category" value={filters.category} onChange={(e) => setFilter('category', e.target.value)} className={`${inputClass()} sm:w-48`}>
          <option value="">All categories</option>
          {data?.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select aria-label="Filter by availability" value={filters.show} onChange={(e) => setFilter('show', e.target.value)} className={`${inputClass()} sm:w-44`}>
          <option value="">All products</option>
          <option value="available">Available</option>
          <option value="sold_out">Sold out</option>
          <option value="hidden">Hidden from website</option>
        </select>
      </div>

      {status === 'error' && data && <InlineAlert onRetry={reload}>{error}</InlineAlert>}
      {status === 'loading' && !data && <LoadingState label="Loading products" />}
      {status === 'error' && !data && <ErrorState message={error} onRetry={reload} />}

      {data && visible.length === 0 && (
        <EmptyState
          icon={<Package className="h-8 w-8" aria-hidden="true" />}
          title={products.length === 0 ? 'No products yet' : 'No products match these filters'}
          body={products.length === 0 && isAdmin ? 'Add your first product to show it on the website.' : undefined}
          action={
            products.length === 0 &&
            isAdmin && (
              <Link to="/admin/products/new" className={buttonClass()}>
                <Plus className="h-4 w-4" aria-hidden="true" /> New product
              </Link>
            )
          }
        />
      )}

      {visible.length > 0 && (
        <>
          <p className="mb-2 text-sm text-cocoa-light">
            {visible.length} of {products.length} products
          </p>
          <ul className="space-y-3">
            {visible.map((p) => (
              <li key={p.id} className="rounded-2xl border border-cocoa/10 bg-white p-4 shadow-sm">
                <div className="flex gap-4">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20" />
                  ) : (
                    <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-cream-dark text-cocoa-light sm:h-20 sm:w-20">
                      <ImageOff className="h-6 w-6" aria-hidden="true" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-cocoa-light">
                          {p.categories?.name ?? 'No category'}
                          {p.categories && !p.categories.is_active && ' (hidden category)'} · {p.unit}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {!p.is_active && <Badge tone="neutral">Hidden</Badge>}
                        {p.is_active && !p.is_available && <Badge tone="warning">Sold out</Badge>}
                        {p.is_active && p.is_available && <Badge tone="success">Available</Badge>}
                        {p.is_featured && <Badge tone="accent">Featured</Badge>}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
                      <PriceEditor product={p} canEdit={isAdmin} busy={busy === p.id} onSave={(price) => apply(p, { price }, `${p.name} now costs ${formatMoney(price)}`)} />
                      {isAdmin && (
                        <>
                          <Toggle
                            label="Available"
                            checked={p.is_available}
                            disabled={busy === p.id}
                            onChange={(v) => apply(p, { is_available: v }, `${p.name} marked as ${v ? 'available' : 'sold out'}`)}
                          />
                          <Toggle
                            label="On website"
                            checked={p.is_active}
                            disabled={busy === p.id}
                            onChange={(v) => apply(p, { is_active: v }, `${p.name} ${v ? 'shown on' : 'hidden from'} the website`)}
                          />
                          <Link to={`/admin/products/${p.id}`} className={`${buttonClass('secondary', 'sm')} ml-auto`}>
                            <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}

function PriceEditor({ product, canEdit, busy, onSave }: { product: Product; canEdit: boolean; busy: boolean; onSave: (price: number) => Promise<boolean> }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold tabular-nums">{formatMoney(product.price)}</span>
        {canEdit && (
          <button
            type="button"
            onClick={() => {
              setValue(String(product.price))
              setError(null)
              setEditing(true)
            }}
            className="rounded-full p-1.5 text-cocoa-light hover:bg-cream-dark hover:text-cocoa"
            aria-label={`Change price of ${product.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const price = parseMoney(value)
    if (price === null) {
      setError('Enter a valid amount, e.g. 1299')
      return
    }
    if (price === product.price) {
      setEditing(false)
      return
    }
    if (await onSave(price)) setEditing(false)
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2" noValidate>
      <label className="sr-only" htmlFor={`price-${product.id}`}>
        New price for {product.name} in rupees
      </label>
      <span className="text-sm text-cocoa-light">₹</span>
      <input
        id={`price-${product.id}`}
        autoFocus
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
        aria-invalid={Boolean(error)}
        className={`${inputClass(!!error)} w-28 py-1.5`}
      />
      <button type="submit" disabled={busy} className="rounded-full bg-cocoa p-1.5 text-cream hover:bg-cocoa-light disabled:opacity-60" aria-label="Save price">
        <Check className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => setEditing(false)} className="rounded-full p-1.5 hover:bg-cream-dark" aria-label="Cancel">
        <X className="h-4 w-4" />
      </button>
      {error && (
        <p role="alert" className="w-full text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </form>
  )
}
