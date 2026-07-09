<?php
/**
 * DB接続情報・共通設定のテンプレート。
 * このファイルを config.php にコピーし、実環境の値に書き換えてください。
 *   cp config.example.php config.php
 * config.php は .gitignore 対象（実際の認証情報はコミットしない）。
 */

// ---- データベース接続情報 ----
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_db_name');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');
define('DB_CHARSET', 'utf8mb4');

// ---- CORS 設定 ----
// ★【要変更】'https://example.com' を、あなたのサイトのドメインに書き換えてください。
//   （例: https://your-domain.example / https://tomoyuki.org など、実際に設置するオリジン）
// 本番はフロントとバックを同一オリジンの /task-board/ 配下に置く想定でCORSは基本不要ですが、
// 別オリジンから叩くケースに備えて本番ドメインと開発用オリジン（Vite）を許可しておきます。
define('CORS_ALLOWED_ORIGINS', 'https://example.com,http://localhost:5173,http://127.0.0.1:5173');

// ---- レート制限 ----
define('RATE_LIMIT_MAX', 20);      // 上限回数
define('RATE_LIMIT_WINDOW', 60);   // ウィンドウ（秒）
