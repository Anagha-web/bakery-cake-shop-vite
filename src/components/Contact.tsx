import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { bakeryInfo } from '../data/products'
import { SectionHeading } from './SectionHeading'

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-20 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Visit us" title="Come say hello" description="Drop by for a coffee and a fresh bake." />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <MapPin className="h-6 w-6 text-rose-dark" />
            <h3 className="mt-4 font-serif text-xl font-semibold">Address</h3>
            <p className="mt-2 text-cocoa-light">{bakeryInfo.address}</p>
          </div>
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <Phone className="h-6 w-6 text-rose-dark" />
            <h3 className="mt-4 font-serif text-xl font-semibold">Phone &amp; email</h3>
            <p className="mt-2">
              <a href={bakeryInfo.phoneHref} className="text-cocoa-light hover:text-rose-dark">
                {bakeryInfo.phone}
              </a>
            </p>
            <p className="mt-1 flex items-center gap-2">
              <Mail className="h-4 w-4 text-cocoa-light" />
              <a href={`mailto:${bakeryInfo.email}`} className="text-cocoa-light hover:text-rose-dark">
                {bakeryInfo.email}
              </a>
            </p>
          </div>
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <Clock className="h-6 w-6 text-rose-dark" />
            <h3 className="mt-4 font-serif text-xl font-semibold">Opening hours</h3>
            <dl className="mt-2 space-y-1 text-cocoa-light">
              {bakeryInfo.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-4">
                  <dt>{h.days}</dt>
                  <dd className="font-medium text-cocoa">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
