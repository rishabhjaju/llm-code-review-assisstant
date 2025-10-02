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
  private apiKey: string | null

  constructor(baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl
    this.apiKey = null
  }

  setApiKey(key: string) {
    this.apiKey = key
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    return headers
  }

  async analyzeCode(file: File, mode: string, features: any) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mode', mode)
    formData.append('features', JSON.stringify(features))

    // include user-provided API key if present in localStorage
    const storedKey = typeof window !== 'undefined' ? localStorage.getItem('llm-api-key') : null
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

  async uploadFile(file: File): Promise<string> {
    // Simulate file upload
    await new Promise(resolve => setTimeout(resolve, 1000))
    return 'File uploaded successfully'
  }
}

export const apiClient = new ApiClient()
