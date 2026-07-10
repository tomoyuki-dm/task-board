import { Fragment } from 'react'

// http(s):// または www. で始まる URL を検出する。
// URL として有効な文字だけにマッチさせ、後続の日本語などを巻き込まないようにする。
const URL_CHARS = "[\\w\\-.~:/?#\\[\\]@!$&'()*+,;=%]+"
const URL_RE = new RegExp(`(\\bhttps?://${URL_CHARS}|\\bwww\\.${URL_CHARS})`, 'gi')
// URL の末尾に付きやすい句読点・閉じ括弧（リンクには含めない）
const TRAILING_RE = /[)\]}>.,;:!?"'。、）」』】]+$/

interface Props {
  text: string
  /** リンク（a要素）に付与する追加クラス。背景色に合わせて色を上書きできる。 */
  linkClassName?: string
}

/**
 * テキスト中の URL を <a> リンクに変換して表示する。
 * テキスト部分は React が自動エスケープするため XSS の心配はない
 * （dangerouslySetInnerHTML は使わない）。改行は親要素の
 * `whitespace-pre-line` により保持される。
 */
export default function Linkify({ text, linkClassName }: Props) {
  const parts = text.split(URL_RE)

  return (
    <>
      {parts.map((part, i) => {
        // 偶数index=通常テキスト、奇数index=URLマッチ
        if (i % 2 === 0) {
          return <Fragment key={i}>{part}</Fragment>
        }

        // 末尾の句読点・括弧はリンクから外してテキストに戻す
        let url = part
        let trailing = ''
        const m = url.match(TRAILING_RE)
        if (m) {
          trailing = m[0]
          url = url.slice(0, url.length - trailing.length)
        }
        if (url === '') {
          return <Fragment key={i}>{part}</Fragment>
        }

        // www. 始まりは https:// を補って href にする（スキームは http/https のみ）
        const href = /^www\./i.test(url) ? `https://${url}` : url

        return (
          <Fragment key={i}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={`underline decoration-dotted underline-offset-2 break-all hover:opacity-80 ${
                linkClassName ?? 'text-sky-200'
              }`}
            >
              {url}
            </a>
            {trailing}
          </Fragment>
        )
      })}
    </>
  )
}
