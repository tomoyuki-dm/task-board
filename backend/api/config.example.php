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
// 本番は同一オリジン配信（例: https://example.com/task-board/）ならCORSは基本不要だが、
// 別オリジンから叩くケースに備えて本番ドメインと開発用オリジンを許可しておく。
define('CORS_ALLOWED_ORIGINS', 'https://example.com,http://localhost:5173,http://127.0.0.1:5173');

// ---- レート制限 ----
define('RATE_LIMIT_MAX', 20);      // 上限回数
define('RATE_LIMIT_WINDOW', 60);   // ウィンドウ（秒）
