# Plunge.

> 取水口＋管制塔＋Toy box。AXIS.エコシステムの情報入口。
> "飛び込む" — 滝壺に飛び込んで、水を汲んで、パイプに流す。

Sorted. Tools 内部ツール。日常のブラウジング・読書・メモが自然とAXIS.への入力行為になるデスクトップアプリ。

---

## 目次

1. [セットアップ](#セットアップ)
2. [AI設定（任意）](#ai設定任意)
3. [画面構成](#画面構成)
4. [キーボードショートカット](#キーボードショートカット)
5. [Launch モード](#launch-モード)
   - [ダッシュボード](#ダッシュボード)
   - [リンクランチャー](#リンクランチャー)
   - [リンク登録](#リンク登録)
   - [リンク管理（右クリックメニュー）](#リンク管理右クリックメニュー)
   - [検索フィルター](#検索フィルター)
   - [AXIS Outbox ステータス](#axis-outbox-ステータス)
6. [Toys モード](#toys-モード)
   - [Clipper](#clipper)
   - [Highlighter（インラインハイライト）](#highlighterインラインハイライト)
   - [Doc Reader](#doc-reader)
7. [Clock モード](#clock-モード)
   - [World Clock](#world-clock)
   - [Calendar](#calendar)
8. [Dark Mode](#dark-mode)
9. [自動アップデート](#自動アップデート)
10. [データベース](#データベース)
11. [AXIS Outbox](#axis-outbox)
12. [AI 鞄持ち（3部署制）](#ai-鞄持ち3部署制)
13. [Tech Stack](#tech-stack)
14. [アーキテクチャ](#アーキテクチャ)
15. [IPC API リファレンス](#ipc-api-リファレンス)
16. [ビルドと配布](#ビルドと配布)
17. [AXIS.エコシステム上の位置](#axisエコシステム上の位置)

---

## セットアップ

### 前提条件

- Node.js 20+
- WSL2（Windows環境の場合）
- better-sqlite3 のネイティブリビルドが必要:

```bash
npx electron-rebuild
```

### インストールと起動

```bash
cd ~/plunge
npm install
npx electron-rebuild    # better-sqlite3 を Electron 向けにリビルド
npm run dev             # 開発モード（Vite + Electron 同時起動）
```

Vite dev server (port 5173) が起動 → Electron ウインドウが自動で立ち上がる。DevToolsが自動で開く（detachモード）。

### プロダクションビルド

```bash
npm run build           # renderer (Vite) + main (tsc) を両方ビルド
npm run start           # ビルド済みアプリを起動
```

---

## AI設定（任意）

AI機能（鞄持ち3部署）を使うには Gemini API キーが必要。

```bash
mkdir -p ~/.config/plunge
cat > ~/.config/plunge/config.json << 'EOF'
{
  "geminiApiKey": "YOUR_GEMINI_API_KEY_HERE"
}
EOF
```

- APIキーがなくてもアプリは正常に動作する（AI機能のみ無効化）
- モデル: `gemini-2.0-flash-lite`
- **このファイルは絶対にコミットしない**

---

## 画面構成

ウインドウは **420×800px**（最小 320×600）の縦長レイアウト。27インチモニターの端に常駐する想定。

```
┌──────────────────────────────────────────┐
│  Plunge. [Home] [Toys] [Clock]       ☽  │  ← タイトルバー（ドラッグ領域）
├──────────────────────────────────────────┤      ☽ = Dark mode トグル
│                                          │
│         各モードのコンテンツ領域            │
│                                          │
│                                          │
└──────────────────────────────────────────┘
```

- タイトルバーの「Plunge.」クリックで常にHomeに戻る
- モードタブのクリック or キーボードショートカットで切り替え
- モード遷移はクロスフェードアニメーション（150ms, ease-out）

### WSLg環境の注意

Linux（WSLg含む）では `frame: true` で起動する（OSのウインドウ装飾を使用）。
Windows/macOSでは `frame: false` + `titleBarOverlay` でカスタムタイトルバー。

---

## キーボードショートカット

### グローバル（バックグラウンドでも有効）

| キー | アクション |
|------|-----------|
| `Ctrl+Shift+P` | Plunge.を呼び出す（最小化→復元→フォーカス） |

### モード切り替え

| キー | アクション |
|------|-----------|
| `Ctrl+L` | Launch（Home）モード |
| `Ctrl+T` | Toys モード |
| `Ctrl+W` | Clock モード |

### Launch モード専用

| キー | アクション |
|------|-----------|
| `Ctrl+1` | Project ビュー |
| `Ctrl+2` | Role ビュー |
| `Ctrl+3` | Tool ビュー |
| `F1` | 1番目のグループを展開/折りたたみ |
| `F2` | 2番目 |
| `F3` | 3番目 |
| `Escape` | 展開中のカードを閉じる |

---

## Launch モード

### ダッシュボード

Homeを開くと、ナビゲーションカードが2×2グリッドで表示される。

```
┌────────────┬────────────┐
│  📋         │  🖍         │
│  Clipper    │ Highlighter│
│  3 clips   │  5 marks   │
├────────────┼────────────┤
│  📖         │  🕐         │
│  Reader    │  Clock     │
│            │ 19:30 JST  │
└────────────┴────────────┘
```

- 各カードクリックで対応するモード/ツールに直接遷移
- Clipper/Highlighterカードは保存数をリアルタイム表示
- Clockカードは現在のJST時刻を表示

### リンクランチャー

ダッシュボードの下に、登録リンクがアコーディオン形式で表示される。

**3軸ビュー:**

| ビュー | 切り替え | グループ化の基準 |
|--------|---------|----------------|
| **Project** | `Ctrl+1` | プロジェクト別（Veto., Hatch., Coffer. 等） |
| **Role** | `Ctrl+2` | ロール別（Cro, Gem, GPT, Antigravity） |
| **Tool** | `Ctrl+3` | ツール別（Claude, Gemini, Cursor 等） |

**操作:**

```
初期状態:
┌─────────────────────────┐
│  Veto.              [5] │  ← クリック or F1 で展開
├─────────────────────────┤
│  Hatch.             [3] │
├─────────────────────────┤
│  Coffer.            [2] │
└─────────────────────────┘

展開時:
┌─────────────────────────┐
│  Veto.              [5] │
├─────────────────────────┤
│ 🟣 Claude  🔵 Gemini   │  ← 4列グリッド、スタガーアニメーション
│ 🐙 GitHub  ▲ Vercel    │
│ 💚 Supabase            │
├─────────────────────────┤
│  Hatch.             [3] │  ← 下にスムーズに押し下げ
└─────────────────────────┘
```

- **展開は常に1つだけ**
- **アイコンクリック** → デフォルトブラウザでURLが開く
- アイコンはemoji または URL指定のfavicon画像（`http`で始まる場合は`<img>`で表示、エラー時🔗にフォールバック）

### リンク登録

Linksセクション右の「**+**」ボタンでモーダルが開く。

```
┌──────────────────────────────────┐
│           Add Link               │
├──────────────────────────────────┤
│  URL:   [https://example.com  ]  │  ← 入力後 blur/Enter で自動取得
│  Name:  [Example Site         ]  │  ← title が自動入力される
│  Icon:  [🌐] (favicon preview)   │  ← favicon が自動取得される
│                                  │
│  Tags:                           │
│  ☐ project: Veto.               │
│  ☐ project: Hatch.              │
│  ☑ tool: Claude                 │  ← チェックボックスで複数選択
│  ...                             │
│                                  │
│     [Cancel]        [Add Link]   │
└──────────────────────────────────┘
```

| フィールド | 必須 | 自動取得 | 説明 |
|-----------|------|---------|------|
| URL | Yes | — | リンク先URL |
| Name | Yes | title タグから | 表示名（編集可） |
| Icon | No | favicon から | emoji or favicon URL |
| Tags | No | — | 既存タグから複数選択 |

**自動取得の仕組み:** URL入力欄からフォーカスが外れた時点で、main processがそのURLにHTTP GETを送信（5秒タイムアウト）。HTMLから `<title>` と `<link rel="icon">` をregexで抽出し、Name/Iconフィールドに自動入力する。

### リンク管理（右クリックメニュー）

リンクアイコンを右クリックするとコンテキストメニューが表示される。

| 操作 | 説明 |
|------|------|
| **Open** | デフォルトブラウザで開く |
| **Copy URL** | URLをクリップボードにコピー |
| **Delete** | リンクを削除（確認なし、CASCADE でタグ関連も削除） |

### 検索フィルター

リンクが存在する場合、Linksセクション上部に検索入力欄が表示される。グループ名（タグ値）を部分一致でフィルタリングする。

### AXIS Outbox ステータス

Launcher下部にoutboxのステータスが表示される（pending/failedがある場合のみ）。

```
  📤 3 pending          [Send now]
```

- 「Send now」で手動一括送信
- pending/failedがゼロの場合は非表示

---

## Toys モード

3つのユーティリティツールをサブタブで切り替え。

```
┌──────────────────────────────────────────┐
│  [Clipper]  [Highlighter]  [Reader]      │  ← サブタブ
├──────────────────────────────────────────┤
│                                          │
│          選択中のツールのUI                │
│                                          │
└──────────────────────────────────────────┘
```

---

### Clipper

Web情報を抽出して構造化保存する。

#### コンテンツ抽出フロー

```
[URL入力] → [Fetch] → main processがHTTP GET
                         ↓
                    HTML解析（regex）:
                    - <title> 抽出
                    - <meta description> 抽出
                    - <article> or <main> のテキスト抽出
                    - nav/header/footer/script/style 除去
                    - 10,000文字で切り詰め
                         ↓
                    Title / Content / Memo 自動入力
                         ↓
                    [Save] → clips テーブル + axis_outbox 自動enqueue
```

#### 入力フォーム

| フィールド | 必須 | 自動入力 | 説明 |
|-----------|------|---------|------|
| URL | No | — | クリップ元のURL |
| Title | No | `<title>`から | コンテンツのタイトル |
| Content | **Yes** | `<article>`/`<main>`から | 抽出テキスト |
| Memo | No | `<meta description>`から | 自分の考察メモ |

- 「**Fetch**」ボタン: URLからコンテンツを自動抽出（10秒タイムアウト）
- 「**AI Extract**」ボタン: Gemini 営業課にコンテンツ分析を依頼（AI設定が必要）
- 「**Clip**」ボタン: DBに保存

#### クリップ一覧

保存済みクリップは新しい順に表示。**クリップカードをクリックすると詳細ビュー（ClipDetailView）が開く。**

```
┌─────────────────────────┐
│ Article Title            │  ← クリックで詳細展開
│ The first two lines...   │
│ 📝 自分のメモ             │  ← ゴールドイタリック
│ 2026-03-22 14:30:00      │
└─────────────────────────┘
```

#### ClipDetailView（クリップ詳細 + インラインハイライト）

クリップをクリックすると、全文表示とインラインハイライト機能が利用できる。

```
┌──────────────────────────────────────────┐
│  [← Back]            Article Title       │
├──────────────────────────────────────────┤
│                                          │
│  This is the full content of the clip.   │
│  You can select any text here and a      │
│  floating toolbar will appear to let     │
│  you ██highlight██ it with colors.       │
│                                          │
│        ┌──────────────────┐              │
│        │ 🟡 🟢 🔵 🩷 [✓]  │ ← 選択時ポップアップ
│        └──────────────────┘              │
│                                          │
│  Existing highlights are shown inline    │
│  with their assigned background color.   │
│                                          │
└──────────────────────────────────────────┘
```

**ハイライト作成手順:**

1. クリップ詳細ビューでテキストを選択
2. フローティングツールバーが出現
3. 色を選択（Yellow / Green / Blue / Pink）
4. チェックマークで確定
5. ハイライトがインラインで即反映

**位置追跡スキーマ（HighlightPosition）:**

```json
{
  "startOffset": 142,
  "endOffset": 198,
  "contextBefore": "...surrounding text before ",
  "contextAfter": " surrounding text after..."
}
```

- `startOffset` / `endOffset`: コンテンツ文字列内の絶対位置
- `contextBefore` / `contextAfter`: 前後約30文字（コンテンツ変更時のfuzzy再マッチング用）

---

### Highlighter

フォームベースでのハイライト作成（ClipDetailViewのインライン作成とは別経路）。

| フィールド | 必須 | 説明 |
|-----------|------|------|
| Clip | Yes | 対象クリップをドロップダウンから選択 |
| Color | Yes | 4色から選択（デフォルト: Yellow） |
| Text | Yes | ハイライトしたいテキスト |
| Note | No | メモ |

#### カラーシステム

| 色 | Hex | 用途の例 |
|----|-----|---------|
| Yellow | `#fef08a` | 重要ポイント（デフォルト） |
| Green | `#bbf7d0` | アクションアイテム |
| Blue | `#bfdbfe` | 参考情報 |
| Pink | `#fbcfe8` | 疑問・要確認 |

---

### Doc Reader

Markdown / docx を閲覧し、音声で読み上げる。

#### 入力方法

| 方法 | 説明 |
|------|------|
| **Open File** ボタン | ファイルダイアログから `.md` / `.docx` を選択 |
| **テキストエリア直接入力** | Markdownをペースト or 手打ち |

- `.docx` ファイルは **mammoth.js** でMarkdownに変換
- `.md` ファイルはそのまま読み込み
- 読み込んだファイル名がバッジで表示される

#### Markdown対応記法

| 記法 | レンダリング |
|------|------------|
| `# 見出し` | H1 |
| `## 見出し` | H2 |
| `### 見出し` | H3 |
| `**太字**` | **太字** |
| `*斜体*` | *斜体* |
| `` `コード` `` | インラインコード |
| ` ``` ` ブロック ` ``` ` | コードブロック |
| `- リスト` | 箇条書き |
| `[text](url)` | リンク（ゴールド色） |
| `---` | 水平線 |

#### 音声読み上げ（Web Speech API）

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
| Read Aloud | 停止中 | 先頭から読み上げ開始 |
| Resume | 一時停止中 | 再開 |
| Restart | 読み上げ中 | 先頭から |
| Pause | 読み上げ中 | 一時停止 |
| Stop | 読み上げ中 | 停止（位置リセット） |

- 2000文字チャンク分割で順次読み上げ
- Markdown記法は読み上げ前に自動除去

---

## Clock モード

### World Clock

6タイムゾーンの現在時刻を毎秒更新で表示。

```
┌────────────────┬────────────────┐
│ ☀ Tokyo   JST  │   UTC     UTC  │  ← Tokyo はゴールド左ボーダー
│ Sat, Mar 22    │ Sat, Mar 22    │
│ 19:30:45       │ 10:30:45       │  ← コロンが0.5秒間隔でパルス
├────────────────┼────────────────┤
│ ☽ New York EDT │ ☽ Chicago CDT  │  ← 夜間は☽、昼間は☀
│ Sat, Mar 22    │ Sat, Mar 22    │
│ 05:30:45       │ 04:30:45       │
├────────────────┼────────────────┤
│ ☽ LA      PDT  │ ☀ India   IST  │
│ Sat, Mar 22    │ Sat, Mar 22    │
│ 02:30:45       │ 16:00:45       │
└────────────────┴────────────────┘
```

| タイムゾーン | 都市 | 用途 |
|-------------|------|------|
| JST | Tokyo | 自分の時間（ゴールドボーダーで強調） |
| UTC | — | 基準時刻 |
| EST/EDT | New York | 米国東海岸 |
| CST/CDT | Chicago | 米国中部 |
| PST/PDT | Los Angeles | 米国西海岸 |
| IST | India | インドチーム |

- 24時間表記（HH:MM:SS）、等幅フォント
- DST切り替えは自動
- 6:00-18:00 = ☀（昼）、それ以外 = ☽（夜）

### Calendar

```
           ◀  March 2026  ▶
  Sun Mon Tue Wed Thu Fri Sat
                          1
   2   3   4   5   6   7   8
   9  10  11  12  13  14  15    ← 週末は薄い色
  16  17  18  19  20 [21] 22    ← 今日 = ゴールド背景
  23  24  25  26  27  28  29    ← 今日の週 = 行ハイライト
  30  31
```

- **◀ / ▶** で月移動
- **今日**: ゴールド背景 + 白テキスト
- **今日の週**: 行全体に薄い背景ハイライト
- **週末（土日）**: テキスト色が薄め
- **日付クリック**: ゴールドリングで選択状態（表示のみ、機能連携は将来）

---

## Dark Mode

タイトルバー右端の ☽ / ☀ ボタンで切り替え。設定は `localStorage` に永続化。

### Light テーマ

| トークン | 値 | 用途 |
|---------|-----|------|
| base | `#F5F1EB` | 背景 |
| text | `#2C2418` | テキスト |
| text-secondary | `#7A6F60` | 補助テキスト |
| text-muted | `#A89B8A` | 薄いテキスト |
| divider | `#E5DFD5` | 区切り線 |
| gold | `#B68A2E` | アクセント |
| surface | `#FDFBF8` | カード背景 |
| surface-hover | `#EDE8E0` | ホバー |

### Dark テーマ

| トークン | 値 | 用途 |
|---------|-----|------|
| base | `#1A1814` | 背景（温かみのあるチャコール） |
| text | `#E8E0D0` | テキスト（クリーム） |
| text-secondary | `#8A7D70` | 補助テキスト |
| text-muted | `#A89A8C` | 薄いテキスト |
| divider | `#3A3228` | 区切り線 |
| gold | `#D4A43A` | アクセント（暗背景用に明るめ） |
| surface | `#242018` | カード背景 |
| surface-hover | `#2E2820` | ホバー |

フォント: **General Sans**（Fontshare CDN）

> Note: Windows/macOSの `titleBarOverlay` カラーはLight固定（`#F5F1EB`）。Dark mode時にタイトルバーのみLightのままになる。

---

## 自動アップデート

`electron-updater` + GitHub Releases による自動アップデート。

| 項目 | 設定 |
|------|------|
| チェックタイミング | 起動3秒後 + 3時間ごと |
| ダウンロード | バックグラウンド自動 |
| インストール | ユーザー確認後に再起動 |
| 署名 | なし（SmartScreen警告あり） |
| Windows配布形式 | NSIS |
| macOS配布形式 | DMG |
| Linux配布形式 | AppImage |

### アップデートフロー

```
[起動3秒後] → GitHub Releases チェック
                  ↓ 新バージョンあり
              バックグラウンドDL
                  ↓ DL完了
              ダイアログ: "Restart now?"
                  ↓ [Restart] クリック
              アプリ再起動 + インストール
```

### 手動チェック（IPC経由）

```typescript
const result = await window.plunge.app.checkForUpdates()
// { available: boolean }
```

---

## データベース

SQLiteファイル:

```
~/.config/plunge/data.db
```

WALモード、外部キー制約ON。スキーマは `database.ts` 内のraw SQLで `CREATE TABLE IF NOT EXISTS` により自動作成（マイグレーションツール不使用）。

### テーブル構成

| テーブル | 行数目安 | 用途 |
|---------|---------|------|
| `links` | 〜50 | ランチャーリンク |
| `tags` | 〜20 | 3軸タグ（project / role / tool） |
| `link_tags` | 〜100 | links × tags 多対多 |
| `clips` | 〜500 | Clipperで保存したコンテンツ |
| `clip_tags` | 〜1000 | clips × tags 多対多 |
| `highlights` | 〜2000 | ハイライト（位置情報JSON付き） |
| `axis_outbox` | 〜5000 | AXIS.送信キュー |

### 初期シードデータ

アプリ初回起動時（tagsテーブルが空の場合）に自動登録:

**タグ（16件）:**

| 軸 | 値 |
|----|-----|
| project | Veto., Hatch., Coffer., Boardroom., Plunge. |
| role | Cro, Gem, GPT, Antigravity |
| tool | Claude, Gemini, Cursor, GitHub, Vercel, Supabase |

リンクのシードはなし。ユーザーが自分で登録する。

---

## AXIS Outbox

Plunge.で作成したclip/highlightは、自動的に `axis_outbox` テーブルにenqueueされる。

### 自動enqueue

| トリガー | source_type | payload |
|---------|-------------|---------|
| Clip保存 | `clip` | `{ origin: "plunge", item_type: "clip", content: { url, title, body, memo } }` |
| Highlight作成 | `highlight` | `{ origin: "plunge", item_type: "highlight", content: { text, note, color } }` |

### 送信方式

| 方式 | 頻度 | 説明 |
|------|------|------|
| 定期バッチ | 15分間隔 | main processのsetIntervalで自動実行 |
| 手動送信 | ユーザー操作 | Launcher下部の「Send now」ボタン |

### ステータス遷移

```
pending → sent      (送信成功)
pending → failed    (送信失敗)
failed  → pending   (リトライ)
```

> **現状:** AXIS.エンジンは開発中のため、送信処理は **stub**（pendingをsentにマークするだけ）。実際のHTTP POST/IPCはAXIS.エンジン完成後に接続する。

---

## AI 鞄持ち（3部署制）

Gemini 2.0 Flash Lite を3つの「部署」に分けて運用。全部署共通ルール:

- 設計判断しない
- コードを書かない
- 優先順位をつけない
- データを勝手に削除・編集しない
- 提案のみ。実行はユーザー承認後

### 部署構成

| 部署 | ID | 担当領域 |
|------|-----|---------|
| **庶務課** | `shomu` | Doc Reader MD正規化、docxクリーンアップ、データ整形、favicon取得支援 |
| **営業課** | `eigyo` | Clipper抽出分析、URL評価、タイトル/タグ提案、読書リストキュレーション |
| **経理課** | `keiri` | タグ管理提案、Outboxステータス報告、ハイライトパターン分析、リンク管理 |

### UI上の呼び出し

| ビュー | ボタン | 呼び出し部署 |
|--------|--------|------------|
| Clipper | AI Extract | 営業課 (`eigyo`) |
| Highlighter | (タグ提案) | 経理課 (`keiri`) |
| Doc Reader | (正規化) | 庶務課 (`shomu`) |

---

## Tech Stack

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| Runtime | Electron | 41 |
| Bundler | Vite | 8 |
| UI | React + TypeScript | 19 |
| Styling | Tailwind CSS + shadcn/ui | v4 |
| Animation | Framer Motion | 12 |
| State | Zustand | 5 |
| Data Fetch | TanStack Query | 5 |
| ORM | Drizzle ORM | 0.45 |
| DB | better-sqlite3 | 12 |
| AI | Google GenAI (Gemini 2.0 Flash Lite) | — |
| Doc Parser | mammoth.js | 1.12 |
| Auto-update | electron-updater | 6 |

---

## アーキテクチャ

```
src/
├── main/                        ← Electron main process (CommonJS)
│   ├── main.ts                  ← Window, IPC handlers, auto-update, global shortcut, outbox batch
│   ├── database.ts              ← SQLite schema (raw SQL), Drizzle wrapper, seed
│   ├── schema.ts                ← Drizzle table definitions + relations
│   ├── config.ts                ← ~/.config/plunge/config.json loader
│   ├── ai.ts                    ← Gemini 3-department system prompts + API call
│   └── preload.ts               ← contextBridge (window.plunge API)
│
├── renderer/                    ← React frontend (ESM, Vite)
│   ├── main.tsx                 ← React root mount
│   ├── App.tsx                  ← Shell (title bar, mode tabs, keyboard, dark mode toggle)
│   ├── index.html               ← HTML template
│   ├── index.css                ← Tailwind v4 + design tokens (light/dark)
│   ├── stores/
│   │   └── appStore.ts          ← Zustand (mode, launchView, toyView, expandedCard, theme)
│   ├── hooks/
│   │   └── useAi.ts             ← AI hook
│   ├── lib/
│   │   └── utils.ts             ← cn() utility (clsx + tailwind-merge)
│   └── components/
│       ├── ModeTab.tsx           ← Title bar tab button
│       ├── Launcher.tsx          ← Home dashboard + 3-axis link launcher + search + outbox status
│       ├── LinkFormModal.tsx     ← Link registration modal with auto-fetch
│       ├── ToyBox.tsx            ← Toy box container (sub-tab routing)
│       ├── ClipperView.tsx       ← Clipper: URL fetch + clip form + clip list
│       ├── ClipDetailView.tsx    ← Clip full view + inline highlight creation
│       ├── HighlighterView.tsx   ← Form-based highlight creation
│       ├── DocReaderView.tsx     ← MD/docx reader + TTS
│       ├── ClockPanel.tsx        ← World Clock + Calendar
│       └── ui/                   ← shadcn/ui primitives (button, card, input, etc.)
│
└── shared/
    └── types.ts                 ← Interface definitions + Window.plunge type declaration
```

### データフロー

```
[Renderer]                    [Main Process]                  [Disk]

 Zustand ←→ React             IPC handlers
 TanStack Query ──invoke──→   Drizzle ORM ──────→ SQLite
              ←──result────   (better-sqlite3)    ~/.config/
                                                  plunge/
 useAi hook ────invoke──→     Gemini API call     data.db
              ←──result────   (Flash Lite)
                                                  config.json
                              autoUpdater ────→   GitHub
                                                  Releases
```

---

## IPC API リファレンス

`window.plunge` で公開されている全API:

### App

```typescript
window.plunge.app.checkForUpdates(): Promise<{ available: boolean }>
```

### Shell

```typescript
window.plunge.openExternal(url: string): Promise<void>
```

### DB — Links

```typescript
window.plunge.db.links.all(): Promise<Link[]>
window.plunge.db.links.insert(data: {
  name: string; url: string; icon?: string; tagIds?: number[]
}): Promise<{ id: number; name: string; url: string; icon: string | null; sortOrder: number | null }>
window.plunge.db.links.delete(id: number): Promise<void>
```

### DB — Tags

```typescript
window.plunge.db.tags.all(): Promise<Tag[]>
```

### DB — Clips

```typescript
window.plunge.db.clips.all(): Promise<Clip[]>
window.plunge.db.clips.insert(clip: {
  url?: string; title?: string; content: string; memo?: string; source_type?: string
}): Promise<Record<string, unknown>>
```

### DB — Highlights

```typescript
window.plunge.db.highlights.all(): Promise<Highlight[]>
window.plunge.db.highlights.insert(h: {
  clip_id: number; text: string; color?: string; note?: string; position?: string
}): Promise<Record<string, unknown>>
```

### DB — Outbox

```typescript
window.plunge.db.outbox.all(): Promise<OutboxEntry[]>
window.plunge.db.outbox.count(): Promise<{ pending: number; sent: number; failed: number }>
window.plunge.db.outbox.sendAll(): Promise<{ sent: number; failed: number }>
window.plunge.db.outbox.retry(): Promise<void>
```

### Util

```typescript
window.plunge.util.fetchMeta(url: string): Promise<{ title: string; favicon: string | null }>
window.plunge.util.extractPage(url: string): Promise<{
  title: string; description: string; content: string; favicon: string | null
}>
window.plunge.util.readFile(path: string): Promise<string>      // .md only
window.plunge.util.parseDocx(path: string): Promise<string>     // .docx → markdown
```

### Dialog

```typescript
window.plunge.dialog.openFile(): Promise<string | null>         // .md / .docx filter
```

### AI

```typescript
window.plunge.ai.status(): Promise<{ configured: boolean }>
window.plunge.ai.ask(req: {
  department: 'shomu' | 'eigyo' | 'keiri'
  message: string
  context?: Record<string, unknown>
}): Promise<AiSuccessResponse | AiErrorResponse>
```

---

## ビルドと配布

### 開発

```bash
npm run dev              # Vite dev server + Electron 同時起動
npm run build            # renderer + main ビルド
npm run start            # ビルド済みで起動
```

### 個別ビルド

```bash
npm run build:renderer   # Vite → dist/renderer/
npm run build:main       # tsc → dist/main/
```

### 配布パッケージ

```bash
npm run dist             # 全プラットフォーム
npm run dist:win         # Windows (NSIS)
npm run dist:mac         # macOS (DMG)
npm run dist:linux       # Linux (AppImage)
```

出力先: `release/`

### electron-builder 設定

| 項目 | 値 |
|------|-----|
| appId | `com.sorted.plunge` |
| productName | `Plunge` |
| publish.provider | `github` |
| publish.owner | `YumaKakuya` |
| publish.repo | `plunge` |
| nsis.perMachine | `false`（ユーザー単位インストール、管理者権限不要） |

---

## AXIS.エコシステム上の位置

```
~/.config/
  ├── coffer/data.db    ← 秘密管理（AXIS.連携済み）
  ├── hatch/data.db     ← 実行安全（AXIS.連携済み）
  ├── boardroom/data.db ← 意思決定（AXIS.連携済み）
  ├── plunge/data.db    ← 情報取水口（独立DB）
  │   └── config.json   ← Gemini APIキー
  └── axis/             ← 合流地点（エンジン開発中）
```

### エコシステム上の役割

| Product | 役割 | AXIS.との関係 |
|---------|------|--------------|
| Coffer. | 秘密管理 | 連携済み |
| Hatch. | 実行安全 | 連携済み |
| Boardroom. | 意思決定会議室 | 連携済み |
| **Plunge.** | **情報の取水口** | **吐出口のみ共通** |
| AXIS. | エンジン（合流地点） | — |

Plunge.はBoardroom.の下位ツールではない。対等な兄弟。
Plunge.にエージェント機能は不要。それはBoardroom.の仕事。

### 情報フロー

```
[日中]
  Plunge. で読む・クリップする・ハイライトする・メモする
    ↓ axis_outbox（自動enqueue）
    ↓ 定期バッチ 15分 or 手動送信
[AXIS. DB]
    ↓ 夜間 Batch（Layer C / Flash Lite）
  整理・構造化・パターン評価
    ↓ Briefing Package
[翌朝]
  Boardroom. → Material Lane に着地
  Hatch.     → コンテキスト更新
  Coffer.    → 鍵の参照情報
```

---

*Plunge. v0.3 — Sorted. Tools Internal*
