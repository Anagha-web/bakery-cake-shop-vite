import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AdminErrorBoundary } from './AdminErrorBoundary.tsx'

// The admin CRM is a separate bundle, loaded only on /admin pages, so the
// customer site stays as small as before.
const AdminApp = lazy(() => import('./admin/AdminApp.tsx'))
const isAdmin = /^\/admin(\/|$)/.test(window.location.pathname)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdmin ? (
      <AdminErrorBoundary>
        <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-cocoa-light">Loading admin…</div>}>
          <AdminApp />
        </Suspense>
      </AdminErrorBoundary>
    ) : (
      <App />
    )}
  </StrictMode>,
)
