import { useState } from 'react'
import type { EditNoteInput, NoteColor } from '../types'
import Modal from './Modal'
import { NOTE_COLORS, NOTE_COLOR_KEYS, randomNoteColor } from './noteColors'

const NAME_MAX = 50
const COMMENT_MAX = 200

interface Props {
  heading: string
  submitLabel: string
  submittingLabel: string
  taskTitle?: string
  initialName?: string
  initialComment?: string
  initialColor?: NoteColor
  onSubmit: (values: EditNoteInput) => Promise<void>
  onClose: () => void
}

/** 付箋の新規作成・編集で共通に使うフォーム。 */
export default function NoteForm({
  heading,
  submitLabel,
  submittingLabel,
  taskTitle,
  initialName = '',
  initialComment = '',
  initialColor,
  onSubmit,
  onClose,
}: Props) {
  const [name, setName] = useState(initialName)
  const [comment, setComment] = useState(initialComment)
  const [color, setColor] = useState<NoteColor>(() => initialColor ?? randomNoteColor())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = name.trim().length > 0 && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ name: name.trim(), comment: comment.trim(), color })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました。')
      setSubmitting(false)
    }
  }

  return (
    <Modal title={heading} onClose={onClose}>
      {taskTitle && (
        <p className="mb-4 truncate text-sm text-stone-500">
          タスク：<span className="font-medium text-stone-700">{taskTitle}</span>
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            名前 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={NAME_MAX}
            autoFocus
            placeholder="例）たろう"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <div className="mt-1 text-right text-xs text-stone-400">
            {name.length} / {NAME_MAX}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">一言コメント（任意）</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={COMMENT_MAX}
            rows={3}
            placeholder="例）土日なら手伝えます！"
            className="w-full resize-y rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <div className="mt-1 text-right text-xs text-stone-400">
            {comment.length} / {COMMENT_MAX}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">付箋の色</label>
          <div className="flex flex-wrap gap-2">
            {NOTE_COLOR_KEYS.map((key) => {
              const c = NOTE_COLORS[key]
              const selected = key === color
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setColor(key)}
                  aria-label={c.label}
                  aria-pressed={selected}
                  className={`h-9 w-9 rounded-full ${c.swatch} ring-offset-2 transition ${
                    selected ? 'ring-2 ring-stone-800' : 'ring-1 ring-stone-300 hover:ring-stone-500'
                  }`}
                />
              )
            })}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-stone-600 hover:bg-stone-200"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? submittingLabel : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}
