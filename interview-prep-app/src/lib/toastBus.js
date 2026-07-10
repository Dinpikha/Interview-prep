
const listeners = new Set()

export function subscribeToast(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function emitToast(toast) {
  listeners.forEach((listener) => listener(toast))
}