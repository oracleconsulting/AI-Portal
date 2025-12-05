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
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

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

interface Form {
  id: string
  problem_identified: string
  solution: string | null
  cost_of_solution: number | null
  time_saving_hours: number | null
  time_saving_description: string | null
  staff_level: string | null
  priority: string
  status: string
  submitted_by: string | null
  submitted_by_name: string | null
  notes: string | null
  created_at: string
  updated_at: string
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
        .select('*')
        .eq('id', formId)
        .single()

      if (error) {
        console.error('Error fetching form:', error)
        setError('Form not found')
      } else {
        setForm(data)
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

  const staffRate = form.staff_level ? STAFF_RATES[form.staff_level] : 75
  const weeklyValue = form.time_saving_hours ? form.time_saving_hours * staffRate : 0
  const annualValue = weeklyValue * 52
  const roi = form.cost_of_solution && annualValue > 0 
    ? Math.round((annualValue / form.cost_of_solution) * 100) 
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
              {form.time_saving_hours ? `${form.time_saving_hours} hrs/wk` : '—'}
            </p>
            {form.staff_level && (
              <p className="text-sm text-surface-500 mt-1">
                {STAFF_LABELS[form.staff_level]} @ £{staffRate}/hr
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
              {annualValue > 0 ? `£${annualValue.toLocaleString()}` : '—'}
            </p>
            {weeklyValue > 0 && (
              <p className="text-sm text-surface-500 mt-1">
                £{weeklyValue.toLocaleString()}/week
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

        {/* Time Saving Details */}
        {form.time_saving_description && (
          <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
            <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Time Saving Details</h2>
            <p className="text-surface-700">{form.time_saving_description}</p>
          </div>
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

