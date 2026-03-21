import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

export function initDatabase() {
  const dbDir = path.join(app.getPath('home'), '.config', 'plunge')
  fs.mkdirSync(dbDir, { recursive: true })
  const dbPath = path.join(dbDir, 'data.db')

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // ─── Schema ───
  db.exec(`
    -- Launcher
    CREATE TABLE IF NOT EXISTS links (
      id         INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      url        TEXT NOT NULL,
      icon       TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tags (
      id    INTEGER PRIMARY KEY,
      axis  TEXT NOT NULL,
      value TEXT NOT NULL,
      color TEXT,
      UNIQUE(axis, value)
    );

    CREATE TABLE IF NOT EXISTS link_tags (
      link_id INTEGER REFERENCES links(id) ON DELETE CASCADE,
      tag_id  INTEGER REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (link_id, tag_id)
    );

    -- Clipper
    CREATE TABLE IF NOT EXISTS clips (
      id          INTEGER PRIMARY KEY,
      url         TEXT,
      title       TEXT,
      content     TEXT NOT NULL,
      memo        TEXT,
      source_type TEXT DEFAULT 'web',
      clipped_at  TEXT NOT NULL DEFAULT (datetime('now')),
      synced_at   TEXT
    );

    CREATE TABLE IF NOT EXISTS clip_tags (
      clip_id INTEGER REFERENCES clips(id) ON DELETE CASCADE,
      tag_id  INTEGER REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (clip_id, tag_id)
    );

    -- Highlighter
    CREATE TABLE IF NOT EXISTS highlights (
      id         INTEGER PRIMARY KEY,
      clip_id    INTEGER REFERENCES clips(id) ON DELETE CASCADE,
      text       TEXT NOT NULL,
      position   TEXT,
      color      TEXT DEFAULT 'yellow',
      note       TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- AXIS Outbox
    CREATE TABLE IF NOT EXISTS axis_outbox (
      id          INTEGER PRIMARY KEY,
      source_type TEXT NOT NULL,
      source_id   INTEGER NOT NULL,
      payload     TEXT NOT NULL,
      status      TEXT DEFAULT 'pending',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      sent_at     TEXT
    );
  `)

  // Seed default tags if empty
  const tagCount = db.prepare('SELECT COUNT(*) as c FROM tags').get() as { c: number }
  if (tagCount.c === 0) {
    const insertTag = db.prepare('INSERT INTO tags (axis, value, color) VALUES (?, ?, ?)')
    const seedTags = db.transaction(() => {
      // Projects
      insertTag.run('project', 'Veto.', '#8B5CF6')
      insertTag.run('project', 'Hatch.', '#10B981')
      insertTag.run('project', 'Coffer.', '#F59E0B')
      insertTag.run('project', 'Boardroom.', '#3B82F6')
      insertTag.run('project', 'Plunge.', '#EC4899')
      // Roles
      insertTag.run('role', 'Cro', '#8B5CF6')
      insertTag.run('role', 'Gem', '#3B82F6')
      insertTag.run('role', 'GPT', '#10B981')
      insertTag.run('role', 'Antigravity', '#F59E0B')
      // Tools
      insertTag.run('tool', 'Claude', '#8B5CF6')
      insertTag.run('tool', 'Gemini', '#3B82F6')
      insertTag.run('tool', 'Cursor', '#06B6D4')
      insertTag.run('tool', 'GitHub', '#4B5563')
      insertTag.run('tool', 'Vercel', '#000000')
      insertTag.run('tool', 'Supabase', '#10B981')
    })
    seedTags()
  }

  // Seed default links if empty
  const linkCount = db.prepare('SELECT COUNT(*) as c FROM links').get() as { c: number }
  if (linkCount.c === 0) {
    const insertLink = db.prepare('INSERT INTO links (name, url, icon, sort_order) VALUES (?, ?, ?, ?)')
    const insertLinkTag = db.prepare('INSERT INTO link_tags (link_id, tag_id) VALUES (?, ?)')
    const seedLinks = db.transaction(() => {
      // Claude
      const r1 = insertLink.run('Claude', 'https://claude.ai', '🟣', 1)
      insertLinkTag.run(r1.lastInsertRowid, 11) // tool:Claude
      // Gemini
      const r2 = insertLink.run('Gemini', 'https://gemini.google.com', '🔵', 2)
      insertLinkTag.run(r2.lastInsertRowid, 12) // tool:Gemini
      // GitHub
      const r3 = insertLink.run('GitHub', 'https://github.com', '🐙', 3)
      insertLinkTag.run(r3.lastInsertRowid, 14) // tool:GitHub
      // Vercel
      const r4 = insertLink.run('Vercel', 'https://vercel.com', '▲', 4)
      insertLinkTag.run(r4.lastInsertRowid, 15) // tool:Vercel
      // Supabase
      const r5 = insertLink.run('Supabase', 'https://supabase.com', '💚', 5)
      insertLinkTag.run(r5.lastInsertRowid, 16) // tool:Supabase
    })
    seedLinks()
  }
}
