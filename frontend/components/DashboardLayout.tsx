'use client'

import { useState, useEffect } from 'react'
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
import { FileData, AnalysisResult } from '@/types'
import { getLanguageFromExtension, getFileExtension } from '@/lib/utils'
import apiClient from '../lib/api'

export default function DashboardLayout() {
  const [currentFile, setCurrentFile] = useState<FileData | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
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
      const mode = userApiKey ? 'cloud' : 'local'

      const features = { summary: true, review: true, metrics: true, tags: true, docs: true }
      const analysis = await apiClient.analyzeCode(fileToSend, mode, features)

      const result = {
        metrics: {
          linesOfCode: currentFile.content.split('\n').length,
          complexity: analysis.complexity ?? 0,
          maintainability: analysis.maintainability ?? 0,
          testCoverage: analysis.testCoverage ?? 0,
          cc_avg: analysis.cc_avg,
          mi_avg: analysis.mi_avg,
          pylint_score: analysis.pylint_score,
          naming_quality: analysis.naming_quality,
          execution_time_estimate_ms: analysis.execution_time_estimate_ms,
          oop_compliance: analysis.oop_compliance,
          coding_standards: analysis.coding_standards
        },
        issues: analysis.issues ?? analysis.comments ?? [],
        suggestions: analysis.suggestions ?? [],
        summary: analysis.summary,
        tags: analysis.tags ?? [],
        docs: analysis.docs ?? [],
        timestamp: new Date()
      }

      setAnalysisResult(result)
      setShowMetrics(true)
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
                <MetricsPanel analysisResult={analysisResult} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
