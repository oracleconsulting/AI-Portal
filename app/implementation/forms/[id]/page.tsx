'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Lightbulb,
  Clock,
  PoundSterling,
  TrendingUp,
  Calendar,
  User,
  AlertCircle,
  Loader2,
  Edit,
  CheckCircle,
  XCircle,
  Pencil,
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/StatusBadge'

const STAFF_RATES: Record<string, number> = {
  admin: 80,
  junior: 100,
  senior: 120,
  assistant_manager: 150,
  manager: 175,
  director: 250,
  partner: 400,
}

const STAFF_LABELS: Record<string, string> = {
  admin: 'Admin',
  junior: 'Junior',
  senior: 'Senior',
  assistant_manager: 'Assistant Manager',
  manager: 'Manager',
  director: 'Director',
  partner: 'Partner',
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  draft: { color: 'bg-surface-100 text-surface-600', icon: <Edit className="w-4 h-4" />, label: 'Draft' },
  submitted: { color: 'bg-blue-100 text-blue-700', icon: <Clock className="w-4 h-4" />, label: 'Submitted' },
  under_review: { color: 'bg-amber-100 text-amber-700', icon: <Clock className="w-4 h-4" />, label: 'Under Review' },
  approved: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" />, label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-700', icon: <XCircle className="w-4 h-4" />, label: 'Rejected' },
  in_progress: { color: 'bg-purple-100 text-purple-700', icon: <TrendingUp className="w-4 h-4" />, label: 'In Progress' },
  completed: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" />, label: 'Completed' },
}

const PRIORITY_CONFIG: Record<string, string> = {
  low: 'bg-surface-100 text-surface-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
}

interface TimeSaving {
  staff_level: string
  hours_per_week: number
}

interface Form {
  id: string
  problem_identified: string
  solution: string | null
  cost_of_solution: number | null
  time_saving_hours: number | null
  time_saving_description: string | null
  staff_level: string | null
  time_savings: TimeSaving[] | null
  priority: string
  status: string
  submitted_by: string | null
  submitted_by_name: string | null
  notes: string | null
  created_at: string
  updated_at: string
  oversight_required?: boolean
  oversight_status?: string
  oversight_reviewed_by?: string | null
  oversight_reviewed_by_name?: string | null
  oversight_reviewed_at?: string | null
  oversight_notes?: string | null
  oversight_conditions?: string | null
  risk_category?: string | null
  risk_score?: number | null
  data_classification?: string | null
  security_review_required?: boolean
}

