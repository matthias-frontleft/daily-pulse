import type { PeriodTotals } from '../types'
import { fmtInt, fmtMoney, fmtPct } from '../lib/format'
import { Arrow, Card, Delta } from './ui'

/** The spine as four headline tiles: Sessions · Conversion · AOV · Orders. */
export function MetricRow({ cur, base }: { cur: PeriodTotals; base: PeriodTotals }) {
  const pc = (a: number, b: number) => (b ? (a - b) / b : null)
  const tiles = [
    { label: 'Sessions', value: fmtInt(cur.sessions), change: pc(cur.sessions, base.sessions) },
    {
      label: 'Conversion rate',
      value: fmtPct(cur.conversionRate, 2),
      change: pc(cur.conversionRate, base.conversionRate),
    },
    { label: 'AOV', value: fmtMoney(cur.aov, 2), change: pc(cur.aov, base.aov) },
    { label: 'Orders', value: fmtInt(cur.orders), change: pc(cur.orders, base.orders) },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <Card key={t.label} className="p-4">
          <div className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            {t.label}
          </div>
          <div className="mt-2 tnum text-[26px] font-bold leading-none text-ink">{t.value}</div>
          <div className="mt-2 flex items-center gap-1 text-[12.5px] font-medium">
            <Arrow change={t.change} />
            <Delta change={t.change} />
            <span className="text-ink-faint">vs baseline</span>
          </div>
        </Card>
      ))}
    </div>
  )
}
