import { Mail, Phone } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import type { CustomCakeRequest, CustomRequestStatus } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import { errorMessage, PermissionError } from '../lib/errors'
import { daysUntil, formatDateTime, formatMoney, formatPlainDate, fulfillmentLabel, requestStatuses, requestStatusMeta, telHref } from '../lib/format'
import { unwrap, useAsync } from '../lib/useAsync'
import { validateQuote, type FieldErrors, type QuoteField } from '../lib/validation'
import { useToast } from '../toast-context'
import { Badge, Button, Card, Detail, ErrorState, Field, LoadingState, PageHeader } from '../ui'
import { inputClass } from '../ui-classes'

async function loadRequest(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  return unwrap(await supabase.from('custom_cake_requests').select('*').eq('id', id).maybeSingle())
}

export function CustomRequestDetailPage() {
  const { id = '' } = useParams()
  const { status, data, error, reload } = useAsync(() => loadRequest(id), [id])

  if (status === 'loading' && !data) return <LoadingState label="Loading request" />
  if (status === 'error' && !data) return <ErrorState message={error} onRetry={reload} />
  if (!data) {
    return (
      <>
        <PageHeader title="Request not found" back={{ to: '/admin/custom-requests', label: 'All requests' }} />
        <ErrorState message="This request doesn't exist, or you don't have access to it." />
      </>
    )
  }

  const r = data
  const days = daysUntil(r.event_date)
  const yesNo = (v: boolean) => (v ? 'Yes' : 'No')

  return (
    <>
      <PageHeader
        back={{ to: '/admin/custom-requests', label: 'All requests' }}
        title={`Custom cake #${r.request_number}`}
        description={`Received ${formatDateTime(r.created_at)}`}
        actions={<Badge tone={requestStatusMeta[r.status].tone}>{requestStatusMeta[r.status].label}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Event">
            <dl className="divide-y divide-cocoa/10">
              <Detail label="Event date">
                {formatPlainDate(r.event_date)}{' '}
                <span className={days < 0 ? 'text-cocoa-light' : days <= 2 ? 'font-semibold text-rose-dark' : 'text-cocoa-light'}>
                  ({days === 0 ? 'today' : days === 1 ? 'tomorrow' : days > 0 ? `in ${days} days` : `${-days} days ago`})
                </span>
              </Detail>
              <Detail label="Occasion">{r.occasion}</Detail>
              <Detail label="Fulfilment">{fulfillmentLabel[r.fulfillment_type]}</Detail>
              {r.fulfillment_type === 'delivery' && <Detail label="Delivery address"><span className="whitespace-pre-line">{r.delivery_address}</span></Detail>}
            </dl>
          </Card>

          <Card title="Cake details">
            <dl className="divide-y divide-cocoa/10">
              <Detail label="Flavour">{r.flavour}</Detail>
              <Detail label="Weight">{r.weight_kg != null ? `${r.weight_kg} kg` : null}</Detail>
              <Detail label="Servings">{r.servings}</Detail>
              <Detail label="Tiers">{r.tiers}</Detail>
              <Detail label="Eggless">{yesNo(r.is_eggless)}</Detail>
              <Detail label="Message on cake">{r.message_on_cake ? <span className="whitespace-pre-line">“{r.message_on_cake}”</span> : null}</Detail>
              <Detail label="Design notes">{r.design_notes ? <span className="whitespace-pre-line">{r.design_notes}</span> : null}</Detail>
              <Detail label="Customer budget">{r.budget != null ? formatMoney(r.budget) : null}</Detail>
            </dl>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Remounts (resetting the form) whenever the saved request changes. */}
          <QuotePanel key={r.updated_at} request={r} onSaved={reload} />
          <Card title="Customer">
            <p className="font-semibold">{r.customer_name}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href={telHref(r.customer_phone)} className="inline-flex items-center gap-2 text-rose-dark underline">
                  <Phone className="h-4 w-4" aria-hidden="true" /> {r.customer_phone}
                </a>
              </li>
              {r.customer_email && (
                <li>
                  <a href={`mailto:${r.customer_email}`} className="inline-flex items-center gap-2 break-all text-rose-dark underline">
                    <Mail className="h-4 w-4 shrink-0" aria-hidden="true" /> {r.customer_email}
                  </a>
                </li>
              )}
            </ul>
            <Link to={`/admin/customers/${r.customer_phone_key}`} className="mt-4 inline-block text-sm font-medium underline">
              View customer history
            </Link>
          </Card>
        </div>
      </div>
    </>
  )
}

function QuotePanel({ request, onSaved }: { request: CustomCakeRequest; onSaved: () => void }) {
  const toast = useToast()
  const [values, setValues] = useState(() => ({
    status: request.status as string,
    quoted_price: request.quoted_price != null ? String(request.quoted_price) : '',
    staff_notes: request.staff_notes ?? '',
  }))
  const [errors, setErrors] = useState<FieldErrors<QuoteField>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)


  const set = (key: QuoteField, value: string) => setValues((v) => ({ ...v, [key]: value }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const result = validateQuote(values)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    setSaving(true)
    try {
      const rows = unwrap(
        await supabase
          .from('custom_cake_requests')
          .update({ status: values.status as CustomRequestStatus, ...result.value })
          .eq('id', request.id)
          .select('id'),
      )
      if (rows.length === 0) throw new PermissionError()
      toast.success(`Request #${request.request_number} saved`)
      onSaved()
    } catch (err) {
      setFormError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="Status & quotation">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Status">
          {(p) => (
            <select {...p} value={values.status} onChange={(e) => set('status', e.target.value)} className={inputClass()}>
              {requestStatuses.map((s) => (
                <option key={s} value={s}>
                  {requestStatusMeta[s].label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Quoted price (₹)" error={errors.quoted_price} hint="Required once the request is quoted or confirmed.">
          {(p) => (
            <input
              {...p}
              inputMode="decimal"
              value={values.quoted_price}
              onChange={(e) => set('quoted_price', e.target.value)}
              placeholder="e.g. 2500"
              className={inputClass(!!errors.quoted_price)}
            />
          )}
        </Field>
        <Field label="Staff notes" error={errors.staff_notes} hint="Only visible to staff.">
          {(p) => (
            <textarea
              {...p}
              rows={4}
              value={values.staff_notes}
              onChange={(e) => set('staff_notes', e.target.value)}
              className={inputClass(!!errors.staff_notes)}
            />
          )}
        </Field>
        {formError && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
            {formError}
          </p>
        )}
        <Button type="submit" loading={saving}>
          Save
        </Button>
      </form>
    </Card>
  )
}
