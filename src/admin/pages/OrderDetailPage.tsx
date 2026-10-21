import { Mail, MapPin, Phone } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import type { Order, OrderItem, OrderStatus, OrderStatusEvent, PaymentStatus } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth-context'
import { errorMessage, PermissionError } from '../lib/errors'
import {
  formatDateTime,
  formatMoney,
  fulfillmentLabel,
  orderStatuses,
  orderStatusMeta,
  paymentStatuses,
  paymentStatusMeta,
  telHref,
} from '../lib/format'
import { unwrap, useAsync } from '../lib/useAsync'
import { useToast } from '../toast-context'
import { Badge, Button, Card, Detail, ErrorState, Field, LoadingState, Modal, PageHeader } from '../ui'
import { inputClass } from '../ui-classes'

type OrderWithDetails = Order & { order_items: OrderItem[]; order_status_events: OrderStatusEvent[] }

async function loadOrder(id: string): Promise<OrderWithDetails | null> {
  // An id that isn't a UUID can never match; skip the round trip.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  return unwrap(
    await supabase
      .from('orders')
      .select('*, order_items(*), order_status_events(*)')
      .eq('id', id)
      .order('created_at', { referencedTable: 'order_items' })
      .order('changed_at', { referencedTable: 'order_status_events', ascending: false })
      .maybeSingle(),
  )
}

export function OrderDetailPage() {
  const { id = '' } = useParams()
  const { status, data, error, reload } = useAsync(() => loadOrder(id), [id])

  if (status === 'loading' && !data) return <LoadingState label="Loading order" />
  if (status === 'error' && !data) return <ErrorState message={error} onRetry={reload} />
  if (!data) {
    return (
      <>
        <PageHeader title="Order not found" back={{ to: '/admin/orders', label: 'All orders' }} />
        <ErrorState message="This order doesn't exist, or you don't have access to it." />
      </>
    )
  }
  return <OrderView order={data} onChanged={reload} />
}

