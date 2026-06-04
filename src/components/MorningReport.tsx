// ───────────────────────────────────────────────────────────────────────────
// THE MORNING REPORT — a calm preview of the automated 6am Slack post.
//
// We can't post to a real Slack, so this renders what the message looks like in
// #daily-pulse: diagnosis-led, deliberately short, with a couple of threaded
// replies to show the in-thread discussion model. Reports YESTERDAY vs the
// trailing-28-day same-weekday baseline (the dashboard default). The premise is
// that people don't read long reports — so this leads with the answer and keeps
// the visual load low.
// ───────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react'
import {
  aggregate,
  decompose,
  resolveComparison,
  resolvePeriod,
  topMovers,
  topReferrerShift,
} from '../lib/periods'
import { fmtMoney, fmtMoneyCompact, fmtPct, fmtPctChange } from '../lib/format'
import { AI_DISCLAIMER } from '../lib/commentary'
import { BRAND } from '../data/mockData'

export function MorningReport() {
  const primary = useMemo(() => resolvePeriod('yesterday'), [])
  const cur = useMemo(() => aggregate(primary), [primary])
  const base = useMemo(() => resolveComparison(primary, 'baseline', [])!.totals, [primary])
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
    <div className="mx-auto max-w-2xl px-6 py-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink">Morning report</h1>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            The automated 6:00 AM Slack post, sent to your team every morning.
          </p>
        </div>
        <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[12px] font-medium text-ink-faint">
          Preview
        </span>
      </div>

      {/* Slack surface */}
      <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
        {/* Channel header */}
        <div className="flex items-center gap-2 border-b border-hairline px-5 py-3">
          <span className="text-[15px] font-bold text-ink-faint">#</span>
          <span className="text-[14px] font-bold text-ink">daily-pulse</span>
        </div>

        <div className="px-5 py-4">
          {/* The bot post */}
          <div className="flex gap-3">
            <div className="metatiedye mt-0.5 h-10 w-10 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-ink">Daily Pulse</span>
                <span className="rounded bg-stone-200 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-ink-soft">
                  App
                </span>
                <span className="text-[12px] text-ink-faint">6:00 AM</span>
              </div>

              <div className="mt-2 flex flex-col gap-4">
                {/* LEADS WITH THE DIAGNOSIS */}
                <div>
                  <p className="text-[16px] font-bold leading-snug text-ink">
                    {emojiFor(spine.dominant)} {spine.headline}
                  </p>
                  <p className="mt-1 text-[12.5px] text-ink-faint">
                    {BRAND.name} · {dateLabel} · vs same-weekday baseline
                  </p>
                </div>

                {/* Compact metric strip — light, no heavy boxes */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-y border-hairline py-3 sm:grid-cols-4">
                  <Metric label="Net revenue" value={fmtMoneyCompact(cur.netRevenue)} change={pc(cur.netRevenue, base.netRevenue)} />
                  <Metric label="Sessions" value={fmtCompactInt(cur.sessions)} change={pc(cur.sessions, base.sessions)} />
                  <Metric label="Conversion" value={fmtPct(cur.conversionRate, 2)} change={pc(cur.conversionRate, base.conversionRate)} />
                  <Metric label="AOV" value={fmtMoney(cur.aov, 0)} change={pc(cur.aov, base.aov)} />
                </div>

                {/* Movers — one quiet line */}
                <p className="text-[13.5px] leading-relaxed text-ink-soft">
                  <span className="font-bold text-ink">Movers&nbsp;&nbsp;</span>
                  {up && (
                    <>
                      {up.name} <span className="font-semibold text-positive">{fmtPctChange(up.change)}</span>
                    </>
                  )}
                  {up && (down || refShift) && <span className="text-ink-faint"> · </span>}
                  {down && (
                    <>
                      {down.name} <span className="font-semibold text-loss">{fmtPctChange(down.change)}</span>
                    </>
                  )}
                  {down && refShift && Math.abs(refShift.change) > 0.15 && (
                    <span className="text-ink-faint"> · </span>
                  )}
                  {refShift && Math.abs(refShift.change) > 0.15 && (
                    <>
                      {refShift.name} traffic{' '}
                      <span className={`font-semibold ${refShift.change < 0 ? 'text-loss' : 'text-positive'}`}>
                        {fmtPctChange(refShift.change)}
                      </span>
                    </>
                  )}
                </p>

                {/* Flagged customer theme — from the separate Customer Care module */}
                <div className="rounded-xl bg-amber-50 px-3.5 py-2.5">
                  <p className="text-[13px] leading-snug text-amber-900">
                    ⚠️ <span className="font-bold">Rising theme:</span> 6 customers mentioned{' '}
                    <span className="font-semibold">late delivery</span> yesterday — likely a courier delay.
                    <span className="ml-1 text-[11.5px] text-amber-700">(via Customer Care module)</span>
                  </p>
                </div>

                {/* The read — short */}
                <p className="text-[13.5px] leading-relaxed text-ink-soft">
                  <span className="font-bold text-ink">The read&nbsp;&nbsp;</span>
                  Clean {spine.dominant} story — visitors still converted and spent normally, so nothing's
                  broken in the store.
                  {refShift && refShift.change < -0.15
                    ? ` The lost traffic was mostly ${refShift.name}; worth checking a scheduled post didn't lapse.`
                    : ''}{' '}
                  Recovered traffic should monetise at the usual rate.
                </p>

                {/* Disclaimer */}
                <p className="text-[11px] leading-snug text-ink-faint">🤖 {AI_DISCLAIMER}</p>
              </div>
            </div>
          </div>

          {/* Threaded replies — two, to show the discussion model */}
          <div className="mt-5 border-t border-hairline pt-4">
            <p className="mb-3 text-[12px] font-bold text-ink-soft">2 replies</p>
            <div className="flex flex-col gap-3.5">
              <Reply name="Priya · Head of Ecom" time="7:42 AM" colour="bg-rose-400">
                Good — nothing broken in checkout 🙏 I'll check the Instagram posts went out.
              </Reply>
              <Reply name="Aisha · Frontleft" time="8:18 AM" colour="bg-violet-500">
                Confirmed the scheduled IG post failed — fixed and re-queued. Traffic should normalise
                today, will keep an eye on the pulse 👀
              </Reply>
            </div>
          </div>
        </div>
      </div>

      <p className="pb-4 pt-5 text-center text-[12px] text-ink-faint">
        Lead with the diagnosis, keep it glanceable, let the conversation happen in the thread.
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
function emojiFor(lever: string): string {
  return lever === 'traffic' ? '🚦' : lever === 'conversion' ? '🛒' : '🧺'
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
    <div className="flex gap-2.5">
      <div className={`mt-0.5 h-7 w-7 shrink-0 rounded-lg ${colour}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-bold text-ink">{name}</span>
          <span className="text-[11px] text-ink-faint">{time}</span>
        </div>
        <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">{children}</p>
      </div>
    </div>
  )
}

function Metric({ label, value, change }: { label: string; value: string; change: number | null }) {
  const flat = change === null || Math.abs(change) < 0.005
  const cls = flat ? 'text-ink-faint' : change! > 0 ? 'text-positive' : 'text-loss'
  const arrow = flat ? '' : change! > 0 ? '▲ ' : '▼ '
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="mt-1 tnum text-[17px] font-bold text-ink">{value}</div>
      <div className={`tnum text-[12px] font-semibold ${cls}`}>
        {arrow}
        {fmtPctChange(change)}
      </div>
    </div>
  )
}
