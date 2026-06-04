import { useMemo, useState } from 'react'
import type { CompareKey, DateRange, PeriodKey, PinnedBaseline } from '../types'
import {
  YESTERDAY,
  aggregate,
  decompose,
  resolveComparison,
  resolvePeriod,
} from '../lib/periods'
import { buildAnalysis } from '../lib/commentary'
import { ANCHOR } from '../data/mockData'
import { PeriodControls } from './PeriodControls'
import { DiagnosisHero } from './DiagnosisHero'
import { MetricRow } from './MetricRow'
import { RevenueBlock } from './RevenueBlock'
import { AiPanel, TopProducts, TrafficPanel } from './Panels'

export function Dashboard() {
  // Default to "Yesterday" vs the trailing-28d same-weekday baseline — the
  // diagnostic default the spec calls for.
  const [period, setPeriod] = useState<PeriodKey>('yesterday')
  const [custom, setCustom] = useState({ start: YESTERDAY, end: YESTERDAY })
  const [compare, setCompare] = useState<CompareKey>('baseline')
  const [pinned, setPinned] = useState<PinnedBaseline[]>([
    // Seed one realistic saved baseline so the feature is visible on load.
    {
      id: 'bfcm-2025',
      name: 'BFCM 2025',
      range: { start: '2025-11-24', end: '2025-12-01', label: '24 Nov – 1 Dec' },
    },
  ])

  // "Live on open" affordance. This is a QUERY-ON-OPEN snapshot, not a real-time
  // background monitor — refreshing re-runs the query and re-stamps the time.
  // (Production: hit the Shopify API here; v2 could poll. Today it just re-stamps.)
  const [asOf, setAsOf] = useState(formatAsOf(ANCHOR.asOf))
  const [refreshing, setRefreshing] = useState(false)
  const refresh = () => {
    setRefreshing(true)
    // Simulate the round-trip; data is static in the prototype.
    setTimeout(() => {
      setAsOf(formatAsOf(ANCHOR.asOf))
      setRefreshing(false)
    }, 450)
  }

  const primaryRange: DateRange = useMemo(
    () => resolvePeriod(period, custom),
    [period, custom],
  )
  const cur = useMemo(() => aggregate(primaryRange), [primaryRange])
  const comparison = useMemo(
    () => resolveComparison(primaryRange, compare, pinned),
    [primaryRange, compare, pinned],
  )

  const base = comparison?.totals ?? cur
  const baseLabel = comparison?.label ?? '—'
  const spine = useMemo(() => decompose(cur, base), [cur, base])
  const analysis = useMemo(
    () => buildAnalysis(cur, base, spine, baseLabel),
    [cur, base, spine, baseLabel],
  )

  const addPin = (name: string, range: DateRange) => {
    const id = 'pin-' + range.start + '-' + range.end
    setPinned((prev) => (prev.some((p) => p.id === id) ? prev : [...prev, { id, name, range }]))
    setCompare(id)
  }
  const removePin = (id: string) => {
    setPinned((prev) => prev.filter((p) => p.id !== id))
    if (compare === id) setCompare('baseline')
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-6">
      {/* Title + live-on-open affordance */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink">{primaryRange.label}</h1>
          <p className="text-[12.5px] text-ink-soft">{primaryRange.label === cur.range.label ? cur.range.label : ''} performance</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11.5px] text-ink-faint">as of {asOf}</span>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-white px-2.5 py-1.5 text-[12px] font-medium text-ink-soft shadow-card transition hover:text-ink disabled:opacity-60"
          >
            <span className={refreshing ? 'inline-block animate-spin' : ''}>↻</span>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-hairline bg-white p-4 shadow-card">
        <PeriodControls
          period={period}
          onPeriod={setPeriod}
          custom={custom}
          onCustom={setCustom}
          compare={compare}
          onCompare={setCompare}
          pinned={pinned}
          onPin={addPin}
          onRemovePin={removePin}
          primaryRange={primaryRange}
        />
      </div>

      {/* The spine: diagnosis + headline metrics */}
      <DiagnosisHero spine={spine} baseLabel={baseLabel} />
      <MetricRow cur={cur} base={base} />

      {/* Revenue → gross profit, plus AI read */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RevenueBlock cur={cur} base={base} />
        <AiPanel analysis={analysis} />
      </div>

      {/* Products & traffic */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TopProducts cur={cur} />
        <TrafficPanel cur={cur} />
      </div>

      <p className="pb-4 pt-1 text-center text-[11px] text-ink-faint">
        Prototype · mocked Shopify data · single channel (online store) · queries on open, not a
        real-time monitor
      </p>
    </div>
  )
}

function formatAsOf(iso: string): string {
  const d = new Date(iso)
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${time}, ${date}`
}
