import { useState } from 'react'
import { navigate, linkHandler } from '../router'
import ChalkboardLayout from '../components/ChalkboardLayout'

export default function HomePage() {
  const [openKey, setOpenKey] = useState('')

  function handleOpen(e: React.FormEvent) {
    e.preventDefault()
    const key = openKey.trim()
    if (key) navigate(`/${encodeURIComponent(key)}`)
  }

  return (
    <ChalkboardLayout>
      <div className="mx-auto max-w-2xl py-10 text-center">
        <h1 className="chalk-text font-chalk text-5xl sm:text-6xl">タスク分担掲示板</h1>
        <p className="chalk-text-muted mt-3 font-chalk text-xl">
          黒板にタスクを書いて、分担を付箋で貼っていこう
        </p>

        <p className="chalk-text-muted mx-auto mt-6 max-w-xl font-hand text-sm leading-relaxed">
          プロジェクトごとに黒板を作れます。作成すると専用のURL（プロジェクトID）が発行されるので、
          そのURLを仲間に共有してみんなで書き込みましょう。
        </p>

        {/* 新規作成 */}
        <div className="mt-8">
          <a
            href={`${import.meta.env.BASE_URL}project-new`}
            onClick={linkHandler('/project-new')}
            className="inline-block rounded-lg border border-white/30 bg-white/10 px-6 py-3 font-hand text-lg text-white shadow transition-colors hover:bg-white/20"
          >
            ＋ 新しい黒板（プロジェクト）を作る
          </a>
        </div>

        {/* 既存のIDを開く */}
        <form onSubmit={handleOpen} className="mx-auto mt-10 max-w-md">
          <label className="chalk-text-muted mb-2 block font-hand text-sm">
            プロジェクトIDを知っている場合は、ここから開けます
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={openKey}
              onChange={(e) => setOpenKey(e.target.value)}
              placeholder="例）ab12cd34ef56"
              className="min-w-0 flex-1 rounded-lg border border-white/25 bg-black/20 px-3 py-2 font-hand text-white placeholder-white/40 outline-none focus:border-white/50"
            />
            <button
              type="submit"
              disabled={openKey.trim() === ''}
              className="shrink-0 rounded-lg border border-white/25 bg-white/10 px-4 py-2 font-hand text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              開く
            </button>
          </div>
        </form>

        <p className="chalk-text-muted mt-10 font-hand text-xs">
          ※ ログイン不要・誰でも書き込み/削除できるオープンな掲示板です。
          <br />
          発行されたURLはブックマークして大切に保管してください（URLが分かる人だけがアクセスできます）。
        </p>
      </div>
    </ChalkboardLayout>
  )
}
