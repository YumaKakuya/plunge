import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('plunge', {
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  db: {
    query: (sql: string, params?: unknown[]) => ipcRenderer.invoke('db:query', sql, params),
    links: {
      all: () => ipcRenderer.invoke('db:links:all'),
    },
    tags: {
      all: () => ipcRenderer.invoke('db:tags:all'),
    },
    clips: {
      all: () => ipcRenderer.invoke('db:clips:all'),
      insert: (clip: { url?: string; title?: string; content: string; memo?: string; source_type?: string }) =>
        ipcRenderer.invoke('db:clips:insert', clip),
    },
    highlights: {
      all: () => ipcRenderer.invoke('db:highlights:all'),
      insert: (h: { clip_id: number; text: string; color?: string; note?: string }) =>
        ipcRenderer.invoke('db:highlights:insert', h),
    },
  },
})
