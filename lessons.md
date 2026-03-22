# Lesson: Plunge. v0.2 — ゼロからElectronデスクトップアプリの基盤構築

**Date:** 2026-03-22
**Task:** Electron + React 19 アプリのscaffoldに Drizzle ORM / shadcn/ui / AI鞄持ち基盤を統合し、UI/UXを磨いてPublicリポジトリとしてship
**Difficulty:** intermediate

## What Happened

30分で作ったscaffoldを受け取り、フルアナライズ → Spec突き合わせ → 3トラック並行で基盤構築（Drizzle ORM / shadcn/ui / AI 3部署） → 起動確認 → WSLg環境問題の解決 → UI/UXリファイン → ホームダッシュボード化 → GitHub Public push。

1セッションで scaffold → 動作する製品基盤まで持っていった。

## What I Learned

### 1. Specとの突き合わせは最初にやる
Scaffoldのコードだけ見ても「何が足りないか」は分からない。Design Snapshot v0.2 と実装を項目ごとに照合したことで、**骨格は95%合致、肉が40%**という正確な現状把握ができた。これがなければ優先順位を間違えていた。

### 2. WSLg + Electron のフレームレスウインドウは地雷
`frame: false` + `titleBarOverlay` はWindows/macOS専用。WSLg上では入力が一切効かなくなる。プラットフォーム判定（`process.platform === 'linux'`）で分岐させる必要がある。

### 3. `user-select: none` はフォーム要素を殺す
Electronアプリで `body { user-select: none }` はデスクトップアプリ感を出すための定番だが、textarea/inputへのペーストまでブロックする。`select-text` クラスでフォーム要素を明示的にオーバーライドする必要がある。

### 4. better-sqlite3のElectronリビルドは必須
Node.jsとElectronのNODE_MODULE_VERSIONが異なるため、`npx electron-rebuild` を忘れるとネイティブモジュールがクラッシュする。

### 5. デザイントークンの「使い方」がUIの品質を決める
トークン自体は最初から存在していた。問題は**全部同じ色・同じサイズで使っていた**こと。3段階のテキスト色、3層のelevation、ゴールドの抑制的な使い方 — これらが「shadcn dashboard / Linear的な品質感」を生む。

## Mistakes Made

- **worktreeエージェントがコミットせずに終了** — 成果物が消えた。ただし設計書が残っていたので再実装は速かった
- **`NODE_ENV=development`が未設定のまま放置** — devスクリプトでElectronがdev serverに接続しない問題。初期アナライズで指摘したのに修正しなかった
- **シードデータを勝手に入れた** — ユーザーが不要と判断したClaude/Gemini等のリンク。scaffoldの判断が「勝手に書き込んでいる」と受け取られた

## Rules to Consider

- **WSLg環境ではElectronの `frame: false` を避ける（Linuxではframe: true）**
- **`user-select: none` を使う場合、フォーム要素に `select-text` を必ず追加する**
- **Publicリポジトリのコミットは見た目を意識する — メッセージ、diff、PRの品質**
- **テスト環境で最初に起動確認 → プラットフォーム固有の問題を即潰す**

---
