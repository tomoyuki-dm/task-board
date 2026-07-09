import type { Project, Task } from '../types'

/** CSVの1セルをエスケープ（カンマ・改行・引用符を含む場合は "" で囲む）。 */
function csvCell(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value)
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

/**
 * ボードを次の羅列形式のCSV文字列にする。
 *
 *   プロジェクト名, プロジェクト説明, プロジェクトURL
 *   （空行）
 *   タスク名, タスク説明
 *   分担者, メモ
 *   分担者, メモ
 *   （空行）
 *   タスク2名, タスク2説明
 *   分担者, メモ
 *   ...
 */
export function buildBoardCsv(project: Project, tasks: Task[], boardUrl: string): string {
  const rows: string[][] = []

  // 1行目：プロジェクト情報
  rows.push([project.name, project.description ?? '', boardUrl])

  // タスクごとのブロック（前に空行を挟む）
  for (const t of tasks) {
    rows.push([]) // 空行
    rows.push([t.title, t.description ?? ''])
    for (const n of t.notes) {
      rows.push([n.name, n.comment ?? ''])
    }
  }

  const body = rows.map((r) => r.map(csvCell).join(',')).join('\r\n')
  // 先頭に UTF-8 BOM を付け、Excel で文字化けしないようにする
  return '﻿' + body
}

function formatToday(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
}

/** ファイル名に使えない文字を除去（プロジェクト名をファイル名に使うため）。 */
function safeFileNamePart(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_').slice(0, 40)
}

/** ボードのCSVを生成してブラウザでダウンロードさせる。 */
export function downloadBoardCsv(project: Project, tasks: Task[], boardUrl: string): void {
  const csv = buildBoardCsv(project, tasks, boardUrl)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const namePart = safeFileNamePart(project.name) || project.key
  const a = document.createElement('a')
  a.href = url
  a.download = `taskboard_${namePart}_${formatToday()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
