'use client'

import { useRef, useEffect } from 'react'
import Editor, { Monaco } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  readOnly?: boolean
  theme?: 'light' | 'dark'
}

export default function CodeEditor({ 
  value, 
  onChange, 
  language, 
  readOnly = false, 
  theme = 'light' 
}: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>()

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
      lineHeight: 1.6,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: false,
      renderWhitespace: 'boundary',
      renderControlCharacters: true,
      renderLineHighlight: 'gutter',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      mouseWheelZoom: true,
    })

    // Add custom themes
    monaco.editor.defineTheme('professional-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
        { token: 'keyword', foreground: '0969da', fontStyle: 'bold' },
        { token: 'string', foreground: '032f62' },
        { token: 'number', foreground: '0550ae' },
        { token: 'type', foreground: '8250df' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#24292f',
        'editor.lineHighlightBackground': '#f6f8fa',
        'editor.selectionBackground': '#0969da26',
        'editorCursor.foreground': '#0969da',
        'editorWhitespace.foreground': '#afb8c133',
      }
    })

    monaco.editor.defineTheme('professional-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
        { token: 'keyword', foreground: '79c0ff', fontStyle: 'bold' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'type', foreground: 'ffa657' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#f0f6fc',
        'editor.lineHighlightBackground': '#21262d',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#79c0ff',
        'editorWhitespace.foreground': '#484f58',
      }
    })

    // Set theme
    monaco.editor.setTheme(theme === 'dark' ? 'professional-dark' : 'professional-light')

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Prevent default save behavior
      // Custom save logic could be added here
    })

    // Add context menu actions
    editor.addAction({
      id: 'format-document',
      label: 'Format Document',
      keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
      contextMenuGroupId: 'formatting',
      contextMenuOrder: 1,
      run: () => {
        editor.trigger('', 'editor.action.formatDocument', {})
      }
    })

    // Focus the editor
    editor.focus()
  }

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '')
  }

  // Get editor options based on language
  const getLanguageOptions = (lang: string) => {
    const options: monaco.editor.IStandaloneEditorConstructionOptions = {}

    switch (lang) {
      case 'typescript':
      case 'javascript':
        options.suggest = { showKeywords: true, showSnippets: true }
        break
      case 'python':
        options.tabSize = 4
        options.insertSpaces = true
        break
      case 'json':
        options.formatOnPaste = true
        options.formatOnType = true
        break
    }

    return options
  }

  return (
    <div className="h-full w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          ...getLanguageOptions(language),
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Loading editor...</span>
          </div>
        }
      />
    </div>
  )
}
