import { app, BrowserWindow, dialog, ipcMain, shell, globalShortcut } from 'electron'
import path from 'path'
import fs from 'fs'
import { autoUpdater } from 'electron-updater'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth') as { convertToMarkdown: (input: { buffer: Buffer }) => Promise<{ value: string }> }
import { initDatabase, getDrizzle } from './database'
import { loadConfig } from './config'
import { initAi, isAiReady, askDepartment, type Department } from './ai'
import { asc, desc, eq } from 'drizzle-orm'
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

  // Auto-update — check on startup and every 3 hours
  autoUpdater.logger = null // suppress default logging
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-downloaded', () => {
    if (mainWindow) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: 'A new version has been downloaded. Restart now to apply the update?',
        buttons: ['Restart', 'Later'],
        defaultId: 0,
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
    }
  })

  autoUpdater.on('error', (err) => {
    console.log('[AutoUpdate] Error:', err.message)
  })

  // Initial check (delay 3s to let app settle)
  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 3000)

  // Periodic check every 3 hours
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 3 * 60 * 60 * 1000)

  // Global shortcut to summon Plunge
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  // AXIS outbox: periodic batch every 15 minutes
  setInterval(() => {
    try {
      const db = getDrizzle()
      const pending = db.select().from(schema.axisOutbox)
        .where(eq(schema.axisOutbox.status, 'pending')).all()

      for (const entry of pending) {
        // STUB: In production, this would POST to AXIS engine via local IPC
        db.update(schema.axisOutbox)
          .set({ status: 'sent', sentAt: new Date().toISOString() })
          .where(eq(schema.axisOutbox.id, entry.id))
          .run()
      }

      if (pending.length > 0) {
        console.log(`[AXIS Outbox] Batch sent ${pending.length} entries (stub)`)
      }
    } catch (err) {
      console.log('[AXIS Outbox] Batch error:', err)
    }
  }, 15 * 60 * 1000)
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

ipcMain.handle('app:checkForUpdates', async () => {
  try {
    const result = await autoUpdater.checkForUpdates()
    return { available: !!result?.updateInfo }
  } catch {
    return { available: false }
  }
})

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
  const clipResult = db.insert(schema.clips).values({
    url: clip.url ?? null,
    title: clip.title ?? null,
    content: clip.content,
    memo: clip.memo ?? null,
    sourceType: clip.source_type ?? 'manual',
  }).returning().get()
  // Auto-enqueue to AXIS outbox
  db.insert(schema.axisOutbox).values({
    sourceType: 'clip',
    sourceId: clipResult.id,
    payload: JSON.stringify({
      origin: 'plunge',
      origin_version: '0.3',
      item_type: 'clip',
      created_at: new Date().toISOString(),
      content: { url: clip.url, title: clip.title, body: clip.content, memo: clip.memo },
      tags: [],
    }),
  }).run()
  return clipResult
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
  const highlightResult = db.insert(schema.highlights).values({
    clipId: h.clip_id,
    text: h.text,
    color: h.color ?? 'yellow',
    note: h.note ?? null,
  }).returning().get()
  // Auto-enqueue to AXIS outbox
  db.insert(schema.axisOutbox).values({
    sourceType: 'highlight',
    sourceId: highlightResult.id,
    payload: JSON.stringify({
      origin: 'plunge',
      origin_version: '0.3',
      item_type: 'highlight',
      created_at: new Date().toISOString(),
      content: { text: h.text, note: h.note, color: h.color },
      tags: [],
    }),
  }).run()
  return highlightResult
})

ipcMain.handle('db:links:insert', (_e, data: { name: string; url: string; icon?: string; tagIds?: number[] }) => {
  const db = getDrizzle()
  const result = db.insert(schema.links).values({
    name: data.name,
    url: data.url,
    icon: data.icon ?? null,
  }).returning().get()

  if (data.tagIds && data.tagIds.length > 0) {
    for (const tagId of data.tagIds) {
      db.insert(schema.linkTags).values({ linkId: result.id, tagId }).run()
    }
  }

  return result
})

ipcMain.handle('db:links:delete', (_e, linkId: number) => {
  const db = getDrizzle()
  return db.delete(schema.links).where(eq(schema.links.id, linkId)).run()
})

// ─── AXIS Outbox Handlers ───

ipcMain.handle('db:outbox:all', () => {
  const db = getDrizzle()
  const rows = db.select().from(schema.axisOutbox).orderBy(desc(schema.axisOutbox.createdAt)).all()
  return rows.map((row) => ({
    id: row.id,
    source_type: row.sourceType,
    source_id: row.sourceId,
    payload: row.payload,
    status: row.status,
    created_at: row.createdAt,
    sent_at: row.sentAt,
  }))
})

ipcMain.handle('db:outbox:count', () => {
  const db = getDrizzle()
  const all = db.select().from(schema.axisOutbox).all()
  let pending = 0, sent = 0, failed = 0
  for (const row of all) {
    if (row.status === 'pending') pending++
    else if (row.status === 'sent') sent++
    else if (row.status === 'failed') failed++
  }
  return { pending, sent, failed }
})

ipcMain.handle('db:outbox:sendAll', () => {
  const db = getDrizzle()
  const pending = db.select().from(schema.axisOutbox)
    .where(eq(schema.axisOutbox.status, 'pending')).all()
  let sent = 0, failed = 0
  for (const entry of pending) {
    try {
      // STUB: In production, this would POST to AXIS engine via local IPC
      db.update(schema.axisOutbox)
        .set({ status: 'sent', sentAt: new Date().toISOString() })
        .where(eq(schema.axisOutbox.id, entry.id))
        .run()
      sent++
    } catch {
      db.update(schema.axisOutbox)
        .set({ status: 'failed' })
        .where(eq(schema.axisOutbox.id, entry.id))
        .run()
      failed++
    }
  }
  return { sent, failed }
})

ipcMain.handle('db:outbox:retry', () => {
  const db = getDrizzle()
  db.update(schema.axisOutbox)
    .set({ status: 'pending' })
    .where(eq(schema.axisOutbox.status, 'failed'))
    .run()
})

ipcMain.handle('util:fetchMeta', async (_e, url: string) => {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    const html = await res.text()

    const titleMatch = html.match(/<title>([^<]*)<\/title>/)
    const title = titleMatch ? titleMatch[1].trim() : ''

    const iconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/)
    let favicon: string | null = null
    if (iconMatch) {
      favicon = iconMatch[1]
      // Resolve relative URLs
      if (favicon && !favicon.startsWith('http')) {
        const origin = new URL(url).origin
        favicon = favicon.startsWith('/') ? origin + favicon : origin + '/' + favicon
      }
    } else {
      favicon = new URL(url).origin + '/favicon.ico'
    }

    return { title, favicon }
  } catch {
    return { title: '', favicon: null }
  }
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
