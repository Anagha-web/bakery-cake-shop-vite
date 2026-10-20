import { products, type Product } from '../data/products'
import { ProductCard } from './ProductCard'
import { SectionHeading } from './SectionHeading'

interface FeaturedProps {
  onAdd: (product: Product) => void
}

export function Featured({ onAdd }: FeaturedProps) {
  const featured = products.filter((p) => p.featured)

  return (
    <section id="featured" className="scroll-mt-20 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Bestsellers"
          title="Featured cakes"
          description="Our most-loved celebration cakes, baked to order and finished by hand."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={onAdd} />
          ))}
        </div>
      </div>
    </section>
  )
}
