 'use client'

 import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
 import MiniChart from './MiniChart'
 import { BarChart3 } from 'lucide-react'
import { ExternalLink } from 'lucide-react'
 import type { AnalyzeResponse, Comment as CommentType } from '../types'
 import { Modal } from '@/components/ui/modal'

 function severityColor(s: string) {
   switch (s) {
     case 'error': return 'bg-red-100 text-red-800'
     case 'warning': return 'bg-yellow-100 text-yellow-800'
     default: return 'bg-blue-100 text-blue-800'
   }
 }

function commentCardClass(s: string | null | undefined) {
  switch (s) {
    case 'error': return 'bg-red-50 border-red-200'
    case 'warning': return 'bg-yellow-50 border-yellow-200'
    case 'info': return 'bg-blue-50 border-blue-200'
    default: return 'bg-white border-gray-200'
  }
}

//using
 export function SummaryCard({ analysis }: { analysis: AnalyzeResponse | null }) {
   if (!analysis) return null
   return (
     <div className="p-4">
       <div className="bg-gradient-to-r from-white to-gray-50 border border-gray-100 rounded-lg p-6 shadow-sm">
         <div className="flex items-start justify-between">
           <div>
             <h3 className="text-xl font-bold text-gray-900">Summary</h3>
             <p className="mt-2 text-gray-700 max-w-3xl">{analysis.summary?.summary ?? (analysis.summary_error ? 'Summary unavailable due to LLM error.' : 'No summary available.')}</p>
             {analysis.summary?.key_points && analysis.summary.key_points.length > 0 && (
               <div className="mt-4 flex flex-wrap gap-2">
                 {analysis.summary.key_points.map((kp: string, i: number) => (
                   <span key={i} className="text-sm px-3 py-1 bg-gray-100 text-gray-800 rounded-full">{kp}</span>
                 ))}
               </div>
             )}
           </div>
           <div className="text-right flex flex-col items-end gap-2">
             <div>
               {analysis.llm_disabled ? (
                 <div className="text-xs text-red-600">LLM features disabled ({analysis.llm_disabled_key_source ?? 'unknown'})</div>
               ) : (
                 <div className="text-xs text-green-600">LLM features enabled</div>
               )}
             </div>
            {/* Export button moved to the navbar for accessibility */}
           </div>
         </div>
       </div>
     </div>
   )
 }

 export function CommentsView({ analysis, onCommentsUpdate }: { analysis: AnalyzeResponse | null, onCommentsUpdate?: (c: CommentType[]) => void }) {
   const [comments, setComments] = useState<CommentType[]>((analysis?.comments || []).map((c: any) => ({ ...c })))
   const [activeIdx, setActiveIdx] = useState<number | null>(null)

   const update = (idx: number, field: string, value: any) => {
     const copy = [...comments]
     copy[idx] = { ...copy[idx], [field]: value }
     setComments(copy)
   }

   const save = () => onCommentsUpdate?.(comments)

   if (!analysis) return null

   return (
     <div className="p-4">
       <div className="mb-4 flex items-center justify-between">
         <h3 className="text-lg font-semibold">Issues</h3>
         {/* <div className="flex gap-2">
           <Button onClick={() => { setComments([{ line: null, column: null, severity: 'info', category: 'Other', message: '', suggestion: '' }, ...comments]) }}>Add</Button>
           <Button variant="outline" onClick={save}>Save</Button>
         </div> */}
       </div>

       {comments.length === 0 ? (
         <div className="text-sm text-gray-500">No issues found</div>
       ) : (
         <div className="space-y-3">
           {comments.map((it: any, idx: number) => (
      <div key={idx} className={`p-4 rounded-lg border flex items-start gap-4 shadow-sm ${commentCardClass(it.severity)}`}>
        <div className={`w-3 h-12 rounded ${severityColor(it.severity || 'info')}`} />
               <div className="flex-1">
                 <div className="flex items-start justify-between">
                   <div>
                     <div className="text-sm font-medium text-gray-900">{it.message || <span className="text-gray-500">(no message)</span>}</div>
                     <div className="text-xs text-gray-500 mt-1">{it.category ?? 'Other'} • Line {it.line ?? '-'}</div>
                   </div>
                   <div className="text-right">
                     {/* <div className="text-xs text-gray-600">Severity</div> */}
                     <div className={`mt-1 text-xs px-2 py-0.5 rounded ${severityColor(it.severity || 'info')}`}>{it.severity}</div>
                   </div>
                 </div>
                 {it.suggestion ? (
                   <blockquote className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700 border-l-2 border-gray-200">{it.suggestion}</blockquote>
                 ) : null}
                 {/* <div className="mt-3 flex gap-2">
                   <button onClick={() => setActiveIdx(idx)} className="text-sm text-primary-600 px-2 py-1 rounded border">Details</button>
                 </div> */}
               </div>
             </div>
           ))}
         </div>
       )}

       <Modal isOpen={activeIdx !== null} onClose={() => setActiveIdx(null)} title="Comment" size="md">
         {activeIdx !== null && (
           <div className="space-y-4">
             <div>
               <div className="text-sm text-gray-500">Message</div>
               <textarea value={comments[activeIdx]?.message ?? ''} onChange={(e) => update(activeIdx, 'message', e.target.value)} className="w-full border rounded px-2 py-1 mt-1" rows={3} />
             </div>
             <div className="flex justify-end gap-2">
               <Button variant="outline" onClick={() => setActiveIdx(null)}>Close</Button>
               <Button onClick={() => { save(); setActiveIdx(null) }}>Save</Button>
             </div>
           </div>
         )}
       </Modal>
     </div>
   )
 }

 //using
