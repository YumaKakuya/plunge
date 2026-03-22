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

# Lesson: Plunge. v0.3 — Spec Open Items全件Must-have実装、8エージェント並列統合

**Date:** 2026-03-22
**Task:** Design Snapshot v0.2のOpen Items（Dark mode, Link登録, Clipper抽出, Highlighter位置追跡, Doc Reader docx, AXIS Outbox, UI磨き, Auto-update, AI部署確定）を全件Must-haveとして実装
**Difficulty:** deep

## What Happened

Spec v0.2を照合し、Open Items 9フェーズを特定。ユーザーと未決定事項（送信頻度、認証方式、UIフォーム等）を1つ1つ確認してから着手。

8エージェント（Senior Opus×4、Engineer Sonnet×4）を2ラウンドで並列起動。各ワークツリーで隔離開発→衝突解消→master統合。TypeScript clean確認後にpush。

- ラウンド1: P1(Dark Mode) + P2(Link登録) + P5(Doc Reader) + P8(Auto-update) 並列
- ラウンド2: P3+P4(Clipper+Highlighter) + P6(Outbox) + P7(UI磨き) + P9(AI部署) 並列

## What I Learned

### 1. 並列エージェントはmain.ts/preload.ts/types.tsで必ず衝突する
Electronアプリの構造上、IPCハンドラー・preload・型定義は全機能が1ファイルに集中する。ワークツリー隔離しても、マージ時にTech Leadが手動統合する前提で設計すべき。

### 2. `util`名前空間の重複はJSオブジェクトの後勝ちで壊れる
P2が`util.fetchMeta`、P5が`util.readFile/parseDocx`を別々に定義→後者が前者を上書き。preload.tsとtypes.ts両方でutil名前空間を統合しないとランタイムで機能が消える。

### 3. `.returning().get()` vs `.run()` は戻り値が変わる
Outbox auto-enqueueのためにclips/highlights insertを`.returning().get()`に変更。rendererが戻り値を使っていないか確認が必要。今回は使っていなかったので安全だった。

### 4. 「Optional」と書いてあっても仕様確認は必須
Spec作成者が「Optional」とマークしていても、発注者の意図は「全件Required」だった。Specのラベルを鵜呑みにせず、発注者に直接確認する。

### 5. ワークツリーの.claude/ディレクトリはgit addで巻き込まれる
`git add -A`でワークツリーのディレクトリがサブモジュール警告と共にコミットされる。`.gitignore`に`.claude/`を最初から入れておくべき。

## Mistakes Made

- **`git add -A`でワークツリーをコミットに含めた** — `.gitignore`未設定。amend + `git rm --cached`で修正
- **util名前空間の重複を自動マージが検出できなかった** — 衝突ではなく「両方存在する」ため。人間のレビューでしか気づけない
- **P3+P4のhighlights insertにposition追加とP6のoutbox auto-enqueueが同じ行で衝突** — 両方の変更を手動統合する必要があった

## Rules to Consider

- **並列エージェント開発では、IPC hub（main.ts, preload.ts, types.ts）の衝突解消をTech Leadが担当する前提で計画する**
- **JSオブジェクトリテラルで同名キーが2回出現する場合、後勝ちで先の定義が消える。マージ後に必ずgrep確認**
- **ワークツリー使用時は`.gitignore`に`.claude/`を事前追加**
- **Specの「Optional/Open Items」ラベルは発注者に再確認してから着手**

---
