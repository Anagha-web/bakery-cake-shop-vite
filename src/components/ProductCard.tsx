import { Plus } from 'lucide-react'
import { formatINR, type Product } from '../data/products'

interface ProductCardProps {
  product: Product
  onAdd: (product: Product) => void
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm transition hover:shadow-xl">
      <div className="relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={800}
          height={600}
          className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full bg-cream/90 px-3 py-1 text-xs font-semibold">
          {product.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-xl font-semibold">{product.name}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-cocoa-light">{product.description}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <p>
            <span className="text-xl font-semibold">{formatINR(product.price)}</span>
            <span className="ml-1 text-sm text-cocoa-light">/ {product.unit}</span>
          </p>
          <button
            type="button"
            onClick={() => onAdd(product)}
            className="inline-flex items-center gap-1 rounded-full bg-blush px-4 py-2 text-sm font-semibold text-rose-dark transition hover:bg-rose hover:text-white"
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>
    </article>
  )
}