export function MetricsView({ analysis, history, onLoadHistory }: { analysis: AnalyzeResponse | null, history?: any[], onLoadHistory?: (item: any) => void }) {
   if (!analysis) return null
  const METRIC_DEFS = [
    { key: 'cc_avg', label: 'Cyclomatic Complexity (avg)', desc: 'Average cyclomatic complexity per function. Lower is better.' , format: (v: any) => (v == null ? '-' : Number(v).toFixed(2)) },
    { key: 'mi_avg', label: 'Maintainability Index', desc: 'Maintainability Index (higher is better; 0-100 scale).', format: (v: any) => (v == null ? '-' : Number(v).toFixed(2)) },
    // { key: 'pylint_score', label: 'Pylint Score', desc: 'Static lint score from pylint (higher is better).', format: (v: any) => (v == null ? '-' : Number(v).toFixed(2)) },
    { key: 'naming_quality', label: 'Naming Quality', desc: 'Proportion of identifiers following naming conventions (0-1). Shown as %.', format: (v: any) => (v == null ? '-' : `${(Number(v) * 100).toFixed(1)}%`) },
    { key: 'execution_time_estimate_ms', label: 'Execution Time (ms)', desc: 'Estimated execution time in milliseconds for common code paths.', format: (v: any) => (v == null ? '-' : `${Number(v).toFixed(1)} ms`) },
    { key: 'oop_compliance', label: 'OOP Compliance', desc: 'Degree of object-oriented design adherence (0-1). Shown as %.', format: (v: any) => (v == null ? '-' : `${(Number(v) * 100).toFixed(1)}%`) },
    // { key: 'coding_standards', label: 'Coding Standards', desc: 'Coding standards compliance score (0-1). Shown as %.', format: (v: any) => (v == null ? '-' : `${(Number(v) * 100).toFixed(1)}%`) },
    { key: 'lines', label: 'Lines of Code', desc: 'Number of source lines in the file.', format: (v: any) => (v == null ? '-' : Math.round(v)) },
    { key: 'func_count', label: 'Functions', desc: 'Number of functions detected in the file.', format: (v: any) => (v == null ? '-' : Math.round(v)) },
    { key: 'class_count', label: 'Classes', desc: 'Number of classes detected in the file.', format: (v: any) => (v == null ? '-' : Math.round(v)) },
  ]

  const metrics = (analysis as any)?.metrics || {}

  function MetricCard({ def }: { def: any }) {
    const val = metrics?.[def.key]
    const display = def.format(val)
    return (
      <div className="p-3 bg-white border rounded-lg shadow-sm h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded"><BarChart3 className="h-5 w-5 text-gray-600" /></div>
            <div>
              <div className="text-lg font-semibold text-gray-700">{def.label}</div>
              {/* <div className="text-xs text-gray-500">&nbsp;</div> */}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between ml-12">
          <div className="text-xl font-bold text-gray-900 tabular-nums truncate">{display}</div>
          <div className="relative group overflow-visible">
            <div className="sr-only">Metric definition</div>
            <div role="tooltip" className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-0 -top-0 mt-2 w-64 bg-gray-800 text-white text-xs p-2 rounded z-10">
              {def.desc}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 gap-6">
      <div>
        <h4 className="text-lg font-semibold mb-3">Metrics</h4>
        <div className="grid grid-cols-2 gap-3">
          {METRIC_DEFS.map((m) => (
            <MetricCard key={m.key} def={m} />
          ))}
        </div>

        {/* <div className="mt-6">
          <h4 className="text-lg font-semibold">Metric Trends</h4>
          {/* <div className="mt-2">
            <div className="text-sm">Coding standards</div>
            <MiniChart values={(history || []).map(h => (h.metrics?.coding_standards ?? 0))} />
          </div> 
        </div> */}
      </div>
    </div>
  )
 }

 //using
export function DocsView({ analysis, history, onLoadHistory }: { analysis: AnalyzeResponse | null, history?: any[], onLoadHistory?: (item: any) => void }) {
  if (!analysis) return null
  const links = (analysis.docs_links || [])
  const rawDocs = (analysis.docs || [])
  const [selected, setSelected] = React.useState<any | null>(null)
  const selectedOpenUrl = selected ? (selected.canonical_url || selected.url || `https://www.google.com/search?q=${encodeURIComponent(selected?.name ?? '')}`) : null

  const findRelated = (name: string) => {
    const lower = (name || '').toLowerCase()
    const items = (history || []).filter((h: any) => {
      try {
        const docs = (h.docs || []) as string[]
        const dlinks = (h.docs_links || []) as any[]
        const foundInDocs = docs.some((d: string) => (d || '').toLowerCase().includes(lower))
        const foundInLinks = dlinks.some((dl: any) => ((dl.name || '')).toLowerCase().includes(lower))
        const foundInSummary = (h.summary?.summary || '').toLowerCase().includes(lower)
        return foundInDocs || foundInLinks || foundInSummary
      } catch (e) {
        return false
      }
    })
    return items
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-3">Library Docs</h3>
      {links.length === 0 && rawDocs.length === 0 && (
        <div className="text-sm text-gray-500">No library documentation found for this file.</div>
      )}

      <div className="space-y-3">
        {links.map((l: any, i: number) => {
          const openUrl = l.canonical_url || l.url || `https://www.google.com/search?q=${encodeURIComponent(l.name)}`
          return (
            <div key={i} className="p-3 bg-white border rounded shadow-sm flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">{(l.name || '').slice(0,2).toUpperCase()}</div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{l.name}</div>
                  <div className="text-xs text-gray-500 truncate w-64">{(l.canonical_url || l.url) ?? 'No direct URL available'}</div>
                  <div className="mt-1 text-xs flex gap-2">
                    <span className="px-2 py-0.5 text-xs bg-gray-100 rounded">{l.source ?? 'unknown'}</span>
                    {typeof l.confidence === 'number' && (
                      <span className="px-2 py-0.5 text-xs bg-gray-50 rounded text-gray-600">{Math.round((l.confidence || 0) * 100)}%</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a target="_blank" rel="noopener noreferrer" href={`https://www.google.com/search?q=${encodeURIComponent(l.name)}`} className="px-3 py-1 bg-gray-100 rounded text-sm">Search</a>
                <a target="_blank" rel="noopener noreferrer" href={openUrl} className={`inline-flex items-center gap-2 px-3 py-1 rounded text-sm ${openUrl ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  More details <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={() => setSelected(l)} className="px-3 py-1 bg-white border rounded text-sm">Details</button>
              </div>
            </div>
          )
        })}

        {rawDocs.map((d: any, i: number) => (
          <div key={`raw-${i}`} className="p-3 bg-white border rounded">
            {d}
          </div>
        ))}
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? 'Library'} size="lg">
        {selected && (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Name</div>
              <div className="text-base font-semibold">{selected.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">URL</div>
              {selectedOpenUrl ? (
                <a target="_blank" rel="noopener noreferrer" href={selectedOpenUrl} className="text-sm text-blue-600 truncate block w-full">{selectedOpenUrl}</a>
              ) : (
                <div className="text-sm text-gray-500">No direct URL available</div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium">Related history</h4>
              <div className="mt-2 space-y-2">
                {findRelated(selected.name).length === 0 && <div className="text-sm text-gray-500">No related history entries.</div>}
                {findRelated(selected.name).map((h: any, idx: number) => (
                  <div key={idx} className="p-2 border rounded bg-gray-50 flex items-center justify-between">
                    <div className="text-sm">{new Date(h.timestamp).toLocaleString()} — {h.summary?.summary ?? ''}</div>
                    <div>
                      <button onClick={() => { onLoadHistory?.(h); setSelected(null) }} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Load</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <a target="_blank" rel="noopener noreferrer" href={`https://www.google.com/search?q=${encodeURIComponent(selected?.name ?? '')}`} className="px-3 py-2 bg-gray-100 rounded text-sm">Search</a>
          <a target="_blank" rel="noopener noreferrer" href={selectedOpenUrl ?? `https://www.google.com/search?q=${encodeURIComponent(selected?.name ?? '')}`} className={`px-3 py-2 rounded text-sm ${selectedOpenUrl ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Open docs</a>
          <button onClick={() => setSelected(null)} className="px-3 py-2 bg-white border rounded text-sm">Close</button>
        </div>
      </Modal>
    </div>
  )
}

 export default {
   SummaryCard,
   CommentsView,
   MetricsView,
   DocsView
 }
