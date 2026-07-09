import { useState } from 'react'

interface Props {
  url: string
}

/** この黒板の共有URLを表示し、ワンクリックでコピーできるバー。 */
export default function ShareBar({ url }: Props) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // クリップボードが使えない環境では選択に任せる
      setCopied(false)
    }
  }

  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/15 bg-black/20 px-3 py-2">
      <span className="chalk-text-muted shrink-0 font-hand text-xs">この黒板のURL：</span>
      <input
        type="text"
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="min-w-0 flex-1 truncate bg-transparent font-hand text-sm text-white/90 outline-none"
      />
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-md border border-white/25 bg-white/10 px-3 py-1 font-hand text-xs text-white transition-colors hover:bg-white/20"
      >
        {copied ? 'コピーしました' : 'コピー'}
      </button>
    </div>
  )
}
