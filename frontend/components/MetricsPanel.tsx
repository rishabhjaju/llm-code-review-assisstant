'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  FileText,
  Clock,
  Target
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import MiniChart from './MiniChart'
import type { AnalyzeResponse, Comment as CommentType } from '../types'
import { Modal } from '@/components/ui/modal'

export default function MetricsPanel({ analysis, onCommentsUpdate, history, onLoadHistory, view = 'full' }: { analysis: AnalyzeResponse | null, onCommentsUpdate?: (c: CommentType[]) => void, history?: any[], onLoadHistory?: (item: any) => void, view?: 'full'|'comments'|'metrics' }) {
  if (!analysis) return null

  const [comments, setComments] = useState<CommentType[]>([])

  useEffect(() => {
    setComments((analysis.comments || []).map((c: any) => ({ ...c })))
  }, [analysis])

  const updateComment = (idx: number, field: string, value: any) => {
    const copy = [...comments]
    copy[idx] = { ...copy[idx], [field]: value }
    setComments(copy)
  }

  const addComment = () => {
    setComments([{ line: null, column: null, severity: 'info', category: 'Other', message: '', suggestion: '' }, ...comments])
  }

  const removeComment = (idx: number) => {
    const copy = [...comments]
    copy.splice(idx, 1)
    setComments(copy)
  }

  const saveComments = () => {
    if (onCommentsUpdate) onCommentsUpdate(comments)
  }

  const [showTagsModal, setShowTagsModal] = useState(false)
  const [showDocsModal, setShowDocsModal] = useState(false)
  const [activeCommentIdx, setActiveCommentIdx] = useState<number | null>(null)

  const severityColor = (s: string) => {
    switch (s) {
      case 'error': return 'bg-red-100 text-red-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const tagColor = (t: string) => {
    const seed = t?.length || 0
    const palette = ['bg-indigo-100 text-indigo-800', 'bg-green-100 text-green-800', 'bg-pink-100 text-pink-800', 'bg-amber-100 text-amber-800', 'bg-sky-100 text-sky-800']
    return palette[seed % palette.length]
  }

  const metricTiles = [
    { key: 'lines', label: 'Lines', icon: BarChart3, value: analysis.metrics?.lines ?? '-' },
    { key: 'func_count', label: 'Functions', icon: TrendingUp, value: analysis.metrics?.func_count ?? '-' },
    { key: 'class_count', label: 'Classes', icon: Target, value: analysis.metrics?.class_count ?? '-' },
    { key: 'cc_avg', label: 'Cyclomatic Avg', icon: AlertTriangle, value: analysis.metrics?.cc_avg ?? '-' },
    { key: 'mi_avg', label: 'Maintainability Avg', icon: CheckCircle, value: analysis.metrics?.mi_avg ?? '-' },
    { key: 'pylint_score', label: 'Pylint', icon: Info, value: analysis.metrics?.pylint_score ?? '-' },
    { key: 'naming_quality', label: 'Naming', icon: FileText, value: analysis.metrics?.naming_quality ?? '-' },
    { key: 'execution_time_estimate_ms', label: 'Exec Time (ms)', icon: Clock, value: analysis.metrics?.execution_time_estimate_ms ?? '-' }
  ]

  return (
    <div className="p-4 space-y-6">
      {/* Modals */}
      {/* summary modal removed - summary is shown in Summary tab */}

      <Modal isOpen={showTagsModal} onClose={() => setShowTagsModal(false)} title="Tags" size="sm">
        <div className="flex flex-wrap gap-2">
          {(analysis.tags || []).map((t: any, i: number) => (
            <span key={i} className={`text-sm px-3 py-1 rounded-full ${tagColor(t)}`}>{t}</span>
          ))}
        </div>
      </Modal>

      <Modal isOpen={showDocsModal} onClose={() => setShowDocsModal(false)} title="Library Docs" size="lg">
        <div className="space-y-3">
          {(analysis.docs || []).map((d: any, i: number) => (
            <div key={i} className="p-3 bg-gray-50 rounded">{d}</div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={activeCommentIdx !== null} onClose={() => setActiveCommentIdx(null)} title="Comment Details" size="md">
        {activeCommentIdx !== null ? (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Category</div>
              <select value={comments[activeCommentIdx]?.category ?? 'Other'} onChange={(e) => updateComment(activeCommentIdx, 'category', e.target.value)} className="w-full border rounded px-2 py-1 mt-1">
                <option>Performance</option>
                <option>Readability</option>
                <option>Security</option>
                <option>Maintainability</option>
                <option>Style</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <div className="text-sm text-gray-500">Severity</div>
              <select value={comments[activeCommentIdx]?.severity ?? 'info'} onChange={(e) => updateComment(activeCommentIdx, 'severity', e.target.value)} className="w-full border rounded px-2 py-1 mt-1">
                <option value="error">error</option>
                <option value="warning">warning</option>
                <option value="info">info</option>
              </select>
            </div>
            <div>
              <div className="text-sm text-gray-500">Line</div>
              <input type="number" value={comments[activeCommentIdx]?.line ?? ''} onChange={(e) => updateComment(activeCommentIdx, 'line', e.target.value ? parseInt(e.target.value) : null)} className="w-full border rounded px-2 py-1 mt-1" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Message</div>
              <textarea value={comments[activeCommentIdx]?.message ?? ''} onChange={(e) => updateComment(activeCommentIdx, 'message', e.target.value)} className="w-full border rounded px-2 py-1 mt-1" rows={3} />
            </div>
            <div>
              <div className="text-sm text-gray-500">Suggestion</div>
              <textarea value={comments[activeCommentIdx]?.suggestion ?? ''} onChange={(e) => updateComment(activeCommentIdx, 'suggestion', e.target.value)} className="w-full border rounded px-2 py-1 mt-1" rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setActiveCommentIdx(null)}>Close</Button>
              <Button onClick={() => { saveComments(); setActiveCommentIdx(null) }}>Save</Button>
            </div>
          </div>
        ) : null}
      </Modal>

  {/* Top row: Tags + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {(analysis.tags || []).slice(0, 6).map((t: any, i: number) => (
                <button key={i} onClick={() => { setShowTagsModal(true) }} className={`text-xs px-2 py-1 rounded-full ${tagColor(t)} hover:opacity-90`}>{t}</button>
              ))}
              {(analysis.tags || []).length > 6 && (
                <button onClick={() => setShowTagsModal(true)} className="text-xs px-2 py-1 rounded-full bg-gray-100">+{(analysis.tags || []).length - 6} more</button>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {view !== 'metrics' && (
            <>
              <Button onClick={addComment} className="px-3 py-1">Add Comment</Button>
              <Button onClick={saveComments} className="px-3 py-1">Save Edits</Button>
            </>
          )}
        </div>
      </div>

      {/* Render comments-only view */}
      {view === 'comments' && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Review Comments</h4>
          {analysis.comments_validation_errors?.length ? (
            <div className="text-sm text-yellow-700">Validation: {analysis.comments_validation_errors.join('; ')}</div>
          ) : null}

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

                    <div className="mt-3 flex gap-2">
                      <button onClick={() => removeComment(idx)} className="text-sm text-red-600 px-2 py-1 rounded border">Remove</button>
                      <button onClick={() => updateComment(idx, 'severity', it.severity === 'error' ? 'warning' : 'error')} className="text-sm text-gray-700 px-2 py-1 rounded border">Toggle Severity</button>
                      <button onClick={() => setActiveCommentIdx(idx)} className="text-sm text-primary-600 px-2 py-1 rounded border">Details</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {analysis.comments_raw ? (
            <div className="mt-3 text-sm">
              <h5 className="font-medium">LLM raw response</h5>
              <pre className="bg-gray-50 p-2 text-xs overflow-auto rounded">{analysis.comments_raw}</pre>
            </div>
          ) : null}
        </div>
      )}

      {/* Render metrics-only view */}
      {view === 'metrics' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-semibold">Metrics</h4>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {metricTiles.map((m) => {
                const Icon = m.icon
                return (
                  <div key={m.key} className="p-3 bg-white border rounded-lg shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded">
                      <Icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">{m.label}</div>
                      <div className="text-lg font-medium text-gray-900">{m.value}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold">Library Docs / Notes</h4>
            <div className="mt-2 text-sm text-gray-700">
              {(analysis.docs || []).length === 0 ? (
                <div className="text-sm text-gray-500">No docs suggestions</div>
              ) : (
                <div className="space-y-2">
                  {(analysis.docs || []).map((d: any, i: number) => (
                    <div key={i} className="p-3 bg-white border rounded flex justify-between items-start">
                      <div className="flex-1 pr-3">{d}</div>
                      <div>
                        <Button variant="ghost" size="sm" onClick={() => { setShowDocsModal(true) }}>Open</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold">Metric Trends</h4>
            <div className="mt-2">
              <div className="text-sm">Coding standards</div>
              <div className="mt-1">
                <MiniChart values={(history || []).map(h => (h.metrics?.coding_standards ?? 0))} />
              </div>
              <div className="text-xs mt-1 text-gray-600">{analysis.metrics?.coding_standards ?? '-'}</div>

              <div className="text-sm mt-3">OOP compliance</div>
              <div className="mt-1">
                <MiniChart values={(history || []).map(h => (h.metrics?.oop_compliance ?? 0) * 100)} color="#7c3aed" />
              </div>
              <div className="text-xs mt-1 text-gray-600">{analysis.metrics?.oop_compliance ?? '-'}</div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold">History</h4>
            <div className="mt-2 space-y-2">
              {(history || []).length === 0 ? <div className="text-sm text-gray-500">No history</div> :
                (history || []).map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border rounded bg-white">
                    <div className="text-sm">{new Date(h.timestamp).toLocaleString()}</div>
                    <div className="flex gap-2">
                      <button onClick={() => onLoadHistory && onLoadHistory(h)} className="px-2 py-1 bg-gray-100 rounded text-sm">Load</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Render full two-column view */}
      {view === 'full' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-lg font-semibold">Review Comments</h4>
            {analysis.comments_validation_errors?.length ? (
              <div className="text-sm text-yellow-700">Validation: {analysis.comments_validation_errors.join('; ')}</div>
            ) : null}

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

                      <div className="mt-3 flex gap-2">
                        <button onClick={() => removeComment(idx)} className="text-sm text-red-600 px-2 py-1 rounded border">Remove</button>
                        <button onClick={() => updateComment(idx, 'severity', it.severity === 'error' ? 'warning' : 'error')} className="text-sm text-gray-700 px-2 py-1 rounded border">Toggle Severity</button>
                        <button onClick={() => setActiveCommentIdx(idx)} className="text-sm text-primary-600 px-2 py-1 rounded border">Details</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {analysis.comments_raw ? (
              <div className="mt-3 text-sm">
                <h5 className="font-medium">LLM raw response</h5>
                <pre className="bg-gray-50 p-2 text-xs overflow-auto rounded">{analysis.comments_raw}</pre>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold">Metrics</h4>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {metricTiles.map((m) => {
                  const Icon = m.icon
                  return (
                    <div key={m.key} className="p-3 bg-white border rounded-lg shadow-sm flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded">
                        <Icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">{m.label}</div>
                        <div className="text-lg font-medium text-gray-900">{m.value}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold">Library Docs / Notes</h4>
              <div className="mt-2 text-sm text-gray-700">
                {(analysis.docs || []).length === 0 ? (
                  <div className="text-sm text-gray-500">No docs suggestions</div>
                ) : (
                  <div className="space-y-2">
                    {(analysis.docs || []).map((d: any, i: number) => (
                      <div key={i} className="p-3 bg-white border rounded flex justify-between items-start">
                        <div className="flex-1 pr-3">{d}</div>
                        <div>
                          <Button variant="ghost" size="sm" onClick={() => { setShowDocsModal(true) }}>Open</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold">Metric Trends</h4>
              <div className="mt-2">
                <div className="text-sm">Coding standards</div>
                <div className="mt-1">
                  <MiniChart values={(history || []).map(h => (h.metrics?.coding_standards ?? 0))} />
                </div>
                <div className="text-xs mt-1 text-gray-600">{analysis.metrics?.coding_standards ?? '-'}</div>

                <div className="text-sm mt-3">OOP compliance</div>
                <div className="mt-1">
                  <MiniChart values={(history || []).map(h => (h.metrics?.oop_compliance ?? 0) * 100)} color="#7c3aed" />
                </div>
                <div className="text-xs mt-1 text-gray-600">{analysis.metrics?.oop_compliance ?? '-'}</div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold">History</h4>
              <div className="mt-2 space-y-2">
                {(history || []).length === 0 ? <div className="text-sm text-gray-500">No history</div> :
                  (history || []).map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded bg-white">
                      <div className="text-sm">{new Date(h.timestamp).toLocaleString()}</div>
                      <div className="flex gap-2">
                        <button onClick={() => onLoadHistory && onLoadHistory(h)} className="px-2 py-1 bg-gray-100 rounded text-sm">Load</button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
