import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Textarea } from '@/renderer/components/ui/textarea'
import { Button } from '@/renderer/components/ui/button'
import { Card, CardContent } from '@/renderer/components/ui/card'
import { useAi, useAiStatus } from '@/renderer/hooks/useAi'

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
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const chunkIndex = useRef(0)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const { ask, isLoading: aiLoading, error: aiError } = useAi()
  const { data: aiStatus } = useAiStatus()

  const handleOpenFile = async () => {
    setFileLoading(true)
    try {
      const filePath = await window.plunge.dialog.openFile()
      if (!filePath) return
      const name = filePath.split('/').pop() ?? filePath.split('\\').pop() ?? filePath
      let content: string
      if (filePath.endsWith('.docx')) {
        content = await window.plunge.util.parseDocx(filePath)
      } else {
        content = await window.plunge.util.readFile(filePath)
      }
      setMarkdown(content)
      setFileName(name)
    } finally {
      setFileLoading(false)
    }
  }

  const handleNormalize = async () => {
    if (!markdown.trim() || aiLoading) return
    const result = await ask(
      'shomu',
      'Normalize this markdown. Fix heading levels, clean up lists, fix broken links, normalize whitespace, and ensure consistent formatting. Return ONLY the normalized markdown, no explanations.',
      { markdown }
    )
    if (result) {
      setMarkdown(result)
    }
  }

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
      {/* Open File */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleOpenFile}
          disabled={fileLoading}
          variant="outline"
          size="sm"
          className="cursor-pointer"
        >
          {fileLoading ? 'Loading...' : 'Open File'}
        </Button>
        {fileName && (
          <span className="text-xs text-text-muted truncate max-w-[200px]" title={fileName}>
            {fileName}
          </span>
        )}
      </div>

      {/* Input */}
      <Textarea
        placeholder="Paste markdown content here..."
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
        rows={6}
        className="font-mono bg-surface"
      />

      {/* AI Normalize */}
      {aiStatus?.configured && (
        <div className="flex items-center gap-2">
          <Button
            onClick={handleNormalize}
            disabled={!markdown.trim() || aiLoading}
            variant="outline"
            size="sm"
            className="cursor-pointer"
          >
            {aiLoading ? 'Normalizing...' : 'AI Normalize'}
          </Button>
          {aiError && (
            <span className="text-xs text-red-400">{aiError}</span>
          )}
        </div>
      )}

      {/* Speech controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-2">
          <Button
            onClick={handlePlay}
            disabled={!plainText}
            size="sm"
            className="cursor-pointer"
          >
            {paused ? 'Resume' : speaking ? 'Restart' : 'Read Aloud'}
          </Button>
          {speaking && (
            <>
              <Button
                onClick={handlePause}
                disabled={paused}
                variant="outline"
                size="sm"
                className="cursor-pointer"
              >
                Pause
              </Button>
              <Button
                onClick={handleStop}
                variant="outline"
                size="sm"
                className="cursor-pointer"
              >
                Stop
              </Button>
            </>
          )}
        </div>

        {/* Speed slider */}
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-text-muted">Speed</label>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-20 accent-gold"
          />
          <span className="text-[11px] text-text-secondary w-8">{speed.toFixed(1)}x</span>
        </div>
      </div>

      {/* Rendered output */}
      {markdown.trim() && (
        <>
          <div className="border-t border-divider" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <Card className="bg-surface border-divider">
              <CardContent className="p-6 text-sm text-text leading-relaxed select-text">
                <div dangerouslySetInnerHTML={{ __html: mdToHtml(markdown) }} />
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  )
}
