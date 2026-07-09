import type { Note } from '../types'
import { NOTE_COLORS, tiltForId } from './noteColors'

interface Props {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (note: Note) => void
}

export default function StickyNote({ note, onEdit, onDelete }: Props) {
  const color = NOTE_COLORS[note.color] ?? NOTE_COLORS.yellow
  const tilt = tiltForId(note.id)

  return (
    <div
      className={`sticky-note group relative w-36 min-h-[7rem] p-3 pb-2 font-hand animate-pop-in ${color.bg}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      {/* 操作ボタン（ホバー/フォーカスで表示） */}
      <div className="absolute -right-2 -top-2 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(note)}
          aria-label={`${note.name} さんの付箋を編集`}
          className="grid h-6 w-6 place-items-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
        >
          ✎
        </button>
        <button
          type="button"
          onClick={() => onDelete(note)}
          aria-label={`${note.name} さんの付箋を削除`}
          className="grid h-6 w-6 place-items-center rounded-full bg-black/60 text-sm text-white hover:bg-black/80"
        >
          ×
        </button>
      </div>

      <p className="break-words text-base font-bold leading-snug">{note.name}</p>
      {note.comment && (
        <p className="mt-1 break-words text-sm leading-snug opacity-90">{note.comment}</p>
      )}
    </div>
  )
}
