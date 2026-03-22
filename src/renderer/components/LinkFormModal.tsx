import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/renderer/components/ui/button'
import { Input } from '@/renderer/components/ui/input'
import { Card } from '@/renderer/components/ui/card'
import { cn } from '@/renderer/lib/utils'
import type { Tag } from '@/shared/types'

interface LinkFormModalProps {
  open: boolean
  onClose: () => void
}

type GroupedTags = Map<string, Tag[]>

function groupTagsByAxis(tags: Tag[]): GroupedTags {
  const groups: GroupedTags = new Map()
  for (const tag of tags) {
    const existing = groups.get(tag.axis) ?? []
    existing.push(tag)
    groups.set(tag.axis, existing)
  }
  return groups
}

export default function LinkFormModal({ open, onClose }: LinkFormModalProps) {
  const queryClient = useQueryClient()

  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [favicon, setFavicon] = useState<string | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [fetching, setFetching] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => window.plunge.db.tags.all(),
  })

  const groupedTags = groupTagsByAxis(tags)

  const fetchMeta = useCallback(async (targetUrl: string) => {
    if (!targetUrl.trim()) return
    setFetching(true)
    try {
      const meta = await window.plunge.util.fetchMeta(targetUrl)
      if (meta.title && !name) {
        setName(meta.title)
      }
      if (meta.favicon) {
        setFavicon(meta.favicon)
      }
    } finally {
      setFetching(false)
    }
  }, [name])

  const handleUrlBlur = () => {
    fetchMeta(url)
  }

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      fetchMeta(url)
    }
  }

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || !name.trim() || submitting) return

    setSubmitting(true)
    try {
      await window.plunge.db.links.insert({
        name: name.trim(),
        url: url.trim(),
        icon: favicon ?? undefined,
        tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      })
      await queryClient.invalidateQueries({ queryKey: ['links'] })
      resetAndClose()
    } finally {
      setSubmitting(false)
    }
  }

  const resetAndClose = () => {
    setUrl('')
    setName('')
    setFavicon(null)
    setSelectedTagIds([])
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={resetAndClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-[360px] max-h-[80vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
          >
            <Card className="bg-surface border-divider p-5">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <h2 className="text-[16px] font-semibold text-text">
                  Add Link
                </h2>

                {/* URL */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-text-muted">
                    URL
                  </label>
                  <div className="flex items-center gap-2">
                    {favicon && (
                      <img
                        src={favicon}
                        alt=""
                        className="w-5 h-5 rounded-sm shrink-0"
                        onError={() => setFavicon(null)}
                      />
                    )}
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onBlur={handleUrlBlur}
                      onKeyDown={handleUrlKeyDown}
                      required
                      className="select-text"
                    />
                  </div>
                  {fetching && (
                    <span className="text-[11px] text-text-muted">
                      Fetching page info...
                    </span>
                  )}
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-text-muted">
                    Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Link name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="select-text"
                  />
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-text-muted">
                      Tags
                    </label>
                    {Array.from(groupedTags.entries()).map(([axis, axisTags]) => (
                      <div key={axis} className="flex flex-col gap-1">
                        <span className="text-[11px] uppercase tracking-wider text-text-muted">
                          {axis}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {axisTags.map((tag) => (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleTag(tag.id)}
                              className={cn(
                                'px-2.5 py-1 rounded-md text-[12px] border transition-colors duration-100 cursor-pointer',
                                selectedTagIds.includes(tag.id)
                                  ? 'bg-gold/20 border-gold text-text font-medium'
                                  : 'bg-surface border-divider text-text-muted hover:bg-surface-hover'
                              )}
                            >
                              {tag.value}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resetAndClose}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!url.trim() || !name.trim() || submitting}
                    className="cursor-pointer"
                  >
                    {submitting ? 'Adding...' : 'Add Link'}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
