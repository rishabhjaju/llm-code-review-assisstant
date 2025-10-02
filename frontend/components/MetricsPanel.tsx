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
import { AnalysisResult, CodeIssue } from '@/types'
import React, { useEffect, useState } from 'react'
import MiniChart from './MiniChart'
import type { AnalyzeResponse, Comment as CommentType } from '../types'

export default function MetricsPanel({ analysis, onCommentsUpdate, history, onLoadHistory }: { analysis: AnalyzeResponse | null, onCommentsUpdate?: (c: CommentType[]) => void, history?: any[], onLoadHistory?: (item: any) => void }) {
  if (!analysis) return null

  const [comments, setComments] = useState<CommentType[]>([])

  useEffect(() => {
    setComments((analysis.comments || []).map((c) => ({ ...c })))
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

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold">Summary</h3>

      {analysis.summary ? (
        <>
          <p className="mt-2 text-sm text-gray-700">{analysis.summary.summary}</p>
          {analysis.summary.key_points && analysis.summary.key_points.length > 0 && (
            <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
              {analysis.summary.key_points.map((kp, i) => (
                <li key={i} className="text-sm text-gray-600">{kp}</li>
              ))}
            </ul>
          )}
        </>
      ) : analysis.summary_error ? (
        <div className="mt-2 text-sm text-red-600">LLM summary error: {analysis.summary_error}</div>
      ) : (
        <p className="mt-2 text-sm text-gray-500">No summary available.</p>
      )}

      <div className="mt-4">
        <h4 className="font-medium">Review Comments</h4>

        {analysis.comments_validation_errors?.length ? (
          <div className="text-sm text-yellow-700">Validation: {analysis.comments_validation_errors.join('; ')}</div>
        ) : null}

        <div className="mt-2 space-y-2">
          <div className="flex gap-2">
            <button onClick={addComment} className="px-2 py-1 bg-blue-500 text-white rounded text-sm">Add</button>
            <button onClick={saveComments} className="px-2 py-1 bg-green-500 text-white rounded text-sm">Save Edits</button>
          </div>

          {comments.length === 0 ? <div className="text-sm text-gray-500 mt-2">No issues found</div> :
            comments.map((it: any, idx: number) => (
              <div key={idx} className="p-2 border rounded grid grid-cols-12 gap-2 items-start">
                <div className="col-span-2">
                  <input type="number" value={it.line ?? ''} onChange={(e) => updateComment(idx, 'line', e.target.value ? parseInt(e.target.value) : null)} placeholder="line" className="w-full border rounded px-1 py-0.5 text-sm" />
                </div>
                <div className="col-span-2">
                  <select value={it.severity || 'info'} onChange={(e) => updateComment(idx, 'severity', e.target.value)} className="w-full border rounded px-1 py-0.5 text-sm">
                    <option value="error">error</option>
                    <option value="warning">warning</option>
                    <option value="info">info</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <select value={it.category || 'Other'} onChange={(e) => updateComment(idx, 'category', e.target.value)} className="w-full border rounded px-1 py-0.5 text-sm">
                    <option>Performance</option>
                    <option>Readability</option>
                    <option>Security</option>
                    <option>Maintainability</option>
                    <option>Style</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="col-span-10">
                  <input type="text" value={it.message || ''} onChange={(e) => updateComment(idx, 'message', e.target.value)} placeholder="message" className="w-full border rounded px-1 py-0.5 text-sm" />
                  <input type="text" value={it.suggestion || ''} onChange={(e) => updateComment(idx, 'suggestion', e.target.value)} placeholder="suggestion" className="w-full border rounded px-1 py-0.5 text-sm mt-1" />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <button onClick={() => removeComment(idx)} className="px-2 py-0.5 bg-red-500 text-white rounded text-xs">Remove</button>
                </div>
              </div>
            ))}

          {analysis.comments_raw ? (
            <div className="mt-3 text-sm">
              <h5 className="font-medium">LLM raw response</h5>
              <pre className="bg-gray-50 p-2 text-xs overflow-auto">{analysis.comments_raw}</pre>
            </div>
          ) : null}
        </div>
      </div>
      
      <div className="mt-6">
        <h4 className="font-medium">Metric Trends</h4>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm">Coding standards</div>
            <div className="mt-1">
              <MiniChart values={(history || []).map(h => (h.metrics?.coding_standards ?? 0))} />
            </div>
            <div className="text-xs mt-1 text-gray-600">{analysis.metrics?.coding_standards ?? '-'}</div>
          </div>

          <div>
            <div className="text-sm">OOP compliance</div>
            <div className="mt-1">
              <MiniChart values={(history || []).map(h => (h.metrics?.oop_compliance ?? 0) * 100)} color="#7c3aed" />
            </div>
            <div className="text-xs mt-1 text-gray-600">{analysis.metrics?.oop_compliance ?? '-'}</div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="font-medium">History</h4>
        <div className="mt-2 space-y-2">
          {(history || []).length === 0 ? <div className="text-sm text-gray-500">No history</div> :
            (history || []).map((h, i) => (
              <div key={i} className="flex items-center justify-between p-2 border rounded">
                <div className="text-sm">{new Date(h.timestamp).toLocaleString()}</div>
                <div className="flex gap-2">
                  <button onClick={() => onLoadHistory && onLoadHistory(h)} className="px-2 py-1 bg-gray-100 rounded text-sm">Load</button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
