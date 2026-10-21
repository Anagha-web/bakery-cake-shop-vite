import { Pencil, Plus, Tags } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { Category } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth-context'
import { errorMessage, PermissionError } from '../lib/errors'
import { unwrap, useAsync } from '../lib/useAsync'
import { slugify, validateCategory, type CategoryField, type CategoryFormValues, type FieldErrors } from '../lib/validation'
import { useToast } from '../toast-context'
import { Badge, Button, EmptyState, ErrorState, Field, LoadingState, Modal, PageHeader, Toggle } from '../ui'
import { inputClass } from '../ui-classes'

type CategoryWithCount = Category & { products: { count: number }[] }

async function loadCategories() {
  const rows = unwrap(await supabase.from('categories').select('*, products(count)').order('sort_order').order('name'))
  return rows as CategoryWithCount[]
}

export function CategoriesPage() {
  const { isAdmin } = useAuth()
  const { status, data, error, reload } = useAsync(loadCategories, [])
  const [editing, setEditing] = useState<Category | 'new' | null>(null)

  return (
    <>
      <PageHeader
        title="Categories"
        description={isAdmin ? 'Group products on the menu. Hide a category instead of deleting it.' : 'Only admins can change categories.'}
        actions={
          isAdmin && (
            <Button onClick={() => setEditing('new')}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New category
            </Button>
          )
        }
      />

      {status === 'loading' && !data && <LoadingState label="Loading categories" />}
      {status === 'error' && !data && <ErrorState message={error} onRetry={reload} />}

      {data && data.length === 0 && (
        <EmptyState
          icon={<Tags className="h-8 w-8" aria-hidden="true" />}
          title="No categories yet"
          body="Create a category before adding products."
          action={isAdmin && <Button onClick={() => setEditing('new')}>New category</Button>}
        />
      )}

      {data && data.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => {
            const count = c.products[0]?.count ?? 0
            return (
              <li key={c.id} className="flex gap-4 rounded-2xl border border-cocoa/10 bg-white p-4 shadow-sm">
                {c.image_url ? (
                  <img src={c.image_url} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                ) : (
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-cream-dark text-cocoa-light">
                    <Tags className="h-6 w-6" aria-hidden="true" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{c.name}</p>
                    {!c.is_active && <Badge tone="neutral">Hidden</Badge>}
                  </div>
                  {c.tagline && <p className="text-sm text-cocoa-light">{c.tagline}</p>}
                  <p className="mt-1 text-xs text-cocoa-light">
                    {count} product{count === 1 ? '' : 's'} · order {c.sort_order}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setEditing(c)}
                    className="grid h-9 w-9 shrink-0 place-items-center self-start rounded-full hover:bg-cream-dark"
                    aria-label={`Edit ${c.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {editing && (
        <CategoryDialog
          category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
    </>
  )
}

function CategoryDialog({ category, onClose, onSaved }: { category: Category | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const [values, setValues] = useState<CategoryFormValues>({
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    tagline: category?.tagline ?? '',
    image_url: category?.image_url ?? '',
    sort_order: category ? String(category.sort_order) : '0',
    is_active: category?.is_active ?? true,
  })
  const [slugTouched, setSlugTouched] = useState(Boolean(category))
  const [errors, setErrors] = useState<FieldErrors<CategoryField>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = <K extends CategoryField>(key: K, value: CategoryFormValues[K]) =>
    setValues((v) => {
      const next = { ...v, [key]: value }
      if (key === 'name' && !slugTouched) next.slug = slugify(String(value))
      return next
    })

  const onSubmit = async (e?: FormEvent) => {
    e?.preventDefault()
    setFormError(null)
    const result = validateCategory(values)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    setSaving(true)
    try {
      if (category) {
        const rows = unwrap(await supabase.from('categories').update(result.value).eq('id', category.id).select('id'))
        if (rows.length === 0) throw new PermissionError()
      } else {
        unwrap(await supabase.from('categories').insert(result.value).select('id').single())
      }
      toast.success(`${result.value.name} ${category ? 'saved' : 'created'}`)
      onSaved()
    } catch (err) {
      setFormError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <Modal
      title={category ? `Edit ${category.name}` : 'New category'}
      open
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" loading={saving}>
            {category ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Name" required error={errors.name}>
          {(p) => <input {...p} value={values.name} onChange={(e) => set('name', e.target.value)} maxLength={60} className={inputClass(!!errors.name)} />}
        </Field>
        <Field label="URL slug" required error={errors.slug}>
          {(p) => (
            <input
              {...p}
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true)
                set('slug', e.target.value)
              }}
              className={inputClass(!!errors.slug)}
            />
          )}
        </Field>
        <Field label="Tagline" error={errors.tagline} hint="Short line shown under the name, e.g. “Little bites of joy”.">
          {(p) => <input {...p} value={values.tagline} onChange={(e) => set('tagline', e.target.value)} maxLength={120} className={inputClass(!!errors.tagline)} />}
        </Field>
        <Field label="Image URL" error={errors.image_url}>
          {(p) => <input {...p} type="url" value={values.image_url} onChange={(e) => set('image_url', e.target.value)} className={inputClass(!!errors.image_url)} />}
        </Field>
        <Field label="Sort order" error={errors.sort_order} hint="Lower numbers appear first.">
          {(p) => <input {...p} inputMode="numeric" value={values.sort_order} onChange={(e) => set('sort_order', e.target.value)} className={inputClass(!!errors.sort_order)} />}
        </Field>
        <Toggle label="Show on website" checked={values.is_active} onChange={(v) => set('is_active', v)} />
        {formError && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  )
}
