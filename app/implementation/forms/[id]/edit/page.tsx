'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Priority } from '@/types/database'
import {
  ArrowLeft,
  Lightbulb,
  AlertCircle,
  Check,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'

const STAFF_LEVELS = [
  { value: 'admin', label: 'Admin', rate: 80 },
  { value: 'junior', label: 'Junior', rate: 100 },
  { value: 'senior', label: 'Senior', rate: 120 },
  { value: 'assistant_manager', label: 'Assistant Manager', rate: 150 },
  { value: 'manager', label: 'Manager', rate: 175 },
  { value: 'director', label: 'Director', rate: 250 },
  { value: 'partner', label: 'Partner', rate: 400 },
]

interface TimeSaving {
  staff_level: string
  hours_per_week: number
}

export default function EditFormPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const formId = params.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    problem_identified: '',
    solution: '',
    cost_of_solution: '',
    time_saving_description: '',
    priority: 'medium' as Priority,
    status: 'draft',
    notes: '',
  })

  const [timeSavings, setTimeSavings] = useState<TimeSaving[]>([
    { staff_level: '', hours_per_week: 0 }
  ])

  useEffect(() => {
    const fetchForm = async () => {
      const { data, error } = await supabase
        .from('identification_forms')
        .select('*')
        .eq('id', formId)
        .single()

      if (error || !data) {
        setError('Form not found')
        setIsLoading(false)
        return
      }

      setFormData({
        problem_identified: data.problem_identified || '',
        solution: data.solution || '',
        cost_of_solution: data.cost_of_solution?.toString() || '',
        time_saving_description: data.time_saving_description || '',
        priority: data.priority || 'medium',
        status: data.status || 'draft',
        notes: data.notes || '',
      })

      // Parse time_savings JSON or use legacy single field
      if (data.time_savings && Array.isArray(data.time_savings)) {
        setTimeSavings(data.time_savings)
      } else if (data.staff_level && data.time_saving_hours) {
        setTimeSavings([{ 
          staff_level: data.staff_level, 
          hours_per_week: data.time_saving_hours 
        }])
      }

      setIsLoading(false)
    }

    fetchForm()
  }, [formId, supabase])

  const addTimeSaving = () => {
    setTimeSavings([...timeSavings, { staff_level: '', hours_per_week: 0 }])
  }

  const removeTimeSaving = (index: number) => {
    setTimeSavings(timeSavings.filter((_, i) => i !== index))
  }

  const updateTimeSaving = (index: number, field: keyof TimeSaving, value: string | number) => {
    const updated = [...timeSavings]
    updated[index] = { ...updated[index], [field]: value }
    setTimeSavings(updated)
  }

  // Calculate totals
  const calculateTotals = () => {
    let totalWeeklyHours = 0
    let totalWeeklyValue = 0

    timeSavings.forEach(ts => {
      if (ts.staff_level && ts.hours_per_week) {
        const rate = STAFF_LEVELS.find(s => s.value === ts.staff_level)?.rate || 0
        totalWeeklyHours += ts.hours_per_week
        totalWeeklyValue += ts.hours_per_week * rate
      }
    })

    return {
      totalWeeklyHours,
      totalWeeklyValue,
      totalAnnualValue: totalWeeklyValue * 52
    }
  }

  const totals = calculateTotals()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Filter out empty time savings
      const validTimeSavings = timeSavings.filter(ts => ts.staff_level && ts.hours_per_week > 0)

      const { error: updateError } = await supabase
        .from('identification_forms')
        .update({
          problem_identified: formData.problem_identified,
          solution: formData.solution || null,
          cost_of_solution: formData.cost_of_solution ? parseFloat(formData.cost_of_solution) : null,
          time_saving_description: formData.time_saving_description || null,
          time_savings: validTimeSavings.length > 0 ? validTimeSavings : null,
          // Keep legacy fields for backwards compatibility
          time_saving_hours: validTimeSavings.reduce((sum, ts) => sum + ts.hours_per_week, 0) || null,
          staff_level: validTimeSavings[0]?.staff_level || null,
          priority: formData.priority,
          status: formData.status,
          notes: formData.notes || null,
        })
        .eq('id', formId)

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/implementation/forms/${formId}`)
      }, 1500)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-implementation-500" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href={`/implementation/forms/${formId}`}
          className="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Form
        </Link>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl gradient-implementation">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">
              Edit Identification Form
            </h1>
            <p className="text-surface-600">
              Update the details of this AI opportunity
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3 text-green-700 animate-fade-in">
          <Check className="w-5 h-5" />
          <p>Form updated successfully! Redirecting...</p>
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
              placeholder="Describe a potential AI solution..."
            />
          </div>

          {/* Cost */}
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
                value={formData.cost_of_solution}
                onChange={(e) => setFormData({ ...formData, cost_of_solution: e.target.value })}
                className="input-field"
                placeholder="e.g., 5000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field"
              >
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Time Savings Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-surface-700">
                Time Savings by Staff Level
              </label>
              <button
                type="button"
                onClick={addTimeSaving}
                className="inline-flex items-center gap-1 text-sm text-implementation-600 hover:text-implementation-700"
              >
                <Plus className="w-4 h-4" />
                Add Staff Level
              </button>
            </div>

            <div className="space-y-3">
              {timeSavings.map((ts, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <select
                      value={ts.staff_level}
                      onChange={(e) => updateTimeSaving(index, 'staff_level', e.target.value)}
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
                  <div className="w-32">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={ts.hours_per_week || ''}
                      onChange={(e) => updateTimeSaving(index, 'hours_per_week', parseFloat(e.target.value) || 0)}
                      className="input-field"
                      placeholder="hrs/wk"
                    />
                  </div>
                  <div className="w-24 py-3 text-right text-sm text-surface-600">
                    {ts.staff_level && ts.hours_per_week ? (
                      `£${(ts.hours_per_week * (STAFF_LEVELS.find(s => s.value === ts.staff_level)?.rate || 0)).toLocaleString()}/wk`
                    ) : '—'}
                  </div>
                  {timeSavings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTimeSaving(index)}
                      className="p-2 text-surface-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            {totals.totalWeeklyValue > 0 && (
              <div className="mt-4 bg-green-50 border border-green-100 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Total Estimated Value</p>
                    <p className="text-xs text-green-600 mt-1">
                      {totals.totalWeeklyHours} hrs/week across {timeSavings.filter(ts => ts.staff_level && ts.hours_per_week).length} staff level(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-700">
                      £{totals.totalAnnualValue.toLocaleString()}/year
                    </p>
                    <p className="text-sm text-green-600">
                      £{totals.totalWeeklyValue.toLocaleString()}/week
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

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
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
          <Link href={`/implementation/forms/${formId}`} className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

