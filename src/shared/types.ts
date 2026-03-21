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

declare global {
  interface Window {
    plunge: {
      openExternal: (url: string) => Promise<void>
      db: {
        query: (sql: string, params?: unknown[]) => Promise<unknown>
        links: { all: () => Promise<Link[]> }
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
    }
  }
}
