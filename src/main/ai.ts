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
Your responsibilities:
- File operations assistance (naming, organizing, formatting)
- Markdown normalization and cleanup
- Data formatting and transformation
- Favicon and metadata fetching suggestions
- General utility tasks that don't fit other departments`,

  eigyo: `${BASE_RULES}

You are the Sales/Content department (営業課).
Your responsibilities:
- Web content analysis and summarization
- URL analysis and metadata extraction
- Content extraction from web pages
- Clip summarization and tagging suggestions
- Reading list organization suggestions`,

  keiri: `${BASE_RULES}

You are the Accounting/Data department (経理課).
Your responsibilities:
- Database operations assistance (query suggestions, data analysis)
- Tag management and categorization suggestions
- Outbox management and sync status analysis
- Activity logging and usage pattern analysis
- Data categorization and organization suggestions`,
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
