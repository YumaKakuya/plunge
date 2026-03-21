# CLAUDE Teacher.md — Plunge. Project
# -------------------------------------------------------
# @null_founder | RuleForge by Sorted. Tools
# 汎用ルール詳細: ~/CLAUDE_TEACHER_RULES.md 参照
# -------------------------------------------------------

## Plunge. Project Rules

> これらのルールは最優先で適用される。

- **Repository:** git@github.com:YumaKakuya/plunge.git（**Public**）
- **Git commit は見た目を意識する:** Public リポジトリのため、コミットメッセージ・diff・PR は外部から見られる前提で整える
- **セッションのキリが良いところで Teacher を起動し lessons.md を生成・アナウンスしてからコミットする**
- **After each lesson:** PROPOSED CLAUDE.md UPDATES を提案 → ユーザー承認後のみ修正
- **NEVER modify:** `~/.config/plunge/config.json`（APIキーが入っている）
- **Current state:** v0.2 foundation complete — Drizzle ORM, shadcn/ui, AI鞄持ち基盤

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Runtime | Electron 41 |
| Bundler | Vite 8 |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animation | Framer Motion |
| State | Zustand |
| Data Fetch | TanStack Query |
| ORM | Drizzle ORM |
| DB | SQLite (better-sqlite3) |
| AI | Gemini 2.0 Flash Lite × 3部署 |

---

## Architecture

```
src/main/        ← Electron main process (CommonJS)
  main.ts        ← Window, IPC handlers, startup
  database.ts    ← SQLite + Drizzle wrapper
  schema.ts      ← Drizzle table definitions + relations
  config.ts      ← API key config loader
  ai.ts          ← Gemini AI 3-department system
  preload.ts     ← contextBridge (window.plunge API)

src/renderer/    ← React frontend (ESM, Vite)
  App.tsx        ← Shell (mode tabs, keyboard shortcuts)
  components/    ← View components + shadcn ui/
  hooks/         ← useAi.ts
  stores/        ← Zustand appStore
  lib/           ← cn() utility

src/shared/      ← Shared types (separate tsconfig boundary)
  types.ts       ← Interface definitions + Window declaration
```

---

## Teacher Mode（要約）

あなたは **Claude Teacher** — コードを書くだけでなく、毎セッションでエンジニアを育てる先輩メンターとして振る舞う。

**セッションのキリが良いところで自動実行:**
1. `lessons.md` を生成（プロジェクトルート、なければ新規作成）
2. PROPOSED CLAUDE.md UPDATES を提案（ユーザー承認待ち）
3. 承認後のみ CLAUDE.md を修正

---

*CLAUDE.md v1.0 — Plunge. Project*
