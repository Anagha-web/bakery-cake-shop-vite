import { useState } from 'react'
import { niceMax, type DailyPoint } from '../lib/dashboard'
import { formatMoney } from '../lib/format'

const dayLabel = new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', day: 'numeric', month: 'short' })
const fullDay = new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' })
const toDate = (d: string) => new Date(`${d}T00:00:00Z`)

/** Single-series bar chart: order value per day (cancelled orders excluded). */
export function DailyOrdersChart({ data }: { data: DailyPoint[] }) {
  const [active, setActive] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)))
  const labelled = new Set([0, Math.floor((data.length - 1) / 2), data.length - 1])

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-cocoa-light">Order value per day, last 14 days (excludes cancelled)</p>
        <button type="button" onClick={() => setShowTable((v) => !v)} className="shrink-0 whitespace-nowrap text-sm font-medium text-rose-dark underline">
          {showTable ? 'Show chart' : 'Show table'}
        </button>
      </div>

      {showTable ? (
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-cocoa-light">
              <tr>
                <th className="py-1.5 font-medium">Date</th>
                <th className="py-1.5 text-right font-medium">Orders</th>
                <th className="py-1.5 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cocoa/10">
              {data.map((d) => (
                <tr key={d.date}>
                  <td className="py-1.5">{fullDay.format(toDate(d.date))}</td>
                  <td className="py-1.5 text-right tabular-nums">{d.orders}</td>
                  <td className="py-1.5 text-right tabular-nums">{formatMoney(d.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative pl-14">
          {/* Recessive axis: top and baseline only */}
          <span className="absolute left-0 top-0 -translate-y-1/2 text-xs tabular-nums text-cocoa-light">{formatMoney(max)}</span>
          <span className="absolute bottom-6 left-0 translate-y-1/2 text-xs text-cocoa-light">₹0</span>
          <div className="relative h-48 border-b border-cocoa/30">
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-cocoa/10" aria-hidden="true" />
            <ul className="absolute inset-0 flex items-end gap-[3px]" aria-label="Order value per day">
              {data.map((d, i) => {
                const pct = (d.value / max) * 100
                const isActive = active === i
                return (
                  <li key={d.date} className="relative flex h-full flex-1 items-end">
                    <button
                      type="button"
                      className="flex h-full w-full items-end focus-visible:outline-2 focus-visible:outline-rose-dark"
                      onMouseEnter={() => setActive(i)}
                      onMouseLeave={() => setActive(null)}
                      onFocus={() => setActive(i)}
                      onBlur={() => setActive(null)}
                      aria-label={`${fullDay.format(toDate(d.date))}: ${d.orders} order${d.orders === 1 ? '' : 's'}, ${formatMoney(d.value)}`}
                    >
                      <span
                        className={`block w-full rounded-t-[4px] transition-colors ${d.value > 0 ? (isActive ? 'bg-cocoa' : 'bg-rose-dark') : 'bg-cocoa/15'}`}
                        style={{ height: d.value > 0 ? `max(${pct}%, 3px)` : '2px' }}
                      />
                    </button>
                    {isActive && (
                      <div
                        role="tooltip"
                        className={`pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg bg-cocoa px-3 py-2 text-xs text-cream shadow-lg ${
                          i < 3 ? 'left-0' : i > data.length - 4 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                        }`}
                      >
                        <p className="font-semibold">{fullDay.format(toDate(d.date))}</p>
                        <p className="tabular-nums">
                          {formatMoney(d.value)} · {d.orders} order{d.orders === 1 ? '' : 's'}
                        </p>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="relative mt-1.5 h-5 text-xs text-cocoa-light" aria-hidden="true">
            {data.map((d, i) =>
              labelled.has(i) ? (
                <span
                  key={d.date}
                  className="absolute whitespace-nowrap"
                  style={
                    i === 0
                      ? { left: 0 }
                      : i === data.length - 1
                        ? { right: 0 }
                        : { left: `${((i + 0.5) / data.length) * 100}%`, transform: 'translateX(-50%)' }
                  }
                >
                  {dayLabel.format(toDate(d.date))}
                </span>
              ) : null,
            )}
          </div>
        </div>
      )}
    </div>
  )
}
