import { useState } from 'react'
import type { CompareKey, DateRange, PeriodKey, PinnedBaseline } from '../types'
import { SectionLabel } from './ui'

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 days' },
  { key: 'last28', label: 'Last 28 days' },
  { key: 'mtd', label: 'Month to date' },
  { key: 'custom', label: 'Custom' },
]

const COMPARES: { key: CompareKey; label: string; hint: string }[] = [
  { key: 'baseline', label: 'Trailing 28d · same weekday', hint: 'Default — compares like-for-like weekdays' },
  { key: 'prev', label: 'Previous period', hint: 'The period immediately before' },
  { key: 'lastMonth', label: 'Same period last month', hint: 'Same dates, one month earlier' },
  { key: 'lastYear', label: 'Same period last year', hint: 'Same dates, 52 weeks earlier' },
]

function Seg({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition ${
        active
          ? 'bg-white text-ink shadow-card ring-1 ring-violet-200'
          : 'text-ink-soft hover:bg-white/60'
      }`}
    >
      {children}
    </button>
  )
}

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
    <div className="flex flex-col gap-3">
      {/* Period */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-16 shrink-0">
          <SectionLabel>Period</SectionLabel>
        </span>
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-hairline bg-stone-50 p-1">
          {PERIODS.map((p) => (
            <Seg key={p.key} active={period === p.key} onClick={() => onPeriod(p.key)}>
              {p.label}
            </Seg>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex items-center gap-1.5 rounded-xl border border-hairline bg-white px-2 py-1">
            <input
              type="date"
              value={custom.start}
              max={custom.end}
              onChange={(e) => onCustom({ ...custom, start: e.target.value })}
              className="bg-transparent text-[12px] text-ink-soft outline-none"
            />
            <span className="text-ink-faint">→</span>
            <input
              type="date"
              value={custom.end}
              min={custom.start}
              onChange={(e) => onCustom({ ...custom, end: e.target.value })}
              className="bg-transparent text-[12px] text-ink-soft outline-none"
            />
          </div>
        )}
      </div>

      {/* Compare */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-16 shrink-0">
          <SectionLabel>Compare</SectionLabel>
        </span>
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-hairline bg-stone-50 p-1">
          {COMPARES.map((c) => (
            <Seg key={c.key} active={compare === c.key} onClick={() => onCompare(c.key)} title={c.hint}>
              {c.label}
            </Seg>
          ))}
        </div>

        {/* Pinned custom baselines */}
        {pinned.map((p) => (
          <span key={p.id} className="inline-flex items-center">
            <button
              onClick={() => onCompare(p.id)}
              title={`Saved baseline · ${p.range.label}`}
              className={`rounded-l-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition ${
                compare === p.id
                  ? 'border-violet-200 bg-white text-ink ring-1 ring-violet-200'
                  : 'border-hairline bg-stone-50 text-ink-soft hover:bg-white/60'
              }`}
            >
              📌 {p.name}
            </button>
            <button
              onClick={() => onRemovePin(p.id)}
              title="Remove saved baseline"
              className="rounded-r-lg border border-l-0 border-hairline bg-stone-50 px-1.5 py-1.5 text-[11px] text-ink-faint hover:bg-white/60 hover:text-loss"
            >
              ✕
            </button>
          </span>
        ))}

        {/* Pin the current period as a reusable baseline */}
        {!pinning ? (
          <button
            onClick={() => {
              setPinName(suggestName(primaryRange))
              setPinning(true)
            }}
            className="rounded-lg border border-dashed border-stone-300 px-2.5 py-1.5 text-[12.5px] font-medium text-ink-faint transition hover:border-violet-300 hover:text-violet-700"
          >
            + Pin current as baseline
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-2 py-1">
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
              className="w-40 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-ink-faint"
            />
            <button
              onClick={() => {
                if (pinName.trim()) {
                  onPin(pinName.trim(), primaryRange)
                  setPinning(false)
                }
              }}
              className="rounded-md bg-violet-600 px-2 py-0.5 text-[11px] font-semibold text-white"
            >
              Save
            </button>
            <button onClick={() => setPinning(false)} className="px-1 text-[11px] text-ink-faint">
              ✕
            </button>
          </span>
        )}
      </div>
    </div>
  )
}

function suggestName(range: DateRange): string {
  return range.label
}
