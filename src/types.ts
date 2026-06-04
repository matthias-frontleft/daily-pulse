// ───────────────────────────────────────────────────────────────────────────
// Domain types for Daily Pulse.
// Everything here is Shopify-shaped: it models only data a Shopify store already
// has (sessions, orders, sales, per-product cost, referrer source, landing page).
// No GA4, no marketing attribution, no other channels.
// ───────────────────────────────────────────────────────────────────────────

export interface Product {
  id: string
  title: string
  /** Net selling price per unit, £. */
  price: number
  /**
   * Per-unit cost of goods, from Shopify's product cost field. `null` means the
   * merchant never filled it in — we must flag gross profit as partial.
   */
  unitCost: number | null
}

/** A product's contribution within a single day. */
export interface DayProduct {
  id: string
  units: number
  /** Net revenue attributed to this product that day, £. */
  netRevenue: number
}

/** One day of store performance. The atomic unit; everything aggregates from these. */
export interface DailyRecord {
  /** ISO date, YYYY-MM-DD (store-local). */
  date: string
  sessions: number
  orders: number
  grossSales: number
  discounts: number
  returns: number
  /** grossSales − discounts − returns. */
  netRevenue: number
  /** Σ units × unitCost over products that HAVE a cost. Products with null cost contribute nothing. */
  cogs: number
  products: DayProduct[]
  /** Sessions split by Shopify referrer source. Keys are referrer names. */
  referrers: Record<string, number>
  /** True for a not-yet-complete day (today). */
  partial?: boolean
}

// ── Period & comparison model ───────────────────────────────────────────────

export type PeriodKey =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last28'
  | 'mtd'
  | 'custom'

export type CompareKey =
  | 'prev' // immediately preceding period of equal length
  | 'lastMonth' // same dates, one month earlier
  | 'lastYear' // same dates, one year earlier
  | 'baseline' // trailing-28-day, SAME WEEKDAY (the default)
  | string // a pinned custom baseline id

/** A resolved date window, inclusive of both ends. */
export interface DateRange {
  start: string
  end: string
  /** Human label, e.g. "Yesterday" or "1–28 May". */
  label: string
}

/** A user-saved baseline window they can compare against repeatedly. */
export interface PinnedBaseline {
  id: string
  name: string
  range: DateRange
}

/** Aggregated metrics over a date window. The spine lives here. */
export interface PeriodTotals {
  range: DateRange
  sessions: number
  orders: number
  grossSales: number
  discounts: number
  returns: number
  netRevenue: number
  cogs: number
  /** netRevenue − cogs (over products with known cost). */
  grossProfit: number
  /** grossProfit / netRevenue. */
  grossMargin: number
  /** orders / sessions. */
  conversionRate: number
  /** netRevenue / orders — the spine's AOV, so sessions × CR × AOV ≡ netRevenue. */
  aov: number
  /** Distinct products with a missing unit cost that sold in this window. */
  missingCogsProductCount: number
  productNames: Record<string, string>
  productRevenue: Record<string, { units: number; netRevenue: number }>
  referrers: Record<string, number>
}

/** A single metric's value paired with its % change vs the comparison period. */
export interface MetricDelta {
  value: number
  /** Fractional change, e.g. -0.17 for −17%. null when the baseline is zero/absent. */
  change: number | null
}

/** Which of the three multiplicative levers dominates a revenue move. */
export type Lever = 'traffic' | 'conversion' | 'basket'

/** The diagnostic-spine decomposition of a revenue change. */
export interface SpineDecomposition {
  revenueChange: number | null
  sessionsChange: number | null
  crChange: number | null
  aovChange: number | null
  /** The lever with the largest |change| — the headline story. */
  dominant: Lever
  /** Plain-English one-liner, e.g. "Revenue −15% — driven by traffic …". */
  headline: string
  /** Short label for the dominant lever, e.g. "Traffic problem". */
  tag: string
}
