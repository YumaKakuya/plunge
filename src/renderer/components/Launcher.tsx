import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/renderer/stores/appStore'
import type { Link, Tag, ToyView } from '@/shared/types'
import { Button } from '@/renderer/components/ui/button'
import { Card } from '@/renderer/components/ui/card'
import { cn } from '@/renderer/lib/utils'

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

function formatJSTTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' JST'
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.15 } },
}

const navCardGridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const navCardVariants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.15 } },
}

interface NavCardProps {
  icon: string
  label: string
  summary?: string
  onClick: () => void
}

function NavCard({ icon, label, summary, onClick }: NavCardProps) {
  return (
    <motion.button
      variants={navCardVariants}
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-2 p-5 rounded-xl',
        'bg-surface border border-divider',
        'hover:bg-surface-hover hover:border-gold/30 transition-all duration-100',
        'cursor-pointer text-left'
      )}
    >
      <span className="text-[28px] leading-none select-none" aria-hidden>
        {icon}
      </span>
      <span className="text-[16px] font-semibold text-text">{label}</span>
      {summary && (
        <span className="text-[13px] text-text-muted">{summary}</span>
      )}
    </motion.button>
  )
}

export default function Launcher() {
  const launchView = useAppStore((s) => s.launchView)
  const expandedCard = useAppStore((s) => s.expandedCard)
  const toggleCard = useAppStore((s) => s.toggleCard)
  const setMode = useAppStore((s) => s.setMode)
  const setToyView = useAppStore((s) => s.setToyView)

  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const { data: links = [] } = useQuery({
    queryKey: ['links'],
    queryFn: () => window.plunge.db.links.all(),
  })

  const { data: clips = [] } = useQuery({
    queryKey: ['clips'],
    queryFn: () => window.plunge.db.clips.all(),
  })

  const { data: highlights = [] } = useQuery({
    queryKey: ['highlights'],
    queryFn: () => window.plunge.db.highlights.all(),
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

  const navigateToToy = (view: ToyView) => {
    setMode('toys')
    setToyView(view)
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold text-text leading-tight tracking-tight">
          Plunge.
        </h1>
        <p className="text-[13px] text-text-muted">情報の取水口 — ツールと素材をここから</p>
      </div>

      {/* Nav Card Grid */}
      <motion.div
        className="grid grid-cols-2 gap-3"
        variants={navCardGridVariants}
        initial="hidden"
        animate="visible"
      >
        <NavCard
          icon="📋"
          label="Clipper"
          summary={`${clips.length} clips`}
          onClick={() => navigateToToy('clipper')}
        />
        <NavCard
          icon="🖍"
          label="Highlighter"
          summary={`${highlights.length} marks`}
          onClick={() => navigateToToy('highlighter')}
        />
        <NavCard
          icon="📖"
          label="Reader"
          onClick={() => navigateToToy('reader')}
        />
        <NavCard
          icon="🕐"
          label="Clock"
          summary={formatJSTTime(now)}
          onClick={() => setMode('clock')}
        />
      </motion.div>

      {/* Links Section Divider */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-medium text-text-muted uppercase tracking-wider">
          Links
        </span>
        <div className="flex-1 h-px bg-divider" />
      </div>

      {/* Links */}
      {links.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <span
            className="text-[24px] text-text-muted leading-none select-none"
            aria-hidden
          >
            🔗
          </span>
          <p className="text-sm text-text-secondary">
            Add links to launch them from here
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {groupKeys.map((key) => {
            const isExpanded = expandedCard === key
            const items = grouped.get(key) ?? []

            return (
              <motion.div key={key} layout className="overflow-hidden">
                <Card className="bg-surface border-divider overflow-hidden">
                  <Button
                    variant="ghost"
                    onClick={() => toggleCard(key)}
                    className="w-full justify-between px-4 py-3 text-left text-sm font-semibold text-text
                               hover:bg-surface-hover cursor-pointer h-auto rounded-none"
                  >
                    <span>{key}</span>
                    <span className="text-text-muted text-xs font-normal">
                      {items.length}
                    </span>
                  </Button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15, ease: 'easeInOut' }}
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
                              onClick={() =>
                                window.plunge.openExternal(link.url)
                              }
                              className="flex flex-col items-center gap-1.5 p-2 rounded-lg
                                         hover:bg-surface-hover transition-colors duration-100 cursor-pointer"
                              title={link.url}
                            >
                              <span className="text-xl leading-none">
                                {link.icon ?? '\uD83D\uDD17'}
                              </span>
                              <span className="text-[11px] text-text-secondary truncate w-full text-center">
                                {link.name}
                              </span>
                            </motion.button>
                          ))}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
