'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  PoundSterling,
  TrendingUp,
  FileText,
  Loader2,
  Filter,
} from 'lucide-react'
import type { OversightReviewQueueItem, OversightStatus, Priority } from '@/types/database'

const PRIORITY_CONFIG: Record<Priority, { color: string; label: string }> = {
  critical: { color: 'bg-red-100 text-red-700', label: 'Critical' },
  high: { color: 'bg-amber-100 text-amber-700', label: 'High' },
  medium: { color: 'bg-blue-100 text-blue-700', label: 'Medium' },
  low: { color: 'bg-surface-100 text-surface-600', label: 'Low' },
}

const OVERSIGHT_STATUS_CONFIG: Record<OversightStatus, { color: string; label: string }> = {
  not_required: { color: 'bg-surface-100 text-surface-600', label: 'Not Required' },
  pending_review: { color: 'bg-orange-100 text-orange-700', label: 'Pending Review' },
  under_review: { color: 'bg-blue-100 text-blue-700', label: 'Under Review' },
  approved: { color: 'bg-green-100 text-green-700', label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
  deferred: { color: 'bg-yellow-100 text-yellow-700', label: 'Deferred' },
  requires_changes: { color: 'bg-amber-100 text-amber-700', label: 'Requires Changes' },
}

const TEAM_LABELS: Record<string, string> = {
  bsg: 'BSG',
  audit: 'Audit',
  tax: 'Tax',
  corporate_finance: 'Corporate Finance',
  bookkeeping: 'Bookkeeping',
  admin: 'Admin',
}

export default function OversightReviewsPage() {
  const supabase = createClient()
  const [items, setItems] = useState<OversightReviewQueueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterTeam, setFilterTeam] = useState<string>('all')
  const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; formId: string | null; action: 'approve' | 'reject' | 'defer' | 'changes' | null }>({
    isOpen: false,
    formId: null,
    action: null,
  })
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewConditions, setReviewConditions] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchReviewQueue()
  }, [])

  const fetchReviewQueue = async () => {
    // Fetch directly from identification_forms with oversight filtering
    const { data, error } = await supabase
      .from('identification_forms')
      .select(`
        id,
        problem_identified,
        solution,
        cost_of_solution,
        time_savings,
        priority,
        status,
        oversight_status,
        submitted_by,
        submitted_by_name,
        created_at,
        updated_at,
        risk_category,
        risk_score,
        data_classification
      `)
      .gte('cost_of_solution', 5000)
      .in('oversight_status', ['pending_review', 'under_review', 'requires_changes'])
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching review queue:', error)
    } else {
      // Calculate annual value and days pending for each item
      const itemsWithCalcs = (data || []).map(item => {
        const timeSavings = item.time_savings as Array<{ staff_level: string; hours_per_week: number }> || []
        const annualValue = timeSavings.reduce((sum, ts) => {
          const rate = getStaffRate(ts.staff_level)
          return sum + (ts.hours_per_week * rate * 52)
        }, 0)
        const daysPending = Math.floor((Date.now() - new Date(item.updated_at).getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          ...item,
          annual_value: annualValue,
          days_pending: daysPending,
          team: null, // Would need to join with profiles
        } as OversightReviewQueueItem
      })
      
      setItems(itemsWithCalcs)
    }
    setIsLoading(false)
  }

  const getStaffRate = (level: string): number => {
    const rates: Record<string, number> = {
      admin: 80,
      junior: 100,
      senior: 120,
      assistant_manager: 150,
      manager: 175,
      director: 250,
      partner: 400,
    }
    return rates[level] || 100
  }

  const handleReviewAction = async () => {
    if (!reviewModal.formId || !reviewModal.action) return
    setIsSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user?.id)
      .single()

    const statusMap: Record<string, OversightStatus> = {
      approve: 'approved',
      reject: 'rejected',
      defer: 'deferred',
      changes: 'requires_changes',
    }

    const { error } = await supabase
      .from('identification_forms')
      .update({
        oversight_status: statusMap[reviewModal.action],
        oversight_reviewed_by: user?.id,
        oversight_reviewed_by_name: profile?.full_name || user?.email,
        oversight_reviewed_at: new Date().toISOString(),
        oversight_notes: reviewNotes || null,
        oversight_conditions: reviewModal.action === 'approve' ? reviewConditions : null,
      })
      .eq('id', reviewModal.formId)

    if (error) {
      console.error('Error updating review:', error)
    } else {
      setReviewModal({ isOpen: false, formId: null, action: null })
      setReviewNotes('')
      setReviewConditions('')
      fetchReviewQueue()
    }
    setIsSubmitting(false)
  }

  const filteredItems = items.filter(item => {
    if (filterPriority !== 'all' && item.priority !== filterPriority) return false
    if (filterTeam !== 'all' && item.team !== filterTeam) return false
    return true
  })

  const urgentCount = items.filter(i => i.days_pending > 5 || i.priority === 'critical').length

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-oversight-500" />
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 rounded-xl gradient-oversight">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">
              Oversight Review Queue
            </h1>
            <p className="text-surface-600">
              Review and approve high-value AI implementation proposals
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-surface-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-oversight-500" />
            <span className="text-sm text-surface-600">Pending Review</span>
          </div>
          <p className="text-2xl font-bold text-surface-900">{items.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-surface-600">Urgent</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <PoundSterling className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-surface-600">Total Value</span>
          </div>
          <p className="text-2xl font-bold text-surface-900">
            £{items.reduce((sum, i) => sum + (i.cost_of_solution || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-sm text-surface-600">Projected Annual Value</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            £{items.reduce((sum, i) => sum + (i.annual_value || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-surface-100 p-4 mb-6 flex items-center gap-4">
        <Filter className="w-5 h-5 text-surface-400" />
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="input-field max-w-[180px]"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          className="input-field max-w-[180px]"
        >
          <option value="all">All Teams</option>
          {Object.entries(TEAM_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Review Queue */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-surface-100 p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold text-surface-900 mb-2">
              All caught up!
            </h3>
            <p className="text-surface-600">No proposals pending oversight review.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                item.days_pending > 5 ? 'border-red-200' : 'border-surface-100'
              }`}
            >
              {/* Header Row */}
              <div
                className="p-5 cursor-pointer hover:bg-surface-50 transition-colors"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PRIORITY_CONFIG[item.priority].color}`}>
                      {PRIORITY_CONFIG[item.priority].label}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${OVERSIGHT_STATUS_CONFIG[item.oversight_status].color}`}>
                      {OVERSIGHT_STATUS_CONFIG[item.oversight_status].label}
                    </span>
                    {item.days_pending > 5 && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        {item.days_pending} days pending
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-surface-500">Cost</p>
                      <p className="font-semibold text-surface-900">£{(item.cost_of_solution || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-surface-500">Annual Value</p>
                      <p className="font-semibold text-green-600">£{(item.annual_value || 0).toLocaleString()}</p>
                    </div>
                    {expandedId === item.id ? (
                      <ChevronUp className="w-5 h-5 text-surface-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-surface-400" />
                    )}
                  </div>
                </div>
                <h3 className="font-medium text-surface-900 mt-3 line-clamp-2">
                  {item.problem_identified}
                </h3>
                <p className="text-sm text-surface-500 mt-1">
                  Submitted by {item.submitted_by_name} on {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Expanded Details */}
              {expandedId === item.id && (
                <div className="border-t border-surface-100 p-5 bg-surface-50">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-surface-700 mb-2">Problem Identified</h4>
                      <p className="text-surface-600 text-sm">{item.problem_identified}</p>
                      
                      {item.solution && (
                        <>
                          <h4 className="font-medium text-surface-700 mb-2 mt-4">Proposed Solution</h4>
                          <p className="text-surface-600 text-sm">{item.solution}</p>
                        </>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-surface-700 mb-2">Risk Assessment</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-surface-500">Risk Category:</span>
                          <span className="text-surface-900 capitalize">{item.risk_category || 'Not assessed'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-surface-500">Risk Score:</span>
                          <span className="text-surface-900">{item.risk_score ? `${item.risk_score}/5` : 'Not assessed'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-surface-500">Data Classification:</span>
                          <span className="text-surface-900 capitalize">{item.data_classification || 'Not specified'}</span>
                        </div>
                      </div>

                      {/* Time Savings Breakdown */}
                      {item.time_savings && (item.time_savings as Array<{ staff_level: string; hours_per_week: number }>).length > 0 && (
                        <>
                          <h4 className="font-medium text-surface-700 mb-2 mt-4">Time Savings</h4>
                          <div className="space-y-1">
                            {(item.time_savings as Array<{ staff_level: string; hours_per_week: number }>).map((ts, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-surface-500 capitalize">{ts.staff_level.replace('_', ' ')}:</span>
                                <span className="text-surface-900">{ts.hours_per_week} hrs/wk (£{(ts.hours_per_week * getStaffRate(ts.staff_level)).toLocaleString()}/wk)</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-surface-200">
                    <Link
                      href={`/implementation/forms/${item.id}`}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      View Full Details
                    </Link>
                    <div className="flex-1" />
                    <button
                      onClick={() => setReviewModal({ isOpen: true, formId: item.id, action: 'changes' })}
                      className="px-4 py-2 rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 font-medium transition-colors"
                    >
                      Request Changes
                    </button>
                    <button
                      onClick={() => setReviewModal({ isOpen: true, formId: item.id, action: 'defer' })}
                      className="px-4 py-2 rounded-xl bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-medium transition-colors"
                    >
                      Defer
                    </button>
                    <button
                      onClick={() => setReviewModal({ isOpen: true, formId: item.id, action: 'reject' })}
                      className="px-4 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 font-medium transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => setReviewModal({ isOpen: true, formId: item.id, action: 'approve' })}
                      className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 font-medium transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h2 className="font-display text-xl font-bold text-surface-900 mb-4">
              {reviewModal.action === 'approve' && 'Approve Proposal'}
              {reviewModal.action === 'reject' && 'Reject Proposal'}
              {reviewModal.action === 'defer' && 'Defer Proposal'}
              {reviewModal.action === 'changes' && 'Request Changes'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">
                  Review Notes {reviewModal.action !== 'approve' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="input-field min-h-[100px]"
                  placeholder={
                    reviewModal.action === 'approve' 
                      ? 'Optional notes about this approval...'
                      : 'Explain your decision...'
                  }
                  required={reviewModal.action !== 'approve'}
                />
              </div>

              {reviewModal.action === 'approve' && (
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">
                    Approval Conditions (optional)
                  </label>
                  <textarea
                    value={reviewConditions}
                    onChange={(e) => setReviewConditions(e.target.value)}
                    className="input-field min-h-[80px]"
                    placeholder="Any conditions attached to this approval..."
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setReviewModal({ isOpen: false, formId: null, action: null })
                  setReviewNotes('')
                  setReviewConditions('')
                }}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleReviewAction}
                disabled={isSubmitting || (reviewModal.action !== 'approve' && !reviewNotes)}
                className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                  reviewModal.action === 'approve'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : reviewModal.action === 'reject'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                } disabled:opacity-50`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

