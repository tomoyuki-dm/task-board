# タスク分担掲示板

黒板にチョーク風でタスク（募集内容）を書き、参加したい人が付箋（名前＋一言）を貼っていく、アナログ掲示板を模したオープンなWebアプリです。ログイン不要で、誰でもタスクの追加・付箋の追加・削除ができます。

**プロジェクト（黒板）を複数作成できます。** プロジェクトごとに推測困難な専用URL（プロジェクトID）が発行され、`https://tomoyuki.org/task-board/<プロジェクトID>` でアクセスします。

- **フロントエンド**: Vite + React + TypeScript + Tailwind CSS v3（SPA・パスパラメータルーティング）
- **バックエンド**: 素のPHP（PDO）＋ MySQL（LAMP・共有ホスティング想定、Composer不要）

## 画面（ルート）

| URL | 内容 |
|---|---|
| `/task-board/` | トップ。新規プロジェクト作成へ誘導、既存IDの入力欄 |
| `/task-board/project-new` | 新規プロジェクト作成フォーム。作成すると専用URLを発行 |
| `/task-board/<プロジェクトID>` | そのプロジェクトの黒板（タスク・付箋） |

> プロジェクトIDはランダムに発行される推測困難な文字列で、これ自体が簡易的なアクセス制御を兼ねます（URLを知っている人だけがアクセス可能）。認証機能はありません。IDの一覧表示や再発行はできないため、発行されたURLは各自でブックマーク・保管してください。

```
task-board/
├── frontend/   # Vite + React + TS + Tailwind
└── backend/    # PHP API + MySQL スキーマ
```

---

## セットアップ手順

### 1. バックエンド（PHP + MySQL）

1. MySQL にデータベースを作成し、スキーマを流し込みます。

   ```sql
   CREATE DATABASE task_board DEFAULT CHARSET utf8mb4;
   ```
   ```bash
   mysql -u <user> -p task_board < backend/db/schema.sql
   ```

   > **既存インストールのマイグレーション**
   > - 旧バージョン（プロジェクト機能なし）から更新する場合、`projects` テーブル追加・`tasks.project_id` 追加などスキーマが変わっています。まだデータが無ければ、`DROP TABLE notes, tasks;` してから上記を流し直すのが簡単です。
   > - すでに `tasks` テーブルが有り、**タスク並び替え機能を後から足す**場合は、データを消さずに次の1行を実行してください。
   >   ```sql
   >   ALTER TABLE tasks ADD COLUMN sort_order INT NOT NULL DEFAULT 0;
   >   ```
   >   既存タスクは `sort_order = 0`（＝従来どおり新しい順）で表示され、以後は画面の「↑／↓」で並びを変更・保存できます。

2. DB接続情報を設定します。テンプレート [`config.example.php`](backend/api/config.example.php) をコピーして `config.php` を作り、値を実環境のものに書き換えてください（`config.php` は `.gitignore` 対象で、実際の認証情報はコミットされません）。

   ```bash
   cp backend/api/config.example.php backend/api/config.php
   ```

   `config.php` の設定項目:
   - `DB_HOST` / `DB_NAME` / `DB_USER` / `DB_PASS` … DB接続情報
   - `CORS_ALLOWED_ORIGINS` … フロントのオリジン（開発時は `http://localhost:5173` など）をカンマ区切りで指定
   - `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW` … 同一IPからの投稿レート制限（既定: 60秒に20回まで）

3. `backend/` を Apache（PHP有効）で配信します。共有ホスティングなら `backend/` 配下をそのままアップロードすればOKです。
   ローカルなら XAMPP/MAMP 等の `htdocs` に置くか、以下でも起動できます（開発用途）。

   ```bash
   php -S localhost:8000 -t backend
   ```

   この場合の API ベースURLは `http://localhost:8000` になります。

### 2. フロントエンド（Vite + React）

