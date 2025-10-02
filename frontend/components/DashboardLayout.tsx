'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FileUpload from '@/components/FileUpload'
import CodeEditor from '@/components/CodeEditor'
import MetricsPanel from '@/components/MetricsPanel'
import { Button } from '@/components/ui/button'
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
import { FileData, AnalysisResult, FrontendAnalysis } from '@/types'
import { getLanguageFromExtension, getFileExtension } from '@/lib/utils'
import apiClient from '../lib/api'

export default function DashboardLayout() {
  const [currentFile, setCurrentFile] = useState<FileData | null>(null)
  const [analysisResult, setAnalysisResult] = useState<FrontendAnalysis | null>(null)
  const [history, setHistory] = useState<FrontendAnalysis[]>([])
  const [showMetrics, setShowMetrics] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

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
      const metrics = res.metrics || {}
      // ensure structured summary object
      let summaryObj = null
      if (res.summary) {
        if (typeof res.summary === 'string') {
          summaryObj = { summary: res.summary, key_points: [] }
        } else if (typeof res.summary === 'object') {
          summaryObj = { summary: res.summary.summary ?? JSON.stringify(res.summary), key_points: res.summary.key_points ?? [] }
        } else {
          summaryObj = null
        }
      }

      const analysis: FrontendAnalysis = {
        metrics,
        issues: res.comments ?? res.issues ?? [],
        suggestions: res.suggestions ?? [],
        summary: summaryObj,
        tags: res.tags ?? [],
        docs: res.docs ?? [],
        summary_error: res.summary_error,
        comments_error: res.comments_error,
        tags_error: res.tags_error,
        docs_error: res.docs_error,
        timestamp: new Date(),
      }
      setAnalysisResult(analysis)
      setShowMetrics(true)

      // persist to history (keep last 20)
      try {
  const newHist = [analysis, ...history].slice(0, 20)
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
        comments: analysisResult.issues ?? [],
        metrics: analysisResult.metrics ?? {},
        tags: analysisResult.tags ?? [],
        summary: analysisResult.summary ?? null
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
              {/* Code Editor */}
              <Card className="overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {currentFile ? currentFile.name : 'No file selected'}
                  </h2>
                </div>
                <div className="h-[600px]">
                  <CodeEditor 
                    value={currentFile?.content || ''} 
                    onChange={handleCodeChange}
                    language={currentFile?.language || 'javascript'}
                  />
                </div>
              </Card>

              {/* Metrics Panel */}
              {showMetrics && analysisResult && (
                <MetricsPanel
                  analysis={analysisResult}
                  history={history}
                  onLoadHistory={(item: any) => {
                    // load historical analysis into UI
                    setAnalysisResult(item)
                    // optionally load file content if stored (not implemented)
                  }}
                  onCommentsUpdate={(updatedComments) => {
                    // persist edits into local UI state
                    setAnalysisResult((prev: any) => ({
                      ...prev,
                      issues: updatedComments,
                      comments: updatedComments
                    }))
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
