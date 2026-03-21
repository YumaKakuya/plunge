import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { useAppStore } from '@/renderer/stores/appStore'
import type { Link, Tag } from '@/shared/types'

function parseTags(link: Link): Tag[] {
  if (typeof link.tags === 'string') {
    try {
      return JSON.parse(link.tags) as Tag[]
    } catch {
      return []
    }
  }
  return link.tags ?? []
}

type GroupedLinks = Map<string, Link[]>

function groupByAxis(links: Link[], axis: 'project' | 'role' | 'tool'): GroupedLinks {
  const groups: GroupedLinks = new Map()
  for (const link of links) {
    const tags = parseTags(link)
    const matching = tags.filter((t) => t.axis === axis)
    if (matching.length === 0) {
      const existing = groups.get('Untagged') ?? []
      existing.push(link)
      groups.set('Untagged', existing)
    } else {
      for (const tag of matching) {
        const existing = groups.get(tag.value) ?? []
        existing.push(link)
        groups.set(tag.value, existing)
      }
    }
  }
  return groups
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

export default function Launcher() {
  const launchView = useAppStore((s) => s.launchView)
  const expandedCard = useAppStore((s) => s.expandedCard)
  const toggleCard = useAppStore((s) => s.toggleCard)

  const { data: links = [] } = useQuery({
    queryKey: ['links'],
    queryFn: () => window.plunge.db.links.all(),
  })

  const grouped = groupByAxis(links, launchView)
  const groupKeys = Array.from(grouped.keys())

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'F1' && groupKeys[0]) {
        e.preventDefault()
        toggleCard(groupKeys[0])
      } else if (e.key === 'F2' && groupKeys[1]) {
        e.preventDefault()
        toggleCard(groupKeys[1])
      } else if (e.key === 'F3' && groupKeys[2]) {
        e.preventDefault()
        toggleCard(groupKeys[2])
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [groupKeys, toggleCard])

  return (
    <div className="flex flex-col gap-1 p-3 overflow-y-auto h-full">
      {groupKeys.map((key) => {
        const isExpanded = expandedCard === key
        const items = grouped.get(key) ?? []

        return (
          <motion.div
            key={key}
            layout
            className="rounded-lg bg-surface border border-divider overflow-hidden"
          >
            <button
              onClick={() => toggleCard(key)}
              className="w-full px-4 py-3 text-left text-sm font-semibold text-text
                         hover:bg-surface-hover transition-colors cursor-pointer flex items-center justify-between"
            >
              <span>{key}</span>
              <span className="text-text/40 text-xs">{items.length}</span>
            </button>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <motion.div
                    className="grid grid-cols-4 gap-2 px-4 pb-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {items.map((link) => (
                      <motion.button
                        key={link.id}
                        variants={itemVariants}
                        onClick={() => window.plunge.openExternal(link.url)}
                        className="flex flex-col items-center gap-1.5 p-2 rounded-md
                                   hover:bg-surface-hover transition-colors cursor-pointer"
                        title={link.url}
                      >
                        <span className="text-xl leading-none">
                          {link.icon ?? '🔗'}
                        </span>
                        <span className="text-[11px] text-text/70 truncate w-full text-center">
                          {link.name}
                        </span>
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}
