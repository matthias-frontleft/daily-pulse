import type { PeriodTotals } from '../types'
import { fmtMoney, fmtPct } from '../lib/format'
import { Card, Delta, Pill, SectionLabel } from './ui'

/** Gross sales → discounts → returns → Net revenue → COGS → Gross profit. */
export function RevenueBlock({ cur, base }: { cur: PeriodTotals; base: PeriodTotals | null }) {
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
      className={`flex items-baseline justify-between gap-3 py-2 ${
        strong ? 'border-t border-hairline pt-3' : ''
      }`}
    >
      <span
        className={`${indent ? 'pl-3 text-[13px] text-ink-faint' : 'text-[14px] text-ink-soft'} ${
          strong ? '!text-[15px] !text-ink font-bold' : ''
        }`}
      >
        {label}
      </span>
      <span className="flex items-baseline gap-3">
        {base && deltaChange !== undefined && <Delta change={deltaChange} polarity={polarity} />}
        <span
          className={`tnum ${strong ? 'text-[18px] font-bold text-ink' : 'text-[15px] text-ink-soft'}`}
        >
          {sign === '−' ? '−' : ''}
          {fmtMoney(Math.abs(value), 0)}
        </span>
      </span>
    </div>
  )

  return (
    <Card className="p-6">
      <div className="mb-1 flex items-center justify-between">
        <SectionLabel>Revenue → Gross profit</SectionLabel>
        <Pill tone="accent" title="Sourced from Shopify order and product-cost data">
          Shopify
        </Pill>
      </div>

      <Line label="Gross sales" value={cur.grossSales} deltaChange={base ? pc(cur.grossSales, base.grossSales) : undefined} />
      <Line label="less Discounts" value={cur.discounts} sign="−" indent polarity="neutral" />
      <Line label="less Returns" value={cur.returns} sign="−" indent polarity="neutral" />
      <Line
        label="Net revenue"
        value={cur.netRevenue}
        strong
        deltaChange={base ? pc(cur.netRevenue, base.netRevenue) : undefined}
      />
      <Line label={`less COGS${partial ? ' (partial)' : ''}`} value={cur.cogs} sign="−" indent polarity="neutral" />
      <Line
        label="Gross profit"
        value={cur.grossProfit}
        strong
        deltaChange={base ? pc(cur.grossProfit, base.grossProfit) : undefined}
      />

      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[13px] text-ink-faint">Gross margin</span>
        <span className="tnum text-[14px] font-bold text-ink-soft">{fmtPct(cur.grossMargin)}</span>
      </div>

      {partial && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-3">
          <span className="text-[15px] leading-none">⚠</span>
          <p className="text-[12.5px] leading-snug text-orange-800">
            <span className="font-bold">Gross profit is partial.</span> COGS is missing on{' '}
            {cur.missingCogsProductCount} product
            {cur.missingCogsProductCount > 1 ? 's' : ''} that sold this period — their cost counts as
            zero, so gross profit and margin are overstated. Add unit costs in Shopify to fix.
          </p>
        </div>
      )}
    </Card>
  )
}
