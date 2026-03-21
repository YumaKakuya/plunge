import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import type { Clip } from '@/shared/types'
import { Input } from '@/renderer/components/ui/input'
import { Textarea } from '@/renderer/components/ui/textarea'
import { Button } from '@/renderer/components/ui/button'
import { Card, CardContent } from '@/renderer/components/ui/card'
import { useAi, useAiStatus } from '@/renderer/hooks/useAi'

export default function ClipperView() {
  const queryClient = useQueryClient()
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [memo, setMemo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { ask, isLoading: aiLoading, error: aiError } = useAi()
  const { data: aiStatus } = useAiStatus()

  const handleAiExtract = async () => {
    if (!url.trim()) return
    const message = 'Extract the main content from this web page. Return a JSON object with fields: title (string), content (string - the main text content), memo (string - a brief one-line summary of what this page is about).'
    const result = await ask('eigyo', message, { url: url.trim() })
    if (!result) return
    try {
      // Strip markdown code fences if present
      const cleaned = result.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
      const parsed = JSON.parse(cleaned)
      if (parsed.title) setTitle(parsed.title)
      if (parsed.content) setContent(parsed.content)
      if (parsed.memo) setMemo(parsed.memo)
    } catch {
      // If JSON parsing fails, put raw response into content
      setContent(result)
    }
  }

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
        <div className="flex gap-3">
          <div className="grid grid-cols-2 gap-3 flex-1">
            <Input
              type="url"
              placeholder="URL (optional)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          {aiStatus?.configured && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!url.trim() || aiLoading}
              onClick={handleAiExtract}
              className="cursor-pointer shrink-0"
            >
              {aiLoading ? 'Extracting...' : 'AI Extract'}
            </Button>
          )}
        </div>
        {aiError && (
          <p className="text-xs text-destructive">{aiError}</p>
        )}
        <Textarea
          placeholder="Content *"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
        />
        <Textarea
          placeholder="Memo (optional)"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={2}
        />
        <Button
          type="submit"
          disabled={!content.trim() || submitting}
          className="cursor-pointer"
        >
          {submitting ? 'Saving...' : 'Clip'}
        </Button>
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
            >
              <Card className="bg-surface border-divider">
                <CardContent className="p-3">
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
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
