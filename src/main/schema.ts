import { sqliteTable, text, integer, primaryKey, unique } from 'drizzle-orm/sqlite-core'
import { relations, type InferSelectModel } from 'drizzle-orm'

// ─── Tables ───

export const links = sqliteTable('links', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  icon: text('icon'),
  sortOrder: integer('sort_order').default(0),
})

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey(),
  axis: text('axis').notNull(),
  value: text('value').notNull(),
  color: text('color'),
}, (table) => [
  unique('tags_axis_value_unique').on(table.axis, table.value),
])

export const linkTags = sqliteTable('link_tags', {
  linkId: integer('link_id').notNull().references(() => links.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.linkId, table.tagId] }),
])

export const clips = sqliteTable('clips', {
  id: integer('id').primaryKey(),
  url: text('url'),
  title: text('title'),
  content: text('content').notNull(),
  memo: text('memo'),
  sourceType: text('source_type').default('web'),
  clippedAt: text('clipped_at').notNull().default("datetime('now')"),
  syncedAt: text('synced_at'),
})

export const clipTags = sqliteTable('clip_tags', {
  clipId: integer('clip_id').notNull().references(() => clips.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.clipId, table.tagId] }),
])

export const highlights = sqliteTable('highlights', {
  id: integer('id').primaryKey(),
  clipId: integer('clip_id').references(() => clips.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  position: text('position'),
  color: text('color').default('yellow'),
  note: text('note'),
  createdAt: text('created_at').notNull().default("datetime('now')"),
})

export const axisOutbox = sqliteTable('axis_outbox', {
  id: integer('id').primaryKey(),
  sourceType: text('source_type').notNull(),
  sourceId: integer('source_id').notNull(),
  payload: text('payload').notNull(),
  status: text('status').default('pending'),
  createdAt: text('created_at').notNull().default("datetime('now')"),
  sentAt: text('sent_at'),
})

// ─── Relations ───

export const linksRelations = relations(links, ({ many }) => ({
  linkTags: many(linkTags),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  linkTags: many(linkTags),
  clipTags: many(clipTags),
}))

export const linkTagsRelations = relations(linkTags, ({ one }) => ({
  link: one(links, { fields: [linkTags.linkId], references: [links.id] }),
  tag: one(tags, { fields: [linkTags.tagId], references: [tags.id] }),
}))

export const clipsRelations = relations(clips, ({ many }) => ({
  clipTags: many(clipTags),
  highlights: many(highlights),
}))

export const clipTagsRelations = relations(clipTags, ({ one }) => ({
  clip: one(clips, { fields: [clipTags.clipId], references: [clips.id] }),
  tag: one(tags, { fields: [clipTags.tagId], references: [tags.id] }),
}))

export const highlightsRelations = relations(highlights, ({ one }) => ({
  clip: one(clips, { fields: [highlights.clipId], references: [clips.id] }),
}))

// ─── Types (main-process only) ───

export type LinkRow = InferSelectModel<typeof links>
export type TagRow = InferSelectModel<typeof tags>
export type LinkTagRow = InferSelectModel<typeof linkTags>
export type ClipRow = InferSelectModel<typeof clips>
export type ClipTagRow = InferSelectModel<typeof clipTags>
export type HighlightRow = InferSelectModel<typeof highlights>
export type AxisOutboxRow = InferSelectModel<typeof axisOutbox>
