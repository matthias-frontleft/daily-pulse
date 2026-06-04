// ───────────────────────────────────────────────────────────────────────────
// MOCK DATA LAYER — the only file that fabricates numbers.
//
// In production this whole module is replaced by a Shopify Admin/Analytics
// adapter that returns the same shapes (DailyRecord[], Product[]). The rest of
// the app imports ONLY the exported shapes below and never touches generation
// logic — so swapping in a real API is a one-file change.
//
// Everything here is deterministic (seeded PRNG, fixed ANCHOR date) so the demo
// tells the same story on every build.
// ───────────────────────────────────────────────────────────────────────────

import type { DailyRecord, DayProduct, Product } from '../types'

// ── The invented brand ───────────────────────────────────────────────────────
export const BRAND = {
  name: 'Wildgrove & Co.',
  blurb: 'Botanical skincare · Shopify online store',
  currency: 'GBP',
  currencySymbol: '£',
  storeUrl: 'wildgrove.com',
}

/**
 * The demo's "now". The app reads the clock from here, not Date.now(), so the
 * prototype is reproducible. Mid-morning, so "today" is a believable partial day.
 * Production would use the real current time in the store's timezone.
 */
export const ANCHOR = {
  iso: '2026-06-04',
  // as-of timestamp shown in the "live on open" affordance
  asOf: '2026-06-04T09:12:00',
}

const START_DATE = '2025-04-01' // ~14 months of history before ANCHOR

// ── Catalogue ────────────────────────────────────────────────────────────────
// Two products intentionally have null unitCost to exercise the missing-COGS flag.
export const PRODUCTS: Product[] = [
  { id: 'midnight-oil', title: 'Midnight Recovery Oil', price: 48, unitCost: 17.5 },
  { id: 'rose-cleanser', title: 'Rosewater Cleansing Balm', price: 32, unitCost: 11.8 },
  { id: 'everyday-spf', title: 'Everyday Mineral SPF 30', price: 28, unitCost: 10.2 },
  { id: 'vit-c-serum', title: 'Bright Days Vitamin C Serum', price: 42, unitCost: 15.1 },
  { id: 'hydra-mask', title: 'Overnight Hydra Mask', price: 36, unitCost: 13.4 },
  { id: 'body-butter', title: 'Wild Bergamot Body Butter', price: 26, unitCost: 9.1 },
  { id: 'lip-balm', title: 'Botanical Lip Repair', price: 14, unitCost: 4.3 },
  { id: 'starter-set', title: 'The Ritual Starter Set', price: 72, unitCost: 26.0 },
  { id: 'hand-cream', title: 'Allotment Hand Cream', price: 18, unitCost: 6.2 },
  { id: 'cleansing-cloth', title: 'Organic Muslin Cloth (2pk)', price: 12, unitCost: null }, // newly listed — cost not entered
  { id: 'travel-kit', title: 'Weekender Travel Kit', price: 38, unitCost: null }, // bundle — cost not entered
  { id: 'gift-card', title: 'Digital Gift Card', price: 50, unitCost: 0.0 },
]

// Base share of net revenue per product (renormalised each day). Hero products first.
const PRODUCT_BASE_WEIGHT: Record<string, number> = {
  'midnight-oil': 0.2,
  'rose-cleanser': 0.15,
  'everyday-spf': 0.13,
  'vit-c-serum': 0.12,
  'hydra-mask': 0.09,
  'body-butter': 0.07,
  'lip-balm': 0.05,
  'starter-set': 0.08,
  'hand-cream': 0.04,
  'cleansing-cloth': 0.02,
  'travel-kit': 0.03,
  'gift-card': 0.02,
}

// Shopify referrer sources (single channel = the online store; these are just
// where the session was referred from — no attribution modelling).
const REFERRER_BASE_SHARE: Record<string, number> = {
  Direct: 0.34,
  'Google — organic': 0.28,
  Instagram: 0.18,
  'Email (Shopify)': 0.12,
  Facebook: 0.08,
}

