import { BRAND } from '../data/mockData'

export type View = 'dashboard' | 'report'

export function Header({ view, onView }: { view: View; onView: (v: View) => void }) {
  return (
    <header className="sticky top-0 z-20">
      {/* Thin brand gradient bar — the one place colour runs full-width. */}
      <div className="metatiedye h-1 w-full" />
      <div className="border-b border-hairline bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-baseline gap-3">
            <span className="text-[15px] font-bold tracking-tight text-ink">
              Daily Pulse
            </span>
            <span className="hidden text-[12px] text-ink-faint sm:inline">
              {BRAND.name} · {BRAND.blurb}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Tabs view={view} onView={onView} />
            <span className="hidden text-[11px] text-ink-faint md:inline">
              by <span className="font-semibold text-ink-soft">Frontleft</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

function Tabs({ view, onView }: { view: View; onView: (v: View) => void }) {
  const tab = (key: View, label: string) => {
    const active = view === key
    return (
      <button
        onClick={() => onView(key)}
        className={`relative rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
          active ? 'text-ink' : 'text-ink-faint hover:text-ink-soft'
        }`}
      >
        {label}
        {active && <span className="metatiedye absolute inset-x-2 -bottom-px h-0.5 rounded-full" />}
      </button>
    )
  }
  return (
    <div className="flex items-center rounded-xl border border-hairline bg-white p-0.5 shadow-card">
      {tab('dashboard', 'Live dashboard')}
      {tab('report', 'Morning report')}
    </div>
  )
}
