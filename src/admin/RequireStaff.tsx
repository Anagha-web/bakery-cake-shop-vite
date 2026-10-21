import { ShieldAlert } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from './auth-context'
import { Button, Spinner } from './ui'

export function FullPageSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-cream">
      <Spinner label={label} />
    </div>
  )
}

/** Renders children only for an active staff member; everyone else is sent to sign in or told why not. */
export function RequireStaff({ children }: { children: ReactNode }) {
  const { state, staff, signOut } = useAuth()
  const location = useLocation()
  const [signingOut, setSigningOut] = useState(false)

  if (state.status === 'loading') return <FullPageSpinner label="Checking your account" />

  if (state.status === 'signed_out') {
    const next = location.pathname + location.search
    return <Navigate to={`/admin/login${next !== '/admin' ? `?next=${encodeURIComponent(next)}` : ''}`} replace />
  }

  if (!staff) {
    const reason = state.staffError
      ? `We couldn't check your staff access: ${state.staffError}`
      : state.staff && !state.staff.is_active
        ? 'Your staff account has been deactivated. Ask the bakery owner to reactivate it.'
        : `${state.session.user.email ?? 'This account'} is signed in but is not set up as bakery staff. Ask the bakery owner to add you.`
    return (
      <div className="grid min-h-screen place-items-center bg-cream px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-10 w-10 text-rose-dark" aria-hidden="true" />
          <h1 className="mt-4 font-serif text-2xl font-bold">No admin access</h1>
          <p className="mt-2 text-sm text-cocoa-light">{reason}</p>
          <Button
            className="mt-6"
            loading={signingOut}
            onClick={async () => {
              setSigningOut(true)
              try {
                await signOut()
              } finally {
                setSigningOut(false)
              }
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