export default function FormDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const formId = params.id as string
  
  const [form, setForm] = useState<Form | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchForm = async () => {
      const { data, error } = await supabase
        .from('identification_forms')
        .select(`
          *,
          reviewer:profiles!identification_forms_oversight_reviewed_by_fkey(full_name)
        `)
        .eq('id', formId)
        .single()

      if (error) {
        console.error('Error fetching form:', error)
        setError('Form not found')
      } else {
        setForm({
          ...data,
          oversight_reviewed_by_name: (data as any).reviewer?.full_name || null
        })
      }
      setIsLoading(false)
    }

    fetchForm()
  }, [formId, supabase])

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-implementation-500" />
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Link 
          href="/implementation/forms" 
          className="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Forms
        </Link>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-surface-900 mb-2">Form Not Found</h2>
          <p className="text-surface-600">The form you're looking for doesn't exist or has been deleted.</p>
        </div>
      </div>
    )
  }

  // Calculate values from time_savings array or legacy fields
  const calculateTotals = () => {
    let totalWeeklyHours = 0
    let totalWeeklyValue = 0

    if (form.time_savings && Array.isArray(form.time_savings)) {
      form.time_savings.forEach(ts => {
        const rate = STAFF_RATES[ts.staff_level] || 0
        totalWeeklyHours += ts.hours_per_week
        totalWeeklyValue += ts.hours_per_week * rate
      })
    } else if (form.staff_level && form.time_saving_hours) {
      const rate = STAFF_RATES[form.staff_level] || 75
      totalWeeklyHours = form.time_saving_hours
      totalWeeklyValue = form.time_saving_hours * rate
    }

    return { totalWeeklyHours, totalWeeklyValue, totalAnnualValue: totalWeeklyValue * 52 }
  }

  const totals = calculateTotals()
  const roi = form.cost_of_solution && totals.totalAnnualValue > 0 
    ? Math.round((totals.totalAnnualValue / form.cost_of_solution) * 100) 
    : null

  const statusConfig = STATUS_CONFIG[form.status] || STATUS_CONFIG.draft

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/implementation/forms" 
          className="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Forms
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl gradient-implementation">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-surface-900">
                AI Opportunity Form
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${PRIORITY_CONFIG[form.priority]}`}>
                  {form.priority} Priority
                </span>
              </div>
            </div>
          </div>
          <Link 
            href={`/implementation/forms/${form.id}/edit`}
            className="btn-secondary flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6">
        {/* Problem & Solution */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Problem Identified</h2>
          <p className="text-surface-700 whitespace-pre-wrap">{form.problem_identified}</p>
          
          {form.solution && (
            <>
              <h2 className="font-display text-lg font-bold text-surface-900 mt-6 mb-4">Proposed Solution</h2>
              <p className="text-surface-700 whitespace-pre-wrap">{form.solution}</p>
            </>
          )}
        </div>

        {/* Metrics */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-implementation-50">
                <PoundSterling className="w-5 h-5 text-implementation-600" />
              </div>
              <span className="text-sm font-medium text-surface-600">Cost</span>
            </div>
            <p className="text-2xl font-bold text-surface-900">
              {form.cost_of_solution ? `£${form.cost_of_solution.toLocaleString()}` : '—'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-green-50">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-surface-600">Time Saved</span>
            </div>
            <p className="text-2xl font-bold text-surface-900">
              {totals.totalWeeklyHours > 0 ? `${totals.totalWeeklyHours} hrs/wk` : '—'}
            </p>
            {form.time_savings && form.time_savings.length > 0 && (
              <p className="text-sm text-surface-500 mt-1">
                {form.time_savings.length} staff level(s)
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <PoundSterling className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-surface-600">Annual Value</span>
            </div>
            <p className="text-2xl font-bold text-surface-900">
              {totals.totalAnnualValue > 0 ? `£${totals.totalAnnualValue.toLocaleString()}` : '—'}
            </p>
            {totals.totalWeeklyValue > 0 && (
              <p className="text-sm text-surface-500 mt-1">
                £{totals.totalWeeklyValue.toLocaleString()}/week
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-surface-600">ROI</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {roi !== null ? `${roi}%` : '—'}
            </p>
            {roi !== null && (
              <p className="text-sm text-surface-500 mt-1">First year return</p>
            )}
          </div>
        </div>

        {/* Time Savings Breakdown */}
        {form.time_savings && form.time_savings.length > 0 && (
          <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
            <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Time Savings Breakdown</h2>
            <div className="space-y-3">
              {form.time_savings.map((ts, index) => {
                const rate = STAFF_RATES[ts.staff_level] || 0
                const weeklyValue = ts.hours_per_week * rate
                return (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-surface-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-implementation-50 text-implementation-700 text-sm font-medium">
                        {STAFF_LABELS[ts.staff_level] || ts.staff_level}
                      </span>
                      <span className="text-surface-600">{ts.hours_per_week} hrs/week @ £{rate}/hr</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-surface-900">£{weeklyValue.toLocaleString()}/week</span>
                      <span className="text-surface-500 text-sm ml-2">(£{(weeklyValue * 52).toLocaleString()}/year)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Time Saving Details */}
        {form.time_saving_description && (
          <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
            <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Time Saving Details</h2>
            <p className="text-surface-700">{form.time_saving_description}</p>
          </div>
        )}

        {/* Oversight Status Section */}
        {form.oversight_required && form.oversight_status && form.oversight_status !== 'not_required' && (
          <OversightStatusSection form={form} />
        )}

        {/* Risk Assessment Section */}
        {(form.risk_category || form.risk_score || form.data_classification) && (
          <RiskAssessmentSection form={form} />
        )}

        {/* Notes */}
        {form.notes && (
          <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
            <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Additional Notes</h2>
            <p className="text-surface-700 whitespace-pre-wrap">{form.notes}</p>
          </div>
        )}

        {/* Meta Info */}
        <div className="bg-surface-50 rounded-2xl border border-surface-100 p-6">
          <div className="flex flex-wrap gap-6 text-sm text-surface-600">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Submitted by: <strong>{form.submitted_by_name || 'Unknown'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Created: <strong>{formatDate(form.created_at)}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Updated: <strong>{formatDate(form.updated_at)}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OversightStatusSection({ form }: { form: Form }) {
  const getOversightStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-50 border-green-200'
      case 'rejected': return 'bg-red-50 border-red-200'
      case 'pending_review': return 'bg-orange-50 border-orange-200'
      case 'under_review': return 'bg-blue-50 border-blue-200'
      case 'deferred': return 'bg-yellow-50 border-yellow-200'
      case 'requires_changes': return 'bg-amber-50 border-amber-200'
      default: return 'bg-surface-50 border-surface-200'
    }
  }

  return (
    <div className={`rounded-2xl border p-6 ${getOversightStatusColor(form.oversight_status || '')}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-surface-900">Oversight Review</h2>
        <StatusBadge status={form.oversight_status || 'not_required'} type="oversight" />
      </div>

      {form.oversight_reviewed_by && (
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-surface-500">Reviewed By:</span>
            <span className="ml-2 font-medium">{form.oversight_reviewed_by_name || 'Unknown'}</span>
          </div>
          <div>
            <span className="text-surface-500">Reviewed At:</span>
            <span className="ml-2 font-medium">
              {form.oversight_reviewed_at
                ? formatDate(form.oversight_reviewed_at)
                : '-'}
            </span>
          </div>
        </div>
      )}

      {form.oversight_notes && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-surface-700 mb-1">Review Notes</h3>
          <p className="text-sm text-surface-600 bg-white/50 p-3 rounded-lg">{form.oversight_notes}</p>
        </div>
      )}

      {form.oversight_conditions && form.oversight_status === 'approved' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <h3 className="text-sm font-medium text-yellow-800 mb-1">⚠️ Approval Conditions</h3>
          <p className="text-sm text-yellow-700">{form.oversight_conditions}</p>
        </div>
      )}

      {form.oversight_status === 'pending_review' && (
        <p className="text-sm text-orange-700">
          This proposal requires oversight review due to its cost (≥£5,000) or risk level.
          It will be reviewed by the Oversight Committee.
        </p>
      )}

      {form.oversight_status === 'requires_changes' && (
        <p className="text-sm text-amber-700">
          The Oversight Committee has requested changes. Please review the notes above and update the form accordingly.
        </p>
      )}
    </div>
  )
}

