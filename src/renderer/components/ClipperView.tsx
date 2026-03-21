import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import type { Clip } from '@/shared/types'

export default function ClipperView() {
  const queryClient = useQueryClient()
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [memo, setMemo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: clips = [], isLoading } = useQuery<Clip[]>({
    queryKey: ['clips'],
    queryFn: () => window.plunge.db.clips.all(),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      await window.plunge.db.clips.insert({
        url: url.trim() || undefined,
        title: title.trim() || undefined,
        content: content.trim(),
        memo: memo.trim() || undefined,
        source_type: 'web',
      })
      setUrl('')
      setTitle('')
      setContent('')
      setMemo('')
      queryClient.invalidateQueries({ queryKey: ['clips'] })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 space-y-5">
      {/* Clip form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            type="url"
            placeholder="URL (optional)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="px-3 py-2 text-sm bg-surface border border-divider rounded-lg text-text
                       placeholder:text-text/30 focus:outline-none focus:border-gold/50 transition-colors"
          />
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-3 py-2 text-sm bg-surface border border-divider rounded-lg text-text
                       placeholder:text-text/30 focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>
        <textarea
          placeholder="Content *"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 text-sm bg-surface border border-divider rounded-lg text-text
                     placeholder:text-text/30 focus:outline-none focus:border-gold/50 transition-colors resize-none"
        />
        <textarea
          placeholder="Memo (optional)"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm bg-surface border border-divider rounded-lg text-text
                     placeholder:text-text/30 focus:outline-none focus:border-gold/50 transition-colors resize-none"
        />
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="px-4 py-2 text-sm font-medium bg-gold text-white rounded-lg cursor-pointer
                     hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? 'Saving...' : 'Clip'}
        </button>
      </form>

      {/* Divider */}
      <div className="border-t border-divider" />

      {/* Clips list */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-text/40 uppercase tracking-wider">
          Saved Clips {clips.length > 0 && `(${clips.length})`}
        </h3>

        {isLoading && (
          <p className="text-sm text-text/40 py-4 text-center">Loading...</p>
        )}

        {!isLoading && clips.length === 0 && (
          <p className="text-sm text-text/30 py-6 text-center">No clips yet. Clip something above.</p>
        )}

        <div className="space-y-2">
          {clips.map((clip, i) => (
            <motion.div
              key={clip.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="p-3 bg-surface border border-divider rounded-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium text-text truncate">
                  {clip.title || clip.url || 'Untitled'}
                </h4>
                <span className="text-[10px] text-text/30 whitespace-nowrap shrink-0">
                  {new Date(clip.clipped_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-text/60 mt-1 line-clamp-2">
                {clip.content}
              </p>
              {clip.memo && (
                <p className="text-[11px] text-gold/70 mt-1.5 italic">
                  {clip.memo}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
