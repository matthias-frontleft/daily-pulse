import { useState } from 'react'
import type { CompareKey, DateRange, PeriodKey, PinnedBaseline } from '../types'
import { Seg, SegGroup, SectionLabel } from './ui'

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 days' },
  { key: 'last28', label: 'Last 28 days' },
  { key: 'mtd', label: 'Month to date' },
  { key: 'custom', label: 'Custom' },
]

const COMPARES: { key: CompareKey; label: string; hint: string }[] = [
  { key: 'none', label: "Don't compare", hint: 'Show the numbers on their own, no deltas' },
  { key: 'baseline', label: 'Same weekday (28d)', hint: 'Default — trailing-28-day, like-for-like weekdays' },
  { key: 'prev', label: 'Previous period', hint: 'The period immediately before' },
  { key: 'lastMonth', label: 'Last month', hint: 'Same dates, one month earlier' },
  { key: 'lastYear', label: 'Last year', hint: 'Same dates, 52 weeks earlier' },
]

export function PeriodControls({
  period,
  onPeriod,
  custom,
  onCustom,
  compare,
  onCompare,
  pinned,
  onPin,
  onRemovePin,
  primaryRange,
}: {
  period: PeriodKey
  onPeriod: (p: PeriodKey) => void
  custom: { start: string; end: string }
  onCustom: (c: { start: string; end: string }) => void
  compare: CompareKey
  onCompare: (c: CompareKey) => void
  pinned: PinnedBaseline[]
  onPin: (name: string, range: DateRange) => void
  onRemovePin: (id: string) => void
  primaryRange: DateRange
}) {
  const [pinning, setPinning] = useState(false)
  const [pinName, setPinName] = useState('')

  return (
    <div className="flex flex-col gap-3.5">
      {/* Period */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="w-[68px] shrink-0">
          <SectionLabel>Period</SectionLabel>
        </span>
        <SegGroup>
          {PERIODS.map((p) => (
            <Seg key={p.key} active={period === p.key} onClick={() => onPeriod(p.key)}>
              {p.label}
            </Seg>
          ))}
        </SegGroup>
        {period === 'custom' && (
          <div className="flex items-center gap-2 rounded-xl border border-hairline bg-white px-3 py-2">
            <input
              type="date"
              value={custom.start}
              max={custom.end}
              onChange={(e) => onCustom({ ...custom, start: e.target.value })}
              className="bg-transparent text-[13px] font-medium text-ink outline-none"
            />
            <span className="text-ink-faint">→</span>
            <input
              type="date"
              value={custom.end}
              min={custom.start}
              onChange={(e) => onCustom({ ...custom, end: e.target.value })}
              className="bg-transparent text-[13px] font-medium text-ink outline-none"
            />
          </div>
        )}
      </div>

      {/* Compare */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="w-[68px] shrink-0">
          <SectionLabel>Compare</SectionLabel>
        </span>
        <SegGroup>
          {COMPARES.map((c) => (
            <Seg key={c.key} active={compare === c.key} onClick={() => onCompare(c.key)} title={c.hint}>
              {c.label}
            </Seg>
          ))}
        </SegGroup>

        {/* Pinned custom baselines */}
        {pinned.map((p) => (
          <span key={p.id} className="inline-flex items-center overflow-hidden rounded-lg">
            <button
              onClick={() => onCompare(p.id)}
              title={`Saved baseline · ${p.range.label}`}
              className={`px-3 py-2 text-[13px] font-semibold transition ${
                compare === p.id
                  ? 'bg-ink text-white'
                  : 'border border-hairline bg-white text-ink-soft hover:text-ink'
              }`}
            >
              📌 {p.name}
            </button>
            <button
              onClick={() => onRemovePin(p.id)}
              title="Remove saved baseline"
              className={`px-2 py-2 text-[12px] transition ${
                compare === p.id
                  ? 'bg-ink text-white/70 hover:text-white'
                  : 'border border-l-0 border-hairline bg-white text-ink-faint hover:text-loss'
              }`}
            >
              ✕
            </button>
          </span>
        ))}

        {/* Pin the current period as a reusable baseline */}
        {!pinning ? (
          <button
            onClick={() => {
              setPinName(primaryRange.label)
              setPinning(true)
            }}
            className="rounded-lg border border-dashed border-stone-300 px-3 py-2 text-[13px] font-semibold text-ink-faint transition hover:border-violet-400 hover:text-violet-700"
          >
            + Pin baseline
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300 bg-white px-2.5 py-1.5">
            <input
              autoFocus
              value={pinName}
              onChange={(e) => setPinName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && pinName.trim()) {
                  onPin(pinName.trim(), primaryRange)
                  setPinning(false)
                }
                if (e.key === 'Escape') setPinning(false)
              }}
              placeholder="Name this baseline"
              className="w-44 bg-transparent text-[13px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-faint"
            />
            <button
              onClick={() => {
                if (pinName.trim()) {
                  onPin(pinName.trim(), primaryRange)
                  setPinning(false)
                }
              }}
              className="rounded-md bg-violet-600 px-2.5 py-1 text-[12px] font-bold text-white"
            >
              Save
            </button>
            <button onClick={() => setPinning(false)} className="px-1 text-[12px] text-ink-faint">
              ✕
            </button>
          </span>
        )}
      </div>
    </div>
  )
}
