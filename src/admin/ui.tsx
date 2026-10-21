import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2, RotateCw, X } from 'lucide-react'
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactElement, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { Tone } from './lib/format'
import { buttonClass, inputClass, type ButtonVariant } from './ui-classes'

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading, disabled, className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${buttonClass(variant, size)} ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Form fields
// ---------------------------------------------------------------------------

type FieldProps = {
  label: string
  error?: string
  hint?: ReactNode
  required?: boolean
  className?: string
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactElement
}

/** Label + control + hint/error, with the ARIA wiring done for you. */
export function Field({ label, error, hint, required, className = '', children }: FieldProps) {
  const id = useId()
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="text-rose-dark"> *</span>}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-cocoa-light">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-dark disabled:opacity-60 ${
          checked ? 'bg-emerald-600' : 'bg-cocoa/25'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'left-[22px]' : 'left-0.5'}`}
        />
      </button>
      <label htmlFor={id} className="cursor-pointer text-sm">
        <span className="font-medium">{label}</span>
        {description && <span className="block text-xs text-cocoa-light">{description}</span>}
      </label>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Layout pieces
// ---------------------------------------------------------------------------

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  back?: { to: string; label: string }
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link to={back.to} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-cocoa-light hover:text-cocoa">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-bold sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-cocoa-light">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export function Card({ title, actions, children, className = '' }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-cocoa/10 bg-white p-5 shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-stone-100 text-stone-700 ring-stone-300',
  info: 'bg-sky-50 text-sky-800 ring-sky-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  danger: 'bg-red-50 text-red-800 ring-red-200',
  accent: 'bg-blush text-rose-dark ring-rose/40',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${toneClasses[tone]}`}>
      {children}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Loading / empty / error states
// ---------------------------------------------------------------------------

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-cocoa-light">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      {label}…
    </span>
  )
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-cocoa/10 bg-white px-6 py-16">
      <Spinner label={label} />
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <AlertTriangle className="h-8 w-8 text-red-600" aria-hidden="true" />
      <p className="max-w-md text-sm text-red-800">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RotateCw className="h-4 w-4" aria-hidden="true" /> Try again
        </Button>
      )}
    </div>
  )
}

export function EmptyState({ title, body, action, icon }: { title: string; body?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-cocoa/20 bg-white px-6 py-14 text-center">
      <span className="text-cocoa-light">{icon ?? <Inbox className="h-8 w-8" aria-hidden="true" />}</span>
      <p className="font-semibold">{title}</p>
      {body && <p className="max-w-md text-sm text-cocoa-light">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Small inline banner, e.g. a load error above data that is still shown. */
export function InlineAlert({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return (
    <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <span>{children}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="font-semibold underline">
          Try again
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3 text-sm">
      <p className="text-cocoa-light">
        {from}–{to} of {total}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export function Modal({
  title,
  open,
  onClose,
  children,
  footer,
}: {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  // Callers usually pass an inline onClose; keep the latest without re-running
  // the effect (which would steal focus on every render).
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    const firstField = panel.current?.querySelector<HTMLElement>('[data-modal-body] :is(input, select, textarea)')
    ;(firstField ?? panel.current?.querySelector<HTMLElement>('button'))?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus()
    }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-cocoa/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-cream shadow-2xl sm:max-w-lg sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-cocoa/10 px-5 py-4">
          <h2 id={titleId} className="font-serif text-xl font-semibold">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-blush" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div data-modal-body className="overflow-y-auto px-5 py-5">
          {children}
        </div>
        {footer && <div className="flex justify-end gap-2 border-t border-cocoa/10 px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}

/** Description list row used on detail pages. */
export function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm text-cocoa-light">{label}</dt>
      <dd className="mt-0.5 text-sm sm:col-span-2 sm:mt-0">{children ?? '—'}</dd>
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={label}
      className={`${inputClass()} sm:max-w-xs`}
    />
  )
}
