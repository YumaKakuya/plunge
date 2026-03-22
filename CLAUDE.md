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
- **Current state:** v0.3 — all Spec v0.2 Open Items implemented (Dark mode, Link registration, Clipper extraction, Highlighter positioning, Doc Reader docx, AXIS Outbox, Auto-update, AI department finalized)

---

## Plunge. 実装から得たルール

- **WSLg環境:** `frame: false` はLinuxで使わない。`process.platform === 'linux'` で `frame: true` に分岐
- **`user-select: none` を使う場合、フォーム要素（input/textarea/select）に `select-text` を必ず追加する**
- **better-sqlite3 は Electron 用に `npx electron-rebuild` が必要**
- **シードデータはユーザーが明示的に要求しない限り入れない**
- **並列エージェント開発では、IPC hub（main.ts, preload.ts, types.ts）の衝突解消をTech Leadが計画に含める**
  **Why:** 8エージェント並列で3回衝突。Electronの構造上、全機能がこの3ファイルに集中する
- **JSオブジェクトリテラルの同名キー重複は後勝ち — マージ後にgrep確認必須**
  **Why:** P2とP5のutil名前空間が重複定義され、fetchMetaがランタイムで消えるバグ。自動マージでは検出不可
- **ワークツリー使用時は `.gitignore` に `.claude/` を事前追加**
  **Why:** `git add -A` でワークツリーがサブモジュール警告と共にコミットされた
- **Specの「Optional/Open Items」ラベルは発注者に再確認してから着手**
  **Why:** Spec作成エージェントがOptionalとマークしても、発注者の意図はMust-haveだった

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
| Doc Parser | mammoth.js (docx→MD) |
| Auto-update | electron-updater + GitHub Releases |

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

*CLAUDE.md v1.1 — Plunge. Project*
