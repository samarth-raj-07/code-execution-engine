import { useState } from 'react'
import Editor from '@monaco-editor/react'
import axios from 'axios'

const LANGUAGES = ['python', 'javascript', 'cpp']

const DEFAULT_CODE = {
  python: 'print("Hello, World!")',
  javascript: 'console.log("Hello, World!")',
  cpp: '#include<iostream>\nusing namespace std;\nint main(){\n  cout<<"Hello, World!"<<endl;\n  return 0;\n}'
}

export default function App() {
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(DEFAULT_CODE['python'])
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [executionTime, setExecutionTime] = useState(null)

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    setCode(DEFAULT_CODE[lang])
    setOutput('')
    setStatus('')
  }

  const handleSubmit = async () => {
    setLoading(true)
    setOutput('')
    setStatus('pending')
    setExecutionTime(null)

    try {
      const { data } = await axios.post('/api/submissions', { language, code })
      const id = data.id

      const poll = setInterval(async () => {
        const result = await axios.get(`/api/submissions/${id}`)
        const sub = result.data

        if (sub.status === 'success' || sub.status === 'error') {
          clearInterval(poll)
          setStatus(sub.status)
          setOutput(sub.output || sub.error || 'No output')
          setExecutionTime(sub.execution_time)
          setLoading(false)
        }
      }, 1000)

    } catch (err) {
      setStatus('error')
      setOutput('Failed to connect to server')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-purple-400">⚡ Code Execution Engine</h1>
        <span className="text-sm text-gray-500">Isolated Docker Sandbox</span>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Left Panel - Editor */}
        <div className="flex flex-col w-1/2 border-r border-gray-800">

          {/* Language Selector */}
          <div className="flex gap-2 px-4 py-3 border-b border-gray-800">
            {LANGUAGES.map(lang => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${
                  language === lang
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Monaco Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language}
              value={code}
              onChange={(val) => setCode(val || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16 }
              }}
            />
          </div>

          {/* Run Button */}
          <div className="px-4 py-3 border-t border-gray-800">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded font-medium transition-all"
            >
              {loading ? '⏳ Running...' : '▶ Run Code'}
            </button>
          </div>
        </div>

        {/* Right Panel - Output */}
        <div className="flex flex-col w-1/2">

          {/* Output Header */}
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Output</span>
            {status && (
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                status === 'success' ? 'bg-green-900 text-green-400' :
                status === 'error' ? 'bg-red-900 text-red-400' :
                'bg-yellow-900 text-yellow-400'
              }`}>
                {status}
              </span>
            )}
          </div>

          {/* Output Content */}
          <div className="flex-1 p-4 font-mono text-sm overflow-auto">
            {loading && (
              <div className="text-yellow-400 animate-pulse">
                ⏳ Executing in isolated container...
              </div>
            )}
            {!loading && output && (
              <pre className={`whitespace-pre-wrap ${
                status === 'error' ? 'text-red-400' : 'text-green-400'
              }`}>
                {output}
              </pre>
            )}
            {!loading && !output && (
              <div className="text-gray-600">
                Run your code to see output here...
              </div>
            )}
          </div>

          {/* Execution Time */}
          {executionTime && (
            <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-500">
              ⚡ Executed in {executionTime}ms
            </div>
          )}
        </div>
      </div>
    </div>
  )
}