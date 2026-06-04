import type { ReactNode } from 'react'
import { fmtPctChange } from '../lib/format'

/** Small pill for tags, sources, flags. */
export function Pill({
  children,
  tone = 'neutral',
  title,
}: {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'warn' | 'good' | 'info'
  title?: string
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-stone-100 text-ink-soft border-stone-200',
    accent: 'bg-violet-50 text-violet-700 border-violet-200',
    warn: 'bg-orange-50 text-orange-700 border-orange-200',
    good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
  }
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-semibold leading-none ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

/**
 * Coloured % delta with a direction arrow built in. `polarity` decides which
 * direction is "good". For ecommerce metrics up is good (green); flat is muted.
 * Rendered as a subtle chip so deltas read as a distinct layer from the values.
 */
export function Delta({
  change,
  polarity = 'good',
  chip = false,
}: {
  change: number | null
  polarity?: 'good' | 'bad' | 'neutral'
  chip?: boolean
}) {
  if (change === null)
    return <span className="text-[13px] font-medium text-ink-faint">—</span>
  const flat = Math.abs(change) < 0.005
  let cls = 'text-ink-faint'
  let chipCls = 'bg-stone-100 text-ink-faint'
  if (!flat && polarity !== 'neutral') {
    const improves = polarity === 'good' ? change > 0 : change < 0
    cls = improves ? 'text-positive' : 'text-loss'
    chipCls = improves ? 'bg-emerald-50 text-positive' : 'bg-red-50 text-loss'
  }
  const arrow = flat ? '' : change > 0 ? '▲ ' : '▼ '
  if (chip) {
    return (
      <span
        className={`tnum inline-flex items-center rounded-md px-1.5 py-0.5 text-[12.5px] font-semibold ${chipCls}`}
      >
        {arrow}
        {fmtPctChange(change)}
      </span>
    )
  }
  return (
    <span className={`tnum text-[13px] font-semibold ${cls}`}>
      {arrow}
      {fmtPctChange(change)}
    </span>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
      {children}
    </span>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-hairline bg-white shadow-card ${className}`}>
      {children}
    </div>
  )
}

// ── Segmented control ────────────────────────────────────────────────────────
// High-contrast: the active option is a solid dark pill, inactive options are
// clearly clickable on hover. Used for both the header tabs and period controls.

export function SegGroup({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-hairline bg-stone-100 p-1">
      {children}
    </div>
  )
}

export function Seg({
  active,
  onClick,
  children,
  title,
  size = 'md',
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  title?: string
  size?: 'md' | 'sm'
}) {
  const pad = size === 'sm' ? 'px-2.5 py-1.5 text-[13px]' : 'px-3.5 py-2 text-[13.5px]'
  return (
    <button
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`rounded-lg font-semibold transition ${pad} ${
        active
          ? 'bg-ink text-white shadow-sm'
          : 'text-ink-soft hover:bg-white hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