1. API のベースURLを設定します。`.env.example` を `.env` にコピーし、バックエンドのURLに合わせます。

   ```bash
   cp frontend/.env.example frontend/.env
   # 例: VITE_API_BASE=http://localhost:8000
   ```

2. 依存をインストールして開発サーバーを起動します。

   ```bash
   cd frontend
   npm install
   npm run dev        # http://localhost:5173
   ```

3. 本番ビルド:

   ```bash
   npm run build      # frontend/dist/ に出力
   ```

   本番用のAPIベースURLは [`frontend/.env.production`](frontend/.env.production) に `VITE_API_BASE=/task-board` として設定済みです。ビルド時に自動で使われます。

---

## 本番デプロイ（https://tomoyuki.org/task-board/）

フロントとバックエンドを**同一ドメインの `/task-board/` 配下**にまとめる構成です。同一オリジンになるためCORSは実質不要で、設定もシンプルです。

サーバー（`public_html` など）に、次のレイアウトになるようアップロードします。

```
task-board/                 ← https://tomoyuki.org/task-board/
├── index.html              (frontend/dist/index.html)
├── assets/                 (frontend/dist/assets/ 一式)
├── .htaccess               (backend/.htaccess … SPAルーティング＋設定ファイル保護)
└── api/
    ├── projects.php        (backend/api/projects.php)
    ├── tasks.php           (backend/api/tasks.php)
    ├── notes.php           (backend/api/notes.php)
    ├── config.php          (backend/api/config.php … 実値に編集して置く)
    ├── bootstrap.php       (backend/api/bootstrap.php)
    └── .htaccess           (backend/api/.htaccess … config/bootstrap を直アクセス拒否)
```

手順:

1. **DB準備** … 上記「バックエンド」の手順で本番MySQLにスキーマを流し、`config.php` に本番のDB接続情報を記入する。
2. **フロントをビルド** … `cd frontend && npm ci && npm run build`。生成された `frontend/dist/` の**中身**（`index.html` と `assets/`）を `task-board/` 直下にアップロード。
3. **バックエンドを配置** … `backend/api/` の中身を `task-board/api/` へ、`backend/.htaccess` を `task-board/.htaccess` へアップロード。`schema.sql`（`backend/db/`）はDB投入用でありサーバーに置く必要はない（置く場合も `.htaccess` でアクセス拒否済み）。
4. ブラウザで `https://tomoyuki.org/task-board/` を開いて動作確認。

補足:
- Vite は `base: '/task-board/'` でビルドし、アセットは `/task-board/assets/...` を絶対パスで参照します。`/task-board/<プロジェクトID>` のようなパスでも参照が壊れません。
- `/task-board/<プロジェクトID>` などSPAのルートは、`.htaccess` の mod_rewrite で `index.html` にフォールバックさせています（**mod_rewrite が有効で `AllowOverride` が効くこと**が前提。多くの共有ホスティングは既定でOK）。
- APIは `https://tomoyuki.org/task-board/api/*.php` を同一オリジンで呼び出します。
- 独自ドメイン/パスを変える場合は、`frontend/vite.config.ts` の `base`、`frontend/.env.production` の `VITE_API_BASE`、`backend/.htaccess` の `RewriteBase`、`config.php` の `CORS_ALLOWED_ORIGINS` を合わせて調整してください。

---

## API 仕様

すべて JSON。エラー時は `{ "error": "メッセージ" }` と適切なHTTPステータスを返します。

