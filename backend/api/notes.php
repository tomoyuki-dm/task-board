<?php
/**
 * 付箋 API
 *   POST   /api/notes.php            付箋新規作成 { task_id, name, comment, color }
 *   PUT    /api/notes.php?id={id}    付箋編集 { name, comment, color }
 *   DELETE /api/notes.php?id={id}    付箋削除
 *
 * XSS 対策方針は tasks.php と同様（React 側の自動エスケープに委ねる）。
 * SQL インジェクションは PDO プレースホルダで防止。
 */

require __DIR__ . '/bootstrap.php';

apply_cors();

// 付箋に使える色（サーバー側でホワイトリスト検証）
const ALLOWED_COLORS = ['yellow', 'pink', 'blue', 'green', 'orange', 'purple'];

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

switch ($method) {
    case 'POST':
        enforce_rate_limit();
        handle_create_note();
        break;
    case 'PUT':
        enforce_rate_limit();
        handle_update_note();
        break;
    case 'DELETE':
        enforce_rate_limit();
        handle_delete_note();
        break;
    default:
        send_error('許可されていないメソッドです。', 405);
}

// ---------------------------------------------------------------------------

function handle_create_note(): void
{
    $body = read_json_body();

    $taskId  = require_positive_int($body['task_id'] ?? null);
    $name    = clean_string($body['name'] ?? '');
    $comment = clean_string($body['comment'] ?? '');
    $color   = clean_string($body['color'] ?? 'yellow');

    if ($name === '') {
        send_error('名前は必須です。', 422);
    }
    if (mb_strlen($name) > 50) {
        send_error('名前は50文字以内で入力してください。', 422);
    }
    if (mb_strlen($comment) > 200) {
        send_error('コメントは200文字以内で入力してください。', 422);
    }
    if (!in_array($color, ALLOWED_COLORS, true)) {
        $color = 'yellow';
    }

    $pdo = db();

    // 親タスクの存在確認（FK違反を分かりやすいエラーに）
    $check = $pdo->prepare('SELECT 1 FROM tasks WHERE id = :id');
    $check->execute([':id' => $taskId]);
    if ($check->fetchColumn() === false) {
        send_error('付箋を貼る対象のタスクが見つかりません。', 404);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO notes (task_id, name, comment, color) VALUES (:task_id, :name, :comment, :color)'
    );
    $stmt->execute([
        ':task_id' => $taskId,
        ':name'    => $name,
        ':comment' => $comment === '' ? null : $comment,
        ':color'   => $color,
    ]);

    $id = (int)$pdo->lastInsertId();
    $stmt = $pdo->prepare(
        'SELECT id, task_id, name, comment, color, created_at FROM notes WHERE id = :id'
    );
    $stmt->execute([':id' => $id]);
    $note = $stmt->fetch();
    $note['id']      = (int)$note['id'];
    $note['task_id'] = (int)$note['task_id'];

    send_json($note, 201);
}

function handle_update_note(): void
{
    $id = require_positive_int($_GET['id'] ?? null);
    $body = read_json_body();

    $name    = clean_string($body['name'] ?? '');
    $comment = clean_string($body['comment'] ?? '');
    $color   = clean_string($body['color'] ?? 'yellow');

    if ($name === '') {
        send_error('名前は必須です。', 422);
    }
    if (mb_strlen($name) > 50) {
        send_error('名前は50文字以内で入力してください。', 422);
    }
    if (mb_strlen($comment) > 200) {
        send_error('コメントは200文字以内で入力してください。', 422);
    }
    if (!in_array($color, ALLOWED_COLORS, true)) {
        $color = 'yellow';
    }

    $pdo = db();
    $stmt = $pdo->prepare(
        'UPDATE notes SET name = :name, comment = :comment, color = :color WHERE id = :id'
    );
    $stmt->execute([
        ':name'    => $name,
        ':comment' => $comment === '' ? null : $comment,
        ':color'   => $color,
        ':id'      => $id,
    ]);

    // 変更が無くても成功扱いにするため、存在確認は SELECT で行う
    $stmt = $pdo->prepare(
        'SELECT id, task_id, name, comment, color, created_at FROM notes WHERE id = :id'
    );
    $stmt->execute([':id' => $id]);
    $note = $stmt->fetch();
    if ($note === false) {
        send_error('該当する付箋が見つかりません。', 404);
    }
    $note['id']      = (int)$note['id'];
    $note['task_id'] = (int)$note['task_id'];

    send_json($note);
}

function handle_delete_note(): void
{
    $id = require_positive_int($_GET['id'] ?? null);

    $pdo = db();
    $stmt = $pdo->prepare('DELETE FROM notes WHERE id = :id');
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        send_error('該当する付箋が見つかりません。', 404);
    }

    send_json(['ok' => true, 'id' => $id]);
}
