export interface CodeAnalysis {
  cc_avg: number | undefined
  mi_avg: number | undefined
  pylint_score: number | undefined
  naming_quality: number | undefined
  complexity: number
  maintainability: number
  testCoverage: number
  issues: Issue[]
  suggestions: string[]

}

export interface Issue {
  line: number
  column: number
  severity: 'error' | 'warning' | 'info'
  message: string
  rule: string
}

export class ApiClient {
  baseUrl: string
  _apiKey?: string | null
  constructor(base = '') {
    // Prefer explicit constructor arg, then NEXT_PUBLIC_API_URL, then NEXT_PUBLIC_API_BASE
    const envBase = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || '').trim()
    let baseCandidate = base || envBase || ''
    // remove trailing slash to avoid double-slash when building endpoints
    if (baseCandidate.endsWith('/')) baseCandidate = baseCandidate.slice(0, -1)
    this.baseUrl = baseCandidate
  }

  setApiKey(key: string | null) {
    this._apiKey = key
    try {
      if (typeof window !== 'undefined') {
        if (key) localStorage.setItem('llm-api-key', key)
        else localStorage.removeItem('llm-api-key')
      }
    } catch (e) {
      // ignore
    }
  }

  async analyzeCode(file: File, mode: string, features: any) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mode', mode)
    formData.append('features', JSON.stringify(features))

    // include user-provided API key if present in localStorage
    let storedKey = null
    if (typeof window !== 'undefined') {
      storedKey = localStorage.getItem('llm-api-key')
    }
    if (storedKey) {
      formData.append('api_key', storedKey)
    }

    const res = await fetch(`${this.baseUrl}/api/v1/analyze`, {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.detail || 'Failed to analyze file')
    }
    return res.json()
  }
}
// Instantiate default ApiClient with an explicit base so client bundles point to backend.
// Use NEXT_PUBLIC_API_URL if available at build time, otherwise fall back to localhost:8000.
const DEFAULT_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')
export default new ApiClient(DEFAULT_BASE)
