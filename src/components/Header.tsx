import { BRAND } from '../data/mockData'

export type View = 'dashboard' | 'report'

export function Header({ view, onView }: { view: View; onView: (v: View) => void }) {
  return (
    <header className="sticky top-0 z-20">
      {/* Thin brand gradient bar — the one place colour runs full-width. */}
      <div className="metatiedye h-1 w-full" />
      <div className="border-b border-hairline bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <span className="text-[17px] font-bold tracking-tight text-ink">Daily Pulse</span>
            <span className="hidden h-4 w-px bg-hairline sm:block" />
            <span className="hidden text-[13px] text-ink-soft sm:inline">{BRAND.name}</span>
          </div>

          <div className="flex items-center gap-4">
            <Tabs view={view} onView={onView} />
            <span className="hidden text-[12px] text-ink-faint md:inline">
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
        aria-pressed={active}
        className={`rounded-lg px-3.5 py-2 text-[13.5px] font-semibold transition ${
          active ? 'bg-ink text-white shadow-sm' : 'text-ink-soft hover:bg-stone-100 hover:text-ink'
        }`}
      >
        {label}
      </button>
    )
  }
  return (
    <div className="flex items-center gap-1 rounded-xl border border-hairline bg-white p-1 shadow-card">
      {tab('dashboard', 'Live dashboard')}
      {tab('report', 'Morning report')}
    </div>
  )
}