// ── Seeded PRNG (mulberry32) — deterministic, no Math.random ─────────────────
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Date helpers (UTC-noon to dodge DST) ─────────────────────────────────────
function toDate(iso: string): Date {
  return new Date(iso + 'T12:00:00Z')
}
function isoOf(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function addDays(iso: string, n: number): string {
  const d = toDate(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return isoOf(d)
}
function dow(iso: string): number {
  return toDate(iso).getUTCDay() // 0 = Sun … 6 = Sat
}

// ── Shape functions ──────────────────────────────────────────────────────────

/** Seasonal multiplier on sessions. Q4 peak with a sharp BFCM spike in late Nov. */
function seasonality(iso: string): number {
  const d = toDate(iso)
  const month = d.getUTCMonth() // 0=Jan
  const day = d.getUTCDate()
  const monthly = [0.92, 0.9, 0.96, 0.98, 1.0, 1.02, 0.98, 0.95, 1.04, 1.1, 1.28, 1.34][month]
  // Black Friday / Cyber Monday bump (last week of November)
  let bfcm = 1
  if (month === 10 && day >= 24) bfcm = 1.45
  if (month === 11 && day <= 2) bfcm = 1.2
  return monthly * bfcm
}

/** Day-of-week multipliers. Weekends pull MORE traffic but LOWER intent —
 *  so comparing a Monday to a Sunday is misleading and same-weekday matters. */
const DOW_SESSIONS = [1.14, 0.94, 0.95, 0.97, 1.0, 1.05, 1.16] // Sun..Sat
const DOW_CR = [0.82, 1.08, 1.1, 1.09, 1.05, 0.96, 0.84] // Sun..Sat (weekends browse, weekdays buy)

/** Gentle YoY growth so the last-year comparison shows the business growing. */
function trend(iso: string): number {
  const days = (toDate(iso).getTime() - toDate(START_DATE).getTime()) / 86_400_000
  return 1 + (0.19 * days) / 365 // ~+19%/yr
}

// ── Generation ────────────────────────────────────────────────────────────────

function buildDay(iso: string, rng: () => number, partial: boolean): DailyRecord {
  const wd = dow(iso)
  const noise = (spread: number) => 1 + (rng() - 0.5) * 2 * spread

  // Spine inputs
  const baseSessions = 8200
  let sessions = baseSessions * seasonality(iso) * DOW_SESSIONS[wd] * trend(iso) * noise(0.08)
  let cr = 0.0242 * DOW_CR[wd] * noise(0.06)
  const grossAov = 71 * noise(0.04) // gross basket; net AOV derived after discounts/returns

  if (partial) sessions *= 0.34 // ~9am: about a third of a day's traffic in

  sessions = Math.round(sessions)
  const orders = Math.max(0, Math.round(sessions * cr))

  // Promo intensity: heavier discounting in Q4 and occasional flash days
  const month = toDate(iso).getUTCMonth()
  const q4 = month === 10 || month === 11
  const discountRate = (q4 ? 0.14 : 0.07) * noise(0.25)
  const returnRate = 0.045 * noise(0.3)

  const grossSales = orders * grossAov
  const discounts = grossSales * discountRate
  const returns = grossSales * returnRate
  const netRevenue = grossSales - discounts - returns

  // Split net revenue across products (renormalised weights with slow drift)
  const products = splitProducts(iso, netRevenue, rng)
  const cogs = products.reduce((s, p) => {
    const cost = PRODUCTS.find((x) => x.id === p.id)!.unitCost
    return s + (cost === null ? 0 : p.units * cost)
  }, 0)

  // Referrer split of sessions
  const referrers = splitReferrers(sessions, rng)

  return {
    date: iso,
    sessions,
    orders,
    grossSales: round2(grossSales),
    discounts: round2(discounts),
    returns: round2(returns),
    netRevenue: round2(netRevenue),
    cogs: round2(cogs),
    products,
    referrers,
    partial: partial || undefined,
  }
}

function splitProducts(iso: string, netRevenue: number, rng: () => number): DayProduct[] {
  const d = toDate(iso)
  const t = (d.getTime() - toDate(START_DATE).getTime()) / 86_400_000
  // raw weights with a slow per-product sinusoidal drift + daily noise
  const raw: Record<string, number> = {}
  let total = 0
  for (const p of PRODUCTS) {
    const base = PRODUCT_BASE_WEIGHT[p.id]
    const phase = p.id.charCodeAt(0) + p.id.charCodeAt(1)
    const drift = 1 + 0.18 * Math.sin((t + phase) / 47)
    const w = Math.max(0.001, base * drift * (1 + (rng() - 0.5) * 0.5))
    raw[p.id] = w
    total += w
  }
  return PRODUCTS.map((p) => {
    const share = raw[p.id] / total
    const rev = netRevenue * share
    const units = Math.max(0, Math.round(rev / p.price))
    return { id: p.id, units, netRevenue: round2(rev) }
  })
}

function splitReferrers(sessions: number, rng: () => number): Record<string, number> {
  const raw: Record<string, number> = {}
  let total = 0
  for (const [name, share] of Object.entries(REFERRER_BASE_SHARE)) {
    const w = Math.max(0.01, share * (1 + (rng() - 0.5) * 0.3))
    raw[name] = w
    total += w
  }
  const out: Record<string, number> = {}
  let assigned = 0
  const names = Object.keys(raw)
  names.forEach((name, i) => {
    if (i === names.length - 1) {
      out[name] = sessions - assigned
    } else {
      const v = Math.round((raw[name] / total) * sessions)
      out[name] = v
      assigned += v
    }
  })
  return out
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// ── Build the series ──────────────────────────────────────────────────────────
function generate(): DailyRecord[] {
  const rng = mulberry32(20260604)
  const days: DailyRecord[] = []
  let cursor = START_DATE
  while (cursor <= ANCHOR.iso) {
    const partial = cursor === ANCHOR.iso
    days.push(buildDay(cursor, rng, partial))
    cursor = addDays(cursor, 1)
  }
  applyDemoStory(days)
  return days
}

/**
 * Bake the demo's hero story into "yesterday" (2026-06-03, a Wednesday):
 * revenue dips, and it's UNAMBIGUOUSLY a traffic problem — sessions fall well
 * below the trailing-28-day same-weekday baseline while conversion and basket
 * hold. This is what makes the diagnostic spine and the morning report sharp.
 */
function applyDemoStory(days: DailyRecord[]): void {
  const yIdx = days.findIndex((d) => d.date === '2026-06-03')
  if (yIdx < 0) return
  const y = days[yIdx]

  // Trailing-28-day, same-weekday (Wednesday) baseline ending the day before.
  const sameWeekday: DailyRecord[] = []
  for (let i = yIdx - 1; i >= 0 && days[yIdx].date; i--) {
    const gap = (toDate(y.date).getTime() - toDate(days[i].date).getTime()) / 86_400_000
    if (gap > 28) break
    if (dow(days[i].date) === dow(y.date)) sameWeekday.push(days[i])
  }
  if (sameWeekday.length === 0) return
  const avg = (sel: (d: DailyRecord) => number) =>
    sameWeekday.reduce((s, d) => s + sel(d), 0) / sameWeekday.length

  const baseSessions = avg((d) => d.sessions)
  const baseCr = avg((d) => d.orders / d.sessions)
  const baseGrossAov = avg((d) => d.grossSales / Math.max(1, d.orders))

  // Force the levers: sessions −17%, CR essentially flat (+0.8%), basket flat (+0.6%).
  const newSessions = Math.round(baseSessions * 0.83)
  const newCr = baseCr * 1.008
  const newOrders = Math.max(0, Math.round(newSessions * newCr))
  const newGrossAov = baseGrossAov * 1.006

  const discountRate = 0.072
  const returnRate = 0.044
  const grossSales = newOrders * newGrossAov
  const discounts = grossSales * discountRate
  const returns = grossSales * returnRate
  const netRevenue = grossSales - discounts - returns

  y.sessions = newSessions
  y.orders = newOrders
  y.grossSales = round2(grossSales)
  y.discounts = round2(discounts)
  y.returns = round2(returns)
  y.netRevenue = round2(netRevenue)

  // Re-split products at the new (lower) total, then bake two top movers:
  // a hero that BUCKS the trend (featured in yesterday's email) and a staple
  // that drops harder than the average.
  const rng = mulberry32(606303)
  y.products = splitProducts(y.date, netRevenue, rng)
  const bump = (id: string, factor: number) => {
    const p = y.products.find((x) => x.id === id)
    const meta = PRODUCTS.find((x) => x.id === id)!
    if (!p) return
    p.netRevenue = round2(p.netRevenue * factor)
    p.units = Math.max(0, Math.round(p.netRevenue / meta.price))
  }
  bump('vit-c-serum', 1.46) // spiked — featured in the morning email
  bump('everyday-spf', 0.58) // dropped hard
  y.cogs = round2(
    y.products.reduce((s, p) => {
      const cost = PRODUCTS.find((x) => x.id === p.id)!.unitCost
      return s + (cost === null ? 0 : p.units * cost)
    }, 0),
  )

  // The traffic culprit: paid/social referral collapses; Direct & Google steadier.
  y.referrers = splitReferrers(newSessions, mulberry32(909303))
  const drop = Math.round(y.referrers['Instagram'] * 0.45)
  y.referrers['Instagram'] = y.referrers['Instagram'] - drop
  y.referrers['Direct'] = y.referrers['Direct'] + Math.round(drop * 0.2) // a little reabsorbed
}

// ── The public surface the rest of the app imports ───────────────────────────
export const DAILY: DailyRecord[] = generate()
