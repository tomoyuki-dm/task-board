import { useRoutePath } from './router'
import HomePage from './pages/HomePage'
import NewProjectPage from './pages/NewProjectPage'
import BoardPage from './pages/BoardPage'

// 予約ルート（プロジェクトキーとして扱わないパス）
const RESERVED = new Set(['', 'project-new', 'index.html'])

export default function App() {
  const path = useRoutePath()

  // '/xxxx' → 'xxxx'
  const segment = path.replace(/^\/+/, '')

  if (segment === 'project-new') {
    return <NewProjectPage />
  }

  if (RESERVED.has(segment) || segment.includes('/')) {
    // ルート、index.html、想定外の多階層はトップ扱い
    return <HomePage />
  }

  // それ以外はプロジェクトキーとして黒板を表示
  return <BoardPage key={segment} projectKey={segment} />
}
