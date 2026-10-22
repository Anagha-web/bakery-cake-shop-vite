import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { Fragment } from 'react'
import { bakeryInfo } from '../data/products'
import { SectionHeading } from './SectionHeading'

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-20 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Visit us" title="Come say hello" description="Drop by for a coffee and a fresh bake." />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="min-w-0 rounded-3xl bg-white p-6 shadow-sm sm:p-8 md:p-6 lg:p-8">
            <MapPin className="h-6 w-6 text-rose-dark" />
            <h3 className="mt-4 font-serif text-xl font-semibold">Address</h3>
            <p className="mt-2 text-cocoa-light">{bakeryInfo.address}</p>
          </div>
          <div className="min-w-0 rounded-3xl bg-white p-6 shadow-sm sm:p-8 md:p-6 lg:p-8">
            <Phone className="h-6 w-6 text-rose-dark" />
            <h3 className="mt-4 font-serif text-xl font-semibold">Phone &amp; email</h3>
            <p className="mt-2">
              <a href={bakeryInfo.phoneHref} className="text-cocoa-light hover:text-rose-dark">
                {bakeryInfo.phone}
              </a>
            </p>
            <p className="mt-1 flex items-start gap-2">
              <Mail className="mt-1 h-4 w-4 shrink-0 text-cocoa-light" />
              <a href={`mailto:${bakeryInfo.email}`} className="min-w-0 wrap-anywhere text-cocoa-light hover:text-rose-dark">
                {/* Let long addresses wrap after "@" or before a dot instead of mid-word. */}
                {bakeryInfo.email.split(/(?<=@)|(?=\.)/).map((part, i) => (
                  <Fragment key={i}>
                    {i > 0 && <wbr />}
                    {part}
                  </Fragment>
                ))}
              </a>
            </p>
          </div>
          <div className="min-w-0 rounded-3xl bg-white p-6 shadow-sm sm:p-8 md:p-6 lg:p-8">
            <Clock className="h-6 w-6 text-rose-dark" />
            <h3 className="mt-4 font-serif text-xl font-semibold">Opening hours</h3>
            <dl className="mt-2 space-y-2 text-cocoa-light">
              {bakeryInfo.hours.map((h) => (
                <div key={h.days}>
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
