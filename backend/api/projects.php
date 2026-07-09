<?php
/**
 * プロジェクト API
 *   POST /api/projects.php            プロジェクト新規作成 { name, description }
 *                                     → 発給された project_key を含むプロジェクトを返す
 *   GET  /api/projects.php?key={key}  プロジェクト情報を取得（存在確認・名称表示用）
 *
 * XSS 対策方針は tasks.php と同様（React 側の自動エスケープに委ねる）。
 */

require __DIR__ . '/bootstrap.php';

apply_cors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

switch ($method) {
    case 'GET':
        handle_get_project();
        break;
    case 'POST':
        enforce_rate_limit();
        handle_create_project();
        break;
    default:
        send_error('許可されていないメソッドです。', 405);
}

// ---------------------------------------------------------------------------

function handle_get_project(): void
{
    $key = require_project_key($_GET['key'] ?? '');
    $project = fetch_project_or_404($key);
    send_json(project_public($project));
}

function handle_create_project(): void
{
    $body = read_json_body();

    $name = clean_string($body['name'] ?? '');
    $description = clean_string($body['description'] ?? '');

    if ($name === '') {
        send_error('プロジェクト名は必須です。', 422);
    }
    if (mb_strlen($name) > 100) {
        send_error('プロジェクト名は100文字以内で入力してください。', 422);
    }
    if (mb_strlen($description) > 500) {
        send_error('説明文は500文字以内で入力してください。', 422);
    }

    $pdo = db();

    // キーの衝突（極めて稀）に備えて数回リトライ
    $stmt = $pdo->prepare(
        'INSERT INTO projects (project_key, name, description) VALUES (:key, :name, :description)'
    );

    $key = '';
    for ($attempt = 0; $attempt < 5; $attempt++) {
        $key = generate_project_key();
        try {
            $stmt->execute([
                ':key'         => $key,
                ':name'        => $name,
                ':description' => $description === '' ? null : $description,
            ]);
            $stmt = null;
            break;
        } catch (PDOException $e) {
            // 23000 = 一意制約違反。キーを変えて再試行。
            if ($e->getCode() === '23000' && $attempt < 4) {
                continue;
            }
            error_log('project insert failed: ' . $e->getMessage());
            send_error('プロジェクトの作成に失敗しました。', 500);
        }
    }

    $id = (int)$pdo->lastInsertId();
    $sel = $pdo->prepare(
        'SELECT id, project_key, name, description, created_at FROM projects WHERE id = :id'
    );
    $sel->execute([':id' => $id]);
    $project = $sel->fetch();

    send_json(project_public($project), 201);
}

/** クライアントに返すプロジェクト表現（内部の数値idは出さず、keyで扱う）。 */
function project_public(array $project): array
{
    return [
        'key'         => $project['project_key'],
        'name'        => $project['name'],
        'description' => $project['description'],
        'created_at'  => $project['created_at'],
    ];
}
