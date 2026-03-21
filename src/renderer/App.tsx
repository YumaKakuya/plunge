import { useEffect, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/renderer/stores/appStore'
import ModeTab from '@/renderer/components/ModeTab'

const Launcher = lazy(() => import('@/renderer/components/Launcher'))
const ToyBox = lazy(() => import('@/renderer/components/ToyBox'))
const ClockPanel = lazy(() => import('@/renderer/components/ClockPanel'))

const MODES = [
  { key: 'launch' as const, label: 'Home' },
  { key: 'toys' as const, label: 'Toys' },
  { key: 'clock' as const, label: 'Clock' },
]

export default function App() {
  const mode = useAppStore((s) => s.mode)
  const setMode = useAppStore((s) => s.setMode)
  const setLaunchView = useAppStore((s) => s.setLaunchView)
  const setExpandedCard = useAppStore((s) => s.setExpandedCard)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault()
        setMode('launch')
      } else if (e.ctrlKey && e.key === 't') {
        e.preventDefault()
        setMode('toys')
      } else if (e.ctrlKey && e.key === 'w') {
        e.preventDefault()
        setMode('clock')
      } else if (e.ctrlKey && e.key === '1') {
        e.preventDefault()
        if (useAppStore.getState().mode === 'launch') setLaunchView('project')
      } else if (e.ctrlKey && e.key === '2') {
        e.preventDefault()
        if (useAppStore.getState().mode === 'launch') setLaunchView('role')
      } else if (e.ctrlKey && e.key === '3') {
        e.preventDefault()
        if (useAppStore.getState().mode === 'launch') setLaunchView('tool')
      } else if (e.key === 'Escape') {
        setExpandedCard(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [setMode, setLaunchView, setExpandedCard])

  return (
    <div className="flex flex-col h-screen bg-base text-text">
      {/* Title bar / drag region */}
      <div
        className="flex items-center gap-1 px-3 border-b border-divider bg-surface shrink-0"
        style={{ WebkitAppRegion: 'drag', height: 44 } as React.CSSProperties}
      >
        <button
          onClick={() => setMode('launch')}
          className="text-[15px] font-semibold text-text mr-3 cursor-pointer bg-transparent border-none hover:text-gold transition-colors duration-100"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          Plunge.
        </button>
        {MODES.map((m) => (
          <ModeTab
            key={m.key}
            label={m.label}
            active={mode === m.key}
            onClick={() => setMode(m.key)}
          />
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0"
          >
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full text-text/40 text-sm">
                  Loading...
                </div>
              }
            >
              {mode === 'launch' && <Launcher />}
              {mode === 'toys' && <ToyBox />}
              {mode === 'clock' && <ClockPanel />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
