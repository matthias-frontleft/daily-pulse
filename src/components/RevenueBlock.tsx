import type { PeriodTotals } from '../types'
import { fmtMoney, fmtPct } from '../lib/format'
import { Card, Delta, Pill, SectionLabel } from './ui'

/** Gross sales → discounts → returns → Net revenue → COGS → Gross profit. */
export function RevenueBlock({ cur, base }: { cur: PeriodTotals; base: PeriodTotals }) {
  const pc = (a: number, b: number) => (b ? (a - b) / b : null)
  const partial = cur.missingCogsProductCount > 0

  const Line = ({
    label,
    value,
    sign,
    strong,
    deltaChange,
    polarity = 'good',
    indent,
  }: {
    label: string
    value: number
    sign?: '−' | '+'
    strong?: boolean
    deltaChange?: number | null
    polarity?: 'good' | 'bad' | 'neutral'
    indent?: boolean
  }) => (
    <div
      className={`flex items-baseline justify-between gap-3 py-1.5 ${
        strong ? 'border-t border-hairline pt-2.5' : ''
      }`}
    >
      <span
        className={`text-[13px] ${indent ? 'pl-3 text-ink-faint' : 'text-ink-soft'} ${
          strong ? '!text-ink font-semibold' : ''
        }`}
      >
        {label}
      </span>
      <span className="flex items-baseline gap-3">
        {deltaChange !== undefined && (
          <span className="text-[11.5px]">
            <Delta change={deltaChange} polarity={polarity} />
          </span>
        )}
        <span
          className={`tnum tabular-nums ${strong ? 'text-[16px] font-bold text-ink' : 'text-[14px] text-ink-soft'}`}
        >
          {sign === '−' ? '−' : ''}
          {fmtMoney(Math.abs(value), 0)}
        </span>
      </span>
    </div>
  )

  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center justify-between">
        <SectionLabel>Revenue → Gross profit</SectionLabel>
        <Pill tone="accent" title="Sourced from Shopify order and product-cost data">
          Shopify
        </Pill>
      </div>

      <Line label="Gross sales" value={cur.grossSales} deltaChange={pc(cur.grossSales, base.grossSales)} />
      <Line label="less Discounts" value={cur.discounts} sign="−" indent polarity="neutral" />
      <Line label="less Returns" value={cur.returns} sign="−" indent polarity="neutral" />
      <Line
        label="Net revenue"
        value={cur.netRevenue}
        strong
        deltaChange={pc(cur.netRevenue, base.netRevenue)}
      />
      <Line
        label={`less COGS${partial ? ' (partial)' : ''}`}
        value={cur.cogs}
        sign="−"
        indent
        polarity="neutral"
      />
      <Line
        label="Gross profit"
        value={cur.grossProfit}
        strong
        deltaChange={pc(cur.grossProfit, base.grossProfit)}
      />

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[12px] text-ink-faint">Gross margin</span>
        <span className="tnum text-[13px] font-semibold text-ink-soft">
          {fmtPct(cur.grossMargin)}
        </span>
      </div>

      {partial && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2">
          <span className="text-[13px] leading-none">⚠</span>
          <p className="text-[11.5px] leading-snug text-orange-800">
            <span className="font-semibold">Gross profit is partial.</span> COGS is missing on{' '}
            {cur.missingCogsProductCount} product
            {cur.missingCogsProductCount > 1 ? 's' : ''} that sold this period — their cost counts as
            zero, so gross profit and margin are overstated. Add unit costs in Shopify to fix.
          </p>
        </div>
      )}
    </Card>
  )
}
