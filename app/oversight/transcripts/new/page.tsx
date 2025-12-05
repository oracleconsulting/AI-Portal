'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ActionItem } from '@/types/database'
import {
  ArrowLeft,
  FileStack,
  AlertCircle,
  Check,
  Loader2,
  Plus,
  X,
} from 'lucide-react'
import Link from 'next/link'

export default function NewTranscriptPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    meeting_date: new Date().toISOString().split('T')[0],
    transcript: '',
    summary: '',
  })

  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [newActionItem, setNewActionItem] = useState({
    description: '',
    assignee: '',
    due_date: '',
  })

  const addActionItem = () => {
    if (!newActionItem.description.trim()) return
    
    setActionItems([
      ...actionItems,
      {
        id: crypto.randomUUID(),
        description: newActionItem.description,
        assignee: newActionItem.assignee || null,
        due_date: newActionItem.due_date || null,
        completed: false,
      },
    ])
    setNewActionItem({ description: '', assignee: '', due_date: '' })
  }

  const removeActionItem = (id: string) => {
    setActionItems(actionItems.filter(item => item.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('You must be logged in to create a transcript')
        return
      }

      const { error: insertError } = await supabase
        .from('meeting_transcripts')
        .insert({
          title: formData.title,
          meeting_date: formData.meeting_date,
          transcript: formData.transcript,
          summary: formData.summary || null,
          action_items: actionItems.length > 0 ? actionItems : null,
          committee: 'oversight',
          created_by: user.id,
        })

      if (insertError) {
        setError(insertError.message)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/oversight/transcripts')
      }, 1500)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/oversight/transcripts" 
          className="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Transcripts
        </Link>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl gradient-oversight">
            <FileStack className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">
              New Meeting Transcript
            </h1>
            <p className="text-surface-600">
              Record meeting notes and generate action items
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3 text-green-700 animate-fade-in">
          <Check className="w-5 h-5" />
          <p>Transcript saved successfully! Redirecting...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700 animate-fade-in">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6 space-y-6">
          {/* Title and Date Row */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-surface-700 mb-2">
                Meeting Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                placeholder="e.g., Q1 Oversight Review Meeting"
                required
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-surface-700 mb-2">
                Meeting Date <span className="text-red-500">*</span>
              </label>
              <input
                id="date"
                type="date"
                value={formData.meeting_date}
                onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Transcript */}
          <div>
            <label htmlFor="transcript" className="block text-sm font-medium text-surface-700 mb-2">
              Meeting Transcript <span className="text-red-500">*</span>
            </label>
            <textarea
              id="transcript"
              value={formData.transcript}
              onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
              className="input-field min-h-[250px] resize-y font-mono text-sm"
              placeholder="Paste or type the meeting transcript here..."
              required
            />
          </div>

          {/* Summary */}
          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-surface-700 mb-2">
              Summary
            </label>
            <textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="input-field min-h-[100px] resize-y"
              placeholder="Key points and decisions from the meeting..."
            />
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">
            Action Items
          </h2>

          {/* Existing Action Items */}
          {actionItems.length > 0 && (
            <div className="space-y-3 mb-6">
              {actionItems.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center gap-4 p-4 rounded-xl bg-surface-50 border border-surface-100"
                >
                  <div className="flex-1">
                    <p className="font-medium text-surface-900">{item.description}</p>
                    <div className="flex items-center gap-4 text-sm text-surface-500 mt-1">
                      {item.assignee && <span>Assignee: {item.assignee}</span>}
                      {item.due_date && <span>Due: {item.due_date}</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeActionItem(item.id)}
                    className="p-2 text-surface-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Action Item */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <input
                type="text"
                value={newActionItem.description}
                onChange={(e) => setNewActionItem({ ...newActionItem, description: e.target.value })}
                className="input-field"
                placeholder="Action item description..."
              />
            </div>
            <div>
              <input
                type="text"
                value={newActionItem.assignee}
                onChange={(e) => setNewActionItem({ ...newActionItem, assignee: e.target.value })}
                className="input-field"
                placeholder="Assignee (optional)"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={newActionItem.due_date}
                onChange={(e) => setNewActionItem({ ...newActionItem, due_date: e.target.value })}
                className="input-field flex-1"
              />
              <button
                type="button"
                onClick={addActionItem}
                disabled={!newActionItem.description.trim()}
                className="btn-oversight px-4"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting || !formData.title || !formData.transcript}
            className="btn-oversight flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Transcript'
            )}
          </button>
          <Link href="/oversight/transcripts" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

