import { Menu, ShoppingBag, X } from 'lucide-react'
import { useState } from 'react'
import { navLinks } from '../data/products'

interface HeaderProps {
  cartCount: number
  onCartClick: () => void
}

export function Header({ cartCount, onCartClick }: HeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-cocoa/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 md:h-20">
        <a href="#home" className="flex min-w-0 shrink items-center" aria-label="Sweet Crumbs Bakery home">
          <img
            src="/brand/sweet-crumbs-logo-horizontal.svg"
            alt="Sweet Crumbs Bakery logo"
            width={825}
            height={200}
            className="h-11 w-auto max-w-full object-contain sm:h-12 md:h-14"
          />
        </a>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-8 text-sm font-medium">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="transition-colors hover:text-rose-dark">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCartClick}
            className="relative grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-blush"
            aria-label={`Open cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-dark px-1 text-[11px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-blush md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-cocoa/10 bg-cream md:hidden">
          <ul className="flex flex-col px-4 py-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 font-medium hover:bg-blush"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
