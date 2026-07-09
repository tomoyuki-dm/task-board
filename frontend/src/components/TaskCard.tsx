import type { Task, Note } from '../types'
import StickyNote from './StickyNote'

interface Props {
  task: Task
  isFirst: boolean
  isLast: boolean
  onAddNote: (task: Task) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
  onMoveTask: (taskId: number, dir: 'up' | 'down') => void
  onEditNote: (note: Note) => void
  onDeleteNote: (note: Note) => void
}

function formatDate(iso: string): string {
  // 'YYYY-MM-DD HH:MM:SS'（MySQL DATETIME）を素直に整形
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
  if (!m) return iso
  const [, , mo, d, h, mi] = m
  return `${Number(mo)}/${Number(d)} ${h}:${mi}`
}

export default function TaskCard({
  task,
  isFirst,
  isLast,
  onAddNote,
  onEditTask,
  onDeleteTask,
  onMoveTask,
  onEditNote,
  onDeleteNote,
}: Props) {
  return (
    <article className="flex flex-col rounded-lg border border-white/15 bg-black/15 p-4 shadow-lg backdrop-blur-[1px]">
      {/* ヘッダ：タイトル＋編集/削除 */}
      <header className="mb-2 flex items-start justify-between gap-2">
        <h3 className="chalk-text font-chalk text-2xl leading-tight break-words">{task.title}</h3>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onMoveTask(task.id, 'up')}
            disabled={isFirst}
            aria-label="このタスクを上へ移動"
            title="上へ移動"
            className="rounded-md px-2 py-1 text-sm text-white/50 transition-colors hover:bg-white/15 hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMoveTask(task.id, 'down')}
            disabled={isLast}
            aria-label="このタスクを下へ移動"
            title="下へ移動"
            className="rounded-md px-2 py-1 text-sm text-white/50 transition-colors hover:bg-white/15 hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => onEditTask(task)}
            aria-label="このタスクを編集"
            title="このタスクを編集"
            className="rounded-md px-2 py-1 text-sm text-white/50 transition-colors hover:bg-white/15 hover:text-white/90"
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => onDeleteTask(task)}
            aria-label="このタスクを削除"
            title="このタスクを削除"
            className="rounded-md px-2 py-1 text-sm text-white/50 transition-colors hover:bg-red-500/20 hover:text-red-300"
          >
            消す
          </button>
        </div>
      </header>

      {task.description && (
        <p className="chalk-text-muted mb-3 whitespace-pre-line font-chalk text-lg leading-snug break-words">
          {task.description}
        </p>
      )}

      <div className="chalk-text-muted mb-3 text-xs font-hand">
        {formatDate(task.created_at)} に書かれました
      </div>

      {/* チョークの区切り線 */}
      <hr className="mb-3 border-t border-dashed border-white/20" />

      {/* 付箋エリア */}
      <div className="flex flex-1 flex-wrap content-start gap-3">
        {task.notes.length === 0 ? (
          <p className="chalk-text-muted py-2 font-hand text-sm">
            まだ立候補者はいません。最初の付箋を貼ろう！
          </p>
        ) : (
          task.notes.map((note) => (
            <StickyNote key={note.id} note={note} onEdit={onEditNote} onDelete={onDeleteNote} />
          ))
        )}
      </div>

      {/* 立候補ボタン */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => onAddNote(task)}
          className="w-full rounded-lg border border-white/25 bg-white/5 py-2 font-hand text-white/90 transition-colors hover:bg-white/15"
        >
          ＋ 立候補する
        </button>
        <p className="chalk-text-muted mt-1 text-right text-xs font-hand">
          立候補 {task.notes.length} 人
        </p>
      </div>
    </article>
  )
}
