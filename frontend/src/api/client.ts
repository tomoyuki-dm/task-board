import type {
  Task,
  Note,
  NewTaskInput,
  NewNoteInput,
  EditTaskInput,
  EditNoteInput,
  Project,
  NewProjectInput,
  BoardData,
} from '../types'

const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

/** APIエラー。message にはサーバーが返した日本語メッセージが入る。 */
export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
  } catch {
    throw new ApiError('サーバーに接続できませんでした。通信環境を確認してください。', 0)
  }

  // 204 No Content 等、本文が無い場合に備える
  const text = await res.text()
  const data = text ? safeParse(text) : null

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : `エラーが発生しました（HTTP ${res.status}）。`)
    throw new ApiError(message, res.status)
  }

  return data as T
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export const api = {
  // --- プロジェクト ---
  createProject(input: NewProjectInput): Promise<Project> {
    return request<Project>('/api/projects.php', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  getProject(key: string): Promise<Project> {
    return request<Project>(`/api/projects.php?key=${encodeURIComponent(key)}`)
  },

  // --- タスク（プロジェクト単位） ---
  getBoard(projectKey: string): Promise<BoardData> {
    return request<BoardData>(`/api/tasks.php?project=${encodeURIComponent(projectKey)}`)
  },

  createTask(input: NewTaskInput): Promise<Task> {
    return request<Task>('/api/tasks.php', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  updateTask(id: number, input: EditTaskInput): Promise<Task> {
    return request<Task>(`/api/tasks.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },

  deleteTask(id: number): Promise<{ ok: boolean; id: number }> {
    return request(`/api/tasks.php?id=${id}`, { method: 'DELETE' })
  },

  // タスクの表示順を保存（orderedIds は表示したい順に並べたタスクID配列）
  reorderTasks(projectKey: string, orderedIds: number[]): Promise<{ ok: boolean }> {
    return request('/api/tasks.php?action=reorder', {
      method: 'PUT',
      body: JSON.stringify({ project: projectKey, order: orderedIds }),
    })
  },

  createNote(input: NewNoteInput): Promise<Note> {
    return request<Note>('/api/notes.php', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  updateNote(id: number, input: EditNoteInput): Promise<Note> {
    return request<Note>(`/api/notes.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },

  deleteNote(id: number): Promise<{ ok: boolean; id: number }> {
    return request(`/api/notes.php?id=${id}`, { method: 'DELETE' })
  },
}
