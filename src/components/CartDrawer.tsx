import { Minus, Plus, ShoppingBag, X } from 'lucide-react'
import { useEffect } from 'react'
import { bakeryInfo, formatINR, type Product } from '../data/products'

export interface CartLine {
  product: Product
  quantity: number
}

interface CartDrawerProps {
  open: boolean
  lines: CartLine[]
  onClose: () => void
  onChangeQuantity: (productId: string, delta: number) => void
}

export function CartDrawer({ open, lines, onClose, onChangeQuantity }: CartDrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0)

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-cocoa/40" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-cocoa/10 p-5">
          <h2 id="cart-title" className="font-serif text-2xl font-semibold">
            Your cart
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-blush"
            aria-label="Close cart"
            autoFocus
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-cocoa-light">
            <ShoppingBag className="h-10 w-10" />
            <p>Your cart is empty.</p>
            <a href="#menu" onClick={onClose} className="font-semibold text-rose-dark underline">
              Browse the menu
            </a>
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-cocoa/10 overflow-y-auto px-5">
            {lines.map(({ product, quantity }) => (
              <li key={product.id} className="flex gap-4 py-4">
                <img src={product.image} alt="" className="h-20 w-20 rounded-xl object-cover" />
                <div className="flex flex-1 flex-col">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-cocoa-light">
                    {formatINR(product.price)} / {product.unit}
                  </p>
                  <div className="mt-auto flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onChangeQuantity(product.id, -1)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-white hover:bg-blush"
                      aria-label={`Remove one ${product.name}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center font-medium">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => onChangeQuantity(product.id, 1)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-white hover:bg-blush"
                      aria-label={`Add one more ${product.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="font-semibold">{formatINR(product.price * quantity)}</p>
              </li>
            ))}
          </ul>
        )}

        {lines.length > 0 && (
          <div className="border-t border-cocoa/10 p-5">
            <div className="flex justify-between text-lg font-semibold">
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <p className="mt-3 rounded-xl bg-blush p-3 text-sm">
              Online checkout is coming soon. To place this order now, call us — pay on delivery or in store.
            </p>
            <a
              href={bakeryInfo.phoneHref}
              className="mt-4 block rounded-full bg-cocoa py-3.5 text-center font-medium text-cream hover:bg-cocoa-light"
            >
              Call {bakeryInfo.phone} to order
            </a>
          </div>
        )}
      </aside>
    </div>
  )
}
