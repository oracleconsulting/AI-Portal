'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft,
  ClipboardCheck,
  Loader2,
  CheckCircle,
  Plus,
  Trash2,
} from 'lucide-react'
import type { IdentificationForm, ReviewRecommendation, ReviewType, TimeSaving } from '@/types/database'

const REVIEW_TYPES: { value: ReviewType; label: string }[] = [
  { value: '30_day', label: '30 Day Review' },
  { value: '90_day', label: '90 Day Review' },
  { value: '180_day', label: '180 Day Review' },
  { value: '365_day', label: 'Annual Review' },
  { value: 'ad_hoc', label: 'Ad-hoc Review' },
]

const RECOMMENDATIONS: { value: ReviewRecommendation; label: string; description: string }[] = [
  { value: 'continue', label: 'Continue', description: 'Proceed as planned' },
  { value: 'expand', label: 'Expand', description: 'Increase scope or adoption' },
  { value: 'modify', label: 'Modify', description: 'Make changes before continuing' },
  { value: 'pause', label: 'Pause', description: 'Temporarily halt implementation' },
  { value: 'discontinue', label: 'Discontinue', description: 'Stop and evaluate alternatives' },
]

const STAFF_LEVELS = [
  { value: 'admin', label: 'Admin' },
  { value: 'junior', label: 'Junior' },
  { value: 'senior', label: 'Senior' },
  { value: 'assistant_manager', label: 'Assistant Manager' },
  { value: 'manager', label: 'Manager' },
  { value: 'director', label: 'Director' },
  { value: 'partner', label: 'Partner' },
]

const STAFF_RATES: Record<string, number> = {
  admin: 80,
  junior: 100,
  senior: 120,
  assistant_manager: 150,
  manager: 175,
  director: 250,
  partner: 400,
}

