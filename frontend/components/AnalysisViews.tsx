 'use client'

 import React, { useState } from 'react'
 import { Button } from '@/components/ui/button'
 import MiniChart from './MiniChart'
 import { BarChart3 } from 'lucide-react'
 import type { AnalyzeResponse, Comment as CommentType } from '../types'
 import { Modal } from '@/components/ui/modal'
 import { Tag, FileText, Clock } from 'lucide-react'

 function severityColor(s: string) {
   switch (s) {
     case 'error': return 'bg-red-100 text-red-800'
     case 'warning': return 'bg-yellow-100 text-yellow-800'
     default: return 'bg-blue-100 text-blue-800'
   }
 }

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
           <div className="text-right">
             {analysis.llm_disabled ? (
               <div className="text-xs text-red-600">LLM features disabled ({analysis.llm_disabled_key_source ?? 'unknown'})</div>
             ) : (
               <div className="text-xs text-green-600">LLM features enabled</div>
             )}
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
         <h3 className="text-lg font-semibold">Review Comments</h3>
         <div className="flex gap-2">
           <Button onClick={() => { setComments([{ line: null, column: null, severity: 'info', category: 'Other', message: '', suggestion: '' }, ...comments]) }}>Add</Button>
           <Button variant="outline" onClick={save}>Save</Button>
         </div>
       </div>

       {comments.length === 0 ? (
         <div className="text-sm text-gray-500">No issues found</div>
       ) : (
         <div className="space-y-3">
           {comments.map((it: any, idx: number) => (
             <div key={idx} className="p-4 rounded-lg border flex items-start gap-4 shadow-sm bg-white">
               <div className={`w-3 h-12 rounded ${severityColor(it.severity || 'info')}`} />
               <div className="flex-1">
                 <div className="flex items-start justify-between">
                   <div>
                     <div className="text-sm font-medium text-gray-900">{it.message || <span className="text-gray-500">(no message)</span>}</div>
                     <div className="text-xs text-gray-500 mt-1">{it.category ?? 'Other'} • Line {it.line ?? '-'}</div>
                   </div>
                   <div className="text-right">
                     <div className="text-xs text-gray-600">Severity</div>
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

 export function MetricsView({ analysis, history, onLoadHistory }: { analysis: AnalyzeResponse | null, history?: any[], onLoadHistory?: (item: any) => void }) {
   if (!analysis) return null
   return (
     <div className="p-4 grid lg:grid-cols-2 gap-6">
       <div>
         <h4 className="text-lg font-semibold mb-3">Metrics</h4>
         <div className="grid grid-cols-2 gap-3">
           {Object.entries(analysis.metrics || {}).slice(0,8).map(([k,v]: any) => (
             <div key={k} className="p-3 bg-white border rounded-lg shadow-sm flex items-center gap-3">
               <div className="p-2 bg-gray-50 rounded"><BarChart3 className="h-5 w-5 text-gray-600" /></div>
               <div>
                 <div className="text-xs text-gray-500">{k}</div>
                 <div className="text-lg font-medium text-gray-900">{v ?? '-'}</div>
               </div>
             </div>
           ))}
         </div>

         <div className="mt-6">
           <h4 className="text-lg font-semibold">Metric Trends</h4>
           <div className="mt-2">
             <div className="text-sm">Coding standards</div>
             <MiniChart values={(history || []).map(h => (h.metrics?.coding_standards ?? 0))} />
           </div>
         </div>
       </div>

       <div>
         <h4 className="text-lg font-semibold mb-3">Library Docs & History</h4>
         <div className="space-y-3">
           {(analysis.docs || []).map((d: any, i: number) => (
             <div key={i} className="p-3 bg-white border rounded">{d}</div>
           ))}
         </div>
         {/* <div className="mt-6">
           <h4 className="text-lg font-semibold">History</h4>
           <div className="mt-2 space-y-2">
             {(history || []).map((h, i) => (
               <div key={i} className="flex items-center justify-between p-2 border rounded bg-white">
                 <div className="text-sm">{new Date(h.timestamp).toLocaleString()}</div>
                 <div>
                   <button onClick={() => onLoadHistory && onLoadHistory(h)} className="px-2 py-1 bg-gray-100 rounded text-sm">Load</button>
                 </div>
               </div>
             ))}
           </div>
         </div> */}
       </div>
     </div>
   )
 }

 export default {
   SummaryCard,
   CommentsView,
   MetricsView
 }
