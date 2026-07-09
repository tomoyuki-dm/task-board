<?php
/**
 * タスク API（プロジェクト単位）
 *   GET    /api/tasks.php?project={key}      指定プロジェクトのタスク一覧（付箋込み）＋プロジェクト情報
 *   POST   /api/tasks.php                    タスク新規作成 { project, title, description }
 *   PUT    /api/tasks.php?id={id}            タスク編集 { title, description }
 *   PUT    /api/tasks.php?action=reorder     並び替え { project, order: [taskId, ...] }
 *   DELETE /api/tasks.php?id={id}            タスク削除（付箋も CASCADE で削除）
 *
 * XSS 対策方針:
 *   本 API のクライアントは React で、React は描画時に自動でエスケープする。
 *   そのため JSON へ htmlspecialchars をかけると二重エスケープになるので行わない。
 *   SQL インジェクションは PDO のプレースホルダで防止し、入力は下記で厳格に検証する。
 */

require __DIR__ . '/bootstrap.php';

apply_cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

switch ($method) {
    case 'GET':
        handle_get_tasks();
        break;
    case 'POST':
        enforce_rate_limit();
        handle_create_task();
        break;
    case 'PUT':
        enforce_rate_limit();
        if (($_GET['action'] ?? '') === 'reorder') {
            handle_reorder_tasks();
        } else {
            handle_update_task();
        }
        break;
    case 'DELETE':
        enforce_rate_limit();
        handle_delete_task();
        break;
    default:
        send_error('許可されていないメソッドです。', 405);
}

// ---------------------------------------------------------------------------

function handle_get_tasks(): void
{
    $key = require_project_key($_GET['project'] ?? '');
    $project = fetch_project_or_404($key);
    $pdo = db();

    $stmt = $pdo->prepare(
        'SELECT id, title, description, created_at FROM tasks
         WHERE project_id = :pid ORDER BY sort_order ASC, id DESC'
    );
    $stmt->execute([':pid' => $project['id']]);
    $tasks = $stmt->fetchAll();

    // このプロジェクトの付箋をまとめて取得（JOINで対象を限定）
    $stmt = $pdo->prepare(
        'SELECT n.id, n.task_id, n.name, n.comment, n.color, n.created_at
         FROM notes n
         INNER JOIN tasks t ON t.id = n.task_id
         WHERE t.project_id = :pid
         ORDER BY n.created_at ASC, n.id ASC'
    );
    $stmt->execute([':pid' => $project['id']]);
    $notes = $stmt->fetchAll();

    $notesByTask = [];
    foreach ($notes as $note) {
        $note['id']      = (int)$note['id'];
        $note['task_id'] = (int)$note['task_id'];
        $notesByTask[$note['task_id']][] = $note;
    }

    foreach ($tasks as &$task) {
        $task['id']    = (int)$task['id'];
        $task['notes'] = $notesByTask[$task['id']] ?? [];
    }
    unset($task);

    send_json([
        'project' => [
            'key'         => $project['project_key'],
            'name'        => $project['name'],
            'description' => $project['description'],
            'created_at'  => $project['created_at'],
        ],
        'tasks' => $tasks,
    ]);
}

function handle_create_task(): void
{
    $body = read_json_body();

    $key = require_project_key($body['project'] ?? '');
    $project = fetch_project_or_404($key);

    $title = clean_string($body['title'] ?? '');
    $description = clean_string($body['description'] ?? '');

    if ($title === '') {
        send_error('タイトルは必須です。', 422);
    }
    if (mb_strlen($title) > 100) {
        send_error('タイトルは100文字以内で入力してください。', 422);
    }
    if (mb_strlen($description) > 500) {
        send_error('説明文は500文字以内で入力してください。', 422);
    }

    $pdo = db();

    // 新規タスクは黒板の先頭（最上段）に置く：既存の最小 sort_order より 1 小さくする
    $min = $pdo->prepare('SELECT COALESCE(MIN(sort_order), 0) FROM tasks WHERE project_id = :pid');
    $min->execute([':pid' => $project['id']]);
    $sortOrder = (int)$min->fetchColumn() - 1;

    $stmt = $pdo->prepare(
        'INSERT INTO tasks (project_id, title, description, sort_order)
         VALUES (:pid, :title, :description, :sort_order)'
    );
    $stmt->execute([
        ':pid'         => $project['id'],
        ':title'       => $title,
        ':description' => $description === '' ? null : $description,
        ':sort_order'  => $sortOrder,
    ]);

    $id = (int)$pdo->lastInsertId();
    $stmt = $pdo->prepare('SELECT id, title, description, created_at FROM tasks WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $task = $stmt->fetch();
    $task['id'] = (int)$task['id'];
    $task['notes'] = [];

    send_json($task, 201);
}

function handle_reorder_tasks(): void
{
    $body = read_json_body();

    $key = require_project_key($body['project'] ?? '');
    $project = fetch_project_or_404($key);

    $order = $body['order'] ?? null;
    if (!is_array($order) || $order === []) {
        send_error('並び順の指定が不正です。', 422);
    }

    // 正の整数のみ・重複排除
    $ids = [];
    foreach ($order as $v) {
        if (is_int($v) || (is_string($v) && ctype_digit($v))) {
            $n = (int)$v;
            if ($n > 0 && !in_array($n, $ids, true)) {
                $ids[] = $n;
            }
        }
    }
    if ($ids === []) {
        send_error('並び順の指定が不正です。', 422);
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        // 配列の並び順どおりに sort_order を 0,1,2... と振り直す。
        // project_id 条件で、他プロジェクトのIDが混じっても無視される。
        $upd = $pdo->prepare(
            'UPDATE tasks SET sort_order = :pos WHERE id = :id AND project_id = :pid'
        );
        foreach ($ids as $pos => $id) {
            $upd->execute([':pos' => $pos, ':id' => $id, ':pid' => $project['id']]);
        }
        $pdo->commit();
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log('reorder failed: ' . $e->getMessage());
        send_error('並び替えに失敗しました。', 500);
    }

    send_json(['ok' => true]);
}

function handle_update_task(): void
{
    $id = require_positive_int($_GET['id'] ?? null);
    $body = read_json_body();

    $title = clean_string($body['title'] ?? '');
    $description = clean_string($body['description'] ?? '');

    if ($title === '') {
        send_error('タイトルは必須です。', 422);
    }
    if (mb_strlen($title) > 100) {
        send_error('タイトルは100文字以内で入力してください。', 422);
    }
    if (mb_strlen($description) > 500) {
        send_error('説明文は500文字以内で入力してください。', 422);
    }

    $pdo = db();
    $stmt = $pdo->prepare(
        'UPDATE tasks SET title = :title, description = :description WHERE id = :id'
    );
    $stmt->execute([
        ':title'       => $title,
        ':description' => $description === '' ? null : $description,
        ':id'          => $id,
    ]);

    // 変更が無くても（同じ内容の保存）成功扱いにするため、存在確認は SELECT で行う
    $stmt = $pdo->prepare('SELECT id, title, description, created_at FROM tasks WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $task = $stmt->fetch();
    if ($task === false) {
        send_error('該当するタスクが見つかりません。', 404);
    }
    $task['id'] = (int)$task['id'];

    send_json($task);
}

function handle_delete_task(): void
{
    $id = require_positive_int($_GET['id'] ?? null);

    $pdo = db();
    $stmt = $pdo->prepare('DELETE FROM tasks WHERE id = :id');
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        send_error('該当するタスクが見つかりません。', 404);
    }

    send_json(['ok' => true, 'id' => $id]);
}
