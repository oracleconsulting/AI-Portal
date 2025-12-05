'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Priority } from '@/types/database'
import {
  ArrowLeft,
  Lightbulb,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

export default function NewIdentificationForm() {
  const router = useRouter()
  const supabase = createClient()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    problem_identified: '',
    solution: '',
    cost_of_solution: '',
    time_saving_hours: '',
    time_saving_description: '',
    staff_level: '',
    priority: 'medium' as Priority,
    notes: '',
  })

  const STAFF_LEVELS = [
    { value: 'admin', label: 'Admin', rate: 80 },
    { value: 'junior', label: 'Junior', rate: 100 },
    { value: 'senior', label: 'Senior', rate: 120 },
    { value: 'assistant_manager', label: 'Assistant Manager', rate: 150 },
    { value: 'manager', label: 'Manager', rate: 175 },
    { value: 'director', label: 'Director', rate: 250 },
    { value: 'partner', label: 'Partner', rate: 400 },
  ]

  const selectedStaffRate = STAFF_LEVELS.find(s => s.value === formData.staff_level)?.rate || 0
  const estimatedWeeklyValue = formData.time_saving_hours && selectedStaffRate 
    ? parseFloat(formData.time_saving_hours) * selectedStaffRate 
    : 0
  const estimatedAnnualValue = estimatedWeeklyValue * 52

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('You must be logged in to submit a form')
        return
      }

      // Get user's name from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const { error: insertError } = await supabase
        .from('identification_forms')
        .insert({
          problem_identified: formData.problem_identified,
          solution: formData.solution || null,
          cost_of_solution: formData.cost_of_solution ? parseFloat(formData.cost_of_solution) : null,
          time_saving_hours: formData.time_saving_hours ? parseFloat(formData.time_saving_hours) : null,
          time_saving_description: formData.time_saving_description || null,
          staff_level: formData.staff_level || null,
          priority: formData.priority,
          status: isDraft ? 'draft' : 'submitted',
          submitted_by: user.id,
          submitted_by_name: profile?.full_name || user.email,
          notes: formData.notes || null,
        })

      if (insertError) {
        setError(insertError.message)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/implementation/forms')
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
          href="/implementation" 
          className="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl gradient-implementation">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">
              New AI Identification Form
            </h1>
            <p className="text-surface-600">
              Document a problem or opportunity for AI implementation
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3 text-green-700 animate-fade-in">
          <Check className="w-5 h-5" />
          <p>Form submitted successfully! Redirecting...</p>
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
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6 space-y-6">
          {/* Problem Identified */}
          <div>
            <label htmlFor="problem" className="block text-sm font-medium text-surface-700 mb-2">
              Problem Identified <span className="text-red-500">*</span>
            </label>
            <textarea
              id="problem"
              value={formData.problem_identified}
              onChange={(e) => setFormData({ ...formData, problem_identified: e.target.value })}
              className="input-field min-h-[120px] resize-y"
              placeholder="Describe the problem or bottleneck you've identified..."
              required
            />
            <p className="mt-2 text-sm text-surface-500">
              Be specific about the current process and its limitations.
            </p>
          </div>

          {/* Solution */}
          <div>
            <label htmlFor="solution" className="block text-sm font-medium text-surface-700 mb-2">
              Proposed Solution
            </label>
            <textarea
              id="solution"
              value={formData.solution}
              onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              className="input-field min-h-[100px] resize-y"
              placeholder="Describe a potential AI solution, or leave blank if one needs to be found..."
            />
          </div>

          {/* Cost and Time Saving Row */}
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-surface-700 mb-2">
                Estimated Cost (£)
              </label>
              <input
                id="cost"
                type="number"
                min="0"
                step="100"
                value={formData.cost_of_solution}
                onChange={(e) => setFormData({ ...formData, cost_of_solution: e.target.value })}
                className="input-field"
                placeholder="e.g., 5000"
              />
            </div>

            <div>
              <label htmlFor="time_saving" className="block text-sm font-medium text-surface-700 mb-2">
                Time Saving (hours/week)
              </label>
              <input
                id="time_saving"
                type="number"
                min="0"
                step="0.5"
                value={formData.time_saving_hours}
                onChange={(e) => setFormData({ ...formData, time_saving_hours: e.target.value })}
                className="input-field"
                placeholder="e.g., 10"
              />
            </div>

            <div>
              <label htmlFor="staff_level" className="block text-sm font-medium text-surface-700 mb-2">
                Staff Level Affected
              </label>
              <select
                id="staff_level"
                value={formData.staff_level}
                onChange={(e) => setFormData({ ...formData, staff_level: e.target.value })}
                className="input-field"
              >
                <option value="">Select level...</option>
                {STAFF_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label} (£{level.rate}/hr)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Value Calculator */}
          {estimatedAnnualValue > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Estimated Value</p>
                  <p className="text-xs text-green-600 mt-1">
                    {formData.time_saving_hours} hrs × £{selectedStaffRate}/hr × 52 weeks
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-700">
                    £{estimatedAnnualValue.toLocaleString()}/year
                  </p>
                  <p className="text-sm text-green-600">
                    £{estimatedWeeklyValue.toLocaleString()}/week
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Time Saving Description */}
          <div>
            <label htmlFor="time_desc" className="block text-sm font-medium text-surface-700 mb-2">
              Time Saving Details
            </label>
            <input
              id="time_desc"
              type="text"
              value={formData.time_saving_description}
              onChange={(e) => setFormData({ ...formData, time_saving_description: e.target.value })}
              className="input-field"
              placeholder="e.g., Saves 2 hours daily on data entry across 5 team members"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">
              Priority
            </label>
            <div className="flex gap-3">
              {(['low', 'medium', 'high', 'critical'] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p })}
                  className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                    formData.priority === p
                      ? p === 'low' ? 'bg-surface-600 text-white'
                        : p === 'medium' ? 'bg-blue-600 text-white'
                        : p === 'high' ? 'bg-amber-500 text-white'
                        : 'bg-red-600 text-white'
                      : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-surface-700 mb-2">
              Additional Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field min-h-[80px] resize-y"
              placeholder="Any other relevant information..."
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting || !formData.problem_identified}
            className="btn-primary flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Form'
            )}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={isSubmitting || !formData.problem_identified}
            className="btn-secondary"
          >
            Save as Draft
          </button>
          <Link href="/implementation" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

