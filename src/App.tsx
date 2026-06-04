import { useState } from 'react'
import { Header, type View } from './components/Header'
import { Dashboard } from './components/Dashboard'
import { MorningReport } from './components/MorningReport'

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  return (
    <div className="min-h-full">
      <Header view={view} onView={setView} />
      {view === 'dashboard' ? <Dashboard /> : <MorningReport />}
    </div>
  )
}
