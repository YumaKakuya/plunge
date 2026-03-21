import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/renderer/stores/appStore'
import type { ToyView } from '@/shared/types'
import { cn } from '@/renderer/lib/utils'
import ClipperView from './ClipperView'
import HighlighterView from './HighlighterView'
import DocReaderView from './DocReaderView'

const tabs: { key: ToyView; label: string }[] = [
  { key: 'clipper', label: 'Clipper' },
  { key: 'highlighter', label: 'Highlighter' },
  { key: 'reader', label: 'Reader' },
]

const viewMap: Record<ToyView, React.ComponentType> = {
  clipper: ClipperView,
  highlighter: HighlighterView,
  reader: DocReaderView,
}

export default function ToyBox() {
  const toyView = useAppStore((s) => s.toyView)
  const setToyView = useAppStore((s) => s.setToyView)

  const ActiveView = viewMap[toyView]

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-1 border-b border-divider bg-base">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setToyView(tab.key)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 cursor-pointer',
              toyView === tab.key
                ? 'bg-selected text-text'
                : 'bg-transparent text-text-muted hover:text-text hover:bg-surface-hover'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* View content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={toyView}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            <ActiveView />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
