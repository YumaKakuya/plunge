import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import type { Clip, Highlight, Tag } from '@/shared/types'
import { cn } from '@/renderer/lib/utils'
import { Input } from '@/renderer/components/ui/input'
import { Textarea } from '@/renderer/components/ui/textarea'
import { Button } from '@/renderer/components/ui/button'
import { Select } from '@/renderer/components/ui/select'
import { Card, CardContent } from '@/renderer/components/ui/card'
import { useAi, useAiStatus } from '@/renderer/hooks/useAi'

const COLORS = [
  { key: 'yellow', label: 'Yellow', bg: 'bg-yellow-100', ring: 'ring-yellow-300', dot: 'bg-yellow-400' },
  { key: 'green', label: 'Green', bg: 'bg-green-100', ring: 'ring-green-300', dot: 'bg-green-400' },
  { key: 'blue', label: 'Blue', bg: 'bg-blue-100', ring: 'ring-blue-300', dot: 'bg-blue-400' },
  { key: 'pink', label: 'Pink', bg: 'bg-pink-100', ring: 'ring-pink-300', dot: 'bg-pink-400' },
] as const

export default function HighlighterView() {
  const queryClient = useQueryClient()
  const [clipId, setClipId] = useState<number | ''>('')
  const [text, setText] = useState('')
  const [color, setColor] = useState('yellow')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [suggestedTags, setSuggestedTags] = useState<Tag[]>([])

  const { ask, isLoading: aiLoading, error: aiError } = useAi()
  const { data: aiStatus } = useAiStatus()

  const { data: highlights = [], isLoading } = useQuery<Highlight[]>({
    queryKey: ['highlights'],
    queryFn: () => window.plunge.db.highlights.all(),
  })

  const { data: clips = [] } = useQuery<Clip[]>({
    queryKey: ['clips'],
    queryFn: () => window.plunge.db.clips.all(),
  })

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: () => window.plunge.db.tags.all(),
  })

  const handleSuggestTags = async () => {
    if (!text.trim()) return
    const message =
      'Based on this highlighted text and note, suggest the most relevant tags from the available tags list. Return a JSON array of tag values (strings) that best match. Maximum 3 tags.'
    const context = {
      text: text.trim(),
      note: note.trim(),
      availableTags: tags.map((t) => ({ axis: t.axis, value: t.value })),
    }
    const result = await ask('keiri', message, context)
    if (!result) return
    try {
      // Strip markdown fences if present
      const cleaned = result.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()
      const values: string[] = JSON.parse(cleaned)
      const matched = values
        .map((v) => tags.find((t) => t.value === v))
        .filter((t): t is Tag => t !== undefined)
      setSuggestedTags(matched)
    } catch {
      // AI response wasn't valid JSON — ignore silently
      setSuggestedTags([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !clipId) return
    setSubmitting(true)
    try {
      await window.plunge.db.highlights.insert({
        clip_id: clipId as number,
        text: text.trim(),
        color,
        note: note.trim() || undefined,
      })
      setText('')
      setNote('')
      queryClient.invalidateQueries({ queryKey: ['highlights'] })
    } finally {
      setSubmitting(false)
    }
  }

  const colorConfig = (c: string) =>
    COLORS.find((col) => col.key === c) ?? COLORS[0]

  return (
    <div className="p-4 space-y-5">
      {/* Add form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Select
            value={clipId}
            onChange={(e) => setClipId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Select clip...</option>
            {clips.map((clip) => (
              <option key={clip.id} value={clip.id}>
                {clip.title || clip.url || `Clip #${clip.id}`}
              </option>
            ))}
          </Select>

          {/* Color picker */}
          <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-divider rounded-lg">
            {COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setColor(c.key)}
                className={cn(
                  'w-6 h-6 rounded-full transition-all cursor-pointer',
                  c.dot,
                  color === c.key ? 'ring-2 ring-offset-1 ' + c.ring + ' scale-110' : 'opacity-60 hover:opacity-100'
                )}
                title={c.label}
              />
            ))}
          </div>
        </div>

        <Textarea
          placeholder="Highlighted text *"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
        />
        <Input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            disabled={!text.trim() || !clipId || submitting}
            className="cursor-pointer"
          >
            {submitting ? 'Saving...' : 'Add Highlight'}
          </Button>
          {aiStatus?.configured && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!text.trim() || aiLoading}
              className="cursor-pointer"
              onClick={handleSuggestTags}
            >
              {aiLoading ? 'Thinking...' : 'Suggest Tags'}
            </Button>
          )}
        </div>

        {aiError && (
          <p className="text-xs text-red-500">{aiError}</p>
        )}

        {suggestedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {suggestedTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer',
                  'border border-divider hover:opacity-80 transition-opacity'
                )}
                style={tag.color ? { backgroundColor: tag.color + '22', borderColor: tag.color, color: tag.color } : undefined}
              >
                {tag.value}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Divider */}
      <div className="border-t border-divider" />

      {/* Highlights list */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-text/40 uppercase tracking-wider">
          Highlights {highlights.length > 0 && `(${highlights.length})`}
        </h3>

        {isLoading && (
          <p className="text-sm text-text/40 py-4 text-center">Loading...</p>
        )}

        {!isLoading && highlights.length === 0 && (
          <p className="text-sm text-text/30 py-6 text-center">No highlights yet.</p>
        )}

        <div className="space-y-2">
          {highlights.map((h, i) => {
            const cfg = colorConfig(h.color)
            return (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={cn('border-divider', cfg.bg)}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <span className={cn('w-2.5 h-2.5 rounded-full mt-1 shrink-0', cfg.dot)} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-text leading-relaxed">
                          "{h.text}"
                        </p>
                        {h.note && (
                          <p className="text-xs text-text/50 mt-1 italic">{h.note}</p>
                        )}
                        <span className="text-[10px] text-text/30 mt-1 block">
                          {new Date(h.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
