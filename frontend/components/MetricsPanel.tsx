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
import React from 'react'

interface MetricsPanelProps {
  analysisResult: AnalysisResult
}

export default function MetricsPanel({ analysisResult }: MetricsPanelProps) {
  const { metrics, issues, suggestions, timestamp } = analysisResult

  // Prefer backend metrics if available, fallback to frontend
  const cyclomaticComplexity = metrics.cc_avg ?? metrics.complexity;
  const maintainabilityIndex = metrics.mi_avg ?? metrics.maintainability;
  const pylintScore = metrics.pylint_score ?? null;
  const namingQuality = metrics.naming_quality ?? null;

  const getSeverityIcon = (severity: CodeIssue['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getSeverityColor = (severity: CodeIssue['severity']) => {
    switch (severity) {
      case 'error': return 'border-red-200 bg-red-50'
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      case 'info': return 'border-blue-200 bg-blue-50'
    }
  }

  const getComplexityColor = (complexity: number) => {
    if (complexity <= 3) return 'text-green-600'
    if (complexity <= 7) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMaintainabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (!analysisResult) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Code Analysis Results
        </h2>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {timestamp.toLocaleString()}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lines of Code</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.linesOfCode ?? 'N/A'}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  Cyclomatic Complexity
                  {metrics.cc_avg !== undefined && <span className="ml-1 text-xs text-gray-400">(backend)</span>}
                  {metrics.cc_avg === undefined && metrics.complexity !== undefined && <span className="ml-1 text-xs text-gray-400">(frontend)</span>}
                </p>
                <p className={`text-2xl font-bold ${getComplexityColor(Number(cyclomaticComplexity))}`}>
                  {cyclomaticComplexity !== undefined ? cyclomaticComplexity.toFixed(2) : 'N/A'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  Maintainability Index
                  {metrics.mi_avg !== undefined && <span className="ml-1 text-xs text-gray-400">(backend)</span>}
                  {metrics.mi_avg === undefined && metrics.maintainability !== undefined && <span className="ml-1 text-xs text-gray-400">(frontend)</span>}
                </p>
                <p className={`text-2xl font-bold ${getMaintainabilityColor(Number(maintainabilityIndex))}`}>
                  {maintainabilityIndex !== undefined ? maintainabilityIndex.toFixed(2) : 'N/A'}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pylint Score {metrics.pylint_score !== undefined && <span className="ml-1 text-xs text-gray-400">(backend)</span>}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pylintScore !== null && pylintScore !== undefined ? pylintScore.toFixed(2) : 'N/A'}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Naming Quality {metrics.naming_quality !== undefined && <span className="ml-1 text-xs text-gray-400">(backend)</span>}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {namingQuality !== null && namingQuality !== undefined ? (namingQuality * 100).toFixed(1) + '%' : 'N/A'}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Test Coverage {metrics.testCoverage !== undefined && <span className="ml-1 text-xs text-gray-400">(frontend)</span>}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.testCoverage !== undefined ? `${metrics.testCoverage}%` : 'N/A'}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Issues */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Issues Found ({issues?.length})
            </h3>
          </CardHeader>
          <CardContent>
            {issues?.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {issues.map((issue, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {issue.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Line {issue.line}:{issue.column}</span>
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {issue.rule}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-500">No issues found in your code!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Suggestions */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Suggestions ({suggestions?.length})
            </h3>
          </CardHeader>
          <CardContent>
            {suggestions?.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <p className="text-sm text-blue-800">{suggestion}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-500">Your code looks great!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline">
          Export Report
        </Button>
        <Button variant="outline">
          Share Results
        </Button>
        <Button variant="outline">
          View History
        </Button>
      </div>
    </div>
  )
}
