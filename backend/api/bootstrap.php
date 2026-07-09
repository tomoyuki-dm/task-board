<?php
/**
 * 共通ブートストラップ。
 * 各エンドポイント（tasks.php / notes.php）の冒頭で require する。
 * - エラー表示制御
 * - CORS ヘッダ
 * - JSON ヘルパ
 * - PDO 接続
 * - 簡易レート制限
 * - 入力バリデーション用ヘルパ
 */

declare(strict_types=1);

require __DIR__ . '/config.php';

// 本番ではエラーを画面に出さない（ログには残す）
error_reporting(E_ALL);
ini_set('display_errors', '0');

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
function apply_cors(): void
{
    $allowed = array_filter(array_map('trim', explode(',', CORS_ALLOWED_ORIGINS)));
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if ($origin !== '' && in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 86400');

    // プリフライトはここで完了
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// ---------------------------------------------------------------------------
// JSON レスポンス
// ---------------------------------------------------------------------------
function send_json($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function send_error(string $message, int $status = 400): void
{
    send_json(['error' => $message], $status);
}

// ---------------------------------------------------------------------------
// リクエストボディ（JSON）の取得
// ---------------------------------------------------------------------------
function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        send_error('不正なリクエストボディです（JSONではありません）。', 400);
    }
    return $data;
}

// ---------------------------------------------------------------------------
// PDO 接続
// ---------------------------------------------------------------------------
function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', DB_HOST, DB_NAME, DB_CHARSET);
    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        // 接続情報の詳細はクライアントに漏らさない
        error_log('DB connection failed: ' . $e->getMessage());
        send_error('データベースに接続できませんでした。', 500);
    }
    return $pdo;
}

// ---------------------------------------------------------------------------
// 簡易レート制限（IP単位・ファイルベース）
//   共有ホスティングでも動くよう、システムのテンポラリディレクトリに
//   カウンタファイルを置く。厳密さより「短時間の大量投稿を防ぐ」ことが目的。
// ---------------------------------------------------------------------------
function enforce_rate_limit(): void
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $bucket = sys_get_temp_dir() . '/tb_rl_' . md5($ip) . '.json';
    $now = time();

    $hits = [];
    if (is_readable($bucket)) {
        $decoded = json_decode((string)file_get_contents($bucket), true);
        if (is_array($decoded)) {
            $hits = $decoded;
        }
    }

    // ウィンドウ外の記録を捨てる
    $window = (int)RATE_LIMIT_WINDOW;
    $hits = array_values(array_filter($hits, static fn($t) => is_int($t) && ($now - $t) < $window));

    if (count($hits) >= (int)RATE_LIMIT_MAX) {
        send_error('投稿が多すぎます。しばらく待ってから再度お試しください。', 429);
    }

    $hits[] = $now;
    @file_put_contents($bucket, json_encode($hits), LOCK_EX);
}

// ---------------------------------------------------------------------------
// バリデーション用ヘルパ
// ---------------------------------------------------------------------------

/** 文字列を取り出し、前後空白を除去。文字数は「見た目の文字数」で判定（マルチバイト対応）。 */
function clean_string($value): string
{
    if (!is_string($value)) {
        return '';
    }
    // 制御文字（改行・タブは許可）を除去
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    return trim($value);
}

function require_positive_int($value): int
{
    if (is_int($value) || (is_string($value) && ctype_digit($value))) {
        $n = (int)$value;
        if ($n > 0) {
            return $n;
        }
    }
    send_error('IDが不正です。', 400);
}

// ---------------------------------------------------------------------------
// プロジェクトキー関連
// ---------------------------------------------------------------------------

/** プロジェクトキーの形式検証（英数字・ハイフン、最大32文字）。不正なら 400。 */
function require_project_key($value): string
{
    $key = is_string($value) ? trim($value) : '';
    if ($key === '' || !preg_match('/^[A-Za-z0-9_-]{1,32}$/', $key)) {
        send_error('プロジェクトIDが不正です。', 400);
    }
    return $key;
}

/** 推測困難なプロジェクトキーを生成（12桁の16進）。 */
function generate_project_key(): string
{
    return bin2hex(random_bytes(6));
}

/** キーからプロジェクトを取得。見つからなければ 404 で終了。 */
function fetch_project_or_404(string $key): array
{
    $stmt = db()->prepare(
        'SELECT id, project_key, name, description, created_at FROM projects WHERE project_key = :key'
    );
    $stmt->execute([':key' => $key]);
    $project = $stmt->fetch();
    if ($project === false) {
        send_error('指定されたプロジェクトが見つかりません。', 404);
    }
    $project['id'] = (int)$project['id'];
    return $project;
}
