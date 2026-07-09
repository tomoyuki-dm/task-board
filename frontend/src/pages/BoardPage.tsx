import { useCallback, useEffect, useRef, useState } from 'react'
import type { Task, Note, Project, EditTaskInput, EditNoteInput } from '../types'
import { api, ApiError } from '../api/client'
import { linkHandler, absoluteUrl } from '../router'
import { downloadBoardCsv } from '../utils/exportCsv'
import ChalkboardLayout from '../components/ChalkboardLayout'
import Board from '../components/Board'
import TaskForm from '../components/TaskForm'
import NoteForm from '../components/NoteForm'
import ConfirmDialog from '../components/ConfirmDialog'
import ShareBar from '../components/ShareBar'

// 一覧の自動更新間隔（ミリ秒）
const POLL_INTERVAL = 15000

type Dialog =
  | { kind: 'none' }
  | { kind: 'new-task' }
  | { kind: 'edit-task'; task: Task }
  | { kind: 'new-note'; task: Task }
  | { kind: 'edit-note'; note: Note }
  | { kind: 'confirm-delete-task'; task: Task }
  | { kind: 'confirm-delete-note'; note: Note }

interface Props {
  projectKey: string
}

export default function BoardPage({ projectKey }: Props) {
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<Dialog>({ kind: 'none' })
  const closeDialog = useCallback(() => setDialog({ kind: 'none' }), [])

  // 最新の tasks を参照するための ref（移動処理で使用）
  const tasksRef = useRef<Task[]>([])
  tasksRef.current = tasks
  // 並び替えの保存中フラグ（ポーリングによる巻き戻しを防ぐ）
  const reorderingRef = useRef(false)

  // ボード取得（silent=true のときはローディング表示を出さず裏で更新）
  const loadBoard = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      try {
        const data = await api.getBoard(projectKey)
        setProject(data.project)
        setTasks(data.tasks)
        setNotFound(false)
        setError(null)
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          setError(err instanceof Error ? err.message : '読み込みに失敗しました。')
        }
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [projectKey],
  )

  useEffect(() => {
    loadBoard()
  }, [loadBoard])

  // ポーリング（ダイアログ表示中・未検出時は割り込まない）
  const dialogOpen = dialog.kind !== 'none'
  const skipPollRef = useRef(false)
  skipPollRef.current = dialogOpen || notFound || reorderingRef.current
  useEffect(() => {
    const timer = setInterval(() => {
      if (!skipPollRef.current) loadBoard(true)
    }, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [loadBoard])

  // --- ハンドラ ---
  const handleCreateTask = useCallback(
    async (values: EditTaskInput) => {
      const created = await api.createTask({ project: projectKey, ...values })
      setTasks((prev) => [created, ...prev])
    },
    [projectKey],
  )

  const handleUpdateTask = useCallback(
    async (id: number, values: EditTaskInput) => {
      const updated = await api.updateTask(id, projectKey, values)
      // notes は変わらないので既存を保持して title/description のみ差し替え
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, title: updated.title, description: updated.description } : t,
        ),
      )
    },
    [projectKey],
  )

  // タスクを1つ上/下へ移動（楽観的更新→保存、失敗時は元に戻す）
  const handleMoveTask = useCallback(
    async (taskId: number, dir: 'up' | 'down') => {
      const current = tasksRef.current
      const idx = current.findIndex((t) => t.id === taskId)
      if (idx < 0) return
      const swapWith = dir === 'up' ? idx - 1 : idx + 1
      if (swapWith < 0 || swapWith >= current.length) return

      const next = current.slice()
      ;[next[idx], next[swapWith]] = [next[swapWith], next[idx]]
      setTasks(next)
      setError(null)
      reorderingRef.current = true
      try {
        await api.reorderTasks(
          projectKey,
          next.map((t) => t.id),
        )
      } catch (err) {
        setTasks(current) // 保存に失敗したら元の順序へ戻す
        setError(err instanceof Error ? err.message : '並び替えに失敗しました。')
      } finally {
        reorderingRef.current = false
      }
    },
    [projectKey],
  )

  const handleCreateNote = useCallback(
    async (taskId: number, values: EditNoteInput) => {
      const created = await api.createNote({ project: projectKey, task_id: taskId, ...values })
      setTasks((prev) =>
        prev.map((t) => (t.id === created.task_id ? { ...t, notes: [...t.notes, created] } : t)),
      )
    },
    [projectKey],
  )

  const handleUpdateNote = useCallback(
    async (id: number, values: EditNoteInput) => {
      const updated = await api.updateNote(id, projectKey, values)
      setTasks((prev) =>
        prev.map((t) =>
          t.id === updated.task_id
            ? { ...t, notes: t.notes.map((n) => (n.id === id ? updated : n)) }
            : t,
        ),
      )
    },
    [projectKey],
  )

  const handleDeleteTask = useCallback(
    async (task: Task) => {
      try {
        await api.deleteTask(task.id, projectKey)
        setTasks((prev) => prev.filter((t) => t.id !== task.id))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'タスクの削除に失敗しました。')
      } finally {
        closeDialog()
      }
    },
    [closeDialog, projectKey],
  )

  const handleDeleteNote = useCallback(
    async (note: Note) => {
      try {
        await api.deleteNote(note.id, projectKey)
        setTasks((prev) =>
          prev.map((t) =>
            t.id === note.task_id ? { ...t, notes: t.notes.filter((n) => n.id !== note.id) } : t,
          ),
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : '付箋の削除に失敗しました。')
      } finally {
        closeDialog()
      }
    },
    [closeDialog, projectKey],
  )

  // --- プロジェクトが見つからない場合 ---
  if (notFound) {
    return (
      <ChalkboardLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="chalk-text font-chalk text-3xl">この黒板は見つかりませんでした</p>
          <p className="chalk-text-muted mt-2 font-chalk text-xl">
            URL（プロジェクトID）が正しいか確認してください
          </p>
          <a
            href={import.meta.env.BASE_URL}
            onClick={linkHandler('/')}
            className="mt-6 rounded-lg border border-white/30 bg-white/10 px-4 py-2.5 font-hand text-white hover:bg-white/20"
          >
            トップへ
          </a>
        </div>
      </ChalkboardLayout>
    )
  }

  const totalNotes = tasks.reduce((sum, t) => sum + t.notes.length, 0)
  const boardUrl = absoluteUrl(`/${projectKey}`)

  return (
    <ChalkboardLayout>
      {/* ヘッダ */}
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <a
            href={import.meta.env.BASE_URL}
            onClick={linkHandler('/')}
            className="chalk-text-muted font-hand text-sm underline-offset-2 hover:underline"
          >
            ← タスク分担掲示板
          </a>
          <h1 className="chalk-text mt-1 break-words font-chalk text-4xl sm:text-5xl">
            {project?.name ?? '読み込み中…'}
          </h1>
          {project?.description && (
            <p className="chalk-text-muted mt-1 whitespace-pre-line break-words font-chalk text-lg">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => project && downloadBoardCsv(project, tasks, boardUrl)}
            disabled={!project}
            title="タスクと付箋をCSVでダウンロード"
            className="rounded-lg border border-white/30 bg-white/10 px-4 py-2.5 font-hand text-lg text-white shadow transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ⬇ CSVダウンロード
          </button>
          <button
            type="button"
            onClick={() => setDialog({ kind: 'new-task' })}
            className="rounded-lg border border-white/30 bg-white/10 px-4 py-2.5 font-hand text-lg text-white shadow transition-colors hover:bg-white/20"
          >
            ＋ 新しいタスクを書く
          </button>
        </div>
      </header>

      {/* 共有URL */}
      <ShareBar url={boardUrl} />

      {/* ステータス行 */}
      <div className="chalk-text-muted mb-4 flex items-center gap-4 font-hand text-sm">
        <span>タスク {tasks.length} 件</span>
        <span>分担登録 {totalNotes} 件</span>
        <button
          type="button"
          onClick={() => loadBoard()}
          className="rounded px-2 py-0.5 underline-offset-2 hover:underline"
        >
          更新
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300/40 bg-red-900/30 px-4 py-3 text-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="chalk-text py-24 text-center font-chalk text-2xl">読み込み中…</div>
      ) : (
        <Board
          tasks={tasks}
          onAddNote={(task) => setDialog({ kind: 'new-note', task })}
          onEditTask={(task) => setDialog({ kind: 'edit-task', task })}
          onDeleteTask={(task) => setDialog({ kind: 'confirm-delete-task', task })}
          onMoveTask={handleMoveTask}
          onEditNote={(note) => setDialog({ kind: 'edit-note', note })}
          onDeleteNote={(note) => setDialog({ kind: 'confirm-delete-note', note })}
        />
      )}

      <footer className="chalk-text-muted mt-10 text-center font-hand text-xs">
        誰でも自由に書き込み・削除できます。マナーを守ってご利用ください。
      </footer>

      {/* ダイアログ群 */}
      {dialog.kind === 'new-task' && (
        <TaskForm
          heading="新しいタスクを書く"
          submitLabel="黒板に書く"
          submittingLabel="追加中…"
          onSubmit={handleCreateTask}
          onClose={closeDialog}
        />
      )}
      {dialog.kind === 'edit-task' && (
        <TaskForm
          heading="タスクを書き直す"
          submitLabel="保存する"
          submittingLabel="保存中…"
          initialTitle={dialog.task.title}
          initialDescription={dialog.task.description ?? ''}
          onSubmit={(values) => handleUpdateTask(dialog.task.id, values)}
          onClose={closeDialog}
        />
      )}
      {dialog.kind === 'new-note' && (
        <NoteForm
          heading="引き受ける（付箋を貼る）"
          submitLabel="付箋を貼る"
          submittingLabel="貼っています…"
          taskTitle={dialog.task.title}
          onSubmit={(values) => handleCreateNote(dialog.task.id, values)}
          onClose={closeDialog}
        />
      )}
      {dialog.kind === 'edit-note' && (
        <NoteForm
          heading="付箋を書き直す"
          submitLabel="保存する"
          submittingLabel="保存中…"
          initialName={dialog.note.name}
          initialComment={dialog.note.comment ?? ''}
          initialColor={dialog.note.color}
          onSubmit={(values) => handleUpdateNote(dialog.note.id, values)}
          onClose={closeDialog}
        />
      )}
      {dialog.kind === 'confirm-delete-task' && (
        <ConfirmDialog
          title="タスクを削除しますか？"
          message={`「${dialog.task.title}」を削除します。\nこのタスクに貼られた付箋（${dialog.task.notes.length}件）もすべて削除されます。`}
          onConfirm={() => handleDeleteTask(dialog.task)}
          onClose={closeDialog}
        />
      )}
      {dialog.kind === 'confirm-delete-note' && (
        <ConfirmDialog
          title="付箋を削除しますか？"
          message={`${dialog.note.name} さんの付箋を削除します。`}
          onConfirm={() => handleDeleteNote(dialog.note)}
          onClose={closeDialog}
        />
      )}
    </ChalkboardLayout>
  )
}
