// 付箋の色（サーバーのホワイトリストと一致させる）
export type NoteColor =
  | 'yellow'
  | 'pink'
  | 'blue'
  | 'green'
  | 'orange'
  | 'purple'

export interface Note {
  id: number
  task_id: number
  name: string
  comment: string | null
  color: NoteColor
  created_at: string
}

export interface Task {
  id: number
  title: string
  description: string | null
  created_at: string
  notes: Note[]
}

// プロジェクト（黒板1枚 = 1プロジェクト）
export interface Project {
  key: string
  name: string
  description: string | null
  created_at: string
}

// GET /api/tasks.php?project={key} のレスポンス
export interface BoardData {
  project: Project
  tasks: Task[]
}

// 作成時のペイロード
export interface NewProjectInput {
  name: string
  description: string
}

export interface NewTaskInput {
  project: string
  title: string
  description: string
}

export interface NewNoteInput {
  project: string
  task_id: number
  name: string
  comment: string
  color: NoteColor
}

// 編集時のペイロード
export interface EditTaskInput {
  title: string
  description: string
}

export interface EditNoteInput {
  name: string
  comment: string
  color: NoteColor
}
