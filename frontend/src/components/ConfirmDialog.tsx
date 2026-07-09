import Modal from './Modal'

interface Props {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = '削除する',
  onConfirm,
  onClose,
}: Props) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="whitespace-pre-line text-stone-700">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-stone-600 hover:bg-stone-200"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