| メソッド | エンドポイント | 内容 |
|---|---|---|
| POST | `/api/projects.php` | プロジェクト作成 `{ name, description }` → `{ key, name, ... }` を返す（`key` が発行されたプロジェクトID） |
| GET | `/api/projects.php?key={key}` | プロジェクト情報を取得（存在確認・名称表示用） |
| GET | `/api/tasks.php?project={key}` | 指定プロジェクトのタスク一覧（付箋込み）＋プロジェクト情報 `{ project, tasks }` |
| POST | `/api/tasks.php` | タスク作成 `{ project, title, description }`（先頭に追加） |
| PUT | `/api/tasks.php?id={id}` | タスク編集 `{ title, description }` |
| PUT | `/api/tasks.php?action=reorder` | 並び替え `{ project, order: [taskId, ...] }`（配列順に表示順を保存） |
| DELETE | `/api/tasks.php?id={id}` | タスク削除（付箋もCASCADEで削除） |
| POST | `/api/notes.php` | 付箋作成 `{ task_id, name, comment, color }` |
| PUT | `/api/notes.php?id={id}` | 付箋編集 `{ name, comment, color }` |
| DELETE | `/api/notes.php?id={id}` | 付箋削除 |

- タスク・付箋は必ずいずれかのプロジェクトに属します（プロジェクト削除で連動削除）。
- 付箋の色（`color`）は `yellow` / `pink` / `blue` / `green` / `orange` / `purple` のいずれか。範囲外は `yellow` に丸めます。

---

## セキュリティ・運用上の注意

- **SQLインジェクション対策**: すべてのクエリで PDO のプレースホルダを使用。
- **入力バリデーション**: 文字数上限（プロジェクト名100・プロジェクト説明500・タスクタイトル100・タスク説明500・付箋名前50・コメント200）と必須項目をサーバー側で厳格に強制。制御文字は除去。プロジェクトIDは英数字・ハイフンのみ・32文字以内の形式チェックを行う。
- **XSS対策**: フロントは React で、React は描画時に自動でHTMLエスケープします。そのため JSON API 側では `htmlspecialchars` を**あえて掛けていません**（掛けると二重エスケープになり `&` が `&amp;` 等と表示崩れするため）。生データを保存し、表示層（React）でエスケープする構成です。もし将来この API を React 以外（エスケープしないクライアント）から直接HTMLに埋め込む場合は、その表示側でエスケープを行ってください。
- **レート制限**: 同一IPからの POST/DELETE を一定時間内の回数で制限（`config.php` で調整）。ファイルベースの簡易実装です。
- **認証なし・全操作オープン**: 仕様どおり誰でも削除できます。荒らしが問題になる場合の拡張余地として、「タスク削除だけ合言葉制にする」等を `config.php` + APIに追加できる構成にしてあります。
- `config.php` / `bootstrap.php` / `.sql` 等へのブラウザからの直接アクセスは `.htaccess` で拒否しています（Apache想定）。

---

## デザインについて

- 黒板テクスチャ背景（濃い緑のグラデ＋チョークの粉ムラ）＋木枠。
- チョーク風フォントに Google Fonts の **Yomogi**（日本語手書き）と **Kalam**（英数手書き）を使用。
- 付箋は6色から選択（または開くたびにランダムな初期色）、`id` を種にした決定的な微小回転で紙感を演出。
- Flexbox/Grid でレイアウトし、スマホ〜PCまでレスポンシブ対応。タスク数・付箋数が増えても崩れません。
- 一覧は15秒ごとにポーリングし、他の人の投稿を自動反映（フォーム/ダイアログ表示中・並び替え保存中は割り込みません）。
- タスクカード右上の「↑／↓」で表示順を1つずつ入れ替えできます。並びはサーバーに保存され、他の閲覧者にも反映されます（先頭では「↑」、末尾では「↓」が無効化されます）。
- ヘッダーの「⬇ CSVダウンロード」で、表示中のプロジェクトのタスクと立候補者をCSV出力できます（フロント側のみで生成、UTF-8 BOM付きでExcel対応）。形式は次のとおり:

  ```
  プロジェクト名,プロジェクト説明,プロジェクトURL

  タスク名,タスク説明
  立候補者,メモ
  立候補者,メモ

  タスク2名,タスク2説明
  立候補者,メモ
  ```
