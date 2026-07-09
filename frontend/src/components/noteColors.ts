import type { NoteColor } from '../types'

// 付箋の色 → Tailwind クラス・表示名。サーバーのホワイトリストと一致させる。
export const NOTE_COLORS: Record<NoteColor, { label: string; bg: string; swatch: string }> = {
  yellow: { label: '黄', bg: 'bg-yellow-200 text-yellow-950', swatch: 'bg-yellow-200' },
  pink: { label: 'ピンク', bg: 'bg-pink-200 text-pink-950', swatch: 'bg-pink-200' },
  blue: { label: '水色', bg: 'bg-sky-200 text-sky-950', swatch: 'bg-sky-200' },
  green: { label: '緑', bg: 'bg-green-200 text-green-950', swatch: 'bg-green-200' },
  orange: { label: 'オレンジ', bg: 'bg-orange-200 text-orange-950', swatch: 'bg-orange-200' },
  purple: { label: '紫', bg: 'bg-purple-200 text-purple-950', swatch: 'bg-purple-200' },
}

export const NOTE_COLOR_KEYS = Object.keys(NOTE_COLORS) as NoteColor[]

export function randomNoteColor(): NoteColor {
  return NOTE_COLOR_KEYS[Math.floor(Math.random() * NOTE_COLOR_KEYS.length)]
}

// idを種にした安定した微小な傾き（-3°〜+3°くらい）。再描画でも揺れないようにする。
export function tiltForId(id: number): number {
  // 疑似乱数（決定的）
  const seed = (id * 2654435761) % 1000
  return (seed / 1000) * 6 - 3
}
