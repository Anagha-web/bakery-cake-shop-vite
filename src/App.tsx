import { useCallback, useEffect, useState } from 'react'
import { About } from './components/About'
import { CartDrawer, type CartLine } from './components/CartDrawer'
import { Categories } from './components/Categories'
import { Contact } from './components/Contact'
import { CustomOrder } from './components/CustomOrder'
import { Featured } from './components/Featured'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { ProductMenu } from './components/ProductMenu'
import type { Category, Product } from './data/products'

export default function App() {
  const [filter, setFilter] = useState<Category | 'All'>('All')
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // The browser tries to jump to a #section before React has rendered it, so a
  // shared link like /#contact would otherwise open at the top of the page.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2500)
    return () => window.clearTimeout(timer)
  }, [toast])

  const showCategory = (category: Category) => {
    setFilter(category)
    document.getElementById('menu')?.scrollIntoView()
  }

  const addToCart = (product: Product) => {
    setCart((lines) =>
      lines.some((l) => l.product.id === product.id)
        ? lines.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l))
        : [...lines, { product, quantity: 1 }],
    )
    setToast(`${product.name} added to cart`)
  }

  const changeQuantity = (productId: string, delta: number) => {
    setCart((lines) =>
      lines
        .map((l) => (l.product.id === productId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    )
  }

  const closeCart = useCallback(() => setCartOpen(false), [])
  const cartCount = cart.reduce((sum, l) => sum + l.quantity, 0)

  return (
    <>
      <Header cartCount={cartCount} onCartClick={() => setCartOpen(true)} />
      <main>
        <Hero onShopCakes={() => showCategory('Cakes')} />
        <Categories onSelect={showCategory} />
        <Featured onAdd={addToCart} />
        <ProductMenu filter={filter} onFilterChange={setFilter} onAdd={addToCart} />
        <CustomOrder />
        <About />
        <Contact />
      </main>
      <Footer />
      <CartDrawer open={cartOpen} lines={cart} onClose={closeCart} onChangeQuantity={changeQuantity} />
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast && (
          <p className="rounded-full bg-cocoa px-5 py-3 text-sm font-medium text-cream shadow-lg">{toast}</p>
        )}
      </div>
    </>
  )
}
