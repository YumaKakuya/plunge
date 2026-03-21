import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { eq, and } from 'drizzle-orm'
import * as schema from './schema'

let db: Database.Database | null = null
let drizzleDb: BetterSQLite3Database<typeof schema> | null = null

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

export function getDrizzle(): BetterSQLite3Database<typeof schema> {
  if (!drizzleDb) throw new Error('Database not initialized')
  return drizzleDb
}

export function initDatabase() {
  const dbDir = path.join(app.getPath('home'), '.config', 'plunge')
  fs.mkdirSync(dbDir, { recursive: true })
  const dbPath = path.join(dbDir, 'data.db')

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // ─── Schema (raw SQL — no drizzle-kit, Electron apps don't use migrations) ───
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

  // ─── Drizzle wrapper ───
  drizzleDb = drizzle(db, { schema })

  // ─── Seed default tags if empty ───
  const tagRows = drizzleDb.select().from(schema.tags).all()
  if (tagRows.length === 0) {
    const seedTags = [
      // Projects
      { axis: 'project', value: 'Veto.', color: '#8B5CF6' },
      { axis: 'project', value: 'Hatch.', color: '#10B981' },
      { axis: 'project', value: 'Coffer.', color: '#F59E0B' },
      { axis: 'project', value: 'Boardroom.', color: '#3B82F6' },
      { axis: 'project', value: 'Plunge.', color: '#EC4899' },
      // Roles
      { axis: 'role', value: 'Cro', color: '#8B5CF6' },
      { axis: 'role', value: 'Gem', color: '#3B82F6' },
      { axis: 'role', value: 'GPT', color: '#10B981' },
      { axis: 'role', value: 'Antigravity', color: '#F59E0B' },
      // Tools
      { axis: 'tool', value: 'Claude', color: '#8B5CF6' },
      { axis: 'tool', value: 'Gemini', color: '#3B82F6' },
      { axis: 'tool', value: 'Cursor', color: '#06B6D4' },
      { axis: 'tool', value: 'GitHub', color: '#4B5563' },
      { axis: 'tool', value: 'Vercel', color: '#000000' },
      { axis: 'tool', value: 'Supabase', color: '#10B981' },
    ]
    drizzleDb.insert(schema.tags).values(seedTags).run()
  }

  // Seed links removed — user populates their own links
}
