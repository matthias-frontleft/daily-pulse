import type { PeriodTotals } from '../types'
import { fmtInt, fmtMoney, fmtPct } from '../lib/format'
import { Card, Pill, SectionLabel } from './ui'
import { BRAND } from '../data/mockData'

// ── Best-performing products ─────────────────────────────────────────────────
export function TopProducts({ cur }: { cur: PeriodTotals }) {
  const rows = Object.entries(cur.productRevenue)
    .map(([id, v]) => ({ id, name: cur.productNames[id] ?? id, ...v }))
    .sort((a, b) => b.netRevenue - a.netRevenue)
    .slice(0, 8)
  const total = cur.netRevenue || 1

  return (
    <Card className="p-5">
      <div className="mb-3">
        <SectionLabel>Best-performing products</SectionLabel>
      </div>
      <div className="flex flex-col">
        {rows.map((r, i) => {
          const share = r.netRevenue / total
          return (
            <div key={r.id} className="flex items-center gap-3 py-1.5">
              <span className="w-4 text-right text-[12px] tabular-nums text-ink-faint">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-ink">{r.name}</div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                  <div className="metatiedye h-full rounded-full" style={{ width: `${share * 100}%` }} />
                </div>
              </div>
              <div className="text-right">
                <div className="tnum text-[13px] font-semibold text-ink">{fmtMoney(r.netRevenue)}</div>
                <div className="text-[11px] text-ink-faint">
                  {fmtInt(r.units)} units · {fmtPct(share, 0)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ── Where traffic lands & comes from (Shopify-depth only) ────────────────────
export function TrafficPanel({ cur }: { cur: PeriodTotals }) {
  const referrers = Object.entries(cur.referrers)
    .map(([name, sessions]) => ({ name, sessions: Math.round(sessions) }))
    .sort((a, b) => b.sessions - a.sessions)
  const refTotal = referrers.reduce((s, r) => s + r.sessions, 0) || 1

  // Landing pages are derived (Shopify reports a basic landing-page list). Home
  // and the Shop-All collection take a fixed slice; the rest follows product mix.
  const landing = deriveLanding(cur)
  const landTotal = cur.sessions || 1

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <SectionLabel>Where traffic lands & comes from</SectionLabel>
        <Pill tone="neutral" title="Basic Shopify source & landing-page lists — not full funnel analytics">
          Shopify depth
        </Pill>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            Top referrers
          </div>
          {referrers.map((r) => (
            <Bar key={r.name} label={r.name} value={r.sessions} share={r.sessions / refTotal} />
          ))}
        </div>
        <div>
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            Top landing pages
          </div>
          {landing.map((l) => (
            <Bar key={l.path} label={l.path} value={l.sessions} share={l.sessions / landTotal} mono />
          ))}
        </div>
      </div>
    </Card>
  )
}

function Bar({
  label,
  value,
  share,
  mono,
}: {
  label: string
  value: number
  share: number
  mono?: boolean
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`truncate text-[12.5px] text-ink-soft ${mono ? 'font-mono text-[11.5px]' : ''}`}>
            {label}
          </span>
          <span className="tnum text-[12px] text-ink-faint">{fmtInt(value)}</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div className="h-full rounded-full bg-violet-300" style={{ width: `${share * 100}%` }} />
        </div>
      </div>
    </div>
  )
}

function deriveLanding(cur: PeriodTotals): { path: string; sessions: number }[] {
  const s = cur.sessions
  const out: { path: string; sessions: number }[] = [
    { path: '/', sessions: Math.round(s * 0.36) },
    { path: '/collections/all', sessions: Math.round(s * 0.13) },
  ]
  // Top 4 product pages by revenue share of remaining sessions.
  const products = Object.entries(cur.productRevenue)
    .map(([id, v]) => ({ id, name: cur.productNames[id] ?? id, rev: v.netRevenue }))
    .sort((a, b) => b.rev - a.rev)
    .slice(0, 4)
  const revTotal = products.reduce((t, p) => t + p.rev, 0) || 1
  const remaining = s * 0.51
  for (const p of products) {
    out.push({ path: '/products/' + slug(p.name), sessions: Math.round(remaining * (p.rev / revTotal)) })
  }
  return out
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ── AI analysis panel ────────────────────────────────────────────────────────
import type { Analysis } from '../lib/commentary'
import { AI_DISCLAIMER } from '../lib/commentary'

export function AiPanel({ analysis }: { analysis: Analysis }) {
  return (
    <Card className="overflow-hidden">
      <div className="metatiedye h-0.5 w-full" />
      <div className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="metatiedye-text text-[11px] font-bold uppercase tracking-[0.14em]">
            AI analysis
          </span>
          <Pill tone="neutral">{BRAND.name}</Pill>
        </div>

        <div className="flex flex-col gap-2.5">
          {analysis.read.map((p, i) => (
            <p key={i} className="text-[13px] leading-relaxed text-ink-soft">
              {p}
            </p>
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            Suggested optimisations
          </div>
          <ul className="flex flex-col gap-2">
            {analysis.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-snug text-ink-soft">
                <span className="mt-0.5 text-violet-500">→</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
          <p className="text-[11px] leading-snug text-ink-faint">
            <span className="font-semibold text-ink-soft">Note · </span>
            {AI_DISCLAIMER}
          </p>
        </div>
      </div>
    </Card>
  )
}
