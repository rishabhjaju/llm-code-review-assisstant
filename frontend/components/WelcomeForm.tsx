'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Zap, Rocket, Code, Shield, Clock, Settings } from 'lucide-react'

export default function WelcomeForm({ onClose }: { onClose?: () => void }) {
  const [showApiModal, setShowApiModal] = useState(false)
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('llm-api-key') || ''
    return ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleTemporaryUse = () => {
    setIsLoading(true)
    setTimeout(() => {
      router.push('/dashboard')
      setIsLoading(false)
    }, 1000)
  }

  const handleLargeFileUse = () => {
    setShowApiModal(true)
  }

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('llm-api-key', apiKey)
      setShowApiModal(false)
      setIsLoading(true)
      setTimeout(() => {
        router.push('/dashboard')
        setIsLoading(false)
      }, 1000)
    }
  }

  const saveKey = () => {
    if (typeof window !== 'undefined') {
      if (apiKey && apiKey.trim().length > 0) {
        localStorage.setItem('llm-api-key', apiKey.trim())
      } else {
        localStorage.removeItem('llm-api-key')
      }
    }
    if (onClose) onClose()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Code className="h-4 w-4" />
            Professional Code Review
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Welcome
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Choose your code review experience and start analyzing your codebase with advanced LLM-powered insights
          </p>
        </div>

        {/* Main Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card hover className="p-8 group animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardContent>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-900">Temporary Use</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Quick code review for small files and snippets. Perfect for immediate analysis without setup.
                </p>
                <div className="space-y-2 mb-8">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    Instant access
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Shield className="h-4 w-4" />
                    No API key required
                  </div>
                </div>
                <Button 
                  onClick={handleTemporaryUse}
                  className="w-full"
                  loading={isLoading}
                  size="lg"
                >
                  Get Started
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card hover className="p-8 group animate-fade-in" style={{ animationDelay: '400ms' }}>
            <CardContent>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-900">Large File Processing</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Advanced analysis with your own API key. Unlimited file size and enhanced features.
                </p>
                <div className="space-y-2 mb-8">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Settings className="h-4 w-4" />
                    Full feature access
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Shield className="h-4 w-4" />
                    Your API key
                  </div>
                </div>
                <Button 
                  onClick={handleLargeFileUse}
                  variant="secondary"
                  className="w-full"
                  size="lg"
                >
                  Setup API Key
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
              <Code className="h-6 w-6 text-primary-600" />
            </div>
            <h4 className="font-semibold mb-2">Monaco Editor</h4>
            <p className="text-sm text-gray-600">Professional code editor with syntax highlighting</p>
          </div>
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
              <Shield className="h-6 w-6 text-primary-600" />
            </div>
            <h4 className="font-semibold mb-2">LLM Powered</h4>
            <p className="text-sm text-gray-600">Advanced AI analysis for comprehensive insights</p>
          </div>
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
              <Settings className="h-6 w-6 text-primary-600" />
            </div>
            <h4 className="font-semibold mb-2">Professional UI</h4>
            <p className="text-sm text-gray-600">Clean, modern interface built for developers</p>
          </div>
        </div>

        {/* API Key Modal */}
        <Modal
          isOpen={showApiModal}
          onClose={() => setShowApiModal(false)}
          title="Setup API Key"
          size="md"
        >
          <div className="space-y-6">
            <p className="text-gray-600">
              Enter your LLM API key to unlock advanced features and process large files.
            </p>

            <Input
              label="API Key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Supported Providers</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• OpenAI GPT-4/GPT-3.5</li>
                <li>• Anthropic Claude</li>
                <li>• Other OpenAI-compatible APIs</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowApiModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveApiKey}
                disabled={!apiKey.trim()}
                loading={isLoading}
                className="flex-1"
              >
                Save & Continue
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
