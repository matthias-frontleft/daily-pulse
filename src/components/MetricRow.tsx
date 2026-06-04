import type { PeriodTotals } from '../types'
import { fmtInt, fmtMoney, fmtPct } from '../lib/format'
import { Card, Delta } from './ui'

/** The spine as four headline tiles: Sessions · Conversion · AOV · Orders. */
export function MetricRow({ cur, base }: { cur: PeriodTotals; base: PeriodTotals | null }) {
  const pc = (a: number, b: number) => (b ? (a - b) / b : null)
  const tiles = [
    { label: 'Sessions', value: fmtInt(cur.sessions), change: base ? pc(cur.sessions, base.sessions) : null },
    {
      label: 'Conversion rate',
      value: fmtPct(cur.conversionRate, 2),
      change: base ? pc(cur.conversionRate, base.conversionRate) : null,
    },
    { label: 'AOV', value: fmtMoney(cur.aov, 2), change: base ? pc(cur.aov, base.aov) : null },
    { label: 'Orders', value: fmtInt(cur.orders), change: base ? pc(cur.orders, base.orders) : null },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map((t) => (
        <Card key={t.label} className="p-5">
          <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
            {t.label}
          </div>
          <div className="mt-2.5 tnum text-[30px] font-bold leading-none text-ink">{t.value}</div>
          {base && (
            <div className="mt-3 flex items-center gap-1.5">
              <Delta change={t.change} chip />
              <span className="text-[12px] text-ink-faint">vs baseline</span>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
