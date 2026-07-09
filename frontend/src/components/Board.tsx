import type { Task, Note } from '../types'
import TaskCard from './TaskCard'

interface Props {
  tasks: Task[]
  onAddNote: (task: Task) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
  onMoveTask: (taskId: number, dir: 'up' | 'down') => void
  onEditNote: (note: Note) => void
  onDeleteNote: (note: Note) => void
}

export default function Board({
  tasks,
  onAddNote,
  onEditTask,
  onDeleteTask,
  onMoveTask,
  onEditNote,
  onDeleteNote,
}: Props) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="chalk-text font-chalk text-3xl">まだ何も書かれていません</p>
        <p className="chalk-text-muted mt-2 font-chalk text-xl">
          右上の「＋ 新しいタスクを書く」から始めましょう
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 min-[1600px]:grid-cols-3">
      {tasks.map((task, index) => (
        <TaskCard
          key={task.id}
          task={task}
          isFirst={index === 0}
          isLast={index === tasks.length - 1}
          onAddNote={onAddNote}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onMoveTask={onMoveTask}
          onEditNote={onEditNote}
          onDeleteNote={onDeleteNote}
        />
      ))}
    </div>
  )
}
