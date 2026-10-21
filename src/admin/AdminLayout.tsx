import {
  CakeSlice,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  Tags,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useAuth } from './auth-context'
import { errorMessage } from './lib/errors'
import { useToast } from './toast-context'

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/custom-requests', label: 'Custom cakes', icon: CakeSlice },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/customers', label: 'Customers', icon: Users },
]

function Brand() {
  return (
    <span className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-blush font-serif font-bold text-rose-dark">SC</span>
      <span className="font-serif text-lg font-semibold leading-tight">
        Sweet Crumbs
        <span className="block font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-cocoa-light">Admin</span>
      </span>
    </span>
  )
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="space-y-1">
      {nav.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-cocoa text-cream' : 'hover:bg-blush'
              }`
            }
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

function AccountPanel() {
  const { staff, signOut } = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const handleSignOut = async () => {
    setBusy(true)
    try {
      await signOut()
    } catch (e) {
      toast.error(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 border-t border-cocoa/10 pt-4">
      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-blush"
      >
        <ExternalLink className="h-5 w-5" aria-hidden="true" /> View website
      </a>
      <div className="flex items-center justify-between gap-2 px-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{staff?.full_name}</p>
          <p className="text-xs capitalize text-cocoa-light">{staff?.role}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={busy}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-blush disabled:opacity-60"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export function AdminLayout() {
  // The drawer covers the page, so the only way to navigate while it is open
  // is through its own links, which close it (onNavigate).
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <div className="min-h-screen bg-cream lg:flex">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-cocoa/10 bg-white px-4 py-6 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="px-2">
          <Brand />
        </div>
        <nav aria-label="Admin" className="mt-8 flex-1 overflow-y-auto">
          <NavItems />
        </nav>
        <AccountPanel />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-cocoa/10 bg-white/95 px-4 backdrop-blur lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="grid h-11 w-11 place-items-center rounded-full hover:bg-blush"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="admin-mobile-nav"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-cocoa/40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <aside
            id="admin-mobile-nav"
            className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-white px-4 py-5 shadow-2xl"
          >
            <div className="flex items-center justify-between px-2">
              <Brand />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-blush"
                aria-label="Close menu"
                autoFocus
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Admin" className="mt-6 flex-1 overflow-y-auto">
              <NavItems onNavigate={() => setMenuOpen(false)} />
            </nav>
            <AccountPanel />
          </aside>
        </div>
      )}

      <main id="admin-main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
