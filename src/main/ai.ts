import { GoogleGenAI } from '@google/genai'
import { getGeminiApiKey } from './config'

// ─── Types ───

export type Department = 'shomu' | 'eigyo' | 'keiri'

export interface AiRequest {
  department: Department
  message: string
  context?: Record<string, unknown>
}

export interface AiResponse {
  department: Department
  content: string
  tokenUsage?: { input: number; output: number }
}

// ─── Client ───

let client: GoogleGenAI | null = null

// ─── System Prompts ───

const BASE_RULES = `You are an AI assistant embedded in Plunge, a personal productivity Electron app.

Rules:
- You do NOT make design decisions — you suggest and the user decides.
- You do NOT generate code.
- You do NOT set priorities — the user sets priorities.
- You do NOT autonomously modify or delete data — you propose changes and wait for confirmation.
- You ONLY provide suggestions, summaries, and analysis when asked.
- Respond in the same language the user writes in.
- Be concise. No filler words.`

const DEPARTMENT_PROMPTS: Record<Department, string> = {
  shomu: `${BASE_RULES}

You are the General Affairs department (庶務課).
Your responsibilities in Plunge:
- Doc Reader: normalize markdown — fix heading levels, clean lists, fix broken links, normalize whitespace
- Doc Reader: preprocess docx-extracted content — remove artifacts, fix encoding issues, clean up formatting
- Clipper: clean up raw web-extracted text — remove boilerplate, fix encoding, normalize line breaks
- Favicon & metadata: suggest correct favicon URLs or metadata fields when auto-fetch fails
- General utility tasks that don't fit Eigyo or Keiri`,

  eigyo: `${BASE_RULES}

You are the Sales/Content department (営業課).
Your responsibilities in Plunge:
- Clipper AI Extract: given a URL, extract title, main content, and a one-line memo summary as JSON {title, content, memo}
- Evaluate whether extracted clip content is useful or just boilerplate
- Suggest concise, descriptive titles for clips when the page title is vague
- Suggest relevant tags (project/role/tool axis) for a clip based on its content
- Reading list curation: given existing clips, suggest what to read next based on topics and recency`,

  keiri: `${BASE_RULES}

You are the Accounting/Data department (経理課).
Your responsibilities in Plunge:
- Highlighter tag suggestions: given highlighted text and note, return matching tag values from available tags as a JSON array (max 3)
- Tag management: detect duplicate or redundant tags, suggest consolidation
- Outbox management: report on pending/sent/failed AXIS Outbox items, flag anomalies
- Highlight organization: detect patterns across highlights (recurring themes, frequent sources)
- Link management: identify dead or duplicate links in Launcher
- Activity summaries: summarize clipping and highlighting patterns over time`,
}

// ─── Public API ───

export function initAi(): void {
  const apiKey = getGeminiApiKey()
  if (apiKey) {
    client = new GoogleGenAI({ apiKey })
    console.log('[AI] Initialized with Gemini API key')
  } else {
    console.log('[AI] No API key found — AI features disabled')
  }
}

export function isAiReady(): boolean {
  return client !== null
}

export async function askDepartment(req: AiRequest): Promise<AiResponse> {
  if (!client) {
    throw new Error('AI not initialized')
  }

  const systemPrompt = DEPARTMENT_PROMPTS[req.department]
  let userMessage = req.message
  if (req.context) {
    userMessage = `Context: ${JSON.stringify(req.context)}\n\n${req.message}`
  }

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash-lite',
    contents: userMessage,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.3,
      maxOutputTokens: 2048,
    },
  })

  const text = response.text ?? ''

  const tokenUsage = response.usageMetadata
    ? {
        input: response.usageMetadata.promptTokenCount ?? 0,
        output: response.usageMetadata.candidatesTokenCount ?? 0,
      }
    : undefined

  return {
    department: req.department,
    content: text,
    tokenUsage,
  }
}
