import type { Lever, SpineDecomposition } from '../types'
import { fmtPctChange } from '../lib/format'
import { Arrow } from './ui'

/**
 * The signature feature: turns "revenue moved" into "which lever moved".
 * Big plain-English diagnosis + the three-lever decomposition that proves it.
 */
export function DiagnosisHero({
  spine,
  baseLabel,
}: {
  spine: SpineDecomposition
  baseLabel: string
}) {
  const levers: { lever: Lever; label: string; change: number | null }[] = [
    { lever: 'traffic', label: 'Sessions', change: spine.sessionsChange },
    { lever: 'conversion', label: 'Conversion rate', change: spine.crChange },
    { lever: 'basket', label: 'AOV', change: spine.aovChange },
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-stretch">
        {/* Left: the diagnosis */}
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="metatiedye-text text-[11px] font-bold uppercase tracking-[0.14em]">
              Diagnosis
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tagTone(
                spine.dominant,
              )}`}
            >
              {spine.tag}
            </span>
          </div>
          <p className="text-[19px] font-semibold leading-snug text-ink">{spine.headline}</p>
          <p className="mt-1.5 text-[12px] text-ink-faint">
            vs {baseLabel} · revenue = sessions × conversion × AOV
          </p>
        </div>

        {/* Right: the three levers, dominant one accented */}
        <div className="grid w-full grid-cols-3 gap-2 sm:w-[360px]">
          {levers.map((l) => {
            const dominant = l.lever === spine.dominant
            return (
              <div
                key={l.lever}
                className={`rounded-xl border p-3 text-center ${
                  dominant ? 'border-violet-200 bg-violet-50/60' : 'border-hairline bg-stone-50/60'
                }`}
              >
                <div className="text-[10.5px] font-medium uppercase tracking-wide text-ink-faint">
                  {l.label}
                </div>
                <div className="mt-1 flex items-center justify-center gap-1">
                  <Arrow change={l.change} />
                  <span
                    className={`tnum text-[17px] font-bold ${deltaColor(l.change)}`}
                  >
                    {fmtPctChange(l.change)}
                  </span>
                </div>
                {dominant && (
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-violet-600">
                    dominant
                  </div>
                )}
              </div>
            )
          })}
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
