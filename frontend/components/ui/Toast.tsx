'use client'

import React from 'react'
import { X, ArrowLeft } from 'lucide-react'

export default function ToastContainer({ toasts, onRemove }: { toasts: any[], onRemove: (id: string) => void }) {
  return (
    <div className="fixed right-6 top-6 flex flex-col gap-2 z-50">
      {toasts.map((t) => (
        <div key={t.id} className={`w-80 p-3 rounded shadow-lg flex items-start gap-3 ${t.variant === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          <div className="flex-1">
            <div className="font-medium">{t.title}</div>
            {t.description && <div className="text-sm mt-1 opacity-90">{t.description}</div>}
            {t.undo && (
              <button className="mt-2 inline-flex items-center gap-1 text-xs underline" onClick={() => { t.undo(); onRemove(t.id) }}>
                <ArrowLeft className="h-4 w-4" /> Undo
              </button>
            )}
          </div>
          <button onClick={() => onRemove(t.id)} className="p-1">
            <X className="h-4 w-4 opacity-80" />
          </button>
        </div>
      ))}
    </div>
  )
}
