import { useEffect, useState } from 'react'

// アプリの公開ベースパス（Viteの base と一致）。例: '/task-board'
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

/** 現在のパスをベース相対で返す。例: '/', '/project-new', '/ab12cd34ef56' */
export function getRoutePath(): string {
  let p = window.location.pathname
  if (p.startsWith(BASE)) {
    p = p.slice(BASE.length)
  }
  if (!p.startsWith('/')) {
    p = '/' + p
  }
  // 末尾スラッシュを正規化（'/' は残す）
  if (p.length > 1 && p.endsWith('/')) {
    p = p.replace(/\/+$/, '')
  }
  return p || '/'
}

/** ベース相対パスへ遷移（履歴に積む）。例: navigate('/ab12cd34ef56') */
export function navigate(to: string): void {
  const path = to.startsWith('/') ? to : '/' + to
  window.history.pushState({}, '', BASE + path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

/** 現在のルートパスを購読するフック。ブラウザの戻る/進むにも追従する。 */
export function useRoutePath(): string {
  const [path, setPath] = useState(getRoutePath())
  useEffect(() => {
    const onPop = () => setPath(getRoutePath())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return path
}

/** アプリ内リンクのクリックを history 遷移に変換するハンドラを作る。 */
export function linkHandler(to: string) {
  return (e: React.MouseEvent) => {
    // 修飾キー付きクリック（新規タブ等）はブラウザ標準に任せる
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(to)
  }
}

/** ベース相対パスから絶対URL文字列を作る（共有用）。 */
export function absoluteUrl(path: string): string {
  const p = path.startsWith('/') ? path : '/' + path
  return window.location.origin + BASE + p
}
