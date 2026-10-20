import { ArrowRight, Star } from 'lucide-react'
import { img } from '../data/products'

interface HeroProps {
  onShopCakes: () => void
}

export function Hero({ onShopCakes }: HeroProps) {
  return (
    <section id="home" className="scroll-mt-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-24">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-blush px-4 py-1.5 text-sm font-medium text-rose-dark">
            <Star className="h-4 w-4 fill-current" /> Freshly baked every morning
          </p>
          <h1 className="font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Handcrafted cakes for life&apos;s <span className="italic text-rose-dark">sweetest</span> moments
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-cocoa-light">
            From birthday showstoppers to buttery croissants, every bake at Sweet Crumbs is made by hand with
            premium ingredients and a lot of love.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={onShopCakes}
              className="inline-flex items-center gap-2 rounded-full bg-cocoa px-7 py-3.5 font-medium text-cream shadow-lg shadow-cocoa/20 transition hover:-translate-y-0.5 hover:bg-cocoa-light"
            >
              Shop Cakes <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#custom"
              className="inline-flex items-center rounded-full border-2 border-cocoa px-7 py-3 font-medium transition hover:bg-cocoa hover:text-cream"
            >
              Custom Order
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 -z-10 rotate-3 rounded-[2.5rem] bg-blush" aria-hidden="true" />
          <img
            src={img('1586985289688-ca3cf47d3e6e', 1000)}
            alt="Baker piping cream onto a layered chocolate ombré cake"
            className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-xl"
            width={800}
            height={1000}
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  )
}
