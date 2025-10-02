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