function RiskAssessmentSection({ form }: { form: Form }) {
  const getRiskScoreColor = (score: number | null) => {
    if (!score) return 'text-surface-500'
    if (score <= 2) return 'text-green-600'
    if (score <= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getDataClassificationBadge = (classification: string | null) => {
    if (!classification) return null

    const colors: Record<string, string> = {
      public: 'bg-green-100 text-green-800',
      internal: 'bg-blue-100 text-blue-800',
      confidential: 'bg-orange-100 text-orange-800',
      restricted: 'bg-red-100 text-red-800',
    }

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[classification] || 'bg-surface-100 text-surface-800'}`}>
        {classification.charAt(0).toUpperCase() + classification.slice(1)}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
      <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Risk Assessment</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {form.risk_category && (
          <div>
            <span className="text-sm text-surface-500">Risk Category</span>
            <p className="font-medium capitalize text-surface-900">{form.risk_category}</p>
          </div>
        )}
        
        {form.risk_score && (
          <div>
            <span className="text-sm text-surface-500">Risk Score</span>
            <p className={`font-medium ${getRiskScoreColor(form.risk_score)}`}>
              {form.risk_score}/5
              {form.risk_score >= 4 && ' ⚠️ High Risk'}
            </p>
          </div>
        )}
        
        {form.data_classification && (
          <div>
            <span className="text-sm text-surface-500">Data Classification</span>
            <div className="mt-1">{getDataClassificationBadge(form.data_classification)}</div>
          </div>
        )}
      </div>

      {form.security_review_required && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-700">
            🔒 Security review required before implementation
          </p>
        </div>
      )}
    </div>
  )
}

