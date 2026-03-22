import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('plunge', {
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  db: {
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
  ai: {
    status: () => ipcRenderer.invoke('ai:status'),
    ask: (req: { department: string; message: string; context?: Record<string, unknown> }) =>
      ipcRenderer.invoke('ai:ask', req),
  },
  dialog: {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
  },
  util: {
    readFile: (filePath: string) => ipcRenderer.invoke('util:readFile', filePath),
    parseDocx: (filePath: string) => ipcRenderer.invoke('util:parseDocx', filePath),
  },
})
