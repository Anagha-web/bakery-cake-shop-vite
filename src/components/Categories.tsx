import { categories, type Category } from '../data/products'
import { SectionHeading } from './SectionHeading'

interface CategoriesProps {
  onSelect: (category: Category) => void
}

export function Categories({ onSelect }: CategoriesProps) {
  return (
    <section className="bg-cream-dark/60 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Browse" title="Shop by category" />
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <li key={c.name}>
              <button
                type="button"
                onClick={() => onSelect(c.name)}
                className="group w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <img
                  src={c.image}
                  alt=""
                  loading="lazy"
                  width={400}
                  height={300}
                  className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="block p-4">
                  <span className="block font-serif text-lg font-semibold">{c.name}</span>
                  <span className="text-sm text-cocoa-light">{c.tagline}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
