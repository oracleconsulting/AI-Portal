'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import type { PolicyCategory } from '@/types/database'

const CATEGORIES: { value: PolicyCategory; label: string; description: string }[] = [
  { value: 'acceptable_use', label: 'Acceptable Use', description: 'Guidelines for appropriate AI tool usage' },
  { value: 'security', label: 'Security', description: 'Security requirements and protocols' },
  { value: 'data_handling', label: 'Data Handling', description: 'Data classification and handling rules' },
  { value: 'procurement', label: 'Procurement', description: 'AI tool evaluation and purchasing' },
  { value: 'training', label: 'Training', description: 'Training requirements and materials' },
  { value: 'governance', label: 'Governance', description: 'Governance structure and responsibilities' },
  { value: 'compliance', label: 'Compliance', description: 'Regulatory compliance requirements' },
  { value: 'other', label: 'Other', description: 'Other policy types' },
]

interface FormData {
  policy_code: string
  title: string
  category: PolicyCategory
  summary: string
  content: string
  effective_from: string
  review_date: string
  applies_to_committees: string[]
}

export default function NewPolicyPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    policy_code: '',
    title: '',
    category: 'acceptable_use',
    summary: '',
    content: `# Policy Title

## Purpose
[Describe the purpose of this policy]

## Scope
This policy applies to:
- [List applicable groups]

## Policy Statement
[Main policy content]

## Responsibilities

### All Staff
- [Responsibility 1]
- [Responsibility 2]

### AI Committee
- [Responsibility 1]

## Compliance
[Compliance requirements and consequences]

## Review
This policy will be reviewed [annually/quarterly/as needed].

## Version History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | ${new Date().toISOString().split('T')[0]} | [Author] | Initial version |
`,
    effective_from: '',
    review_date: '',
    applies_to_committees: ['implementation', 'oversight'],
  })

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleCommittee = (committee: string) => {
    setFormData(prev => ({
      ...prev,
      applies_to_committees: prev.applies_to_committees.includes(committee)
        ? prev.applies_to_committees.filter(c => c !== committee)
        : [...prev.applies_to_committees, committee]
    }))
  }

  const handleSubmit = async (e: React.FormEvent, saveAsDraft: boolean = true) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in')
      setLoading(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('policy_documents')
      .insert({
        policy_code: formData.policy_code || null,
        title: formData.title,
        category: formData.category,
        summary: formData.summary || null,
        content: formData.content,
        version: '1.0',
        status: saveAsDraft ? 'draft' : 'pending_approval',
        effective_from: formData.effective_from || null,
        review_date: formData.review_date || null,
        applies_to_committees: formData.applies_to_committees,
        author: user.id,
        owner: user.id,
      })
      .select()
      .single()

    if (insertError) {
      setError('Failed to create policy: ' + insertError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push(`/oversight/policies/${data.id}`)
    }, 1500)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <Link 
          href="/oversight/policies" 
          className="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Policies
        </Link>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl gradient-oversight">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">Create New Policy</h1>
            <p className="text-surface-600">Create a new AI policy document</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3 text-green-700">
          <CheckCircle className="w-5 h-5" />
          Policy created successfully! Redirecting...
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Policy Information</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Policy Code
              </label>
              <input
                type="text"
                value={formData.policy_code}
                onChange={(e) => handleChange('policy_code', e.target.value)}
                placeholder="e.g., AI-POL-001"
                className="input-field"
              />
              <p className="text-xs text-surface-500 mt-1">Optional unique identifier</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
                className="input-field"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} - {cat.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-surface-700 mb-2">
              Policy Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
              placeholder="e.g., AI Acceptable Use Policy"
              className="input-field"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-surface-700 mb-2">
              Summary
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) => handleChange('summary', e.target.value)}
              rows={2}
              placeholder="Brief description of what this policy covers..."
              className="input-field"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Effective From
              </label>
              <input
                type="date"
                value={formData.effective_from}
                onChange={(e) => handleChange('effective_from', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Review Date
              </label>
              <input
                type="date"
                value={formData.review_date}
                onChange={(e) => handleChange('review_date', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-surface-700 mb-2">
              Applies To
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.applies_to_committees.includes('implementation')}
                  onChange={() => toggleCommittee('implementation')}
                  className="w-4 h-4 rounded border-surface-300 text-oversight-500 focus:ring-oversight-500"
                />
                <span className="ml-2 text-sm text-surface-700">Implementation Committee</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.applies_to_committees.includes('oversight')}
                  onChange={() => toggleCommittee('oversight')}
                  className="w-4 h-4 rounded border-surface-300 text-oversight-500 focus:ring-oversight-500"
                />
                <span className="ml-2 text-sm text-surface-700">Oversight Committee</span>
              </label>
            </div>
          </div>
        </div>

        {/* Policy Content */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Policy Content</h2>
          <p className="text-sm text-surface-500 mb-4">
            Write your policy content. You can use Markdown formatting (headers, lists, etc.).
          </p>
          
          <textarea
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            rows={20}
            className="input-field font-mono text-sm"
            placeholder="Policy content..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href="/oversight/policies"
            className="btn-secondary"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save as Draft'
            )}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e as any, false)}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit for Approval'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

