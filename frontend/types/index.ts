export interface FileData {
  name: string
  content: string
  size: number
  language: string
  lastModified: Date
}

export interface CodeMetrics {
  linesOfCode: number
  complexity: number
  maintainability: number
  testCoverage?: number
  duplicatedLines?: number
  cc_avg?: number
  mi_avg?: number
  pylint_score?: number
  naming_quality?: number
}

export interface CodeIssue {
  line: number
  column: number
  severity: 'error' | 'warning' | 'info'
  message: string
  rule: string
  suggestion?: string
}

export interface AnalysisResult {
  metrics: CodeMetrics
  issues: CodeIssue[]
  suggestions: string[]
  timestamp: Date
}

export interface FrontendAnalysis {
  metrics: Metrics
  issues: Comment[]
  suggestions?: string[]
  summary?: Summary | null
  tags?: string[]
  docs?: string[]
  summary_error?: string | null
  comments_error?: string | null
  tags_error?: string | null
  docs_error?: string | null
  // LLM disabled metadata (populated when backend falls back from LLM due to quota/errors)
  llm_disabled?: boolean | null
  llm_disabled_reason?: string | null
  llm_retry_after_seconds?: number | null
  llm_disabled_key_source?: string | null
  timestamp: Date
}

export interface UserSettings {
  apiKey?: string
  preferredLanguage: string
  theme: 'light' | 'dark'
  autoSave: boolean
}

export interface Project {
  id: string
  name: string
  files: FileData[]
  settings: UserSettings
  createdAt: Date
  updatedAt: Date
}

export type NavigationPage = 'welcome' | 'dashboard' | 'settings'

export interface AppState {
  currentPage: NavigationPage
  currentFile: FileData | null
  analysisResults: AnalysisResult[]
  settings: UserSettings
  isAnalyzing: boolean
  error: string | null
}

export interface Summary {
  summary: string
  key_points?: string[]
}

export interface Comment {
  line?: number | null
  column?: number | null
  severity?: 'error' | 'warning' | 'info'
  category?: string
  message: string
  suggestion?: string | null
}

export interface Metrics {
  cc_avg?: number
  mi_avg?: number
  pylint_score?: number
  naming_quality?: number
  execution_time_estimate_ms?: number
  oop_compliance?: number
  coding_standards?: number
  lines?: number
  func_count?: number
  class_count?: number
}

export interface AnalyzeResponse {
  summary?: Summary | null
  summary_validation_errors?: string[] | null
  summary_error?: string | null
  metrics?: Metrics | null
  metrics_error?: string | null
  comments?: Comment[] | null
  comments_validation_errors?: string[] | null
  comments_error?: string | null
  comments_raw?: string | null
  tags?: string[] | null
  tags_validation_errors?: string[] | null
  tags_error?: string | null
  docs?: string[] | null
  docs_validation_errors?: string[] | null
  docs_error?: string | null
  docs_raw?: string | null
  llm_disabled?: boolean | null
  llm_disabled_reason?: string | null
  llm_retry_after_seconds?: number | null
  llm_disabled_key_source?: string | null
}
