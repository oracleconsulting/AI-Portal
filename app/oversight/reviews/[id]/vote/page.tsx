'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Loader2, Clock, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { determineROITier, getTierColor, getTierIcon } from '@/lib/data/roi-tiers'

interface CriteriaResult {
  criterion_name: string
  met: boolean
  failure_reasons: string[]
}

interface VotingSession {
  id: string
  pathway: 'fast_track' | 'full_oversight' | 'auto_approved' | 'partner_escalation'
  deadline: string | null
  votes_approve: number
  votes_reject: number
  fast_track_eligible: boolean
}

export default function VotePage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const formId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<any>(null)
  const [session, setSession] = useState<VotingSession | null>(null)
  const [criteriaEval, setCriteriaEval] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isFastTrackVoter, setIsFastTrackVoter] = useState(false)
  const [existingVote, setExistingVote] = useState<any>(null)

  // Vote form state
  const [decision, setDecision] = useState<string>('')
  const [reason, setReason] = useState('')
  const [conditions, setConditions] = useState('')
  const [concerns, setConcerns] = useState('')

  useEffect(() => {
    if (formId) {
      loadData()
    }
  }, [formId])

  async function loadData() {
    setLoading(true)
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setCurrentUser(profile)

    // Check if fast-track voter
    const { data: ftVoter } = await supabase
      .from('fast_track_voters')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    setIsFastTrackVoter(!!ftVoter)

    // Get form
    const { data: formData } = await supabase
      .from('identification_forms')
      .select('*')
      .eq('id', formId)
      .single()

    setForm(formData)

    // Evaluate criteria
    const { data: evalData } = await supabase.rpc('evaluate_approval_criteria', {
      form_uuid: formId,
    })
    setCriteriaEval(evalData)

    // Get or create voting session
    let { data: sessionData } = await supabase
      .from('voting_sessions')
      .select('*')
      .eq('form_id', formId)
      .is('closed_at', null)
      .single()

    if (!sessionData) {
      // Create new session
      const pathway = evalData?.fast_track_eligible ? 'fast_track' : 'full_oversight'
      const deadline =
        pathway === 'full_oversight'
          ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
          : null

      const { data: newSession } = await supabase
        .from('voting_sessions')
        .insert({
          form_id: formId,
          pathway,
          deadline,
          fast_track_eligible: evalData?.fast_track_eligible || false,
          initiated_by: user.id,
        })
        .select()
        .single()

      sessionData = newSession
    }

    setSession(sessionData)

    // Check for existing vote
    const { data: voteData } = await supabase
      .from('governance_votes')
      .select('*')
      .eq('form_id', formId)
      .eq('voter_id', user.id)
      .single()

    setExistingVote(voteData || null)
    setLoading(false)
  }

  async function submitVote() {
    if (!decision || !currentUser || !session) return

    setSubmitting(true)

    const { error } = await supabase.from('governance_votes').insert({
      form_id: formId,
      voter_id: currentUser.id,
      voter_name: currentUser.full_name || currentUser.email,
      decision: decision as 'approve' | 'reject' | 'abstain' | 'defer',
      pathway: session.pathway,
      vote_reason: reason || null,
      conditions: decision === 'approve' ? conditions || null : null,
      concerns: concerns || null,
      criteria_snapshot: criteriaEval,
      all_criteria_met: criteriaEval?.all_criteria_met || false,
    })

    if (error) {
      console.error('Vote error:', error)
      setSubmitting(false)
      return
    }

    // Update vote counts in session
    await supabase.rpc('update_vote_counts', { session_uuid: session.id })

    // Check if voting is complete
    await checkVotingComplete()

    router.push(`/oversight/reviews`)
  }

  async function checkVotingComplete() {
    if (!session) return

    const { data: votes } = await supabase
      .from('governance_votes')
      .select('*')
      .eq('form_id', formId)

    const approvals = votes?.filter(v => v.decision === 'approve').length || 0
    const rejections = votes?.filter(v => v.decision === 'reject').length || 0

    let outcome = null
    let shouldClose = false

    if (session.pathway === 'fast_track') {
      // Fast-track: 3 votes max, need 2-3 approvals with all criteria met
      const totalVotes = votes?.length || 0
      if (totalVotes >= 3 || rejections >= 2) {
        shouldClose = true
        if (approvals >= 2 && criteriaEval?.all_criteria_met) {
          outcome = 'approved'
        } else if (approvals === 3) {
          outcome = 'approved'
        } else if (rejections >= 2) {
          outcome = 'rejected'
        } else {
          outcome = 'escalated' // 1 approve, needs full committee
        }
      }
    } else {
      // Full oversight: need 3/5 majority
      if (approvals >= 3) {
        outcome = 'approved'
        shouldClose = true
      } else if (rejections >= 3) {
        outcome = 'rejected'
        shouldClose = true
      }
    }

    if (shouldClose && outcome) {
      // Close the session
      await supabase
        .from('voting_sessions')
        .update({
          closed_at: new Date().toISOString(),
          outcome,
          votes_approve: approvals,
          votes_reject: rejections,
        })
        .eq('id', session.id)

      // Update form oversight status
      const oversightStatus =
        outcome === 'approved'
          ? 'approved'
          : outcome === 'rejected'
            ? 'rejected'
            : 'under_review'

      await supabase
        .from('identification_forms')
        .update({
          oversight_status: oversightStatus,
          oversight_reviewed_at: new Date().toISOString(),
        })
        .eq('id', formId)
    }
  }

  const canVote = () => {
    if (existingVote) return false
    if (session?.pathway === 'fast_track' && !isFastTrackVoter) return false
    return true
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-oversight-600" />
      </div>
    )
  }

  if (!form) {
    return (
      <div className="p-8">
        <p className="text-red-600">Form not found</p>
        <Link href="/oversight/reviews" className="btn-secondary mt-4">
          Back to Reviews
        </Link>
      </div>
    )
  }

  const tier = determineROITier({
    cost: form.cost_of_solution || 0,
    riskScore: form.risk_score,
    dataClassification: form.data_classification,
    escalationTriggers: [],
  })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link
        href="/oversight/reviews"
        className="btn-secondary flex items-center gap-2 mb-6 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Review Queue
      </Link>

      <h1 className="font-display text-3xl font-bold text-surface-900 mb-6">Vote on Proposal</h1>

      {/* Form Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-6 mb-6">
        <h2 className="font-semibold text-surface-900 mb-4 text-lg">{form.problem_identified}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-surface-500">Cost:</span>
            <span className="ml-2 font-medium">
              £{form.cost_of_solution?.toLocaleString() || '0'}
            </span>
          </div>
          <div>
            <span className="text-surface-500">Risk Score:</span>
            <span className="ml-2 font-medium">{form.risk_score || 'N/A'}/5</span>
          </div>
          <div>
            <span className="text-surface-500">Data Classification:</span>
            <span className="ml-2 font-medium capitalize">
              {form.data_classification || 'Not set'}
            </span>
          </div>
        </div>
        {form.solution && (
          <div className="mt-4 pt-4 border-t border-surface-100">
            <p className="text-sm text-surface-600">
              <span className="font-medium">Solution:</span> {form.solution}
            </p>
          </div>
        )}
      </div>

      {/* ROI Tier Badge */}
      <div className={`rounded-xl p-4 mb-6 border ${getTierColor(tier.id)}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{getTierIcon(tier.id)}</span>
          <span className="font-semibold">{tier.name}</span>
        </div>
        <p className="text-sm">{tier.description}</p>
      </div>

      {/* Voting Pathway */}
      <div
        className={`rounded-xl p-4 mb-6 border ${
          session?.pathway === 'fast_track'
            ? 'bg-green-50 border-green-200'
            : 'bg-blue-50 border-blue-200'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${
              session?.pathway === 'fast_track'
                ? 'bg-green-200 text-green-800'
                : 'bg-blue-200 text-blue-800'
            }`}
          >
            {session?.pathway === 'fast_track' ? '⚡ Fast-Track' : '📋 Full Oversight'}
          </span>
          {criteriaEval?.all_criteria_met && (
            <span className="text-green-600 text-sm flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              All criteria met
            </span>
          )}
        </div>
        <p className="text-sm text-surface-700">
          {session?.pathway === 'fast_track'
            ? 'This proposal meets all criteria for fast-track approval by dual-committee members (James, Katy, Steve).'
            : 'This proposal requires full Oversight Committee review (3/5 majority needed).'}
        </p>
        {session?.deadline && (
          <p className="text-sm text-surface-500 mt-2 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Deadline: {format(new Date(session.deadline), 'dd MMM yyyy')}
          </p>
        )}
      </div>

      {/* Criteria Evaluation */}
      {criteriaEval?.criteria_results && criteriaEval.criteria_results.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-6 mb-6">
          <h3 className="font-semibold text-surface-900 mb-4">Criteria Evaluation</h3>
          <div className="space-y-2">
            {criteriaEval.criteria_results.map((cr: CriteriaResult, i: number) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded ${
                  cr.met ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <span className={cr.met ? 'text-green-600' : 'text-red-600'}>
                  {cr.met ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </span>
                <div className="flex-1">
                  <span className="font-medium">{cr.criterion_name}</span>
                  {!cr.met && cr.failure_reasons && cr.failure_reasons.length > 0 && (
                    <ul className="text-sm text-red-700 mt-1">
                      {cr.failure_reasons.map((reason, j) => (
                        <li key={j}>• {reason}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Votes */}
      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-6 mb-6">
        <h3 className="font-semibold text-surface-900 mb-4">Current Votes</h3>
        <div className="flex gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{session?.votes_approve || 0}</div>
            <div className="text-sm text-surface-500">Approve</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{session?.votes_reject || 0}</div>
            <div className="text-sm text-surface-500">Reject</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-surface-600">
              {session?.pathway === 'fast_track' ? '3' : '5'}
            </div>
            <div className="text-sm text-surface-500">Total Voters</div>
          </div>
        </div>
        <p className="text-sm text-surface-500 mt-4">
          {session?.pathway === 'fast_track'
            ? 'Need 2/3 with all criteria met, or 3/3 for approval'
            : 'Need 3/5 majority for approval'}
        </p>
      </div>

      {/* Vote Form */}
      {canVote() ? (
        <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-6">
          <h3 className="font-semibold text-surface-900 mb-4">Cast Your Vote</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Decision</label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value="approve"
                    checked={decision === 'approve'}
                    onChange={e => setDecision(e.target.value)}
                    className="h-4 w-4 text-green-600"
                  />
                  <span className="ml-2 text-green-700">Approve</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value="reject"
                    checked={decision === 'reject'}
                    onChange={e => setDecision(e.target.value)}
                    className="h-4 w-4 text-red-600"
                  />
                  <span className="ml-2 text-red-700">Reject</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value="defer"
                    checked={decision === 'defer'}
                    onChange={e => setDecision(e.target.value)}
                    className="h-4 w-4 text-yellow-600"
                  />
                  <span className="ml-2 text-yellow-700">Defer</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Reason for Decision
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                className="input-field"
                placeholder="Explain your reasoning..."
              />
            </div>

            {decision === 'approve' && (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Conditions (if any)
                </label>
                <textarea
                  value={conditions}
                  onChange={e => setConditions(e.target.value)}
                  rows={2}
                  className="input-field"
                  placeholder="Any conditions attached to approval..."
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">
                Concerns to Log (even if approving)
              </label>
              <textarea
                value={concerns}
                onChange={e => setConcerns(e.target.value)}
                rows={2}
                className="input-field"
                placeholder="Any concerns for the record..."
              />
            </div>

            <button
              onClick={submitVote}
              disabled={!decision || submitting}
              className="btn-oversight w-full flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Vote'
              )}
            </button>
          </div>
        </div>
      ) : existingVote ? (
        <div className="bg-surface-50 rounded-xl p-6 text-center">
          <p className="text-surface-600">
            You have already voted:{' '}
            <span className="font-medium capitalize">{existingVote.decision}</span>
          </p>
          {existingVote.vote_reason && (
            <p className="text-sm text-surface-500 mt-2">{existingVote.vote_reason}</p>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-700">
            This is a fast-track vote. Only dual-committee members (James, Katy, Steve) can vote.
          </p>
        </div>
      )}
    </div>
  )
}

