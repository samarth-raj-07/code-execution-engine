import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import axios from 'axios'

const LANGUAGES = ['python', 'javascript', 'cpp']

const DEFAULT_CODE = {
  python: 'name = input("Enter your name: ")\nprint(f"Hello, {name}!")',
  javascript: 'const lines = require("fs").readFileSync("/dev/stdin","utf8").trim().split("\\n");\nconsole.log("Hello, " + lines[0] + "!");',
  cpp: '#include<iostream>\nusing namespace std;\nint main(){\n  string name;\n  cin >> name;\n  cout << "Hello, " << name << "!" << endl;\n  return 0;\n}'
}

function HistoryPage({ onBack }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/submissions/history').then(res => {
      setHistory(res.data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-purple-400">⚡ Code Execution Engine</h1>
        <button
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-white transition-all"
        >
          ← Back to Editor
        </button>
      </div>

      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Submission History</h2>

        {loading && <div className="text-yellow-400 animate-pulse">Loading...</div>}

        {!loading && history.length === 0 && (
          <div className="text-gray-600">No submissions yet.</div>
        )}

        {!loading && history.length > 0 && (
          <div className="flex flex-col gap-3">
            {history.map(sub => (
              <div
                key={sub.id}
                className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono bg-gray-800 px-2 py-1 rounded text-purple-400">
                    {sub.language}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(sub.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {sub.execution_time && (
                    <span className="text-xs text-gray-500">
                      ⚡ {sub.execution_time}ms
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    sub.status === 'success' ? 'bg-green-900 text-green-400' :
                    sub.status === 'error' ? 'bg-red-900 text-red-400' :
                    'bg-yellow-900 text-yellow-400'
                  }`}>
                    {sub.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('editor')
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(DEFAULT_CODE['python'])
  const [stdin, setStdin] = useState('')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [executionTime, setExecutionTime] = useState(null)

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    setCode(DEFAULT_CODE[lang])
    setOutput('')
    setStatus('')
    setStdin('')
  }

  const handleSubmit = async () => {
    setLoading(true)
    setOutput('')
    setStatus('pending')
    setExecutionTime(null)

    try {
      const { data } = await axios.post('/api/submissions', { language, code, stdin })
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
      if (err.response?.status === 429) {
        setStatus('error')
        setOutput('Too many submissions. Please wait a minute.')
      } else {
        setStatus('error')
        setOutput('Failed to connect to server')
      }
      setLoading(false)
    }
  }

  if (page === 'history') {
    return <HistoryPage onBack={() => setPage('editor')} />
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-purple-400">⚡ Code Execution Engine</h1>
        <button
          onClick={() => setPage('history')}
          className="text-sm text-gray-400 hover:text-white transition-all"
        >
          📋 History
        </button>
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

          {/* Stdin Input */}
          <div className="border-t border-gray-800">
            <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-800">
              stdin / input
            </div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter program input here..."
              className="w-full bg-gray-900 text-gray-300 text-sm font-mono px-4 py-3 resize-none outline-none h-24"
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