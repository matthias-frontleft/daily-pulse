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
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

/**
 * Coloured % delta. `polarity` decides which direction is "good".
 * For ecommerce metrics, up is good (green); flat is muted.
 */
export function Delta({
  change,
  polarity = 'good',
  className = '',
}: {
  change: number | null
  polarity?: 'good' | 'bad' | 'neutral'
  className?: string
}) {
  if (change === null) return <span className="text-ink-faint">—</span>
  const flat = Math.abs(change) < 0.005
  let cls = 'text-ink-faint'
  if (!flat && polarity !== 'neutral') {
    const improves = polarity === 'good' ? change > 0 : change < 0
    cls = improves ? 'text-positive' : 'text-loss'
  }
  return <span className={`tnum ${cls} ${className}`}>{fmtPctChange(change)}</span>
}

/** Tiny triangle marker echoing delta direction. */
export function Arrow({ change }: { change: number | null }) {
  if (change === null || Math.abs(change) < 0.005) return null
  const up = change > 0
  return <span className={`text-[9px] ${up ? 'text-positive' : 'text-loss'}`}>{up ? '▲' : '▼'}</span>
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-ink-faint">
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
