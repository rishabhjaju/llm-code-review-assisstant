'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatBytes } from '@/lib/utils'

interface FileUploadProps {
  onFileLoad: (content: string, name: string, size: number) => void
}

//using
export default function FileUpload({ onFileLoad }: FileUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateAndProcessFile = async (file: File) => {
    setUploadStatus('loading')
    setErrorMessage('')

    try {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB')
      }

      // Read file content
      const content = await file.text()

      // Validate content
      if (!content.trim()) {
        throw new Error('File appears to be empty')
      }

      onFileLoad(content, file.name, file.size)
      setUploadStatus('success')

      // Reset status after 3 seconds
      setTimeout(() => {
        setUploadStatus('idle')
      }, 3000)

    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to read file')
      setUploadStatus('error')

      // Reset error after 5 seconds
      setTimeout(() => {
        setUploadStatus('idle')
        setErrorMessage('')
      }, 5000)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      validateAndProcessFile(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)

    const file = event.dataTransfer.files[0]
    if (file) {
      validateAndProcessFile(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'loading': return 'border-blue-300 bg-blue-50'
      case 'success': return 'border-green-300 bg-green-50'
      case 'error': return 'border-red-300 bg-red-50'
      default: return isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'
    }
  }

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'loading': 
        return (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        )
      case 'success': 
        return <CheckCircle2 className="h-8 w-8 text-green-600" />
      case 'error': 
        return <AlertCircle className="h-8 w-8 text-red-600" />
      default: 
        return <Upload className={`h-8 w-8 ${isDragOver ? 'text-blue-600' : 'text-gray-400'}`} />
    }
  }

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'loading': return 'Processing file...'
      case 'success': return 'File loaded successfully!'
      case 'error': return errorMessage || 'Upload failed'
      default: 
        return isDragOver 
          ? 'Drop the file here...' 
          : 'Drag & drop a code file here'
    }
  }

  return (
    <div className="space-y-4">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${getStatusColor()}
          ${uploadStatus === 'loading' ? 'cursor-wait' : 'hover:border-blue-400 hover:bg-blue-50'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept=".js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.php,.rb,.go,.rs,.kt,.swift,.html,.css,.scss,.json,.xml,.yaml,.yml,.md,.sql,.sh"
          className="hidden"
          disabled={uploadStatus === 'loading'}
        />

        <div className="flex flex-col items-center space-y-3">
          {getStatusIcon()}

          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              {getStatusText()}
            </p>
            {uploadStatus === 'idle' && (
              <p className="text-xs text-gray-500">
                or click to select
              </p>
            )}
          </div>

          {uploadStatus === 'idle' && (
            <Button variant="outline" size="sm" disabled={uploadStatus === 'loading'}>
              <FileText className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          )}
        </div>
      </div>

      {/* Supported file types */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Supported Files</h4>
        <div className="flex flex-wrap gap-1">
          {[
            'JavaScript', 'TypeScript', 'Python', 'Java', 'C/C++', 
            'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'HTML/CSS', 'JSON'
          ].map((lang) => (
            <span key={lang} className="inline-block bg-white px-2 py-1 rounded text-xs text-gray-600 border">
              {lang}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">Max file size: 5MB</p>
      </div>
    </div>
  )
}
