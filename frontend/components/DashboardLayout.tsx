'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FileUpload from '@/components/FileUpload'
import CodeEditor from '@/components/CodeEditor'
import MetricsPanel from '@/components/MetricsPanel'
import AnalysisViews from '@/components/AnalysisViews'
const { SummaryCard, CommentsView, MetricsView } = AnalysisViews
import LLMDisabledBanner from './ui/LLMDisabledBanner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { 
  Home, 
  Upload, 
  BarChart3, 
  Play, 
  Save, 
  FileText,
  Settings,
  ArrowLeft 
} from 'lucide-react'
import { FileData, FrontendAnalysis } from '@/types'
import type { AnalyzeResponse } from '@/types'
import { getLanguageFromExtension, getFileExtension } from '@/lib/utils'
import apiClient from '../lib/api'
import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/ui/Toast'

export default function DashboardLayout() {
  const [currentFile, setCurrentFile] = useState<FileData | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [showMetrics, setShowMetrics] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'code'|'summary'|'metrics'|'comments'|'history'>('code')
  const [showSaveToast, setShowSaveToast] = useState(false)
  const { toasts, add: addToast, remove: removeToast } = useToast()

  useEffect(() => {
    // Load API key if available
    const savedApiKey = localStorage.getItem('llm-api-key')
    if (savedApiKey) {
      apiClient.setApiKey(savedApiKey)
    }
    // load history
    try {
      const raw = localStorage.getItem('analysis-history')
      if (raw) {
        const parsed = JSON.parse(raw)
        // parse timestamps into Date
        const fixed = (parsed || []).map((h: any) => ({ ...h, timestamp: h.timestamp ? new Date(h.timestamp) : new Date() }))
        setHistory(fixed)
      }
    } catch (e) {
      console.warn('could not load history', e)
    }
  }, [])

  const handleFileLoad = (content: string, name: string, size: number) => {
    const extension = getFileExtension(name)
    const language = getLanguageFromExtension(extension)

    const fileData: FileData = {
      name,
      content,
      size,
      language,
      lastModified: new Date()
    }

    setCurrentFile(fileData)
    setAnalysisResult(null)
    setShowMetrics(false)
  }

  // persist analysis to server history and local history (available to callbacks)
  const persistAnalysis = async (analysis: any) => {
    const base = apiClient.baseUrl || ''
    // ensure timestamp
    const withTs = { ...analysis, timestamp: (analysis.timestamp instanceof Date) ? analysis.timestamp.toISOString() : (analysis.timestamp || new Date().toISOString()) }
    // update local history first
    const newHist = [analysis, ...history].slice(0, 20)
    setHistory(newHist)
    const serial = newHist.map((h: any) => ({ ...h, timestamp: (h.timestamp instanceof Date) ? h.timestamp.toISOString() : h.timestamp }))
    try {
      localStorage.setItem('analysis-history', JSON.stringify(serial))
    } catch (e) {
      console.warn('could not persist local history', e)
    }

    // post to server and show toast/undo
    try {
      const res = await fetch(`${base}/api/v1/history`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(withTs) })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        addToast({ title: 'Save failed', description: body || 'Server rejected history save', variant: 'error' })
        return
      }
      // success toast with undo
      const lastId = addToast({ title: 'Saved analysis', description: 'Your analysis was saved to history', variant: 'success', undo: async () => {
        try {
          // remove locally
          setHistory((prev) => prev.filter((p) => p !== analysis))
          const after = (history || []).filter((p) => p !== analysis)
          const serialAfter = after.map((h: any) => ({ ...h, timestamp: (h.timestamp instanceof Date) ? h.timestamp.toISOString() : h.timestamp }))
          localStorage.setItem('analysis-history', JSON.stringify(serialAfter))
          // attempt server delete - best-effort: call DELETE /api/v1/history with body { timestamp }
          try {
            await fetch(`${base}/api/v1/history`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timestamp: withTs.timestamp }) })
          } catch (e) {
            console.warn('undo server delete failed', e)
          }
        } catch (e) {
          console.warn('undo failed', e)
        }
      }})
      // auto-remove handled by hook TTL
    } catch (e) {
      console.warn('could not post history to server', e)
      addToast({ title: 'Save failed', description: 'Could not reach server to save history', variant: 'error' })
    }
  }

  const handleCodeChange = (value: string) => {
    if (currentFile) {
      setCurrentFile({
        ...currentFile,
        content: value,
        lastModified: new Date()
      })
    }
  }

  const handleAnalyzeCode = async () => {
    if (!currentFile) return
    setIsAnalyzing(true)
    try {
      const fileToSend = new File(
        [currentFile.content],
        currentFile.name,
        { type: 'text/plain', lastModified: currentFile.lastModified?.getTime?.() ?? Date.now() }
      )

      // pick mode by presence of a stored API key
      const userApiKey = typeof window !== 'undefined' ? localStorage.getItem('llm-api-key') : null
      const useMode = userApiKey ? 'cloud' : 'local'

      const features = { summary: true, review: true, metrics: true, tags: true, docs: true }
      const res = await apiClient.analyzeCode(fileToSend, useMode, features)
      // Normalize response fields
      // Use the raw API response shape (AnalyzeResponse) so MetricsPanel receives comments/tags/docs/metrics directly
      const analysis: AnalyzeResponse = {
        summary: res.summary ?? null,
        summary_validation_errors: res.summary_validation_errors ?? null,
        summary_error: res.summary_error ?? null,
        metrics: res.metrics ?? null,
        metrics_error: res.metrics_error ?? null,
        comments: res.comments ?? null,
        comments_validation_errors: res.comments_validation_errors ?? null,
        comments_error: res.comments_error ?? null,
        comments_raw: res.comments_raw ?? null,
  tags: res.tags ?? null,
  tags_validation_errors: res.tags_validation_errors ?? null,
  tags_error: res.tags_error ?? null,
  docs: res.docs ?? null,
  docs_validation_errors: res.docs_validation_errors ?? null,
  docs_error: res.docs_error ?? null,
        llm_disabled: res.llm_disabled ?? null,
        llm_disabled_reason: res.llm_disabled_reason ?? null,
        llm_retry_after_seconds: res.llm_retry_after_seconds ?? null,
        llm_disabled_key_source: res.llm_disabled_key_source ?? null,
      }
      // attach timestamp for UI/history
      const analysisWithTs = { ...analysis, timestamp: new Date() }
      // cast to any because AnalyzeResponse doesn't declare timestamp
      setAnalysisResult(analysisWithTs as any)
      setShowMetrics(true)
  // switch to summary view when analysis completes
  setActiveTab('summary')

      // persist to history (keep last 20)
      try {
        const newHist = [analysisWithTs, ...history].slice(0, 20)
        setHistory(newHist)
        // serialize dates
        const serial = newHist.map((h: any) => ({ ...h, timestamp: (h.timestamp instanceof Date) ? h.timestamp.toISOString() : h.timestamp }))
        localStorage.setItem('analysis-history', JSON.stringify(serial))
        // attempt to post to server history
        try {
          const base = apiClient.baseUrl || ''
          await fetch(`${base}/api/v1/history`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(analysis) })
        } catch (e) {
          console.warn('could not post history to server', e)
        }
      } catch (e) {
        console.warn('could not save history', e)
      }
    } catch (err) {
      console.error('Analysis failed', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSaveFile = () => {
    if (!currentFile) return

    setIsSaving(true)
    // Simulate save
    setTimeout(() => {
      const blob = new Blob([currentFile.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = currentFile.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setIsSaving(false)
    }, 500)
  }

  const downloadBlob = async (res: Response, defaultName: string) => {
    const blob = await res.blob()
    // attempt to get filename from Content-Disposition
    const cd = res.headers.get('Content-Disposition') || ''
    let filename = defaultName
    const m = cd.match(/filename="?([^";]+)"?/)
    if (m && m[1]) filename = m[1]
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const handleExport = async (format: 'json' | 'sarif') => {
    if (!analysisResult) return
    try {
      const payload = {
        filename: currentFile?.name?.replace(/\.[^.]+$/, '') ?? 'analysis',
        format,
        comments: analysisResult?.comments ?? [],
        metrics: analysisResult?.metrics ?? {},
        tags: analysisResult?.tags ?? [],
        summary: analysisResult?.summary ?? null
      }
      const base = apiClient.baseUrl || ''
      const res = await fetch(`${base}/api/v1/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('Export failed', body)
        return
      }
      await downloadBlob(res, `${payload.filename}.${format === 'sarif' ? 'sarif.json' : 'json'}`)
    } catch (err) {
      console.error('Export error', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <div className="h-6 border-l border-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900">Code Review Dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMetrics(!showMetrics)}
              disabled={!currentFile}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {showMetrics ? 'Hide' : 'Show'} Metrics
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveFile}
              disabled={!currentFile}
              loading={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save File
            </Button>
            <div className="flex items-center gap-2">
              <button onClick={async () => {
                try {
                  const base = apiClient.baseUrl || ''
                  const r = await fetch(`${base}/api/v1/history`)
                  if (!r.ok) return
                  const data = await r.json()
                  const items = (data.items || []).map((h: any) => ({ ...h, timestamp: h.timestamp ? new Date(h.timestamp) : new Date() }))
                  setHistory(items)
                  // if history contains at least one item, load the most recent into the UI
                  if (items.length > 0) {
                    setAnalysisResult(items[0])
                    setShowMetrics(true)
                  }
                } catch (e) {
                  console.error('fetch history', e)
                }
              }} className="px-3 py-1 bg-gray-200 rounded">Load Server History</button>

              <button onClick={async () => {
                try {
                  const base = apiClient.baseUrl || ''
                  const r = await fetch(`${base}/api/v1/history`, { method: 'DELETE' })
                  if (r.ok) setHistory([])
                } catch (e) { console.error('clear history', e) }
              }} className="px-3 py-1 bg-red-100 rounded">Clear Server History</button>

              <button onClick={async () => {
                try {
                  // load the static example JSON from public/ for quick local testing
                  const r = await fetch('/example_analysis.json')
                  if (!r.ok) return
                  const example = await r.json()
                  // ensure timestamp exists for history UI
                  example.timestamp = example.timestamp ? new Date(example.timestamp) : new Date()
                  setAnalysisResult(example)
                  setShowMetrics(true)
                } catch (e) {
                  console.error('load example analysis', e)
                }
              }} className="px-3 py-1 bg-green-100 rounded">Load Example</button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                File Upload
              </h2>
              <FileUpload onFileLoad={handleFileLoad} />
            </Card>

            {currentFile && (
              <Card className="p-6">
                <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  File Info
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">NAME</div>
                    <div className="text-sm text-gray-900 truncate">{currentFile.name}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">LANGUAGE</div>
                    <div className="text-sm text-gray-900 capitalize">{currentFile.language}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">SIZE</div>
                    <div className="text-sm text-gray-900">{(currentFile.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>

                <Button 
                  onClick={handleAnalyzeCode}
                  className="w-full mt-6"
                  loading={isAnalyzing}
                  disabled={!currentFile.content.trim()}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Code'}
                </Button>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            <div className="grid grid-cols-1 gap-6">
              {/* Tab bar */}
              <Card className="overflow-hidden">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                  <div className="border-b border-gray-200 px-6 py-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        {currentFile ? currentFile.name : 'No file selected'}
                      </h2>
                      <div className="hidden sm:flex items-center gap-2">
                        <TabsList>
                          <TabsTrigger value="code">Code Editor</TabsTrigger>
                          <TabsTrigger value="summary">Summary</TabsTrigger>
                          <TabsTrigger value="metrics">Metrics</TabsTrigger>
                          <TabsTrigger value="comments">Comments {analysisResult?.comments?.length ? <span className="ml-1 text-xs px-2 py-0.5 bg-gray-100 rounded">{analysisResult.comments.length}</span> : null}</TabsTrigger>
                          <TabsTrigger value="history">History</TabsTrigger>
                        </TabsList>
                      </div>
                      <div className="sm:hidden">
                        <select value={activeTab} onChange={(e) => setActiveTab(e.target.value as any)} className="border rounded px-2 py-1 text-sm">
                          <option value="code">Code Editor</option>
                          <option value="summary">Summary</option>
                          <option value="metrics">Metrics</option>
                          <option value="comments">Comments</option>
                          <option value="history">History</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Toasts */}
                    <ToastContainer toasts={toasts} onRemove={(id: string) => removeToast(id)} />

                    {activeTab === 'code' && (
                      <TabsContent value="code">
                        <div className="h-[600px]">
                          <CodeEditor 
                            value={currentFile?.content || ''} 
                            onChange={handleCodeChange}
                            language={currentFile?.language || 'javascript'}
                          />
                        </div>
                      </TabsContent>
                    )}

                    {activeTab === 'summary' && (
                      <TabsContent value="summary">
                        {analysisResult ? (
                          <SummaryCard analysis={analysisResult} />
                        ) : (
                          <div className="text-sm text-gray-500">Run analysis to see summary</div>
                        )}
                      </TabsContent>
                    )}

                    {activeTab === 'metrics' && (
                      <TabsContent value="metrics">
                        {analysisResult ? (
                          <MetricsView analysis={analysisResult} history={history} onLoadHistory={(item: any) => { setAnalysisResult(item); setShowMetrics(true) }} />
                        ) : (
                          <div className="text-sm text-gray-500">Run analysis to see metrics</div>
                        )}
                      </TabsContent>
                    )}

                    {activeTab === 'comments' && (
                      <TabsContent value="comments">
                        {analysisResult ? (
                          <CommentsView analysis={analysisResult} onCommentsUpdate={(updatedComments) => { setAnalysisResult((prev: any) => ({ ...prev, issues: updatedComments, comments: updatedComments })); persistAnalysis({ ...analysisResult, comments: updatedComments }) }} />
                        ) : (
                          <div className="text-sm text-gray-500">Run analysis to see comments</div>
                        )}
                      </TabsContent>
                    )}

                    {activeTab === 'history' && (
                      <TabsContent value="history">
                        <h3 className="text-lg font-semibold">History</h3>
                        <div className="mt-3 space-y-2">
                          {(history || []).length === 0 ? <div className="text-sm text-gray-500">No history</div> :
                            (history || []).map((h, i) => (
                              <div key={i} className="flex items-center justify-between p-2 border rounded bg-white">
                                <div className="text-sm">{new Date(h.timestamp).toLocaleString()}</div>
                                <div className="flex gap-2">
                                  <button onClick={() => { setAnalysisResult(h); setActiveTab('summary'); setShowMetrics(true) }} className="px-2 py-1 bg-gray-100 rounded text-sm">Load</button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </TabsContent>
                    )}
                  </div>
                </Tabs>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
