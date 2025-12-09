'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  TrendingUp,
  Loader2,
  BarChart3,
} from 'lucide-react'
import { calculateFullROI, getStaffRates } from '@/lib/utils/roi'

interface TeamPerformance {
  team: string
  display_name: string
  proposals_submitted: number
  proposals_approved: number
  proposals_rejected: number
  proposals_in_progress: number
  proposals_completed: number
  approval_rate: number
  total_projected_value: number
  total_actual_value: number
  total_cost: number
  avg_roi: number
  reviews_completed: number
  reviews_due: number
  active_members: number
}

const TEAM_DISPLAY_NAMES: Record<string, string> = {
  bsg: 'Business Services',
  audit: 'Audit',
  tax: 'Tax',
  corporate_finance: 'Corporate Finance',
  bookkeeping: 'Bookkeeping',
  admin: 'Admin',
}

export default function TeamPerformancePage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<TeamPerformance[]>([])
  const [sortBy, setSortBy] = useState<keyof TeamPerformance>('proposals_submitted')
  const [sortDesc, setSortDesc] = useState(true)

  useEffect(() => {
    fetchTeamData()
  }, [])

  async function fetchTeamData() {
    // Get staff rates once
    const rates = await getStaffRates(supabase)
    
    // Fetch forms
    const { data: forms } = await supabase
      .from('identification_forms')
      .select('*')

    // Fetch reviews
    const { data: reviews } = await supabase
      .from('implementation_reviews')
      .select('*, identification_forms(team)')

    // Fetch profiles for member counts
    const { data: profiles } = await supabase
      .from('profiles')
      .select('team')
      .eq('committee', 'implementation')

    const teamData: Record<string, TeamPerformance> = {}

    // Initialize all teams
    Object.keys(TEAM_DISPLAY_NAMES).forEach(team => {
      teamData[team] = {
        team,
        display_name: TEAM_DISPLAY_NAMES[team],
        proposals_submitted: 0,
        proposals_approved: 0,
        proposals_rejected: 0,
        proposals_in_progress: 0,
        proposals_completed: 0,
        approval_rate: 0,
        total_projected_value: 0,
        total_actual_value: 0,
        total_cost: 0,
        avg_roi: 0,
        reviews_completed: 0,
        reviews_due: 0,
        active_members: 0,
      }
    })

    // Count members per team
    ;(profiles || []).forEach(p => {
      if (p.team && teamData[p.team]) {
        teamData[p.team].active_members++
      }
    })

    // Process forms
    ;(forms || []).forEach(f => {
      const team = f.team || 'unknown'
      if (!teamData[team]) return

      teamData[team].proposals_submitted++

      teamData[team].total_cost += f.cost_of_solution || 0

      // Calculate projected value
      const timeSavings = f.time_savings || []
      if (Array.isArray(timeSavings) && timeSavings.length > 0) {
        const roiSummary = calculateFullROI(timeSavings, f.cost_of_solution || 0, rates)
        teamData[team].total_projected_value += roiSummary.annualValue
      }

      // Count by status
      switch (f.status) {
        case 'approved':
        case 'in_progress':
          teamData[team].proposals_approved++
          if (f.status === 'in_progress') teamData[team].proposals_in_progress++
          break
        case 'completed':
          teamData[team].proposals_approved++
          teamData[team].proposals_completed++
          break
        case 'rejected':
          teamData[team].proposals_rejected++
          break
      }
    })

    // Process reviews
    ;(reviews || []).forEach((r: any) => {
      const team = r.identification_forms?.team
      if (!team || !teamData[team]) return

      teamData[team].reviews_completed++
      if (r.actual_annual_value) {
        teamData[team].total_actual_value += r.actual_annual_value
      }
    })

    // Calculate derived metrics
    Object.values(teamData).forEach(team => {
      if (team.proposals_submitted > 0) {
        team.approval_rate = (team.proposals_approved / team.proposals_submitted) * 100
      }
      if (team.total_cost > 0) {
        team.avg_roi = (team.total_projected_value / team.total_cost) * 100
      }
    })

    setTeams(Object.values(teamData))
    setLoading(false)
  }

  const getStaffRate = (staffLevel: string): number => {
    const rates: Record<string, number> = {
      admin: 80,
      junior: 100,
      senior: 120,
      assistant_manager: 150,
      manager: 175,
      director: 250,
      partner: 400,
    }
    return rates[staffLevel] || 0
  }

  const sortedTeams = [...teams].sort((a, b) => {
    const aVal = a[sortBy]
    const bVal = b[sortBy]
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDesc ? bVal - aVal : aVal - bVal
    }
    return 0
  })

  const handleSort = (column: keyof TeamPerformance) => {
    if (sortBy === column) {
      setSortDesc(!sortDesc)
    } else {
      setSortBy(column)
      setSortDesc(true)
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

  const SortHeader = ({ column, children }: { column: keyof TeamPerformance; children: React.ReactNode }) => (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortBy === column && (
          <span>{sortDesc ? '↓' : '↑'}</span>
        )}
      </div>
    </th>
  )

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-implementation-500" />
      </div>
    )
  }

  // Calculate totals
  const totals = teams.reduce((acc, t) => ({
    proposals: acc.proposals + t.proposals_submitted,
    approved: acc.approved + t.proposals_approved,
    value: acc.value + t.total_projected_value,
    cost: acc.cost + t.total_cost,
  }), { proposals: 0, approved: 0, value: 0, cost: 0 })

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl gradient-implementation">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">Team Performance</h1>
            <p className="text-surface-600 mt-1">
              Compare AI adoption and outcomes across teams
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4">
          <div className="text-2xl font-bold text-surface-900">{totals.proposals}</div>
          <div className="text-sm text-surface-500">Total Proposals</div>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">{totals.approved}</div>
          <div className="text-sm text-surface-500">Approved</div>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4">
          <div className="text-2xl font-bold text-implementation-600">{formatCurrency(totals.value)}</div>
          <div className="text-sm text-surface-500">Projected Annual Value</div>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4">
          <div className="text-2xl font-bold text-surface-600">{formatCurrency(totals.cost)}</div>
          <div className="text-sm text-surface-500">Total Investment</div>
        </div>
      </div>

      {/* Team Comparison Table */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden mb-6">
        <table className="min-w-full divide-y divide-surface-100">
          <thead className="bg-surface-50">
            <tr>
              <SortHeader column="display_name">Team</SortHeader>
              <SortHeader column="active_members">Members</SortHeader>
              <SortHeader column="proposals_submitted">Proposals</SortHeader>
              <SortHeader column="approval_rate">Approval %</SortHeader>
              <SortHeader column="proposals_completed">Completed</SortHeader>
              <SortHeader column="total_projected_value">Projected Value</SortHeader>
              <SortHeader column="avg_roi">Avg ROI</SortHeader>
              <SortHeader column="reviews_completed">Reviews</SortHeader>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-surface-100">
            {sortedTeams.map((team) => (
              <tr key={team.team} className="hover:bg-surface-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-surface-900">
                  {team.display_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-surface-600">
                  {team.active_members}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{team.proposals_submitted}</span>
                    {team.proposals_in_progress > 0 && (
                      <span className="text-xs text-blue-600">
                        ({team.proposals_in_progress} in progress)
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-surface-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${Math.min(team.approval_rate, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-surface-600">{team.approval_rate.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-surface-600">
                  {team.proposals_completed}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-surface-900">
                  {formatCurrency(team.total_projected_value)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={team.avg_roi >= 100 ? 'text-green-600 font-medium' : 'text-surface-600'}>
                    {team.avg_roi.toFixed(0)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-surface-600">
                  {team.reviews_completed}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
          <h3 className="font-semibold text-surface-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Top Performers
          </h3>
          <div className="space-y-2">
            {[...teams]
              .sort((a, b) => b.avg_roi - a.avg_roi)
              .slice(0, 3)
              .map((team, i) => (
                <div key={team.team} className="flex justify-between text-sm">
                  <span>{i + 1}. {team.display_name}</span>
                  <span className="text-green-600 font-medium">{team.avg_roi.toFixed(0)}% ROI</span>
                </div>
              ))}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
          <h3 className="font-semibold text-surface-900 mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-implementation-600" />
            Most Active
          </h3>
          <div className="space-y-2">
            {[...teams]
              .sort((a, b) => b.proposals_submitted - a.proposals_submitted)
              .slice(0, 3)
              .map((team, i) => (
                <div key={team.team} className="flex justify-between text-sm">
                  <span>{i + 1}. {team.display_name}</span>
                  <span className="text-implementation-600 font-medium">{team.proposals_submitted} proposals</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

