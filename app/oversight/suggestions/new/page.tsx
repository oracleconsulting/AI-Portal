'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  MessageSquare,
  AlertCircle,
  Check,
  Loader2,
  Wallet,
  Lock,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'

type Category = 'cost' | 'security' | 'risk' | 'general'
type RiskLevel = 'low' | 'medium' | 'high'

export default function NewSuggestionPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    category: 'general' as Category,
    title: '',
    description: '',
    estimated_cost: '',
    risk_level: '' as RiskLevel | '',
  })

  const categories = [
    { value: 'cost', label: 'Cost', icon: Wallet, color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'security', label: 'Security', icon: Lock, color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'risk', label: 'Risk', icon: AlertTriangle, color: 'bg-red-100 text-red-700 border-red-200' },
    { value: 'general', label: 'General', icon: MessageSquare, color: 'bg-surface-100 text-surface-700 border-surface-200' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('You must be logged in to submit a suggestion')
        return
      }

      const { error: insertError } = await supabase
        .from('oversight_suggestions')
        .insert({
          category: formData.category,
          title: formData.title,
          description: formData.description,
          estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
          risk_level: formData.risk_level || null,
          status: 'pending',
          submitted_by: user.id,
        })

      if (insertError) {
        setError(insertError.message)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/oversight/suggestions')
      }, 1500)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/oversight/suggestions" 
          className="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Suggestions
        </Link>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl gradient-oversight">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">
              New Suggestion
            </h1>
            <p className="text-surface-600">
              Submit an idea or concern for oversight review
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3 text-green-700 animate-fade-in">
          <Check className="w-5 h-5" />
          <p>Suggestion submitted successfully! Redirecting...</p>
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
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-3">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value as Category })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.category === cat.value
                        ? `${cat.color} border-current`
                        : 'border-surface-200 hover:border-surface-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-2" />
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-surface-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="Brief title for your suggestion..."
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-surface-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field min-h-[150px] resize-y"
              placeholder="Provide details about your suggestion, including context and rationale..."
              required
            />
          </div>

          {/* Cost and Risk Row */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-surface-700 mb-2">
                Estimated Cost (£)
              </label>
              <input
                id="cost"
                type="number"
                min="0"
                step="100"
                value={formData.estimated_cost}
                onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                className="input-field"
                placeholder="e.g., 5000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Risk Level
              </label>
              <div className="flex gap-3">
                {(['low', 'medium', 'high'] as RiskLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, risk_level: formData.risk_level === level ? '' : level })}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                      formData.risk_level === level
                        ? level === 'low' ? 'bg-green-600 text-white'
                          : level === 'medium' ? 'bg-amber-500 text-white'
                          : 'bg-red-600 text-white'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting || !formData.title || !formData.description}
            className="btn-oversight flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Suggestion'
            )}
          </button>
          <Link href="/oversight/suggestions" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

