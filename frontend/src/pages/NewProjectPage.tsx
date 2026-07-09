import { useState } from 'react'
import type { Project } from '../types'
import { api } from '../api/client'
import { navigate, linkHandler, absoluteUrl } from '../router'
import ChalkboardLayout from '../components/ChalkboardLayout'
import ShareBar from '../components/ShareBar'

const NAME_MAX = 100
const DESC_MAX = 500

export default function NewProjectPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<Project | null>(null)

  const canSubmit = name.trim().length > 0 && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const project = await api.createProject({
        name: name.trim(),
        description: description.trim(),
      })
      setCreated(project)
    } catch (err) {
      setError(err instanceof Error ? err.message : '作成に失敗しました。')
      setSubmitting(false)
    }
  }

  // 作成完了画面：発行されたURLを提示
  if (created) {
    const url = absoluteUrl(`/${created.key}`)
    return (
      <ChalkboardLayout>
        <div className="mx-auto max-w-xl py-10 text-center">
          <h1 className="chalk-text font-chalk text-4xl">黒板を作成しました！</h1>
          <p className="chalk-text mt-4 break-words font-chalk text-2xl">{created.name}</p>

          <p className="chalk-text-muted mx-auto mt-6 max-w-md font-hand text-sm leading-relaxed">
            下記が、この黒板の専用URLです。
            <br />
            <strong className="text-white">必ずブックマーク・共有して保管してください。</strong>
            <br />
            URLを知っている人だけがアクセスできます（再発行はできません）。
          </p>

          <div className="mt-6">
            <ShareBar url={url} />
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <a
              href={`${import.meta.env.BASE_URL}${created.key}`}
              onClick={linkHandler(`/${created.key}`)}
              className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 font-hand text-lg text-white shadow transition-colors hover:bg-white/20"
            >
              この黒板を開く →
            </a>
          </div>
        </div>
      </ChalkboardLayout>
    )
  }

  // 入力フォーム
  return (
    <ChalkboardLayout>
      <div className="mx-auto max-w-xl py-8">
        <a
          href={import.meta.env.BASE_URL}
          onClick={linkHandler('/')}
          className="chalk-text-muted font-hand text-sm underline-offset-2 hover:underline"
        >
          ← トップ
        </a>
        <h1 className="chalk-text mt-1 font-chalk text-4xl">新しい黒板を作る</h1>
        <p className="chalk-text-muted mt-2 font-hand text-sm">
          プロジェクト名を決めると、専用URL（プロジェクトID）が発行されます。
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-xl bg-stone-50 p-5 text-left shadow-2xl"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              プロジェクト名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={NAME_MAX}
              autoFocus
              placeholder="例）文化祭 実行委員会"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <div className="mt-1 text-right text-xs text-stone-400">
              {name.length} / {NAME_MAX}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">説明文（任意）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={DESC_MAX}
              rows={3}
              placeholder="この黒板の目的や使い方など"
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
              onClick={() => navigate('/')}
              className="rounded-lg px-4 py-2 text-stone-600 hover:bg-stone-200"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? '作成中…' : '黒板を作成する'}
            </button>
          </div>
        </form>
      </div>
    </ChalkboardLayout>
  )
}
