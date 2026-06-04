// ───────────────────────────────────────────────────────────────────────────
// THE MORNING REPORT — a realistic preview of the automated 6am Slack post.
//
// We can't post to a real Slack, so this renders what the message looks like in
// #daily-pulse: diagnosis-led, compact, with threaded replies to demonstrate the
// in-thread discussion model. It reports YESTERDAY vs the trailing-28-day
// same-weekday baseline — the same default the dashboard uses.
// ───────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react'
import { aggregate, decompose, resolveComparison, resolvePeriod, topMovers, topReferrerShift } from '../lib/periods'
import { fmtMoney, fmtMoneyCompact, fmtPct, fmtPctChange } from '../lib/format'
import { AI_DISCLAIMER } from '../lib/commentary'
import { BRAND } from '../data/mockData'

export function MorningReport() {
  const primary = useMemo(() => resolvePeriod('yesterday'), [])
  const cur = useMemo(() => aggregate(primary), [primary])
  const comparison = useMemo(() => resolveComparison(primary, 'baseline', []), [primary])
  const base = comparison!.totals
  const spine = useMemo(() => decompose(cur, base), [cur, base])

  const movers = topMovers(cur, base)
  const up = movers.find((m) => m.change > 0.1)
  const down = movers.find((m) => m.change < -0.1)
  const refShift = topReferrerShift(cur, base)

  const dateLabel = new Date(primary.start + 'T12:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-ink">Morning report</h1>
          <p className="text-[12.5px] text-ink-soft">
            Preview of the automated 6:00 AM Slack post · sent to your team every morning
          </p>
        </div>
        <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] text-ink-faint">
          Preview — not a live Slack connection
        </span>
      </div>

      {/* Slack surface */}
      <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
        {/* Channel header */}
        <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
          <span className="text-[14px] font-bold text-ink">#</span>
          <span className="text-[14px] font-semibold text-ink">daily-pulse</span>
          <span className="text-[12px] text-ink-faint">· 24 members</span>
        </div>

        <div className="px-4 py-3">
          {/* The bot post */}
          <SlackMessage
            avatar="gradient"
            name="Daily Pulse"
            app
            time="6:00 AM"
          >
            <div className="flex flex-col gap-2.5">
              {/* LEADS WITH THE DIAGNOSIS */}
              <div>
                <p className="text-[14px] font-semibold leading-snug text-ink">
                  {emojiFor(spine.dominant)} {spine.headline}
                </p>
                <p className="mt-0.5 text-[12.5px] text-ink-soft">
                  {BRAND.name} · {dateLabel} · vs trailing-28-day same-weekday baseline
                </p>
              </div>

              {/* Compact metric line */}
              <div className="rounded-lg border border-hairline bg-stone-50 px-3 py-2">
                <div className="grid grid-cols-3 gap-y-2 sm:grid-cols-6">
                  <Metric label="Sessions" value={fmtCompactInt(cur.sessions)} change={pc(cur.sessions, base.sessions)} />
                  <Metric label="Conv." value={fmtPct(cur.conversionRate, 2)} change={pc(cur.conversionRate, base.conversionRate)} />
                  <Metric label="AOV" value={fmtMoney(cur.aov, 0)} change={pc(cur.aov, base.aov)} />
                  <Metric label="Orders" value={fmtCompactInt(cur.orders)} change={pc(cur.orders, base.orders)} />
                  <Metric label="Net rev" value={fmtMoneyCompact(cur.netRevenue)} change={pc(cur.netRevenue, base.netRevenue)} />
                  <Metric
                    label="Gross profit*"
                    value={fmtMoneyCompact(cur.grossProfit)}
                    change={pc(cur.grossProfit, base.grossProfit)}
                  />
                </div>
                {cur.missingCogsProductCount > 0 && (
                  <p className="mt-2 text-[10.5px] text-orange-700">
                    *partial — COGS missing on {cur.missingCogsProductCount} product
                    {cur.missingCogsProductCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Top movers */}
              <div className="text-[13px] leading-relaxed text-ink-soft">
                <span className="font-semibold text-ink">Movers · </span>
                {up && (
                  <>
                    📈 {up.name} <span className="text-positive">{fmtPctChange(up.change)}</span>
                    {(down || refShift) && ' · '}
                  </>
                )}
                {down && (
                  <>
                    📉 {down.name} <span className="text-loss">{fmtPctChange(down.change)}</span>
                    {refShift && Math.abs(refShift.change) > 0.15 && ' · '}
                  </>
                )}
                {refShift && Math.abs(refShift.change) > 0.15 && (
                  <>
                    🔀 {refShift.name} referrals{' '}
                    <span className={refShift.change < 0 ? 'text-loss' : 'text-positive'}>
                      {fmtPctChange(refShift.change)}
                    </span>
                  </>
                )}
              </div>

              {/* Flagged customer theme — from the separate Customer Care module */}
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <span className="text-[13px] leading-none">⚠️</span>
                <div>
                  <p className="text-[12.5px] leading-snug text-amber-900">
                    <span className="font-semibold">Rising theme:</span> 6 customers mentioned{' '}
                    <span className="font-semibold">late delivery</span> yesterday (up from ~1/day).
                    Possible courier delay on tracked shipments.
                  </p>
                  <p className="mt-1 text-[10.5px] text-amber-700">
                    Surfaced by the Customer Care module · not generated here
                  </p>
                </div>
              </div>

              {/* AI narrative */}
              <div className="text-[13px] leading-relaxed text-ink-soft">
                <span className="font-semibold text-ink">The read · </span>
                Yesterday's dip was {magnitude(spine.revenueChange)} and clean: it's a {spine.dominant}{' '}
                story, not a store problem — visitors who arrived still converted and spent normally.
                {refShift && refShift.change < -0.15
                  ? ` Most of the lost traffic came from a drop in ${refShift.name} referrals — worth checking whether a scheduled post or campaign lapsed.`
                  : ''}{' '}
                Conversion and basket held, so recovered traffic should monetise at the usual rate.
              </div>

              {/* Disclaimer */}
              <p className="border-t border-hairline pt-2 text-[10.5px] leading-snug text-ink-faint">
                🤖 {AI_DISCLAIMER}
              </p>

              {/* Slack action affordances */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <SlackBtn>📊 Open dashboard</SlackBtn>
                <SlackBtn>🧵 Discuss in thread</SlackBtn>
                <span className="text-[11px] text-ink-faint">📌 Saved to #daily-pulse</span>
              </div>
            </div>
          </SlackMessage>

          {/* Threaded replies */}
          <div className="mt-1 border-l-2 border-stone-200 pl-3">
            <p className="mb-1 pl-9 text-[11.5px] font-semibold text-sky-700">3 replies</p>
            <Reply name="Priya (Head of Ecom)" time="7:42 AM" colour="bg-rose-400">
              Nice, so nothing broken in checkout 🙏 I'll ping the agency about the Instagram posts — I
              think yesterday's story didn't go out.
            </Reply>
            <Reply name="Tom (Ops)" time="8:05 AM" colour="bg-emerald-500">
              On the late-delivery theme — yep, our courier had a depot delay Tuesday. Drafting a
              proactive email to affected orders now.
            </Reply>
            <Reply name="Frontleft (Aisha)" time="8:18 AM" colour="bg-violet-500">
              Confirmed the IG scheduled post failed to publish — fixed and re-queued. Traffic should
              normalise today. Will keep an eye on the pulse 👀
            </Reply>
          </div>
        </div>
      </div>

      <p className="pb-4 pt-4 text-center text-[11px] text-ink-faint">
        The premise: people don't read long reports. Lead with the diagnosis, keep it glanceable,
        let the conversation happen in the thread.
      </p>
    </div>
  )
}

// ── helpers ──────────────────────────────────────────────────────────────────
function pc(a: number, b: number): number | null {
  return b ? (a - b) / b : null
}
function fmtCompactInt(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return Math.round(n).toString()
}
function magnitude(f: number | null): string {
  if (f === null) return 'modest'
  const a = Math.abs(f)
  if (a >= 0.15) return 'sharp'
  if (a >= 0.07) return 'a real'
  return 'a mild'
}
function emojiFor(lever: string): string {
  return lever === 'traffic' ? '🚦' : lever === 'conversion' ? '🛒' : '🧺'
}

// ── Slack UI primitives ──────────────────────────────────────────────────────
function SlackMessage({
  name,
  time,
  app,
  children,
}: {
  avatar: 'gradient'
  name: string
  time: string
  app?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-2.5">
      <div className="metatiedye mt-0.5 h-9 w-9 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[13.5px] font-bold text-ink">{name}</span>
          {app && (
            <span className="rounded bg-stone-200 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-ink-soft">
              App
            </span>
          )}
          <span className="text-[11px] text-ink-faint">{time}</span>
        </div>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  )
}

function Reply({
  name,
  time,
  colour,
  children,
}: {
  name: string
  time: string
  colour: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-2.5 py-1.5 pl-6">
      <div className={`mt-0.5 h-7 w-7 shrink-0 rounded-lg ${colour}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[12.5px] font-bold text-ink">{name}</span>
          <span className="text-[10.5px] text-ink-faint">{time}</span>
        </div>
        <p className="mt-0.5 text-[12.5px] leading-snug text-ink-soft">{children}</p>
      </div>
    </div>
  )
}

function Metric({ label, value, change }: { label: string; value: string; change: number | null }) {
  const flat = change === null || Math.abs(change) < 0.005
  const cls = flat ? 'text-ink-faint' : change! > 0 ? 'text-positive' : 'text-loss'
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="tnum text-[13.5px] font-bold text-ink">{value}</div>
      <div className={`tnum text-[10.5px] font-medium ${cls}`}>{fmtPctChange(change)}</div>
    </div>
  )
}

function SlackBtn({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-stone-300 bg-white px-2 py-1 text-[11.5px] font-medium text-ink-soft">
      {children}
    </span>
  )
}
