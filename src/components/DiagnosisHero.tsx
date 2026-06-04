import type { Lever, PeriodTotals, SpineDecomposition } from '../types'
import { fmtInt, fmtMoney, fmtPct, fmtPctChange } from '../lib/format'

/**
 * The signature feature: turns "revenue moved" into "which lever moved".
 * When no comparison is selected it falls back to a calm snapshot of the spine.
 */
export function DiagnosisHero({
  cur,
  spine,
  baseLabel,
}: {
  cur: PeriodTotals
  spine: SpineDecomposition | null
  baseLabel: string
}) {
  if (!spine) return <SnapshotHero cur={cur} />

  const levers: { lever: Lever; label: string; value: string; change: number | null }[] = [
    { lever: 'traffic', label: 'Sessions', value: fmtInt(cur.sessions), change: spine.sessionsChange },
    {
      lever: 'conversion',
      label: 'Conversion',
      value: fmtPct(cur.conversionRate, 2),
      change: spine.crChange,
    },
    { lever: 'basket', label: 'AOV', value: fmtMoney(cur.aov, 0), change: spine.aovChange },
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
      <div className="metatiedye h-1 w-full" />
      <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center">
        {/* Left: the diagnosis */}
        <div className="flex-1">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <span className="metatiedye-text text-[12px] font-bold uppercase tracking-[0.12em]">
              Diagnosis
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[12px] font-bold ${tagTone(spine.dominant)}`}>
              {spine.tag}
            </span>
          </div>
          <p className="max-w-2xl text-[24px] font-bold leading-tight tracking-tight text-ink">
            {spine.headline}
          </p>
          <p className="mt-2 text-[13px] text-ink-faint">
            vs {baseLabel} · revenue = sessions × conversion × AOV
          </p>
        </div>

        {/* Right: the three levers, dominant accented */}
        <div className="grid w-full shrink-0 grid-cols-3 gap-2.5 lg:w-[400px]">
          {levers.map((l) => {
            const dominant = l.lever === spine.dominant
            return (
              <div
                key={l.lever}
                className={`rounded-xl border p-3.5 text-center ${
                  dominant ? 'border-violet-300 bg-violet-50' : 'border-hairline bg-stone-50'
                }`}
              >
                <div className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-faint">
                  {l.label}
                </div>
                <div className="mt-1.5 tnum text-[15px] font-semibold text-ink-soft">{l.value}</div>
                <div className={`mt-1 tnum text-[19px] font-bold leading-none ${deltaColor(l.change)}`}>
                  {fmtPctChange(l.change)}
                </div>
                <div
                  className={`mt-1.5 text-[10.5px] font-bold uppercase tracking-wide ${
                    dominant ? 'text-violet-600' : 'text-transparent'
                  }`}
                >
                  {dominant ? 'dominant' : '·'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** Calm snapshot when "Don't compare" is selected — net revenue + the spine. */
function SnapshotHero({ cur }: { cur: PeriodTotals }) {
  const items = [
    { label: 'Sessions', value: fmtInt(cur.sessions) },
    { label: 'Conversion', value: fmtPct(cur.conversionRate, 2) },
    { label: 'AOV', value: fmtMoney(cur.aov, 0) },
  ]
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
      <div className="metatiedye h-1 w-full" />
      <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center">
        <div className="flex-1">
          <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink-faint">
            Snapshot
          </span>
          <div className="mt-1.5 flex items-baseline gap-2.5">
            <span className="tnum text-[34px] font-bold leading-none tracking-tight text-ink">
              {fmtMoney(cur.netRevenue)}
            </span>
            <span className="text-[14px] font-medium text-ink-soft">net revenue</span>
          </div>
          <p className="mt-2 text-[13px] text-ink-faint">
            Pick a comparison above to see what moved and why.
          </p>
        </div>
        <div className="grid w-full shrink-0 grid-cols-3 gap-2.5 lg:w-[400px]">
          {items.map((i) => (
            <div key={i.label} className="rounded-xl border border-hairline bg-stone-50 p-3.5 text-center">
              <div className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-faint">
                {i.label}
              </div>
              <div className="mt-1.5 tnum text-[22px] font-bold text-ink">{i.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function deltaColor(change: number | null): string {
  if (change === null || Math.abs(change) < 0.005) return 'text-ink-faint'
  return change > 0 ? 'text-positive' : 'text-loss'
}

function tagTone(lever: Lever): string {
  switch (lever) {
    case 'traffic':
      return 'border-sky-200 bg-sky-50 text-sky-700'
    case 'conversion':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'basket':
      return 'border-violet-200 bg-violet-50 text-violet-700'
  }
}
