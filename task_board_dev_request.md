# タスク分担掲示板 開発依頼スクリプト（Claude Code 用）

このドキュメントは Claude Code に貼り付けて開発を依頼するための仕様書です。冒頭からそのままプロンプトとして使用できます。

---

## 依頼文（Claude Codeへの指示）

以下の仕様に基づき、「タスク分担掲示板」というWebアプリケーションを開発してください。黒板にチョークでタスク（募集内容）を書き、そのタスクに賛同・参加する人が付箋を貼っていく、というアナログな掲示板を模したデジタルツールです。

---

## 1. コンセプト

- 黒板に見立てた画面に、募集したいタスクの「タイトル」と「説明文」をチョーク書き風に表示する。
- 各タスクには誰でも付箋（ボランティアの名前＋一言コメント）を貼ることができる。
- 黒板には複数のタスクを同時に掲示できる（一覧・ボード形式）。
- ログイン機能はなし。誰でも自由にタスクの追加、付箋の追加・削除ができる、オープンな運用とする。

## 2. 技術スタック

**フロントエンド**
- Vite + React + TypeScript
- Tailwind CSS v3
- SPA構成。バックエンドのPHP APIをfetchで呼び出す

**バックエンド**
- LAMP環境（共有ホスティングを想定）
- PHP（フレームワークなし、素のPHP＋PDOで実装。Composer等のCLI操作が使えないホスティングでも動く構成とする）
- MySQL

## 3. 機能要件

### 3.1 タスク（黒板の項目）

- 誰でも新規タスクを作成できる（ログイン不要）
- 入力項目：タイトル（必須・100文字程度まで）、説明文（任意・500文字程度まで）
- 作成日時を保持し、新しい順（または任意の並び順）で黒板に表示
- タスクの削除も誰でも可能（オープン運用のため）。削除すると紐づく付箋もすべて削除される
- タスク一覧はページ遷移なしで随時更新（一覧取得APIを都度呼ぶ、またはポーリングで十分）

### 3.2 付箋（立候補・ボランティア登録）

- 各タスクに対し、誰でも付箋を追加できる
- 入力項目：名前（必須・50文字程度まで）、一言コメント（任意・200文字程度まで）
- 付箋の色はランダムまたはユーザーが選択可能にする（黄・ピンク・水色・緑など数色を用意）
- 付箋は誰でも削除できる（本人確認なし。運用上の注意点として後述）
- 1つのタスクに貼れる付箋の数に上限は設けない

## 4. 画面構成

- **黒板ビュー（メイン画面）**：黒板風の背景（濃い緑〜黒のテクスチャ）に、タスクをチョーク文字風フォントでカード状に並べる。各タスクカードの下部に、貼られた付箋を重ならないように並べて表示する
- **タスク追加**：黒板上に常設の「＋ 新しいタスクを書く」ボタンからモーダルまたはフォームを開き、タイトル・説明文を入力して追加
- **付箋追加**：各タスクカード内の「＋ 立候補する」ボタンから、名前・コメント・（任意で）色を入力して追加
- **削除操作**：タスクカード・付箋それぞれに削除ボタン（誤操作防止のため確認ダイアログを挟む）
- **デザインテイスト**：黒板のテクスチャ背景＋チョーク風フォント（例：Google Fonts の "Chalkboard" 系、または "Caveat" ".Kalam" 等の手書き風フォント）で質感を重視する。付箋はランダムな微妙な傾き（回転）をつけて紙感を演出すると雰囲気が出る

## 5. データベース設計（MySQL）

```sql
CREATE TABLE tasks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id INT UNSIGNED NOT NULL,
  name VARCHAR(50) NOT NULL,
  comment VARCHAR(200),
  color VARCHAR(20) DEFAULT 'yellow',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 6. API仕様（JSON, PHP実装）

| メソッド | エンドポイント | 内容 |
|---|---|---|
| GET | /api/tasks.php | 全タスク一覧を、紐づく付箋込みで取得 |
| POST | /api/tasks.php | タスクを新規作成（title, description） |
| DELETE | /api/tasks.php?id={id} | タスクを削除（付箋も連動して削除） |
| POST | /api/notes.php | 付箋を新規作成（task_id, name, comment, color） |
| DELETE | /api/notes.php?id={id} | 付箋を削除 |

- レスポンスは全てJSON
- CORS対応（フロントとバックが別ドメイン・別ポートの開発環境を想定し、開発時は `Access-Control-Allow-Origin` を設定）
- 入力値は必ずサーバー側でもバリデーション・エスケープ処理を行う（XSS対策として `htmlspecialchars` 等で出力時エスケープ、SQLインジェクション対策としてPDOのプレースホルダを使用）

## 7. ディレクトリ構成（例）

```
project-root/
├── frontend/                  # Vite + React + TS + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── Board.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   ├── StickyNote.tsx
│   │   │   ├── NewTaskForm.tsx
│   │   │   └── NewNoteForm.tsx
│   │   ├── api/client.ts
│   │   ├── types/index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
└── backend/                   # PHP (LAMP)
    ├── api/
    │   ├── tasks.php
    │   ├── notes.php
    │   └── config.php         # DB接続情報（.gitignore対象）
    ├── db/
    │   └── schema.sql
    └── .htaccess
```

## 8. 非機能要件・運用上の注意

- 認証なし・全操作オープンのため、荒らし対策として以下を検討する：
  - 簡易的なレート制限（同一IPからの短時間大量投稿を制限）
  - 入力文字数の上限を厳格にサーバー側で強制
  - 将来的に「タスク削除だけは合言葉制にする」等の拡張余地を残しておく
- スマートフォンでも閲覧・投稿しやすいよう、レスポンシブ対応必須
- 黒板・付箋のレイアウトは、タスク数・付箋数が増えても崩れないようFlexbox/Gridで組む

## 9. 開発の進め方（推奨）

1. `backend/db/schema.sql` を作成し、MySQLにテーブルを作成
2. PHP側のAPI（tasks.php / notes.php）をPDOで実装し、Postman等で動作確認
3. フロントエンドをVite + React + TSでセットアップし、Tailwindを導入
4. 黒板・タスクカード・付箋のUIコンポーネントを実装
5. APIと接続し、タスク追加・付箋追加・削除の一連の操作を動作確認
6. デザイン調整（黒板テクスチャ、チョーク風フォント、付箋の傾き演出）
7. レスポンシブ対応と入力バリデーションの最終確認
