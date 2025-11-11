let listeners = []
let idCounter = 0

export function subscribe(listener) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter(l => l !== listener)
  }
}

export function showToast(message, type = 'success', duration = 3000) {
  const id = ++idCounter
  const payload = { id, message, type, duration }
  for (const l of listeners) l(payload)
}


