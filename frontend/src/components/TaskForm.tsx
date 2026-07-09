import { useState } from 'react'
import type { EditTaskInput } from '../types'
import Modal from './Modal'

const TITLE_MAX = 100
const DESC_MAX = 500

interface Props {
  heading: string
  submitLabel: string
  submittingLabel: string
  initialTitle?: string
  initialDescription?: string
  onSubmit: (values: EditTaskInput) => Promise<void>
  onClose: () => void
}

/** タスクの新規作成・編集で共通に使うフォーム。 */
export default function TaskForm({
  heading,
  submitLabel,
  submittingLabel,
  initialTitle = '',
  initialDescription = '',
  onSubmit,
  onClose,
}: Props) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = title.trim().length > 0 && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ title: title.trim(), description: description.trim() })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました。')
      setSubmitting(false)
    }
  }

  return (
    <Modal title={heading} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX}
            autoFocus
            placeholder="例）文化祭の看板を作る人募集"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <div className="mt-1 text-right text-xs text-stone-400">
            {title.length} / {TITLE_MAX}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">説明文（任意）</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={DESC_MAX}
            rows={4}
            placeholder="どんな作業か、いつまでに、など"
            className="w-full resize-y rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <div className="mt-1 text-right text-xs text-stone-400">
            {description.length} / {DESC_MAX}
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