export default function NewReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [forms, setForms] = useState<IdentificationForm[]>([])
  const [selectedForm, setSelectedForm] = useState<IdentificationForm | null>(null)

  const [formData, setFormData] = useState({
    form_id: searchParams.get('form_id') || '',
    review_type: '30_day' as ReviewType,
    review_date: new Date().toISOString().split('T')[0],
    actual_cost: '',
    user_satisfaction_score: '',
    adoption_rate_percentage: '',
    quality_impact: 'unchanged' as 'improved' | 'unchanged' | 'declined',
    challenges_encountered: '',
    unexpected_benefits: '',
    lessons_learned: '',
    recommendation: 'continue' as ReviewRecommendation,
    recommendation_notes: '',
    next_review_date: '',
  })

  const [timeSavingsEntries, setTimeSavingsEntries] = useState<
    { staff_level: string; hours_per_week: string }[]
  >([{ staff_level: '', hours_per_week: '' }])

  useEffect(() => {
    fetchForms()
  }, [])

  useEffect(() => {
    if (formData.form_id) {
      const form = forms.find(f => f.id === formData.form_id)
      setSelectedForm(form || null)
      
      // Pre-populate time savings from the original form
      if (form?.time_savings) {
        const ts = form.time_savings as TimeSaving[]
        if (ts.length > 0) {
          setTimeSavingsEntries(ts.map(t => ({
            staff_level: t.staff_level,
            hours_per_week: t.hours_per_week.toString(),
          })))
        }
      }
    }
  }, [formData.form_id, forms])

  const fetchForms = async () => {
    const { data } = await supabase
      .from('identification_forms')
      .select('*')
      .in('status', ['in_progress', 'completed'])
      .order('created_at', { ascending: false })

    setForms(data || [])
    
    // If we have a form_id in the URL, find and select it
    const urlFormId = searchParams.get('form_id')
    if (urlFormId && data) {
      const form = data.find((f: IdentificationForm) => f.id === urlFormId)
      if (form) setSelectedForm(form)
    }
  }

  const calculateActualAnnualValue = () => {
    return timeSavingsEntries.reduce((sum, entry) => {
      const hours = parseFloat(entry.hours_per_week) || 0
      const rate = STAFF_RATES[entry.staff_level] || 0
      return sum + (hours * rate * 52)
    }, 0)
  }

  const calculateProjectedAnnualValue = () => {
    if (!selectedForm?.time_savings) return 0
    const ts = selectedForm.time_savings as TimeSaving[]
    return ts.reduce((sum, entry) => {
      const rate = STAFF_RATES[entry.staff_level] || 0
      return sum + (entry.hours_per_week * rate * 52)
    }, 0)
  }

  const calculateVariance = () => {
    const projected = calculateProjectedAnnualValue()
    const actual = calculateActualAnnualValue()
    if (projected === 0) return 0
    return ((actual - projected) / projected) * 100
  }

  const calculateROI = () => {
    const actualValue = calculateActualAnnualValue()
    const cost = parseFloat(formData.actual_cost) || selectedForm?.cost_of_solution || 0
    if (cost === 0) return 0
    return (actualValue / cost) * 100
  }

  const handleTimeSavingsChange = (index: number, field: string, value: string) => {
    const newEntries = [...timeSavingsEntries]
    newEntries[index] = { ...newEntries[index], [field]: value }
    setTimeSavingsEntries(newEntries)
  }

  const addTimeSavingsEntry = () => {
    setTimeSavingsEntries([...timeSavingsEntries, { staff_level: '', hours_per_week: '' }])
  }

  const removeTimeSavingsEntry = (index: number) => {
    setTimeSavingsEntries(timeSavingsEntries.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to create a review')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const actualTimeSaved = timeSavingsEntries
        .filter(e => e.staff_level && parseFloat(e.hours_per_week) > 0)
        .map(e => ({
          staff_level: e.staff_level,
          hours_per_week: parseFloat(e.hours_per_week),
        }))

      const actualWeeklyHours = actualTimeSaved.reduce((sum, t) => sum + t.hours_per_week, 0)
      const actualAnnualValue = calculateActualAnnualValue()
      const projectedAnnualValue = calculateProjectedAnnualValue()
      const variance = calculateVariance()
      const roi = calculateROI()

      const { error: insertError } = await supabase
        .from('implementation_reviews')
        .insert({
          form_id: formData.form_id,
          review_type: formData.review_type,
          review_date: formData.review_date,
          actual_time_saved: actualTimeSaved,
          actual_weekly_hours: actualWeeklyHours,
          actual_annual_value: actualAnnualValue,
          actual_cost: formData.actual_cost ? parseFloat(formData.actual_cost) : null,
          actual_roi: roi,
          projected_annual_value: projectedAnnualValue,
          projected_cost: selectedForm?.cost_of_solution || null,
          variance_percentage: variance,
          user_satisfaction_score: formData.user_satisfaction_score 
            ? parseInt(formData.user_satisfaction_score) 
            : null,
          adoption_rate_percentage: formData.adoption_rate_percentage
            ? parseInt(formData.adoption_rate_percentage)
            : null,
          quality_impact: formData.quality_impact,
          challenges_encountered: formData.challenges_encountered || null,
          unexpected_benefits: formData.unexpected_benefits || null,
          lessons_learned: formData.lessons_learned || null,
          recommendation: formData.recommendation,
          recommendation_notes: formData.recommendation_notes || null,
          next_review_date: formData.next_review_date || null,
          reviewed_by: user.id,
          reviewed_by_name: profile?.full_name || user.email,
        })

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        router.push('/implementation/reviews')
      }, 1500)
    } catch (err) {
      console.error('Error creating review:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-surface-900 mb-2">
            Review Submitted
          </h2>
          <p className="text-surface-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/implementation/reviews"
          className="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reviews
        </Link>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl gradient-implementation">
            <ClipboardCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">
              New Implementation Review
            </h1>
            <p className="text-surface-600">
              Track actual outcomes vs projected for ROI validation
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Select Form */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">
            Select Implementation
          </h2>
          <select
            value={formData.form_id}
            onChange={(e) => setFormData({ ...formData, form_id: e.target.value })}
            className="input-field"
            required
          >
            <option value="">Select a form to review...</option>
            {forms.map((form) => (
              <option key={form.id} value={form.id}>
                {form.problem_identified.slice(0, 80)}...
              </option>
            ))}
          </select>

          {selectedForm && (
            <div className="mt-4 p-4 bg-surface-50 rounded-xl">
              <h4 className="font-medium text-surface-900 mb-2">{selectedForm.problem_identified}</h4>
              <p className="text-sm text-surface-600 mb-2">{selectedForm.solution}</p>
              <div className="flex gap-4 text-sm">
                <span className="text-surface-500">
                  Projected Cost: <strong>£{selectedForm.cost_of_solution?.toLocaleString() || 'N/A'}</strong>
                </span>
                <span className="text-surface-500">
                  Projected Value: <strong>£{calculateProjectedAnnualValue().toLocaleString()}/year</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Review Details */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">
            Review Details
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Review Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.review_type}
                onChange={(e) => setFormData({ ...formData, review_type: e.target.value as ReviewType })}
                className="input-field"
                required
              >
                {REVIEW_TYPES.map((rt) => (
                  <option key={rt.value} value={rt.value}>{rt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Review Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.review_date}
                onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </div>
        </div>

        {/* Actual Outcomes */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">
            Actual Outcomes
          </h2>
          
          {/* Actual Time Savings */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-surface-700 mb-2">
              Actual Time Saved per Week
            </label>
            <div className="space-y-3">
              {timeSavingsEntries.map((entry, index) => (
                <div key={index} className="flex items-center gap-3">
                  <select
                    value={entry.staff_level}
                    onChange={(e) => handleTimeSavingsChange(index, 'staff_level', e.target.value)}
                    className="input-field flex-1"
                  >
                    <option value="">Select staff level</option>
                    {STAFF_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label} (£{STAFF_RATES[level.value]}/hr)
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Hours/week"
                    value={entry.hours_per_week}
                    onChange={(e) => handleTimeSavingsChange(index, 'hours_per_week', e.target.value)}
                    className="input-field w-32"
                  />
                  {timeSavingsEntries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTimeSavingsEntry(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addTimeSavingsEntry}
                className="flex items-center gap-2 text-sm text-implementation-600 hover:text-implementation-700"
              >
                <Plus className="w-4 h-4" />
                Add another staff level
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Actual Cost (if different from projected)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.actual_cost}
                onChange={(e) => setFormData({ ...formData, actual_cost: e.target.value })}
                className="input-field"
                placeholder={selectedForm?.cost_of_solution?.toString() || '0.00'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                User Satisfaction (1-5)
              </label>
              <select
                value={formData.user_satisfaction_score}
                onChange={(e) => setFormData({ ...formData, user_satisfaction_score: e.target.value })}
                className="input-field"
              >
                <option value="">Select...</option>
                <option value="1">1 - Very Dissatisfied</option>
                <option value="2">2 - Dissatisfied</option>
                <option value="3">3 - Neutral</option>
                <option value="4">4 - Satisfied</option>
                <option value="5">5 - Very Satisfied</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Adoption Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.adoption_rate_percentage}
                onChange={(e) => setFormData({ ...formData, adoption_rate_percentage: e.target.value })}
                className="input-field"
                placeholder="e.g., 75"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Quality Impact
              </label>
              <select
                value={formData.quality_impact}
                onChange={(e) => setFormData({ ...formData, quality_impact: e.target.value as any })}
                className="input-field"
              >
                <option value="improved">Improved</option>
                <option value="unchanged">Unchanged</option>
                <option value="declined">Declined</option>
              </select>
            </div>
          </div>

          {/* Calculated Values */}
          <div className="mt-6 p-4 bg-surface-50 rounded-xl grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-surface-500">Actual Annual Value</p>
              <p className="text-xl font-bold text-surface-900">
                £{calculateActualAnnualValue().toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-surface-500">Variance</p>
              <p className={`text-xl font-bold ${calculateVariance() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {calculateVariance() >= 0 ? '+' : ''}{calculateVariance().toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-surface-500">Actual ROI</p>
              <p className="text-xl font-bold text-implementation-600">
                {calculateROI().toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        {/* Qualitative Assessment */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">
            Qualitative Assessment
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Challenges Encountered
              </label>
              <textarea
                value={formData.challenges_encountered}
                onChange={(e) => setFormData({ ...formData, challenges_encountered: e.target.value })}
                className="input-field min-h-[80px]"
                placeholder="What obstacles or issues arose during implementation?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Unexpected Benefits
              </label>
              <textarea
                value={formData.unexpected_benefits}
                onChange={(e) => setFormData({ ...formData, unexpected_benefits: e.target.value })}
                className="input-field min-h-[80px]"
                placeholder="Any positive outcomes that weren't anticipated?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Lessons Learned
              </label>
              <textarea
                value={formData.lessons_learned}
                onChange={(e) => setFormData({ ...formData, lessons_learned: e.target.value })}
                className="input-field min-h-[80px]"
                placeholder="Key takeaways for future implementations..."
              />
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">
            Recommendation
          </h2>
          <div className="grid grid-cols-5 gap-3 mb-4">
            {RECOMMENDATIONS.map((rec) => (
              <button
                key={rec.value}
                type="button"
                onClick={() => setFormData({ ...formData, recommendation: rec.value })}
                className={`p-3 rounded-xl border text-center transition-all ${
                  formData.recommendation === rec.value
                    ? 'border-implementation-500 bg-implementation-50 text-implementation-700'
                    : 'border-surface-200 hover:border-surface-300'
                }`}
              >
                <p className="font-medium text-sm">{rec.label}</p>
                <p className="text-xs text-surface-500 mt-1">{rec.description}</p>
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">
              Recommendation Notes
            </label>
            <textarea
              value={formData.recommendation_notes}
              onChange={(e) => setFormData({ ...formData, recommendation_notes: e.target.value })}
              className="input-field min-h-[80px]"
              placeholder="Explain your recommendation..."
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-surface-700 mb-2">
              Next Review Date
            </label>
            <input
              type="date"
              value={formData.next_review_date}
              onChange={(e) => setFormData({ ...formData, next_review_date: e.target.value })}
              className="input-field max-w-xs"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/implementation/reviews" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !formData.form_id}
            className="btn-primary flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

