import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

/** 黒板テクスチャ＋木枠の共通レイアウト。各ページの外枠に使う。 */
export default function ChalkboardLayout({ children }: Props) {
  return (
    <div className="chalkboard-bg min-h-full">
      <div className="min-h-full border-[10px] border-chalkboard-frame/80 sm:border-[16px]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
      </div>
    </div>
  )
}
