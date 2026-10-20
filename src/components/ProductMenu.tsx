import { categories, products, type Category, type Product } from '../data/products'
import { ProductCard } from './ProductCard'
import { SectionHeading } from './SectionHeading'

interface ProductMenuProps {
  filter: Category | 'All'
  onFilterChange: (filter: Category | 'All') => void
  onAdd: (product: Product) => void
}

export function ProductMenu({ filter, onFilterChange, onAdd }: ProductMenuProps) {
  const visible = filter === 'All' ? products : products.filter((p) => p.category === filter)
  const filters: (Category | 'All')[] = ['All', ...categories.map((c) => c.name)]

  return (
    <section id="menu" className="scroll-mt-20 bg-cream-dark/60 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Our menu"
          title="Baked fresh, every day"
          description="Sample menu with indicative prices. Final prices are confirmed when you order."
        />
        <div className="mb-10 flex flex-wrap justify-center gap-2" role="group" aria-label="Filter by category">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFilterChange(f)}
              aria-pressed={filter === f}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                filter === f ? 'bg-cocoa text-cream' : 'bg-white hover:bg-blush'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={onAdd} />
          ))}
        </div>
      </div>
    </section>
  )
}
