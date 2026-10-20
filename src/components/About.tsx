import { Heart, Leaf, Truck, Wheat } from 'lucide-react'
import { img } from '../data/products'

const benefits = [
  { icon: Leaf, title: 'Premium ingredients', text: 'Real butter, Belgian chocolate and seasonal fruit.' },
  { icon: Wheat, title: 'Baked fresh daily', text: 'Small batches every morning — never frozen.' },
  { icon: Heart, title: 'Made with love', text: 'Every cake is finished by hand by our pastry chefs.' },
  { icon: Truck, title: 'Pay on delivery', text: 'Pay in store or when your order arrives.' },
]

export function About() {
  return (
    <section id="about" className="scroll-mt-20 bg-cream-dark/60 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 md:grid-cols-2">
        <img
          src={img('1517433670267-08bbd4be890f', 1000)}
          alt="Shelves of freshly baked breads and pastries in the bakery"
          loading="lazy"
          width={800}
          height={600}
          className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-lg"
        />
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-dark">Our story</p>
          <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">A neighbourhood bakery, baked with heart</h2>
          <p className="mt-4 leading-relaxed text-cocoa-light">
            Sweet Crumbs began in a tiny home kitchen with one family recipe for chocolate cake. Today we bake
            cakes, pastries, cookies and breads for our community — still by hand, still from scratch, and still
            with that same family recipe.
          </p>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {benefits.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blush text-rose-dark">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="text-sm text-cocoa-light">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
