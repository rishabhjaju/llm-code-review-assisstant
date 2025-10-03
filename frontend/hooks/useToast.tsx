'use client'

import React from 'react'

export type Toast = { id: string, title: string, description?: string, variant?: 'success'|'error'|'info', undo?: () => void }

export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const add = (t: Omit<Toast, 'id'>, ttl = 5000) => {
    const id = Math.random().toString(36).slice(2, 9)
    const toast = { id, ...t }
    setToasts((s) => [...s, toast])
    if (ttl > 0) {
      setTimeout(() => remove(id), ttl)
    }
    return id
  }

  const remove = (id: string) => setToasts((s) => s.filter((t) => t.id !== id))

  return { toasts, add, remove }
}
