// ───────────────────────────────────────────────────────────────────────────
// Period resolution, aggregation, comparison baselines, and the diagnostic
// spine decomposition. This is pure data logic — no React, no formatting.
// ───────────────────────────────────────────────────────────────────────────

import type {
  CompareKey,
  DateRange,
  Lever,
  MetricDelta,
  PeriodKey,
  PeriodTotals,
  PinnedBaseline,
  SpineDecomposition,
} from '../types'
import { ANCHOR, DAILY, PRODUCTS } from '../data/mockData'

// ── date helpers (UTC-noon, matching the data layer) ─────────────────────────
function toDate(iso: string): Date {
  return new Date(iso + 'T12:00:00Z')
}
function isoOf(d: Date): string {
  return d.toISOString().slice(0, 10)
}
export function addDays(iso: string, n: number): string {
  const d = toDate(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return isoOf(d)
}
function daysBetween(a: string, b: string): number {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86_400_000)
}
function addMonths(iso: string, n: number): string {
  const d = toDate(iso)
  d.setUTCMonth(d.getUTCMonth() + n)
  return isoOf(d)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function dayLabel(iso: string): string {
  const d = toDate(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}
export function rangeLabel(start: string, end: string): string {
  if (start === end) return dayLabel(start)
  return `${dayLabel(start)} – ${dayLabel(end)}`
}

export const TODAY = ANCHOR.iso
export const YESTERDAY = addDays(ANCHOR.iso, -1)

// ── Resolve a PeriodKey (+ optional custom range) into a concrete window ──────
export function resolvePeriod(key: PeriodKey, custom?: { start: string; end: string }): DateRange {
  switch (key) {
    case 'today':
      return { start: TODAY, end: TODAY, label: 'Today' }
    case 'yesterday':
      return { start: YESTERDAY, end: YESTERDAY, label: 'Yesterday' }
    case 'last7': {
      const start = addDays(YESTERDAY, -6)
      return { start, end: YESTERDAY, label: 'Last 7 days' }
    }
    case 'last28': {
      const start = addDays(YESTERDAY, -27)
      return { start, end: YESTERDAY, label: 'Last 28 days' }
    }
    case 'mtd': {
      const start = TODAY.slice(0, 8) + '01'
      return { start, end: TODAY, label: 'Month to date' }
    }
    case 'custom': {
      const start = custom?.start ?? YESTERDAY
      const end = custom?.end ?? YESTERDAY
      return { start, end, label: rangeLabel(start, end) }
    }
  }
}

// ── Aggregate the daily records inside a window into PeriodTotals ────────────
export function aggregate(range: DateRange): PeriodTotals {
  const rows = DAILY.filter((d) => d.date >= range.start && d.date <= range.end)

  let sessions = 0,
    orders = 0,
    grossSales = 0,
    discounts = 0,
    returns = 0,
    netRevenue = 0,
    cogs = 0
  const productRevenue: Record<string, { units: number; netRevenue: number }> = {}
  const referrers: Record<string, number> = {}
  // Track which products with missing cost actually sold in the window.
  const soldMissingCogs = new Set<string>()

  for (const d of rows) {
    sessions += d.sessions
    orders += d.orders
    grossSales += d.grossSales
    discounts += d.discounts
    returns += d.returns
    netRevenue += d.netRevenue
    cogs += d.cogs
    for (const p of d.products) {
      const acc = (productRevenue[p.id] ??= { units: 0, netRevenue: 0 })
      acc.units += p.units
      acc.netRevenue += p.netRevenue
      const meta = PRODUCTS.find((x) => x.id === p.id)
      if (meta && meta.unitCost === null && p.units > 0) soldMissingCogs.add(p.id)
    }
    for (const [name, v] of Object.entries(d.referrers)) {
      referrers[name] = (referrers[name] ?? 0) + v
    }
  }

  const productNames: Record<string, string> = {}
  for (const p of PRODUCTS) productNames[p.id] = p.title

  const grossProfit = netRevenue - cogs
  return {
    range,
    sessions,
    orders,
    grossSales: r2(grossSales),
    discounts: r2(discounts),
    returns: r2(returns),
    netRevenue: r2(netRevenue),
    cogs: r2(cogs),
    grossProfit: r2(grossProfit),
    grossMargin: netRevenue ? grossProfit / netRevenue : 0,
    conversionRate: sessions ? orders / sessions : 0,
    aov: orders ? netRevenue / orders : 0,
    missingCogsProductCount: soldMissingCogs.size,
    productNames,
    productRevenue,
    referrers,
  }
}

// ── Comparison baselines ─────────────────────────────────────────────────────
//
// The DEFAULT baseline is trailing-28-day, SAME WEEKDAY: a given day is compared
// against the mean of the matching weekdays over the preceding four weeks, so a
// Monday is judged against recent Mondays — never against a quiet Sunday. For
// multi-day periods we shift the whole window back in 7-day steps (4 windows)
// and average, which preserves the weekday mix.

export function resolveComparison(
  primary: DateRange,
  compare: CompareKey,
  pinned: PinnedBaseline[],
): { totals: PeriodTotals; label: string } | null {
  const len = daysBetween(primary.start, primary.end) + 1

  if (compare === 'prev') {
    const end = addDays(primary.start, -1)
    const start = addDays(end, -(len - 1))
    const r = { start, end, label: rangeLabel(start, end) }
    return { totals: aggregate(r), label: 'previous period' }
  }
  if (compare === 'lastMonth') {
    const start = addMonths(primary.start, -1)
    const end = addMonths(primary.end, -1)
    const r = { start, end, label: rangeLabel(start, end) }
    return { totals: aggregate(r), label: 'same dates last month' }
  }
  if (compare === 'lastYear') {
    const start = addDays(primary.start, -364) // 52 weeks keeps weekday alignment
    const end = addDays(primary.end, -364)
    const r = { start, end, label: rangeLabel(start, end) }
    return { totals: aggregate(r), label: 'same dates last year' }
  }
  if (compare === 'baseline') {
    return { totals: trailingSameWeekday(primary, len), label: 'trailing 28d · same weekday' }
  }
  // pinned custom baseline
  const pin = pinned.find((p) => p.id === compare)
  if (pin) return { totals: aggregate(pin.range), label: pin.name }
  return null
}

/**
 * Trailing-28-day same-weekday baseline. We average the four equivalent windows
 * shifted back by 7, 14, 21, 28 days. Averaging totals (not rates) keeps the
 * spine identity intact: the averaged CR/AOV are recomputed from averaged
 * sessions/orders/revenue.
 */
function trailingSameWeekday(primary: DateRange, len: number): PeriodTotals {
  const windows: PeriodTotals[] = []
  for (let w = 1; w <= 4; w++) {
    const start = addDays(primary.start, -7 * w)
    const end = addDays(primary.end, -7 * w)
    windows.push(aggregate({ start, end, label: rangeLabel(start, end) }))
  }
  const mean = (sel: (t: PeriodTotals) => number) =>
    windows.reduce((s, t) => s + sel(t), 0) / windows.length

  const sessions = mean((t) => t.sessions)
  const orders = mean((t) => t.orders)
  const grossSales = mean((t) => t.grossSales)
  const discounts = mean((t) => t.discounts)
  const returns = mean((t) => t.returns)
  const netRevenue = mean((t) => t.netRevenue)
  const cogs = mean((t) => t.cogs)
  const grossProfit = netRevenue - cogs

  // Average the per-product and referrer breakdowns too (for top-mover deltas).
  const productRevenue: Record<string, { units: number; netRevenue: number }> = {}
  const referrers: Record<string, number> = {}
  for (const t of windows) {
    for (const [id, v] of Object.entries(t.productRevenue)) {
      const acc = (productRevenue[id] ??= { units: 0, netRevenue: 0 })
      acc.units += v.units / windows.length
      acc.netRevenue += v.netRevenue / windows.length
    }
    for (const [name, v] of Object.entries(t.referrers)) {
      referrers[name] = (referrers[name] ?? 0) + v / windows.length
    }
  }

  const span =
    len === 1
      ? `${dayLabel(addDays(primary.start, -28))}–${dayLabel(addDays(primary.start, -7))}`
      : 'trailing 4 windows'

  return {
    range: { start: addDays(primary.start, -28), end: addDays(primary.end, -7), label: span },
    sessions,
    orders,
    grossSales: r2(grossSales),
    discounts: r2(discounts),
    returns: r2(returns),
    netRevenue: r2(netRevenue),
    cogs: r2(cogs),
    grossProfit: r2(grossProfit),
    grossMargin: netRevenue ? grossProfit / netRevenue : 0,
    conversionRate: sessions ? orders / sessions : 0,
    aov: orders ? netRevenue / orders : 0,
    missingCogsProductCount: windows[0]?.missingCogsProductCount ?? 0,
    productNames: windows[0]?.productNames ?? {},
    productRevenue,
    referrers,
  }
}

// ── Metric delta helper ──────────────────────────────────────────────────────
export function delta(value: number, base: number): MetricDelta {
  if (!base) return { value, change: null }
  return { value, change: (value - base) / base }
}

// ───────────────────────────────────────────────────────────────────────────
// THE DIAGNOSTIC SPINE
//
// Revenue = Sessions × Conversion rate × AOV. A multiplicative identity, so to
// first order the % change in revenue is the SUM of the % changes in the three
// levers:  %ΔRev ≈ %ΔSessions + %ΔCR + %ΔAOV.
//
// We use this additive approximation for the demo and attribute the move to the
// lever with the largest |%Δ|. NOTE: production should use an exact LMDI
// (log-mean Divisia index) decomposition so the three contributions sum to the
// revenue change with zero residual even for large swings; the additive form
// drifts when changes are big. The chosen-lever conclusion is unaffected here.
// ───────────────────────────────────────────────────────────────────────────
export function decompose(current: PeriodTotals, base: PeriodTotals): SpineDecomposition {
  const pc = (a: number, b: number) => (b ? (a - b) / b : null)
  const revenueChange = pc(current.netRevenue, base.netRevenue)
  const sessionsChange = pc(current.sessions, base.sessions)
  const crChange = pc(current.conversionRate, base.conversionRate)
  const aovChange = pc(current.aov, base.aov)

  const levers: { lever: Lever; change: number | null }[] = [
    { lever: 'traffic', change: sessionsChange },
    { lever: 'conversion', change: crChange },
    { lever: 'basket', change: aovChange },
  ]
  // Dominant = largest absolute move among the three.
  const dominant =
    levers
      .filter((l) => l.change !== null)
      .sort((a, b) => Math.abs(b.change!) - Math.abs(a.change!))[0]?.lever ?? 'traffic'

  return {
    revenueChange,
    sessionsChange,
    crChange,
    aovChange,
    dominant,
    headline: buildHeadline(revenueChange, { sessionsChange, crChange, aovChange }, dominant),
    tag: TAG[dominant],
  }
}

const TAG: Record<Lever, string> = {
  traffic: 'Traffic-driven',
  conversion: 'Conversion-driven',
  basket: 'Basket-driven',
}

const LEVER_NOUN: Record<Lever, string> = {
  traffic: 'traffic',
  conversion: 'conversion',
  basket: 'basket size',
}
const LEVER_METRIC: Record<Lever, string> = {
  traffic: 'sessions',
  conversion: 'conversion rate',
  basket: 'AOV',
}

/** Turn the numbers into one plain-English sentence naming the lever that moved. */
function buildHeadline(
  rev: number | null,
  ch: { sessionsChange: number | null; crChange: number | null; aovChange: number | null },
  dominant: Lever,
): string {
  if (rev === null) return 'Not enough history to compare.'
  const pct = (f: number | null) => (f === null ? '—' : signed(f))
  const dir = rev > 0.002 ? 'up' : rev < -0.002 ? 'down' : 'flat'
  const driverChange =
    dominant === 'traffic' ? ch.sessionsChange : dominant === 'conversion' ? ch.crChange : ch.aovChange

  if (dir === 'flat') {
    return `Revenue held flat (${pct(rev)}) — sessions ${pct(ch.sessionsChange)}, conversion ${pct(
      ch.crChange,
    )}, basket ${pct(ch.aovChange)}.`
  }

  // Name the held levers (the two non-dominant ones that barely moved).
  const others: Lever[] = (['traffic', 'conversion', 'basket'] as Lever[]).filter((l) => l !== dominant)
  const held = others.filter((l) => {
    const c = l === 'traffic' ? ch.sessionsChange : l === 'conversion' ? ch.crChange : ch.aovChange
    return c !== null && Math.abs(c) < 0.03
  })
  const heldClause =
    held.length === 2
      ? `${LEVER_NOUN[held[0]]} and ${LEVER_NOUN[held[1]]} held`
      : held.length === 1
        ? `${LEVER_NOUN[held[0]]} held`
        : `${LEVER_METRIC[others[0]]} ${pct(
            others[0] === 'traffic' ? ch.sessionsChange : others[0] === 'conversion' ? ch.crChange : ch.aovChange,
          )}, ${LEVER_METRIC[others[1]]} ${pct(
            others[1] === 'traffic' ? ch.sessionsChange : others[1] === 'conversion' ? ch.crChange : ch.aovChange,
          )}`

  return `Revenue ${pct(rev)} — driven by ${LEVER_NOUN[dominant]} (${LEVER_METRIC[dominant]} ${pct(
    driverChange,
  )}); ${heldClause}.`
}

function signed(f: number): string {
  const v = f * 100
  const s = v > 0 ? '+' : v < 0 ? '−' : ''
  return s + Math.abs(v).toFixed(0) + '%'
}

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

// ── Top movers (for the report): biggest product net-revenue swings ─────────
export function topMovers(
  current: PeriodTotals,
  base: PeriodTotals,
): { id: string; name: string; change: number; current: number }[] {
  const out: { id: string; name: string; change: number; current: number }[] = []
  for (const [id, cur] of Object.entries(current.productRevenue)) {
    const b = base.productRevenue[id]?.netRevenue ?? 0
    if (b < 200 && cur.netRevenue < 200) continue // ignore tiny lines
    const change = b ? (cur.netRevenue - b) / b : 0
    out.push({ id, name: current.productNames[id] ?? id, change, current: cur.netRevenue })
  }
  return out.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
}

/** Biggest referrer swing — the "notable traffic shift" line. */
export function topReferrerShift(
  current: PeriodTotals,
  base: PeriodTotals,
): { name: string; change: number; current: number } | null {
  let best: { name: string; change: number; current: number } | null = null
  for (const [name, cur] of Object.entries(current.referrers)) {
    const b = base.referrers[name] ?? 0
    if (!b) continue
    const change = (cur - b) / b
    if (!best || Math.abs(change) > Math.abs(best.change)) best = { name, change, current: cur }
  }
  return best
}