function OrderView({ order, onChanged }: { order: OrderWithDetails; onChanged: () => void }) {
  return (
    <>
      <PageHeader
        back={{ to: '/admin/orders', label: 'All orders' }}
        title={`Order #${order.order_number}`}
        description={`Placed ${formatDateTime(order.created_at)}`}
        actions={
          <span className="flex gap-1">
            <Badge tone={orderStatusMeta[order.status].tone}>{orderStatusMeta[order.status].label}</Badge>
            <Badge tone={paymentStatusMeta[order.payment_status].tone}>{paymentStatusMeta[order.payment_status].label}</Badge>
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Items">
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-sm">
                <thead className="text-left text-cocoa-light">
                  <tr>
                    <th scope="col" className="px-5 py-2 font-medium">Product</th>
                    <th scope="col" className="px-5 py-2 text-right font-medium">Price</th>
                    <th scope="col" className="px-5 py-2 text-right font-medium">Qty</th>
                    <th scope="col" className="px-5 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cocoa/10">
                  {order.order_items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-3">
                        <span className="block font-medium">{item.product_name}</span>
                        <span className="text-xs text-cocoa-light">{item.unit}</span>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">{formatMoney(item.unit_price)}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{item.quantity}</td>
                      <td className="px-5 py-3 text-right font-medium tabular-nums">{formatMoney(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-cocoa/15">
                    <th scope="row" colSpan={3} className="px-5 py-3 text-right font-semibold">
                      Subtotal
                    </th>
                    <td className="px-5 py-3 text-right text-base font-bold tabular-nums">{formatMoney(order.subtotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="mt-3 text-xs text-cocoa-light">Prices are as charged when the order was placed.</p>
          </Card>

          <Card title="Fulfilment">
            <dl className="divide-y divide-cocoa/10">
              <Detail label="Method">{fulfillmentLabel[order.fulfillment_type]}</Detail>
              <Detail label="Requested for">{order.requested_for ? formatDateTime(order.requested_for) : 'As soon as possible'}</Detail>
              {order.fulfillment_type === 'delivery' && (
                <Detail label="Delivery address">
                  <span className="flex gap-2 whitespace-pre-line">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cocoa-light" aria-hidden="true" />
                    {order.delivery_address}
                  </span>
                </Detail>
              )}
              <Detail label="Customer notes">{order.notes ? <span className="whitespace-pre-line">{order.notes}</span> : '—'}</Detail>
            </dl>
          </Card>

          <Card title="History">
            <ol className="space-y-3">
              {order.order_status_events.map((ev) => (
                <HistoryItem key={ev.id} event={ev} />
              ))}
            </ol>
            {order.order_status_events.length === 0 && <p className="text-sm text-cocoa-light">No history recorded.</p>}
          </Card>
        </div>

        <div className="space-y-6">
          {/* Remounts (resetting the form) whenever the saved order changes. */}
          <StatusPanel key={order.updated_at} order={order} onChanged={onChanged} />
          <Card title="Customer">
            <p className="font-semibold">{order.customer_name}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href={telHref(order.customer_phone)} className="inline-flex items-center gap-2 text-rose-dark underline">
                  <Phone className="h-4 w-4" aria-hidden="true" /> {order.customer_phone}
                </a>
              </li>
              {order.customer_email && (
                <li>
                  <a href={`mailto:${order.customer_email}`} className="inline-flex items-center gap-2 break-all text-rose-dark underline">
                    <Mail className="h-4 w-4 shrink-0" aria-hidden="true" /> {order.customer_email}
                  </a>
                </li>
              )}
            </ul>
            <Link to={`/admin/customers/${order.customer_phone_key}`} className="mt-4 inline-block text-sm font-medium underline">
              View customer history
            </Link>
          </Card>
        </div>
      </div>
    </>
  )
}

function HistoryItem({ event }: { event: OrderStatusEvent }) {
  const { userId } = useAuth()
  const who = event.changed_by === null ? 'Website' : event.changed_by === userId ? 'You' : 'Staff'
  return (
    <li className="flex gap-3 text-sm">
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-dark" aria-hidden="true" />
      <div>
        <p className="flex flex-wrap gap-1">
          <Badge tone={orderStatusMeta[event.status].tone}>{orderStatusMeta[event.status].label}</Badge>
          <Badge tone={paymentStatusMeta[event.payment_status].tone}>{paymentStatusMeta[event.payment_status].label}</Badge>
        </p>
        <p className="mt-1 text-xs text-cocoa-light">
          {formatDateTime(event.changed_at)} · {who}
        </p>
      </div>
    </li>
  )
}

function StatusPanel({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const toast = useToast()
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [payment, setPayment] = useState<PaymentStatus>(order.payment_status)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = status !== order.status || payment !== order.payment_status

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const rows = unwrap(
        await supabase.from('orders').update({ status, payment_status: payment }).eq('id', order.id).select('id'),
      )
      // RLS turns a forbidden update into "0 rows updated" rather than an error.
      if (rows.length === 0) throw new PermissionError()
      toast.success(`Order #${order.order_number} updated`)
      setConfirming(false)
      onChanged()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const needsConfirm = (status === 'cancelled' && order.status !== 'cancelled') || (payment === 'refunded' && order.payment_status !== 'refunded')

  return (
    <Card title="Update order">
      <div className="space-y-4">
        <Field label="Order status">
          {(p) => (
            <select {...p} value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className={inputClass()}>
              {orderStatuses.map((s) => (
                <option key={s} value={s}>
                  {orderStatusMeta[s].label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Payment status" hint="No online payments yet: mark as paid when cash or UPI is received.">
          {(p) => (
            <select {...p} value={payment} onChange={(e) => setPayment(e.target.value as PaymentStatus)} className={inputClass()}>
              {paymentStatuses.map((s) => (
                <option key={s} value={s}>
                  {paymentStatusMeta[s].label}
                </option>
              ))}
            </select>
          )}
        </Field>
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Button disabled={!dirty} loading={saving && !confirming} onClick={() => (needsConfirm ? setConfirming(true) : save())}>
            Save changes
          </Button>
          {dirty && (
            <Button
              variant="ghost"
              onClick={() => {
                setStatus(order.status)
                setPayment(order.payment_status)
                setError(null)
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      <Modal
        title="Confirm change"
        open={confirming}
        onClose={() => setConfirming(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Go back
            </Button>
            <Button variant="danger" loading={saving} onClick={save}>
              Yes, save
            </Button>
          </>
        }
      >
        <p className="text-sm">
          You are about to mark order #{order.order_number} as{' '}
          <strong>{[status !== order.status && orderStatusMeta[status].label, payment !== order.payment_status && paymentStatusMeta[payment].label].filter(Boolean).join(' and ')}</strong>.
          Make sure the customer has been told.
        </p>
        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
      </Modal>
    </Card>
  )
}
