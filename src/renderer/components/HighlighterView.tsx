import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import type { Clip, Highlight } from '@/shared/types'

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

  const { data: highlights = [], isLoading } = useQuery<Highlight[]>({
    queryKey: ['highlights'],
    queryFn: () => window.plunge.db.highlights.all(),
  })

  const { data: clips = [] } = useQuery<Clip[]>({
    queryKey: ['clips'],
    queryFn: () => window.plunge.db.clips.all(),
  })

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
          <select
            value={clipId}
            onChange={(e) => setClipId(e.target.value ? Number(e.target.value) : '')}
            className="px-3 py-2 text-sm bg-surface border border-divider rounded-lg text-text
                       focus:outline-none focus:border-gold/50 transition-colors cursor-pointer"
          >
            <option value="">Select clip...</option>
            {clips.map((clip) => (
              <option key={clip.id} value={clip.id}>
                {clip.title || clip.url || `Clip #${clip.id}`}
              </option>
            ))}
          </select>

          {/* Color picker */}
          <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-divider rounded-lg">
            {COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setColor(c.key)}
                className={[
                  'w-6 h-6 rounded-full transition-all cursor-pointer',
                  c.dot,
                  color === c.key ? 'ring-2 ring-offset-1 ' + c.ring + ' scale-110' : 'opacity-60 hover:opacity-100',
                ].join(' ')}
                title={c.label}
              />
            ))}
          </div>
        </div>

        <textarea
          placeholder="Highlighted text *"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm bg-surface border border-divider rounded-lg text-text
                     placeholder:text-text/30 focus:outline-none focus:border-gold/50 transition-colors resize-none"
        />
        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-surface border border-divider rounded-lg text-text
                     placeholder:text-text/30 focus:outline-none focus:border-gold/50 transition-colors"
        />
        <button
          type="submit"
          disabled={!text.trim() || !clipId || submitting}
          className="px-4 py-2 text-sm font-medium bg-gold text-white rounded-lg cursor-pointer
                     hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? 'Saving...' : 'Add Highlight'}
        </button>
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
                className={`p-3 rounded-lg border border-divider ${cfg.bg}`}
              >
                <div className="flex items-start gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${cfg.dot}`} />
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
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
