import { app, BrowserWindow, ipcMain, shell, globalShortcut, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth') as { convertToMarkdown: (input: { buffer: Buffer }) => Promise<{ value: string }> }
import { initDatabase, getDrizzle } from './database'
import { loadConfig } from './config'
import { initAi, isAiReady, askDepartment, type Department } from './ai'
import { asc, desc } from 'drizzle-orm'
import * as schema from './schema'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 800,
    minWidth: 320,
    minHeight: 600,
    ...(process.platform === 'linux'
      ? { frame: true }
      : {
          frame: false,
          titleBarStyle: 'hidden' as const,
          titleBarOverlay: {
            color: '#F5F1EB',
            symbolColor: '#4A413B',
            height: 36,
          },
        }),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#F5F1EB',
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(() => {
  loadConfig()
  initDatabase()
  initAi()
  createWindow()

  // Global shortcut to summon Plunge
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// ─── IPC Handlers ───

ipcMain.handle('shell:openExternal', (_e, url: string) => {
  return shell.openExternal(url)
})

// db:query handler REMOVED — raw SQL execution is a security risk

ipcMain.handle('db:links:all', () => {
  const db = getDrizzle()
  const rows = db.query.links.findMany({
    orderBy: [asc(schema.links.sortOrder)],
    with: {
      linkTags: {
        with: {
          tag: true,
        },
      },
    },
  }).sync()
  // Map to the shape the renderer expects: { ...link, tags: Tag[] | string }
  // The renderer's parseTags() expects tags as a JSON string from the old raw query,
  // so we return a JSON string for backward compatibility.
  return rows.map((row) => {
    const tags = row.linkTags.map((lt) => lt.tag)
    return {
      id: row.id,
      name: row.name,
      url: row.url,
      icon: row.icon,
      sort_order: row.sortOrder,
      tags: JSON.stringify(tags.map((t) => ({
        id: t.id,
        axis: t.axis,
        value: t.value,
        color: t.color,
      }))),
    }
  })
})

ipcMain.handle('db:tags:all', () => {
  const db = getDrizzle()
  return db.select().from(schema.tags).orderBy(asc(schema.tags.axis), asc(schema.tags.value)).all()
})

ipcMain.handle('db:clips:all', () => {
  const db = getDrizzle()
  const rows = db.select().from(schema.clips).orderBy(desc(schema.clips.clippedAt)).all()
  // Map camelCase back to snake_case for renderer compatibility
  return rows.map((row) => ({
    id: row.id,
    url: row.url,
    title: row.title,
    content: row.content,
    memo: row.memo,
    source_type: row.sourceType,
    clipped_at: row.clippedAt,
    synced_at: row.syncedAt,
  }))
})

ipcMain.handle('db:clips:insert', (_e, clip: { url?: string; title?: string; content: string; memo?: string; source_type?: string }) => {
  const db = getDrizzle()
  return db.insert(schema.clips).values({
    url: clip.url ?? null,
    title: clip.title ?? null,
    content: clip.content,
    memo: clip.memo ?? null,
    sourceType: clip.source_type ?? 'manual',
  }).run()
})

ipcMain.handle('db:highlights:all', () => {
  const db = getDrizzle()
  const rows = db.select().from(schema.highlights).orderBy(desc(schema.highlights.createdAt)).all()
  // Map camelCase back to snake_case for renderer compatibility
  return rows.map((row) => ({
    id: row.id,
    clip_id: row.clipId,
    text: row.text,
    position: row.position,
    color: row.color,
    note: row.note,
    created_at: row.createdAt,
  }))
})

ipcMain.handle('db:highlights:insert', (_e, h: { clip_id: number; text: string; color?: string; note?: string }) => {
  const db = getDrizzle()
  return db.insert(schema.highlights).values({
    clipId: h.clip_id,
    text: h.text,
    color: h.color ?? 'yellow',
    note: h.note ?? null,
  }).run()
})

// ─── Dialog & File Handlers ───

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Documents', extensions: ['md', 'docx'] },
    ],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

ipcMain.handle('util:readFile', (_e, filePath: string) => {
  if (!filePath.endsWith('.md')) {
    throw new Error('Only .md files are supported by util:readFile')
  }
  return fs.readFileSync(filePath, 'utf-8')
})

ipcMain.handle('util:parseDocx', async (_e, filePath: string) => {
  const buffer = fs.readFileSync(filePath)
  const result = await mammoth.convertToMarkdown({ buffer })
  return result.value
})

// ─── AI Handlers ───

ipcMain.handle('ai:status', () => {
  return { configured: isAiReady() }
})

ipcMain.handle('ai:ask', async (_e, req: { department: Department; message: string; context?: Record<string, unknown> }) => {
  if (!isAiReady()) {
    return { ok: false, error: 'AI not configured. Add geminiApiKey to ~/.config/plunge/config.json', errorType: 'auth' as const }
  }
  try {
    const result = await askDepartment(req)
    return { ok: true as const, ...result }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown AI error'
    const isRateLimit = message.includes('429') || message.toLowerCase().includes('rate')
    const isAuth = message.includes('401') || message.includes('403') || message.toLowerCase().includes('api key')
    return {
      ok: false as const,
      error: message,
      errorType: isRateLimit ? 'rate_limit' as const : isAuth ? 'auth' as const : 'network' as const,
    }
  }
})
