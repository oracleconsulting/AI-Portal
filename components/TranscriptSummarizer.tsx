'use client'

import { useState } from 'react'
import { Sparkles, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

interface Props {
  transcriptId?: string
  initialText?: string
  onSummaryGenerated?: (summary: string, actionItems: any[]) => void
}

export function TranscriptSummarizer({ transcriptId, initialText, onSummaryGenerated }: Props) {
  const [text, setText] = useState(initialText || '')
  const [summary, setSummary] = useState<string | null>(null)
  const [actionItems, setActionItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSummarize = async () => {
    if (!text.trim()) {
      setError('Please enter transcript text')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/summarize-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptId,
          transcriptText: text,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate summary')
      }

      const data = await response.json()
      setSummary(data.summary)
      setActionItems(data.actionItems || [])
      onSummaryGenerated?.(data.summary, data.actionItems)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary')
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Input */}
      <div>
        <label className="block text-sm font-medium text-surface-700 mb-2">
          Paste Transcript Text
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="input-field font-mono text-sm"
          placeholder="Paste your meeting transcript here..."
        />
        <div className="mt-2 flex justify-between items-center">
          <span className="text-sm text-surface-500">
            {text.length} characters
          </span>
          <button
            onClick={handleSummarize}
            disabled={loading || !text.trim()}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Summary
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Summary Output */}
      {summary && (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
          <h3 className="font-display text-lg font-bold text-surface-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            AI Summary
          </h3>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-surface-700">{summary}</div>
          </div>
        </div>
      )}

      {/* Action Items */}
      {actionItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
          <h3 className="font-display text-lg font-bold text-surface-900 mb-4">Extracted Action Items</h3>
          <div className="space-y-3">
            {actionItems.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-surface-50 rounded-lg"
              >
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  item.priority === 'high' ? 'bg-red-100 text-red-800' :
                  item.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                  'bg-surface-100 text-surface-800'
                }`}>
                  {item.priority || 'normal'}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-surface-900">{item.action}</p>
                  <div className="text-sm text-surface-500 mt-1">
                    {item.assignee && <span>Assignee: {item.assignee}</span>}
                    {item.due_date && <span className="ml-3">Due: {item.due_date}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

