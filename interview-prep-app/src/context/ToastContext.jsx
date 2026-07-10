import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { subscribeToast } from '../lib/toastBus'
import Toast from '../components/ui/Toast'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((toast) => {
    const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
    setToasts((current) => [...current, { id, variant: 'error', duration: 6000, ...toast }])
  }, [])

  useEffect(() => subscribeToast(addToast), [addToast])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}