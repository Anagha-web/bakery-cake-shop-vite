import { LockKeyhole } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { useAuth } from '../auth-context'
import { errorMessage } from '../lib/errors'
import { validateLogin } from '../lib/validation'
import { FullPageSpinner } from '../RequireStaff'
import { Button, Field } from '../ui'
import { inputClass } from '../ui-classes'

/** Only allow redirects to admin pages, never to another site. */
const safeNext = (next: string | null) => (next && /^\/admin(\/|$|\?)/.test(next) ? next : '/admin')

export function LoginPage() {
  const { state, signIn } = useAuth()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (state.status === 'loading' && !submitting) return <FullPageSpinner label="Checking your account" />
  if (state.status === 'signed_in') return <Navigate to={safeNext(params.get('next'))} replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const found = validateLogin(email, password)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSubmitting(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setFormError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-cream px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blush font-serif text-xl font-bold text-rose-dark">SC</span>
          <h1 className="mt-4 font-serif text-3xl font-bold">Staff sign in</h1>
          <p className="mt-1 text-sm text-cocoa-light">Sweet Crumbs Bakery admin</p>
        </div>
        <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          {formError && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
              {formError}
            </p>
          )}
          <Field label="Email" error={errors.email}>
            {(p) => (
              <input
                {...p}
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass(!!errors.email)}
              />
            )}
          </Field>
          <Field label="Password" error={errors.password}>
            {(p) => (
              <input
                {...p}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass(!!errors.password)}
              />
            )}
          </Field>
          <Button type="submit" loading={submitting} className="w-full">
            <LockKeyhole className="h-4 w-4" aria-hidden="true" /> Sign in
          </Button>
          <p className="text-center text-xs text-cocoa-light">
            Staff accounts are created by the bakery owner. Forgotten your password? Ask the owner to reset it.
          </p>
        </form>
        <p className="mt-6 text-center text-sm">
          <a href="/" className="font-medium text-rose-dark underline">
            Back to the website
          </a>
        </p>
      </div>
    </div>
  )
}
