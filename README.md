# Plunge.

> 取水口＋管制塔＋Toy box。AXIS.エコシステムの情報入口。
> "飛び込む" — 滝壺に飛び込んで、水を汲んで、パイプに流す。

Sorted. Tools 内部ツール。日常のブラウジング・読書・メモが自然とAXIS.への入力行為になるデスクトップアプリ。

---

## 目次

1. [起動方法](#起動方法)
2. [画面構成](#画面構成)
3. [キーボードショートカット一覧](#キーボードショートカット一覧)
4. [Launch モード](#launch-モード)
5. [Toys モード](#toys-モード)
   - [Clipper](#clipper)
   - [Highlighter](#highlighter)
   - [Doc Reader](#doc-reader)
6. [Clock モード](#clock-モード)
   - [World Clock](#world-clock)
   - [Calendar](#calendar)
7. [データベース](#データベース)
8. [Tech Stack](#tech-stack)
9. [開発](#開発)
10. [AXIS.エコシステム上の位置](#axisエコシステム上の位置)

---

## 起動方法

### 前提条件

- Node.js 18+
- WSL2（Windows環境の場合）

### インストール

```bash
cd ~/plunge
npm install
```

### 開発モード

```bash
npm run dev
```

Vite dev server (port 5173) が起動した後、Electron ウインドウが自動で立ち上がる。

### プロダクションビルド

```bash
npm run build       # renderer + main を両方ビルド
npm run start       # ビルド済みアプリを起動
```

### 個別ビルド

```bash
npm run build:renderer   # Vite で renderer をビルド → dist/renderer/
npm run build:main       # tsc で main process をビルド → dist/main/
```

---

## 画面構成

ウインドウは **420×800px**（最小 320×600）の縦長レイアウト。27インチモニターの端に常駐する想定。

```
┌──────────────────────────────────────────┐
│  [🚀 Launch]  [🧰 Toys]  [🕐 Clock]     │  ← モードタブ（ドラッグ領域兼用）
├──────────────────────────────────────────┤
│                                          │
│         各モードのコンテンツ領域            │
│                                          │
│                                          │
│                                          │
└──────────────────────────────────────────┘
```

上部のタブをクリック、またはキーボードショートカットで3つのモードを切り替える。
モード切り替えはクロスフェードアニメーション（0.18秒）で滑らかに遷移。

---

## キーボードショートカット一覧

### グローバル（Plunge. がバックグラウンドでも有効）

| キー | アクション |
|------|-----------|
| `Ctrl+Shift+P` | Plunge. ウインドウを呼び出す（最小化→復元→フォーカス） |

### モード切り替え

| キー | アクション |
|------|-----------|
| `Ctrl+L` | Launch モードに切り替え |
| `Ctrl+T` | Toys モードに切り替え |
| `Ctrl+W` | Clock モードに切り替え |

### Launch モード専用

| キー | アクション |
|------|-----------|
| `Ctrl+1` | Project ビュー（プロジェクト別表示） |
| `Ctrl+2` | Role ビュー（ロール別表示） |
| `Ctrl+3` | Tool ビュー（ツール別表示） |
| `F1` | 1番目のカードを展開/折りたたみ |
| `F2` | 2番目のカードを展開/折りたたみ |
| `F3` | 3番目のカードを展開/折りたたみ |

### 共通

| キー | アクション |
|------|-----------|
| `Escape` | 展開中のカードを閉じる |

---

## Launch モード

**メインのランチャー機能。** 登録されたリンクを3つの軸で切り替えて表示し、ワンクリックで外部ブラウザに遷移する。

### 3軸ビュー

| ビュー | 切り替え | グループ化の基準 |
|--------|---------|----------------|
| **Project** | `Ctrl+1` | プロジェクト別（Veto., Hatch., Coffer. 等） |
| **Role** | `Ctrl+2` | ロール別（Cro, Gem, GPT, Antigravity） |
| **Tool** | `Ctrl+3` | ツール別（Claude, Gemini, Cursor 等） |

### 操作方法

```
初期状態（全カード閉じている）:
┌─────────────────────────┐
│  Veto.              [5] │  ← F1 で展開
├─────────────────────────┤
│  Hatch.             [3] │  ← F2 で展開
├─────────────────────────┤
│  Coffer.            [2] │  ← F3 で展開
└─────────────────────────┘

カードをクリック or F1 で展開:
┌─────────────────────────┐
│  Veto.              [5] │
├─────────────────────────┤
│ 🟣 Claude  🔵 Gemini   │  ← アイコンが4列グリッドで
│ 🐙 GitHub  ▲ Vercel    │     フワッと順番に出現
│ 💚 Supabase            │     （0.05秒間隔のスタガー）
├─────────────────────────┤
│  Hatch.             [3] │  ← 下に滑らかに押し下げ
├─────────────────────────┤
│  Coffer.            [2] │
└─────────────────────────┘
```

- **展開は常に1つだけ。** 別のカードを開くと前のカードが自動で閉じる
- **アイコンをクリック** → デフォルトブラウザでURLが開く
- **右の数字** はそのグループに属するリンクの数

### 初期登録リンク

| アイコン | 名前 | URL |
|---------|------|-----|
| 🟣 | Claude | https://claude.ai |
| 🔵 | Gemini | https://gemini.google.com |
| 🐙 | GitHub | https://github.com |
| ▲ | Vercel | https://vercel.com |
| 💚 | Supabase | https://supabase.com |

---

## Toys モード

3つのユーティリティツールをサブタブで切り替える。

```
┌──────────────────────────────────────────┐
│  [Clipper]  [Highlighter]  [Reader]      │  ← サブタブ
├──────────────────────────────────────────┤
│                                          │
│          選択中のツールのUI                │
│                                          │
└──────────────────────────────────────────┘
```

アクティブなタブはゴールドのテキスト＋シャドウで視覚的に区別される。

---

### Clipper

**Web情報を抽出して構造化保存する。** Obsidian Web Clipper にインスパイアされたもの。

#### 入力フォーム

| フィールド | 必須 | 説明 |
|-----------|------|------|
| **URL** | × | クリップ元のURL |
| **Title** | × | コンテンツのタイトル |
| **Content** | ✅ | 抽出・入力したコンテンツ本文 |
| **Memo** | × | 自分の考察メモ（何が重要か、なぜ保存したか） |

#### 使い方

1. URLとタイトルを入力（省略可）
2. コンテンツ本文をペースト or 入力
3. Memoに自分の考察を書く
4. **「Clip」ボタン** をクリック
5. 下のリストに保存されたクリップが表示される

#### クリップ一覧

保存済みクリップは新しい順に一覧表示：

```
┌─────────────────────────┐
│ Article Title            │
│ The first two lines of   │
│ content are shown...     │
│ 📝 自分のメモがここに     │  ← ゴールドのイタリック
│ 2026-03-21 14:30:00      │
└─────────────────────────┘
```

- タイトルがない場合はURLを表示、URLもなければ「Untitled」
- コンテンツは2行で切り詰め
- メモがあればゴールド色イタリックで表示

---

### Highlighter

**テキストをハイライトして色分け保存する。** Glasp にインスパイアされたもの。

#### カラーシステム

| 色 | 用途の例 |
|-----|---------|
| 🟡 **Yellow** | 重要なポイント（デフォルト） |
| 🟢 **Green** | アクションアイテム |
| 🔵 **Blue** | 参考情報 |
| 🩷 **Pink** | 疑問・要確認 |

#### 入力フォーム

| フィールド | 必須 | 説明 |
|-----------|------|------|
| **Clip** | ✅ | ハイライト対象のクリップをドロップダウンから選択 |
| **Color** | ✅ | 4色のカラーピッカーから選択（デフォルト: Yellow） |
| **Text** | ✅ | ハイライトしたいテキスト |
| **Note** | × | ハイライトに添えるメモ |

#### 使い方

1. ドロップダウンから対象のクリップを選択
2. カラーボタンで色を選ぶ（選択中は拡大＋リング表示）
3. ハイライトしたいテキストを入力
4. 必要ならノートを追加
5. **「Add Highlight」ボタン** をクリック

#### ハイライト一覧

```
┌─────────────────────────────┐
│ 🟡 "ハイライトされたテキスト"  │  ← 色に応じた背景色
│    ここが重要だと思った理由    │  ← ノート（イタリック）
│    2026-03-21 15:00:00       │
└─────────────────────────────┘
```

---

### Doc Reader

**Markdownを閲覧し、音声で読み上げる。** edge-md-reader の進化版。

#### 対応するMarkdown記法

| 記法 | レンダリング |
|------|------------|
| `# 見出し` | H1（太字・大きいテキスト） |
| `## 見出し` | H2 |
| `### 見出し` | H3 |
| `**太字**` | **太字** |
| `*斜体*` | *斜体* |
| `` `コード` `` | インラインコード |
| ` ``` ` コードブロック ` ``` ` | プレフォーマットブロック |
| `- リスト項目` | 箇条書き |
| `[テキスト](URL)` | リンク（ゴールド色） |
| `---` | 水平線 |

#### 使い方

1. **上部のテキストエリア** にMarkdownをペースト
2. 下にリアルタイムでHTML変換されたプレビューが表示される
3. 音声読み上げを使う場合：

#### 音声コントロール

```
┌──────────────────────────────────────┐
│  Speed: [━━━━●━━━━] 1.0x            │  ← 0.5x 〜 2.0x
│                                      │
│  [▶ Read Aloud]  [⏸ Pause]  [⏹ Stop]│
│                  [🔄 Restart]        │
└──────────────────────────────────────┘
```

| ボタン | 状態 | アクション |
|--------|------|-----------|
| **Read Aloud** | 停止中 | テキスト全体を先頭から読み上げ開始 |
| **Resume** | 一時停止中 | 中断した位置から読み上げ再開 |
| **Restart** | 読み上げ中 | 先頭から読み直し |
| **Pause** | 読み上げ中 | 一時停止 |
| **Stop** | 読み上げ中 | 読み上げ停止（位置リセット） |

- テキストは **2000文字単位のチャンク** に分割して順次読み上げ
- Markdown記法は読み上げ前に自動除去（見出し記号、太字記号など）
- 速度スライダーで読み上げ速度を調整（0.5x〜2.0x）

---

## Clock モード

### World Clock

6つのタイムゾーンの現在時刻を **毎秒更新** で常時表示。

```
┌────────────────┬────────────────┐
│ Tokyo     JST  │ UTC       UTC  │
│ Fri, Mar 21    │ Fri, Mar 21    │
│ 19:30:45       │ 10:30:45       │
├────────────────┼────────────────┤
│ New York  EST  │ Chicago   CST  │
│ Fri, Mar 21    │ Fri, Mar 21    │
│ 05:30:45       │ 04:30:45       │
├────────────────┼────────────────┤
│ Los Angeles PST│ India     IST  │
│ Fri, Mar 21    │ Fri, Mar 21    │
│ 02:30:45       │ 16:00:45       │
└────────────────┴────────────────┘
```

| タイムゾーン | 都市 | 用途 |
|-------------|------|------|
| JST | 東京 | 自分の時間 |
| UTC | — | 基準時刻 |
| EST/EDT | ニューヨーク | 米国東海岸 |
| CST/CDT | シカゴ | 米国中部 |
| PST/PDT | ロサンゼルス | 米国西海岸 |
| IST | インド | インドチーム |

- 24時間表記（HH:MM:SS）
- 等幅フォントで桁ズレなし
- DSTの切り替えは自動（EDT/CDT/PDT表記に自動変更）

### Calendar

World Clock の下に月カレンダーを表示。

```
        ◀  March 2026  ▶
  Sun Mon Tue Wed Thu Fri Sat
                          1
   2   3   4   5   6   7   8
   9  10  11  12  13  14  15
  16  17  18  19  20 [21] 22   ← 今日はゴールドで強調
  23  24  25  26  27  28  29
  30  31
```

- **◀ / ▶** で前月・翌月に移動
- **今日の日付** はゴールド背景＋白テキストで強調表示
- 予定管理機能は載せない（日付確認レベル）

---

## データベース

SQLite データベースファイルの保存先：

```
~/.config/plunge/data.db
```

WALモード有効、外部キー制約ON。

### テーブル構成

| テーブル | 用途 |
|---------|------|
| `links` | ランチャーに登録されたリンク |
| `tags` | 3軸タグ（project / role / tool） |
| `link_tags` | links × tags の多対多リレーション |
| `clips` | Clipper で保存したコンテンツ |
| `clip_tags` | clips × tags の多対多リレーション |
| `highlights` | Highlighter で作成したハイライト |
| `axis_outbox` | AXIS.への送信キュー（将来用） |

### 初期シードデータ

アプリ初回起動時に以下が自動登録される：

**タグ（16件）:**
- Projects: Veto., Hatch., Coffer., Boardroom., Plunge.
- Roles: Cro, Gem, GPT, Antigravity
- Tools: Claude, Gemini, Cursor, GitHub, Vercel, Supabase

**リンク（5件）:** Claude, Gemini, GitHub, Vercel, Supabase（全てtoolタグ付き）

---

## Tech Stack

| レイヤー | 技術 | 用途 |
|---------|------|------|
| Runtime | Electron 41 | デスクトップアプリ |
| Bundler | Vite 8 | フロントエンドビルド |
| UI | React 19 + TypeScript | コンポーネント |
| Styling | Tailwind CSS v4 | ユーティリティCSS |
| Animation | Framer Motion | UI遷移・展開 |
| State | Zustand | クライアント状態 |
| Data Fetch | TanStack Query | IPC経由のDBクエリ |
| DB | better-sqlite3 | ローカルSQLite |

### デザイントークン（Sorted. 共通）

| トークン | 値 | 用途 |
|---------|-----|------|
| `base` | `#F5F1EB` | 背景色 |
| `text` | `#4A413B` | テキスト色 |
| `divider` | `#D8D0C8` | ボーダー・区切り線 |
| `gold` | `#B68A2E` | アクセントカラー |
| `shadow` | `#D4CAC0` | シャドウ |
| `surface` | `#FFFFFF` | カード背景 |
| `surface-hover` | `#F0ECE6` | ホバー時背景 |

フォント: **General Sans**（Fontshare CDN）

---

## 開発

### ディレクトリ構成

```
plunge/
├── src/
│   ├── main/               ← Electron メインプロセス
│   │   ├── main.ts         ← ウインドウ生成、IPC、グローバルショートカット
│   │   ├── database.ts     ← SQLiteスキーマ、シード、接続管理
│   │   └── preload.ts      ← contextBridge（window.plunge API）
│   ├── renderer/           ← React フロントエンド
│   │   ├── main.tsx        ← エントリーポイント
│   │   ├── App.tsx         ← シェル（モードタブ、キーボード）
│   │   ├── index.html      ← HTML テンプレート
│   │   ├── index.css       ← Tailwind + デザイントークン
│   │   ├── stores/
│   │   │   └── appStore.ts ← Zustand ストア
│   │   └── components/
│   │       ├── ModeTab.tsx       ← モードタブボタン
│   │       ├── Launcher.tsx      ← 3軸ランチャー
│   │       ├── ToyBox.tsx        ← Toy box コンテナ
│   │       ├── ClipperView.tsx   ← Web クリッパー
│   │       ├── HighlighterView.tsx ← ハイライター
│   │       ├── DocReaderView.tsx ← MD リーダー + TTS
│   │       └── ClockPanel.tsx    ← World Clock + Calendar
│   └── shared/
│       └── types.ts        ← 共通型定義 + window.plunge 型宣言
├── vite.config.ts
├── tsconfig.json           ← Renderer用
├── tsconfig.main.json      ← Main process用
└── package.json
```

### IPC API リファレンス

`window.plunge` で公開されているAPI：

```typescript
// 外部リンク
window.plunge.openExternal(url: string): Promise<void>

// DB — リンク
window.plunge.db.links.all(): Promise<Link[]>

// DB — タグ
window.plunge.db.tags.all(): Promise<Tag[]>

// DB — クリップ
window.plunge.db.clips.all(): Promise<Clip[]>
window.plunge.db.clips.insert(clip): Promise<{ lastInsertRowid: number }>

// DB — ハイライト
window.plunge.db.highlights.all(): Promise<Highlight[]>
window.plunge.db.highlights.insert(h): Promise<{ lastInsertRowid: number }>

// DB — 汎用クエリ（上級者向け）
window.plunge.db.query(sql: string, params?: unknown[]): Promise<unknown>
```

---

## AXIS.エコシステム上の位置

```
~/.config/
  ├── coffer/data.db    ← 秘密管理（AXIS.連携済み）
  ├── hatch/data.db     ← 実行安全（AXIS.連携済み）
  ├── boardroom/data.db ← 意思決定（AXIS.連携済み）
  ├── plunge/data.db    ← 情報取水口（独立DB）
  └── axis/             ← 合流地点
```

Plunge. の DB は独立。他プロダクトとスキーマを共有しない。
連携が必要な場合は `axis_outbox` テーブル経由で AXIS. が仲介する。

### 情報フロー

```
[日中]  Plunge. で読む・クリップする・ハイライトする・メモする
            ↓ axis_outbox（吐出口）
[AXIS. DB]  夜間 Batch で整理・構造化
            ↓ Briefing Package
[翌朝]  Boardroom. Material Lane / Hatch. Context / Coffer. Reference
```

---

*Plunge. v0.2 — Sorted. Tools Internal*
