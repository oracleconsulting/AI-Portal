'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

interface ReviewData {
  id: string
  form_id: string
  form_title: string
  team: string
  review_type: string
  review_date: string
  projected_annual_value: number
  actual_annual_value: number | null
  projected_cost: number
  actual_cost: number | null
  variance_percentage: number | null
  recommendation: string
}

interface TeamAccuracy {
  team: string
  total_reviews: number
  avg_variance: number
  overestimate_count: number
  underestimate_count: number
  accurate_count: number
}

export default function ROIValidationPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [reviews, setReviews] = useState<ReviewData[]>([])
  const [teamAccuracy, setTeamAccuracy] = useState<TeamAccuracy[]>([])
  const [overallStats, setOverallStats] = useState({
    totalReviews: 0,
    avgVariance: 0,
    accuracyRate: 0,
    totalProjectedValue: 0,
    totalActualValue: 0,
    improvementTrend: 0,
  })

  const [teamFilter, setTeamFilter] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('implementation_reviews')
      .select(`
        id,
        form_id,
        review_type,
        review_date,
        projected_annual_value,
        actual_annual_value,
        projected_cost,
        actual_cost,
        variance_percentage,
        recommendation,
        identification_forms (
          problem_identified,
          team
        )
      `)
      .not('actual_annual_value', 'is', null)
      .order('review_date', { ascending: false })

    if (reviewsError) {
      setError('Failed to load review data')
      setLoading(false)
      return
    }

    const transformedReviews: ReviewData[] = (reviewsData || []).map((r: any) => ({
      id: r.id,
      form_id: r.form_id,
      form_title: r.identification_forms?.problem_identified || 'Unknown',
      team: r.identification_forms?.team || 'unknown',
      review_type: r.review_type,
      review_date: r.review_date,
      projected_annual_value: r.projected_annual_value || 0,
      actual_annual_value: r.actual_annual_value,
      projected_cost: r.projected_cost || 0,
      actual_cost: r.actual_cost,
      variance_percentage: r.variance_percentage,
      recommendation: r.recommendation,
    }))

    setReviews(transformedReviews)

    // Calculate team accuracy
    const teamStats: Record<string, TeamAccuracy> = {}

    transformedReviews.forEach(r => {
      if (!teamStats[r.team]) {
        teamStats[r.team] = {
          team: r.team,
          total_reviews: 0,
          avg_variance: 0,
          overestimate_count: 0,
          underestimate_count: 0,
          accurate_count: 0,
        }
      }

      teamStats[r.team].total_reviews++
      
      const variance = r.variance_percentage || 0
      if (Math.abs(variance) <= 15) {
        teamStats[r.team].accurate_count++
      } else if (variance > 15) {
        teamStats[r.team].overestimate_count++
      } else {
        teamStats[r.team].underestimate_count++
      }
    })

    // Calculate averages
    Object.keys(teamStats).forEach(team => {
      const teamReviews = transformedReviews.filter(r => r.team === team)
      const variances = teamReviews.map(r => r.variance_percentage || 0)
      teamStats[team].avg_variance = variances.reduce((a, b) => a + b, 0) / variances.length
    })

    setTeamAccuracy(Object.values(teamStats))

    // Calculate overall stats
    const allVariances = transformedReviews.map(r => r.variance_percentage || 0)
    const avgVariance = allVariances.length > 0 
      ? allVariances.reduce((a, b) => a + b, 0) / allVariances.length 
      : 0

    const accurateCount = transformedReviews.filter(r => Math.abs(r.variance_percentage || 0) <= 15).length
    const accuracyRate = transformedReviews.length > 0 
      ? (accurateCount / transformedReviews.length) * 100 
      : 0

    setOverallStats({
      totalReviews: transformedReviews.length,
      avgVariance,
      accuracyRate,
      totalProjectedValue: transformedReviews.reduce((a, r) => a + r.projected_annual_value, 0),
      totalActualValue: transformedReviews.reduce((a, r) => a + (r.actual_annual_value || 0), 0),
      improvementTrend: calculateTrend(transformedReviews),
    })

    setLoading(false)
  }

  function calculateTrend(reviews: ReviewData[]): number {
    const now = new Date()
    const threeMonthsAgo = new Date(now)
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    
    const recentReviews = reviews.filter(r => new Date(r.review_date) >= threeMonthsAgo)
    const olderReviews = reviews.filter(r => new Date(r.review_date) < threeMonthsAgo)
    
    if (recentReviews.length === 0 || olderReviews.length === 0) return 0
    
    const recentAvgVariance = recentReviews.reduce((a, r) => a + Math.abs(r.variance_percentage || 0), 0) / recentReviews.length
    const olderAvgVariance = olderReviews.reduce((a, r) => a + Math.abs(r.variance_percentage || 0), 0) / olderReviews.length
    
    return olderAvgVariance - recentAvgVariance
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
    const prefix = value > 0 ? '+' : ''
    return `${prefix}${value.toFixed(1)}%`
  }

  const getVarianceColor = (variance: number | null) => {
    if (variance === null) return 'text-surface-500'
    const absVariance = Math.abs(variance)
    if (absVariance <= 10) return 'text-green-600'
    if (absVariance <= 25) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredReviews = reviews.filter(r => {
    if (teamFilter !== 'all' && r.team !== teamFilter) return false
    return true
  })

  const teams = [...new Set(reviews.map(r => r.team))]

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-implementation-500" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl gradient-implementation">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">ROI Validation</h1>
            <p className="text-surface-600 mt-1">
              Compare projected vs actual outcomes to validate estimation accuracy
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-8 text-center">
          <BarChart3 className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <p className="text-surface-500">
            No implementation reviews with actual data yet. Complete some post-implementation reviews to see ROI validation metrics.
          </p>
          <Link href="/implementation/reviews" className="text-implementation-600 hover:underline mt-4 inline-block">
            View Reviews Dashboard →
          </Link>
        </div>
      ) : (
        <>
          {/* Overall Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4">
              <div className="text-2xl font-bold text-surface-900">{overallStats.totalReviews}</div>
              <div className="text-sm text-surface-500">Reviews Completed</div>
            </div>
            <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4">
              <div className={`text-2xl font-bold ${getVarianceColor(overallStats.avgVariance)}`}>
                {formatPercent(overallStats.avgVariance)}
              </div>
              <div className="text-sm text-surface-500">Avg Variance</div>
            </div>
            <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4">
              <div className="text-2xl font-bold text-green-600">{overallStats.accuracyRate.toFixed(0)}%</div>
              <div className="text-sm text-surface-500">Accuracy Rate (±15%)</div>
            </div>
            <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4">
              <div className={`text-2xl font-bold flex items-center gap-2 ${
                overallStats.improvementTrend > 0 ? 'text-green-600' : 
                overallStats.improvementTrend < 0 ? 'text-red-600' : 
                'text-surface-600'
              }`}>
                {overallStats.improvementTrend > 0 ? (
                  <>
                    <TrendingUp className="w-6 h-6" />
                    Improving
                  </>
                ) : overallStats.improvementTrend < 0 ? (
                  <>
                    <TrendingDown className="w-6 h-6" />
                    Declining
                  </>
                ) : (
                  '→ Stable'
                )}
              </div>
              <div className="text-sm text-surface-500">Estimation Trend</div>
            </div>
          </div>

          {/* Value Comparison */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6 mb-6">
            <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Total Value Comparison</h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-sm text-surface-500 mb-1">Total Projected Annual Value</div>
                <div className="text-3xl font-bold text-surface-700">
                  {formatCurrency(overallStats.totalProjectedValue)}
                </div>
              </div>
              <div>
                <div className="text-sm text-surface-500 mb-1">Total Actual Annual Value</div>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(overallStats.totalActualValue)}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-surface-100">
              <div className="text-sm">
                {overallStats.totalActualValue >= overallStats.totalProjectedValue ? (
                  <span className="text-green-600 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Actual value exceeds projections by {formatCurrency(overallStats.totalActualValue - overallStats.totalProjectedValue)}
                  </span>
                ) : (
                  <span className="text-orange-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Actual value is {formatCurrency(overallStats.totalProjectedValue - overallStats.totalActualValue)} below projections
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Team Accuracy Table */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-surface-100 bg-surface-50">
              <h2 className="font-display text-lg font-bold text-surface-900">Team Estimation Accuracy</h2>
            </div>
            <table className="min-w-full divide-y divide-surface-100">
              <thead className="bg-surface-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Reviews</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Avg Variance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Accurate (±15%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Over-estimated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Under-estimated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-surface-100">
                {teamAccuracy.map((team) => (
                  <tr key={team.team} className="hover:bg-surface-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-surface-900 capitalize">
                      {team.team.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-surface-600">
                      {team.total_reviews}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap font-medium ${getVarianceColor(team.avg_variance)}`}>
                      {formatPercent(team.avg_variance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {team.accurate_count} ({((team.accurate_count / team.total_reviews) * 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                        {team.overestimate_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {team.underestimate_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Individual Reviews Table */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-100 bg-surface-50 flex justify-between items-center">
              <h2 className="font-display text-lg font-bold text-surface-900">Review Details</h2>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="input-field text-sm"
              >
                <option value="all">All Teams</option>
                {teams.map(team => (
                  <option key={team} value={team} className="capitalize">
                    {team.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <table className="min-w-full divide-y divide-surface-100">
              <thead className="bg-surface-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Proposal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Review Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase">Projected</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase">Actual</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase">Variance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-surface-100">
                {filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-surface-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/implementation/forms/${review.form_id}`}
                        className="text-implementation-600 hover:underline line-clamp-1"
                      >
                        {review.form_title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600 capitalize">
                      {review.team.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600">
                      {review.review_type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-surface-600">
                      {formatCurrency(review.projected_annual_value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-surface-900 font-medium">
                      {formatCurrency(review.actual_annual_value || 0)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${getVarianceColor(review.variance_percentage)}`}>
                      {review.variance_percentage !== null ? formatPercent(review.variance_percentage) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        review.recommendation === 'expand' ? 'bg-green-100 text-green-800' :
                        review.recommendation === 'continue' ? 'bg-blue-100 text-blue-800' :
                        review.recommendation === 'modify' ? 'bg-amber-100 text-amber-800' :
                        review.recommendation === 'pause' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {review.recommendation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

