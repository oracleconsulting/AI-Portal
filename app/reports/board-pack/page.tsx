'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  FileText,
  Loader2,
  RefreshCw,
  Download,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'
import { calculateFullROI, getStaffRates } from '@/lib/utils/roi'

interface BoardPackData {
  generated_at: string
  period: string
  
  investment: {
    total_approved_cost: number
    total_proposals: number
    proposals_approved: number
    proposals_pending: number
    proposals_rejected: number
    avg_proposal_value: number
  }
  
  value: {
    projected_annual_value: number
    actual_annual_value: number
    variance_percentage: number
    roi_accuracy_rate: number
  }
  
  pipeline: {
    pending_oversight_count: number
    pending_oversight_value: number
    in_progress_count: number
    in_progress_value: number
    draft_count: number
  }
  
  risk: {
    tools_total: number
    tools_approved: number
    tools_high_risk: number
    avg_security_score: number
    reviews_overdue: number
  }
  
  compliance: {
    policies_active: number
    policies_pending_review: number
    acknowledgment_rate: number
    audit_events_this_period: number
  }
  
  teams: Array<{
    team: string
    proposals_submitted: number
    proposals_approved: number
    total_value: number
    avg_roi: number
  }>
  
  wins: Array<{
    title: string
    team: string
    annual_value: number
    roi: number
  }>
  
  challenges: Array<{
    title: string
    description: string
  }>
}

