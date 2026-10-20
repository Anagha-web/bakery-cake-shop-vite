import { Check, Phone } from 'lucide-react'
import { bakeryInfo, img } from '../data/products'

const perks = ['Any flavour, size or theme', 'Eggless & sugar-conscious options', 'Photo cakes & tiered designs']

export function CustomOrder() {
  return (
    <section id="custom" className="scroll-mt-20 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid overflow-hidden rounded-[2rem] bg-blush md:grid-cols-2">
          <img
            src={img('1535141192574-5d4897c12636', 1000)}
            alt="Two-tier white cake topped with fresh strawberries and blueberries"
            loading="lazy"
            width={800}
            height={700}
            className="h-64 w-full object-cover md:h-full"
          />
          <div className="p-8 sm:p-12">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-dark">Custom cakes</p>
            <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">Dream it. We&apos;ll bake it.</h2>
            <p className="mt-4 leading-relaxed text-cocoa-light">
              Birthdays, weddings, anniversaries or just because — share your idea and our pastry chefs will design
              a cake that&apos;s uniquely yours. Please order at least 48 hours in advance.
            </p>
            <ul className="mt-6 space-y-3">
              {perks.map((perk) => (
                <li key={perk} className="flex items-center gap-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-rose-dark">
                    <Check className="h-4 w-4" />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={bakeryInfo.phoneHref}
                className="inline-flex items-center gap-2 rounded-full bg-cocoa px-6 py-3 font-medium text-cream transition hover:bg-cocoa-light"
              >
                <Phone className="h-4 w-4" /> Call to discuss
              </a>
              <a
                href="#contact"
                className="inline-flex items-center rounded-full border-2 border-cocoa px-6 py-2.5 font-medium transition hover:bg-cocoa hover:text-cream"
              >
                Visit the shop
              </a>
            </div>
            <p className="mt-4 text-sm text-cocoa-light">Online custom-order form coming soon.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
