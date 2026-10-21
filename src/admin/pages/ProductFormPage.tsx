import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import type { Category, Product } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth-context'
import { errorMessage, PermissionError } from '../lib/errors'
import { unwrap, useAsync } from '../lib/useAsync'
import { slugify, validateProduct, type FieldErrors, type ProductField, type ProductFormValues } from '../lib/validation'
import { useToast } from '../toast-context'
import { Button, Card, ErrorState, Field, LoadingState, PageHeader, Toggle } from '../ui'
import { inputClass } from '../ui-classes'

async function loadForm(id: string | undefined) {
  const categories = unwrap(await supabase.from('categories').select('*').order('sort_order').order('name'))
  if (!id) return { categories, product: null }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { categories, product: undefined }
  const product = unwrap(await supabase.from('products').select('*').eq('id', id).maybeSingle())
  return { categories, product: product ?? undefined }
}

export function ProductFormPage() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const { status, data, error, reload } = useAsync(() => loadForm(id), [id])

  if (!isAdmin) return <Navigate to="/admin/products" replace />
  if (status === 'loading' && !data) return <LoadingState label="Loading product" />
  if (status === 'error' && !data) return <ErrorState message={error} onRetry={reload} />
  if (!data) return null
  if (data.product === undefined) {
    return (
      <>
        <PageHeader title="Product not found" back={{ to: '/admin/products', label: 'All products' }} />
        <ErrorState message="This product doesn't exist." />
      </>
    )
  }
  return <ProductForm key={data.product?.id ?? 'new'} product={data.product} categories={data.categories} />
}

const toValues = (p: Product | null): ProductFormValues => ({
  name: p?.name ?? '',
  slug: p?.slug ?? '',
  category_id: p?.category_id ?? '',
  description: p?.description ?? '',
  price: p ? String(p.price) : '',
  unit: p?.unit ?? '',
  image_url: p?.image_url ?? '',
  sort_order: p ? String(p.sort_order) : '0',
  is_featured: p?.is_featured ?? false,
  is_active: p?.is_active ?? true,
  is_available: p?.is_available ?? true,
})

function ProductForm({ product, categories }: { product: Product | null; categories: Category[] }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [values, setValues] = useState<ProductFormValues>(() => toValues(product))
  const [slugTouched, setSlugTouched] = useState(Boolean(product))
  const [errors, setErrors] = useState<FieldErrors<ProductField>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = <K extends ProductField>(key: K, value: ProductFormValues[K]) =>
    setValues((v) => {
      const next = { ...v, [key]: value }
      if (key === 'name' && !slugTouched) next.slug = slugify(String(value))
      return next
    })

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const result = validateProduct(values)
    if (!result.ok) {
      setErrors(result.errors)
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }
    setErrors({})
    setSaving(true)
    try {
      if (product) {
        const rows = unwrap(await supabase.from('products').update(result.value).eq('id', product.id).select('id'))
        if (rows.length === 0) throw new PermissionError()
        toast.success(`${result.value.name} saved`)
      } else {
        unwrap(await supabase.from('products').insert(result.value).select('id').single())
        toast.success(`${result.value.name} created`)
      }
      navigate('/admin/products')
    } catch (err) {
      setFormError(errorMessage(err))
      setSaving(false)
    }
  }

  const err = errors

  return (
    <>
      <PageHeader back={{ to: '/admin/products', label: 'All products' }} title={product ? `Edit ${product.name}` : 'New product'} />
      <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required error={err.name} className="sm:col-span-2">
                {(p) => <input {...p} value={values.name} onChange={(e) => set('name', e.target.value)} maxLength={120} className={inputClass(!!err.name)} />}
              </Field>
              <Field label="URL slug" required error={err.slug} hint="Used as the product's ID in links. Lowercase letters, numbers and hyphens.">
                {(p) => (
                  <input
                    {...p}
                    value={values.slug}
                    onChange={(e) => {
                      setSlugTouched(true)
                      set('slug', e.target.value)
                    }}
                    className={inputClass(!!err.slug)}
                  />
                )}
              </Field>
              <Field label="Category" required error={err.category_id}>
                {(p) => (
                  <select {...p} value={values.category_id} onChange={(e) => set('category_id', e.target.value)} className={inputClass(!!err.category_id)}>
                    <option value="">Choose a category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.is_active ? '' : ' (hidden)'}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Description" error={err.description} className="sm:col-span-2" hint={`${values.description.length}/1000`}>
                {(p) => (
                  <textarea {...p} rows={3} value={values.description} onChange={(e) => set('description', e.target.value)} className={inputClass(!!err.description)} />
                )}
              </Field>
            </div>
          </Card>

          <Card title="Price">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price (₹)" required error={err.price}>
                {(p) => <input {...p} inputMode="decimal" value={values.price} onChange={(e) => set('price', e.target.value)} placeholder="e.g. 1299" className={inputClass(!!err.price)} />}
              </Field>
              <Field label="Unit" required error={err.unit} hint='What the price buys, e.g. "1 kg" or "Box of 6".'>
                {(p) => <input {...p} value={values.unit} onChange={(e) => set('unit', e.target.value)} maxLength={40} className={inputClass(!!err.unit)} />}
              </Field>
            </div>
            {product && <p className="mt-3 text-xs text-cocoa-light">Changing the price doesn't affect orders already placed.</p>}
          </Card>

          <Card title="Image">
            <Field label="Image URL" error={err.image_url} hint="A full https:// link to the photo.">
              {(p) => <input {...p} type="url" value={values.image_url} onChange={(e) => set('image_url', e.target.value)} className={inputClass(!!err.image_url)} />}
            </Field>
            {values.image_url.startsWith('https://') && (
              <img src={values.image_url} alt="Preview" className="mt-4 aspect-[4/3] w-full max-w-xs rounded-2xl object-cover" />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Visibility">
            <div className="space-y-4">
              <Toggle label="Show on website" description="Hidden products stay in order history." checked={values.is_active} onChange={(v) => set('is_active', v)} />
              <Toggle label="Available to order" description="Turn off when sold out for the day." checked={values.is_available} onChange={(v) => set('is_available', v)} />
              <Toggle label="Featured" description="Highlight in the featured section." checked={values.is_featured} onChange={(v) => set('is_featured', v)} />
              <Field label="Sort order" error={err.sort_order} hint="Lower numbers appear first.">
                {(p) => <input {...p} inputMode="numeric" value={values.sort_order} onChange={(e) => set('sort_order', e.target.value)} className={inputClass(!!err.sort_order)} />}
              </Field>
            </div>
          </Card>
          {formError && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
              {formError}
            </p>
          )}
          {Object.keys(errors).length > 0 && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
              Please fix the highlighted fields.
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" loading={saving}>
              {product ? 'Save changes' : 'Create product'}
            </Button>
            <Button variant="ghost" onClick={() => navigate('/admin/products')}>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </>
  )
}
