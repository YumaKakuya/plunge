import { useState, useCallback, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Clip, Highlight, HighlightPosition } from '@/shared/types'
import { Button } from '@/renderer/components/ui/button'

const HIGHLIGHT_COLORS = [
  { name: 'yellow', value: '#fef08a' },
  { name: 'green', value: '#bbf7d0' },
  { name: 'blue', value: '#bfdbfe' },
  { name: 'pink', value: '#fbcfe8' },
] as const

interface FloatingToolbar {
  x: number
  y: number
  text: string
  startOffset: number
  endOffset: number
}

interface Props {
  clip: Clip
  onClose: () => void
}

export default function ClipDetailView({ clip, onClose }: Props) {
  const queryClient = useQueryClient()
  const contentRef = useRef<HTMLDivElement>(null)
  const [toolbar, setToolbar] = useState<FloatingToolbar | null>(null)
  const [selectedColor, setSelectedColor] = useState<string>('yellow')

  const { data: allHighlights = [] } = useQuery<Highlight[]>({
    queryKey: ['highlights'],
    queryFn: () => window.plunge.db.highlights.all(),
  })

  const clipHighlights = allHighlights
    .filter((h) => h.clip_id === clip.id)
    .map((h) => {
      if (!h.position) return null
      try {
        const pos = JSON.parse(h.position) as HighlightPosition
        return { ...h, pos }
      } catch {
        return null
      }
    })
    .filter((h): h is Highlight & { pos: HighlightPosition } => h !== null)
    .sort((a, b) => a.pos.startOffset - b.pos.startOffset)

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !contentRef.current) {
      setToolbar(null)
      return
    }

    const text = selection.toString().trim()
    if (!text) {
      setToolbar(null)
      return
    }

    // Compute offset relative to the plain-text content
    const range = selection.getRangeAt(0)
    const preRange = document.createRange()
    preRange.selectNodeContents(contentRef.current)
    preRange.setEnd(range.startContainer, range.startOffset)
    const startOffset = preRange.toString().length
    const endOffset = startOffset + text.length

    // Position toolbar near selection
    const rect = range.getBoundingClientRect()
    const containerRect = contentRef.current.getBoundingClientRect()
    const x = Math.min(
      Math.max(rect.left - containerRect.left + rect.width / 2, 0),
      containerRect.width
    )
    const y = rect.top - containerRect.top - 8

    setToolbar({ x, y, text, startOffset, endOffset })
  }, [])

  const handleHighlight = async () => {
    if (!toolbar) return

    const position: HighlightPosition = {
      startOffset: toolbar.startOffset,
      endOffset: toolbar.endOffset,
      contextBefore: clip.content.slice(Math.max(0, toolbar.startOffset - 30), toolbar.startOffset),
      contextAfter: clip.content.slice(toolbar.endOffset, toolbar.endOffset + 30),
    }

    await window.plunge.db.highlights.insert({
      clip_id: clip.id,
      text: toolbar.text,
      color: selectedColor,
      position: JSON.stringify(position),
    })

    queryClient.invalidateQueries({ queryKey: ['highlights'] })
    setToolbar(null)
    window.getSelection()?.removeAllRanges()
  }

  // Close toolbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbar && !(e.target as Element)?.closest('[data-highlight-toolbar]')) {
        setToolbar(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [toolbar])

  // Render content with highlights applied
  const renderContent = () => {
    if (clipHighlights.length === 0) {
      return <span>{clip.content}</span>
    }

    const segments: React.ReactNode[] = []
    let lastEnd = 0

    for (const h of clipHighlights) {
      const start = h.pos.startOffset
      const end = h.pos.endOffset

      // Skip overlapping or out-of-bounds highlights
      if (start < lastEnd || start >= clip.content.length) continue
      const safeEnd = Math.min(end, clip.content.length)

      // Text before this highlight
      if (start > lastEnd) {
        segments.push(
          <span key={`t-${lastEnd}`}>{clip.content.slice(lastEnd, start)}</span>
        )
      }

      // Highlighted span
      const bgColor = HIGHLIGHT_COLORS.find((c) => c.name === h.color)?.value ?? '#fef08a'
      segments.push(
        <mark
          key={`h-${h.id}`}
          style={{ backgroundColor: bgColor, borderRadius: '2px', padding: '0 1px' }}
          title={h.note || undefined}
        >
          {clip.content.slice(start, safeEnd)}
        </mark>
      )

      lastEnd = safeEnd
    }

    // Remaining text after last highlight
    if (lastEnd < clip.content.length) {
      segments.push(
        <span key={`t-${lastEnd}`}>{clip.content.slice(lastEnd)}</span>
      )
    }

    return <>{segments}</>
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="cursor-pointer shrink-0"
        >
          Back
        </Button>
        <h3 className="text-sm font-medium text-text truncate flex-1 text-right">
          {clip.title || clip.url || 'Untitled'}
        </h3>
      </div>

      {clip.url && (
        <p className="text-[11px] text-text-muted truncate">{clip.url}</p>
      )}

      {/* Content with highlights */}
      <div className="relative">
        <div
          ref={contentRef}
          onMouseUp={handleMouseUp}
          className="text-sm text-text leading-relaxed whitespace-pre-wrap select-text bg-surface border border-divider rounded-md p-3 max-h-[60vh] overflow-y-auto"
        >
          {renderContent()}
        </div>

        {/* Floating highlight toolbar */}
        {toolbar && (
          <div
            data-highlight-toolbar
            className="absolute z-50 flex items-center gap-1 bg-bg border border-divider rounded-lg shadow-lg p-1.5"
            style={{
              left: `${toolbar.x}px`,
              top: `${toolbar.y}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedColor(c.name)}
                className="w-5 h-5 rounded-full border-2 transition-transform cursor-pointer"
                style={{
                  backgroundColor: c.value,
                  borderColor: selectedColor === c.name ? '#4A413B' : 'transparent',
                  transform: selectedColor === c.name ? 'scale(1.2)' : 'scale(1)',
                }}
                title={c.name}
              />
            ))}
            <Button
              size="sm"
              onClick={handleHighlight}
              className="ml-1 h-6 text-xs cursor-pointer"
            >
              Highlight
            </Button>
          </div>
        )}
      </div>

      {/* Highlight count */}
      {clipHighlights.length > 0 && (
        <p className="text-[11px] text-text-muted">
          {clipHighlights.length} highlight{clipHighlights.length !== 1 ? 's' : ''}
        </p>
      )}

      {clip.memo && (
        <div className="border-t border-divider pt-3">
          <p className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Memo</p>
          <p className="text-xs text-text-secondary italic">{clip.memo}</p>
        </div>
      )}
    </div>
  )
}
