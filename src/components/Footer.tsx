import { bakeryInfo, navLinks } from '../data/products'

const year = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="bg-cocoa text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-serif text-2xl font-semibold">Sweet Crumbs Bakery</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/70">
            Handcrafted cakes, pastries and breads, baked fresh every day.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="font-semibold">Explore</p>
          <ul className="mt-3 space-y-2 text-sm text-cream/70">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="hover:text-blush">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="text-sm text-cream/70">
          <p className="font-semibold text-cream">Get in touch</p>
          <p className="mt-3">{bakeryInfo.address}</p>
          <p className="mt-2">
            <a href={bakeryInfo.phoneHref} className="hover:text-blush">
              {bakeryInfo.phone}
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-cream/10 py-6 text-center text-xs text-cream/60">
        © {year} Sweet Crumbs Bakery. All rights reserved.
      </div>
    </footer>
  )
}
