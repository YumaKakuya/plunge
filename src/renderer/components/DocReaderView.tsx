import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

function mdToHtml(md: string): string {
  return md
    // Code blocks (``` ... ```)
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-base p-3 rounded text-xs overflow-x-auto my-2"><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-base px-1 py-0.5 rounded text-xs">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-divider my-3" />')
    // Unordered list items
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-gold underline">$1</a>')
    // Line breaks
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

const CHUNK_SIZE = 2000

export default function DocReaderView() {
  const [markdown, setMarkdown] = useState('')
  const [speed, setSpeed] = useState(1)
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const chunkIndex = useRef(0)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const plainText = markdown.replace(/[#*`\[\]()_~>-]/g, '').trim()

  const chunks = useCallback(() => {
    const result: string[] = []
    for (let i = 0; i < plainText.length; i += CHUNK_SIZE) {
      result.push(plainText.slice(i, i + CHUNK_SIZE))
    }
    return result
  }, [plainText])

  const speakChunk = useCallback((index: number) => {
    const allChunks = chunks()
    if (index >= allChunks.length) {
      setSpeaking(false)
      setPaused(false)
      chunkIndex.current = 0
      return
    }

    const utterance = new SpeechSynthesisUtterance(allChunks[index])
    utterance.rate = speed
    utterance.onend = () => {
      chunkIndex.current = index + 1
      speakChunk(index + 1)
    }
    utteranceRef.current = utterance
    speechSynthesis.speak(utterance)
  }, [chunks, speed])

  const handlePlay = () => {
    if (!plainText) return

    if (paused) {
      speechSynthesis.resume()
      setPaused(false)
      return
    }

    speechSynthesis.cancel()
    chunkIndex.current = 0
    setSpeaking(true)
    setPaused(false)
    speakChunk(0)
  }

  const handlePause = () => {
    speechSynthesis.pause()
    setPaused(true)
  }

  const handleStop = () => {
    speechSynthesis.cancel()
    setSpeaking(false)
    setPaused(false)
    chunkIndex.current = 0
  }

  return (
    <div className="p-4 space-y-4">
      {/* Input */}
      <textarea
        placeholder="Paste markdown content here..."
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
        rows={6}
        className="w-full px-3 py-2 text-sm bg-surface border border-divider rounded-lg text-text
                   placeholder:text-text/30 focus:outline-none focus:border-gold/50 transition-colors
                   resize-none font-mono"
      />

      {/* Speech controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5">
          <button
            onClick={handlePlay}
            disabled={!plainText}
            className="px-3 py-1.5 text-xs font-medium bg-gold text-white rounded-md cursor-pointer
                       hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {paused ? 'Resume' : speaking ? 'Restart' : 'Read Aloud'}
          </button>
          {speaking && (
            <>
              <button
                onClick={handlePause}
                disabled={paused}
                className="px-3 py-1.5 text-xs font-medium bg-surface border border-divider rounded-md
                           text-text cursor-pointer hover:bg-surface-hover disabled:opacity-40
                           disabled:cursor-not-allowed transition-all"
              >
                Pause
              </button>
              <button
                onClick={handleStop}
                className="px-3 py-1.5 text-xs font-medium bg-surface border border-divider rounded-md
                           text-text cursor-pointer hover:bg-surface-hover transition-all"
              >
                Stop
              </button>
            </>
          )}
        </div>

        {/* Speed slider */}
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-text/40">Speed</label>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-20 accent-gold"
          />
          <span className="text-[11px] text-text/50 w-8">{speed.toFixed(1)}x</span>
        </div>
      </div>

      {/* Rendered output */}
      {markdown.trim() && (
        <>
          <div className="border-t border-divider" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="p-4 bg-surface border border-divider rounded-lg text-sm text-text leading-relaxed
                       select-text"
            dangerouslySetInnerHTML={{ __html: mdToHtml(markdown) }}
          />
        </>
      )}
    </div>
  )
}
