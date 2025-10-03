import React from 'react'

export default function LLMDisabledBanner({ reason, keySource, retryAfter }: { reason?: string | null, keySource?: string | null, retryAfter?: number | null }) {
  if (!reason && !keySource) return null
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex">
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            LLM features are temporarily disabled{keySource ? ` (key source: ${keySource})` : ''}.
          </p>
          {reason ? <p className="mt-1 text-sm text-yellow-600">{reason}</p> : null}
          {retryAfter ? <p className="mt-1 text-xs text-yellow-500">Retry after ~{Math.ceil(retryAfter)}s</p> : null}
        </div>
      </div>
    </div>
  )
}