export default function BoardPackPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<BoardPackData | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    generateReport()
  }, [])

  async function generateReport() {
    setLoading(true)
    setError(null)

    try {
      // Get staff rates
      const rates = await getStaffRates(supabase)

      // Fetch all required data in parallel
      const [
        formsResult,
        reviewsResult,
        toolsResult,
        policiesResult,
        acknowledgementsResult,
        auditResult,
      ] = await Promise.all([
        supabase.from('identification_forms').select('*'),
        supabase.from('implementation_reviews').select('*').not('actual_annual_value', 'is', null),
        supabase.from('ai_tools').select('*'),
        supabase.from('policy_documents').select('*'),
        supabase.from('policy_acknowledgments').select('*'),
        supabase.from('audit_log').select('id', { count: 'exact' })
          .gte('changed_at', new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString()),
      ])

      const forms = formsResult.data || []
      const reviews = reviewsResult.data || []
      const tools = toolsResult.data || []
      const policies = policiesResult.data || []
      const acknowledgements = acknowledgementsResult.data || []
      const auditCount = auditResult.count || 0

      // Calculate Investment Summary
      const approvedForms = forms.filter(f => ['approved', 'in_progress', 'completed'].includes(f.status))
      const totalApprovedCost = approvedForms.reduce((sum, f) => sum + (f.cost_of_solution || 0), 0)
      
      // Calculate Value Realisation
      const projectedValue = reviews.reduce((sum, r) => sum + (r.projected_annual_value || 0), 0)
      const actualValue = reviews.reduce((sum, r) => sum + (r.actual_annual_value || 0), 0)
      const accurateReviews = reviews.filter(r => Math.abs(r.variance_percentage || 0) <= 15).length

      // Calculate Pipeline
      const pendingOversight = forms.filter(f => f.oversight_status === 'pending_review')
      const inProgress = forms.filter(f => f.status === 'in_progress')
      const drafts = forms.filter(f => f.status === 'draft')

      // Calculate Risk Posture
      const approvedTools = tools.filter(t => ['approved', 'approved_restricted'].includes(t.status))
      const highRiskTools = tools.filter(t => (t.risk_score || 0) >= 4)
      const toolsWithSecurity = tools.filter(t => t.security_score !== null)
      const avgSecurityScore = toolsWithSecurity.length > 0
        ? toolsWithSecurity.reduce((sum, t) => sum + (t.security_score || 0), 0) / toolsWithSecurity.length
        : 0
      
      // Tool reviews overdue
      const now = new Date()
      const overdueReviews = tools.filter(t => 
        t.next_review_date && new Date(t.next_review_date) < now
      ).length

      // Calculate Compliance
      const activePolicies = policies.filter(p => p.status === 'approved')
      const policiesPendingReview = policies.filter(p => 
        p.review_date && new Date(p.review_date) < now && p.status === 'approved'
      )
      
      // Get unique users who need to acknowledge
      const { data: profiles } = await supabase.from('profiles').select('id')
      const totalUsers = profiles?.length || 1
      const usersWithAcknowledgements = new Set(acknowledgements.map(a => a.user_id)).size
      const acknowledgmentRate = (usersWithAcknowledgements / totalUsers) * 100

      // Calculate Team Performance
      const teamStats: Record<string, any> = {}
      forms.forEach(f => {
        const team = f.team || 'unknown'
        if (!teamStats[team]) {
          teamStats[team] = {
            team,
            proposals_submitted: 0,
            proposals_approved: 0,
            total_value: 0,
            avg_roi: 0,
            roi_sum: 0,
            roi_count: 0,
          }
        }
        teamStats[team].proposals_submitted++
        if (['approved', 'in_progress', 'completed'].includes(f.status)) {
          teamStats[team].proposals_approved++
        }

        // Calculate value
        const timeSavings = f.time_savings || []
        if (Array.isArray(timeSavings) && timeSavings.length > 0) {
          const roiSummary = calculateFullROI(timeSavings, f.cost_of_solution || 0, rates)
          teamStats[team].total_value += roiSummary.annualValue
          if (f.cost_of_solution && f.cost_of_solution > 0) {
            teamStats[team].roi_sum += roiSummary.roi
            teamStats[team].roi_count++
          }
        }
      })

      // Calculate average ROI per team
      Object.keys(teamStats).forEach(team => {
        if (teamStats[team].roi_count > 0) {
          teamStats[team].avg_roi = teamStats[team].roi_sum / teamStats[team].roi_count
        }
      })

      // Calculate top wins (highest ROI completed implementations)
      const completedForms = forms.filter(f => f.status === 'completed')
      const wins = completedForms
        .map(f => {
          const timeSavings = f.time_savings || []
          let annualValue = 0
          let roi = 0
          if (Array.isArray(timeSavings) && timeSavings.length > 0) {
            const roiSummary = calculateFullROI(timeSavings, f.cost_of_solution || 0, rates)
            annualValue = roiSummary.annualValue
            roi = roiSummary.roi
          }
          return {
            title: f.problem_identified,
            team: f.team || 'unknown',
            annual_value: annualValue,
            roi,
          }
        })
        .sort((a, b) => b.roi - a.roi)
        .slice(0, 5)

      // Challenges (rejected or discontinued)
      const challenges = forms
        .filter(f => f.status === 'rejected')
        .slice(0, 3)
        .map(f => ({
          title: f.problem_identified,
          description: f.oversight_notes || 'No details provided',
        }))

      const boardPackData: BoardPackData = {
        generated_at: new Date().toISOString(),
        period: `Q${Math.floor((new Date().getMonth() / 3)) + 1} ${new Date().getFullYear()}`,
        
        investment: {
          total_approved_cost: totalApprovedCost,
          total_proposals: forms.length,
          proposals_approved: approvedForms.length,
          proposals_pending: forms.filter(f => f.status === 'submitted' || f.status === 'under_review').length,
          proposals_rejected: forms.filter(f => f.status === 'rejected').length,
          avg_proposal_value: approvedForms.length > 0 ? totalApprovedCost / approvedForms.length : 0,
        },
        
        value: {
          projected_annual_value: projectedValue,
          actual_annual_value: actualValue,
          variance_percentage: projectedValue > 0 ? ((actualValue - projectedValue) / projectedValue) * 100 : 0,
          roi_accuracy_rate: reviews.length > 0 ? (accurateReviews / reviews.length) * 100 : 0,
        },
        
        pipeline: {
          pending_oversight_count: pendingOversight.length,
          pending_oversight_value: pendingOversight.reduce((sum, f) => sum + (f.cost_of_solution || 0), 0),
          in_progress_count: inProgress.length,
          in_progress_value: inProgress.reduce((sum, f) => sum + (f.cost_of_solution || 0), 0),
          draft_count: drafts.length,
        },
        
        risk: {
          tools_total: tools.length,
          tools_approved: approvedTools.length,
          tools_high_risk: highRiskTools.length,
          avg_security_score: avgSecurityScore,
          reviews_overdue: overdueReviews,
        },
        
        compliance: {
          policies_active: activePolicies.length,
          policies_pending_review: policiesPendingReview.length,
          acknowledgment_rate: acknowledgmentRate,
          audit_events_this_period: auditCount,
        },
        
        teams: Object.values(teamStats),
        wins,
        challenges,
      }

      setData(boardPackData)
      setLoading(false)
    } catch (err) {
      setError('Failed to generate report: ' + (err instanceof Error ? err.message : 'Unknown error'))
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const handleExportPDF = async () => {
    setGenerating(true)
    // PDF generation would be implemented here
    // Using @react-pdf/renderer or similar
    alert('PDF export coming soon - see Phase 4.2 PDF Export task')
    setGenerating(false)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-oversight-500" />
        <span className="ml-3 text-surface-600">Generating report...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        <p className="text-surface-500">Failed to generate report</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-xl gradient-oversight">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-surface-900">AI Initiative Board Pack</h1>
              <p className="text-surface-600 mt-1">{data.period} Quarterly Summary</p>
            </div>
          </div>
          <p className="text-sm text-surface-400">
            Generated: {new Date(data.generated_at).toLocaleString('en-GB')}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={generateReport}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh Data
          </button>
          <button
            onClick={handleExportPDF}
            disabled={generating}
            className="btn-primary flex items-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Export PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-gradient-to-r from-oversight-500 to-oversight-600 rounded-2xl p-6 text-white mb-8">
        <h2 className="font-display text-xl font-semibold mb-4">Executive Summary</h2>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <div className="text-3xl font-bold">{formatCurrency(data.investment.total_approved_cost)}</div>
            <div className="text-blue-100">Total Investment</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{formatCurrency(data.value.actual_annual_value)}</div>
            <div className="text-blue-100">Realised Value</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{data.investment.proposals_approved}</div>
            <div className="text-blue-100">Implementations</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{formatPercent(data.value.roi_accuracy_rate)}</div>
            <div className="text-blue-100">Estimation Accuracy</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Investment Summary */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Investment Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-surface-600">Total Proposals</span>
              <span className="font-medium">{data.investment.total_proposals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-600">Approved</span>
              <span className="font-medium text-green-600">{data.investment.proposals_approved}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-600">Pending</span>
              <span className="font-medium text-yellow-600">{data.investment.proposals_pending}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-600">Rejected</span>
              <span className="font-medium text-red-600">{data.investment.proposals_rejected}</span>
            </div>
            <div className="pt-3 border-t border-surface-100">
              <div className="flex justify-between">
                <span className="text-surface-600">Avg Proposal Value</span>
                <span className="font-medium">{formatCurrency(data.investment.avg_proposal_value)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Pipeline</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-surface-600">Pending Oversight Review</span>
              <span className="font-medium">
                {data.pipeline.pending_oversight_count} ({formatCurrency(data.pipeline.pending_oversight_value)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-600">In Progress</span>
              <span className="font-medium text-blue-600">
                {data.pipeline.in_progress_count} ({formatCurrency(data.pipeline.in_progress_value)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-600">Drafts</span>
              <span className="font-medium text-surface-500">{data.pipeline.draft_count}</span>
            </div>
          </div>
        </div>

        {/* Risk Posture */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Risk Posture</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-surface-600">Registered Tools</span>
              <span className="font-medium">{data.risk.tools_total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-600">Approved for Use</span>
              <span className="font-medium text-green-600">{data.risk.tools_approved}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-600">High Risk Tools</span>
              <span className={`font-medium ${data.risk.tools_high_risk > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {data.risk.tools_high_risk}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-600">Avg Security Score</span>
              <span className="font-medium">{data.risk.avg_security_score.toFixed(1)}/5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-600">Reviews Overdue</span>
              <span className={`font-medium ${data.risk.reviews_overdue > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {data.risk.reviews_overdue}
              </span>
            </div>
          </div>
        </div>

        {/* Compliance */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Compliance</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-surface-600">Active Policies</span>
              <span className="font-medium">{data.compliance.policies_active}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-600">Policies Requiring Review</span>
              <span className={`font-medium ${data.compliance.policies_pending_review > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {data.compliance.policies_pending_review}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-600">Policy Acknowledgment Rate</span>
              <span className="font-medium">{formatPercent(data.compliance.acknowledgment_rate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-600">Audit Events (This Quarter)</span>
              <span className="font-medium">{data.compliance.audit_events_this_period}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Wins */}
      {data.wins.length > 0 && (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6 mb-8">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Top Wins
          </h2>
          <div className="space-y-3">
            {data.wins.map((win, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium text-surface-900">{win.title}</div>
                  <div className="text-sm text-surface-500 capitalize">{win.team.replace(/_/g, ' ')}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-600">{formatCurrency(win.annual_value)}/yr</div>
                  <div className="text-sm text-surface-500">{win.roi.toFixed(0)}% ROI</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Performance */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-surface-100 bg-surface-50">
          <h2 className="font-display text-lg font-bold text-surface-900">Team Performance</h2>
        </div>
        <table className="min-w-full divide-y divide-surface-100">
          <thead className="bg-surface-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Team</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase">Submitted</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase">Approved</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase">Approval Rate</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-surface-100">
            {data.teams.map((team) => (
              <tr key={team.team}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-surface-900 capitalize">
                  {team.team.replace(/_/g, ' ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-surface-600">
                  {team.proposals_submitted}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-surface-600">
                  {team.proposals_approved}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-surface-600">
                  {team.proposals_submitted > 0 
                    ? formatPercent((team.proposals_approved / team.proposals_submitted) * 100)
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-surface-500 py-6">
        <p>RPGCC AI Portal • Confidential Board Report</p>
        <p>For internal use only</p>
      </div>
    </div>
  )
}

