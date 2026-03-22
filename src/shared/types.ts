export interface Tag {
  id: number
  axis: 'project' | 'role' | 'tool'
  value: string
  color: string | null
}

export interface Link {
  id: number
  name: string
  url: string
  icon: string | null
  sort_order: number
  tags: Tag[] | string // JSON string from DB, parsed in renderer
}

export interface Clip {
  id: number
  url: string | null
  title: string | null
  content: string
  memo: string | null
  source_type: string
  clipped_at: string
  synced_at: string | null
}

export interface Highlight {
  id: number
  clip_id: number
  text: string
  position: string | null
  color: string
  note: string | null
  created_at: string
}

export type AppMode = 'launch' | 'toys' | 'clock'
export type LaunchView = 'project' | 'role' | 'tool'
export type ToyView = 'clipper' | 'highlighter' | 'reader'

// ─── AI Types ───

export type AiDepartment = 'shomu' | 'eigyo' | 'keiri'

export interface AiRequest {
  department: AiDepartment
  message: string
  context?: Record<string, unknown>
}

export interface AiSuccessResponse {
  ok: true
  department: AiDepartment
  content: string
  tokenUsage?: { input: number; output: number }
}

export interface AiErrorResponse {
  ok: false
  error: string
  errorType: 'rate_limit' | 'auth' | 'network'
}

export type AiResponse = AiSuccessResponse | AiErrorResponse

export interface AiStatus {
  configured: boolean
}

declare global {
  interface Window {
    plunge: {
      openExternal: (url: string) => Promise<void>
      app: {
        checkForUpdates: () => Promise<{ available: boolean }>
      }
      // NOTE: These interfaces must stay in sync with src/main/schema.ts
      db: {
        links: {
          all: () => Promise<Link[]>
          insert: (data: { name: string; url: string; icon?: string; tagIds?: number[] }) => Promise<{ id: number; name: string; url: string; icon: string | null; sortOrder: number | null }>
          delete: (id: number) => Promise<void>
        }
        tags: { all: () => Promise<Tag[]> }
        clips: {
          all: () => Promise<Clip[]>
          insert: (clip: { url?: string; title?: string; content: string; memo?: string; source_type?: string }) => Promise<{ lastInsertRowid: number }>
        }
        highlights: {
          all: () => Promise<Highlight[]>
          insert: (h: { clip_id: number; text: string; color?: string; note?: string }) => Promise<{ lastInsertRowid: number }>
        }
      }
      util: {
        fetchMeta: (url: string) => Promise<{ title: string; favicon: string | null }>
      }
      ai: {
        status: () => Promise<AiStatus>
        ask: (req: AiRequest) => Promise<AiResponse>
      }
    }
  }
}
