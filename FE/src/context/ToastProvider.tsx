import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { ToastContext, type Toast, type ToastKind } from './toast'
import './ToastProvider.css'

const DURATION_MS = 4500
const ICONS = { info: Info, success: CircleCheck, error: CircleAlert }

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = nextId++
      setToasts((current) => [...current.slice(-3), { id, message, kind }])
      setTimeout(() => dismiss(id), DURATION_MS)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.kind]
          return (
            <div key={toast.id} className={`toast toast--${toast.kind}`}>
              <Icon size={18} className="toast__icon" />
              <span>{toast.message}</span>
              <button className="toast__close" onClick={() => dismiss(toast.id)} aria-label="Chiudi notifica">
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext>
  )
}
