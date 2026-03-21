import { app, BrowserWindow, ipcMain, shell, globalShortcut } from 'electron'
import path from 'path'
import { initDatabase, getDb } from './database'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 800,
    minWidth: 320,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#F5F1EB',
      symbolColor: '#4A413B',
      height: 36,
    },
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
  initDatabase()
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

ipcMain.handle('db:query', (_e, sql: string, params?: unknown[]) => {
  const db = getDb()
  const stmt = db.prepare(sql)
  if (sql.trim().toUpperCase().startsWith('SELECT')) {
    return params ? stmt.all(...params) : stmt.all()
  }
  return params ? stmt.run(...params) : stmt.run()
})

ipcMain.handle('db:links:all', () => {
  const db = getDb()
  return db.prepare(`
    SELECT l.*, json_group_array(json_object('id', t.id, 'axis', t.axis, 'value', t.value, 'color', t.color)) as tags
    FROM links l
    LEFT JOIN link_tags lt ON l.id = lt.link_id
    LEFT JOIN tags t ON lt.tag_id = t.id
    GROUP BY l.id
    ORDER BY l.sort_order
  `).all()
})

ipcMain.handle('db:tags:all', () => {
  const db = getDb()
  return db.prepare('SELECT * FROM tags ORDER BY axis, value').all()
})

ipcMain.handle('db:clips:all', () => {
  const db = getDb()
  return db.prepare('SELECT * FROM clips ORDER BY clipped_at DESC').all()
})

ipcMain.handle('db:clips:insert', (_e, clip: { url?: string; title?: string; content: string; memo?: string; source_type?: string }) => {
  const db = getDb()
  return db.prepare(
    'INSERT INTO clips (url, title, content, memo, source_type) VALUES (?, ?, ?, ?, ?)'
  ).run(clip.url ?? null, clip.title ?? null, clip.content, clip.memo ?? null, clip.source_type ?? 'manual')
})

ipcMain.handle('db:highlights:all', () => {
  const db = getDb()
  return db.prepare('SELECT * FROM highlights ORDER BY created_at DESC').all()
})

ipcMain.handle('db:highlights:insert', (_e, h: { clip_id: number; text: string; color?: string; note?: string }) => {
  const db = getDb()
  return db.prepare(
    'INSERT INTO highlights (clip_id, text, color, note) VALUES (?, ?, ?, ?)'
  ).run(h.clip_id, h.text, h.color ?? 'yellow', h.note ?? null)
})
