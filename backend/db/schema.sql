-- タスク分担掲示板 データベーススキーマ（マルチプロジェクト対応）
-- 実行例: mysql -u <user> -p <dbname> < schema.sql

SET NAMES utf8mb4;

-- プロジェクト（黒板 = 1プロジェクト）
CREATE TABLE IF NOT EXISTS projects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_key VARCHAR(32) NOT NULL,          -- URL に載る推測困難なID（発給時に生成）
  name VARCHAR(100) NOT NULL,                -- プロジェクト名
  description TEXT,                          -- プロジェクトの説明（任意）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_projects_key (project_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tasks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,          -- 所属プロジェクト
  title VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,         -- 表示順（小さいほど上。同値は id 降順）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_tasks_project_id (project_id),
  INDEX idx_tasks_project_order (project_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id INT UNSIGNED NOT NULL,
  name VARCHAR(50) NOT NULL,
  comment VARCHAR(200),
  color VARCHAR(20) DEFAULT 'yellow',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  INDEX idx_notes_task_id (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
