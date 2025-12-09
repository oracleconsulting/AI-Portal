'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft,
  BarChart3,
  Loader2,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
} from 'lucide-react'

interface UsageData {
  tool_id: string
  usage_date: string
  team: string
  total_uses: number
  total_tokens_input: number
  total_tokens_output: number
  total_cost: number
  avg_duration_ms: number
  unique_users: number
  successful_uses: number
}

interface Tool {
  id: string
  name: string
  vendor: string
}

export default function ToolUsagePage() {
  const params = useParams()
  const toolId = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [tool, setTool] = useState<Tool | null>(null)
  const [usageData, setUsageData] = useState<UsageData[]>([])
  const [totals, setTotals] = useState({
    total_uses: 0,
    total_cost: 0,
    unique_users: 0,
  })
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchData()
  }, [toolId, dateRange])

  async function fetchData() {
    setLoading(true)

    // Fetch tool
    const { data: toolData } = await supabase
      .from('ai_tools')
      .select('id, name, vendor')
      .eq('id', toolId)
      .single()

    setTool(toolData)

    // Fetch usage data
    const response = await fetch(
      `/api/tools/usage?tool_id=${toolId}&start_date=${dateRange.start}&end_date=${dateRange.end}`
    )

    if (response.ok) {
      const data = await response.json()
      setUsageData(data.data || [])
      setTotals(data.totals || { total_uses: 0, total_cost: 0, unique_users: 0 })
    }

    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-oversight-500" />
      </div>
    )
  }

  if (!tool) {
    return (
      <div className="p-8 text-center">
        <h2 className="font-display text-xl font-bold text-surface-900 mb-2">Tool not found</h2>
        <Link href="/oversight/tools" className="text-oversight-600 hover:underline mt-4 inline-block">
          Back to Tool Registry
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link 
          href={`/oversight/tools/${toolId}`} 
          className="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {tool.name}
        </Link>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl gradient-oversight">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">Usage Analytics: {tool.name}</h1>
            <p className="text-surface-600 mt-1">Track tool usage, costs, and adoption</p>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4 mb-6">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-oversight-500" />
            <span className="text-sm text-surface-600">Total Uses</span>
          </div>
          <p className="text-2xl font-bold text-surface-900">{totals.total_uses}</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm text-surface-600">Total Cost</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.total_cost)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-surface-600">Unique Users</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{totals.unique_users}</p>
        </div>
      </div>

      {/* Usage Table */}
      {usageData.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-8 text-center">
          <BarChart3 className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <p className="text-surface-500">
            No usage data for this period. Usage will appear here once the tool is used.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-surface-100">
            <thead className="bg-surface-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Team</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase">Uses</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase">Tokens</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase">Cost</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase">Avg Duration</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase">Users</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-surface-100">
              {usageData.map((day, index) => (
                <tr key={index} className="hover:bg-surface-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-900">
                    {formatDate(day.usage_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600 capitalize">
                    {day.team?.replace(/_/g, ' ') || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-surface-900">
                    {day.total_uses}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-surface-600">
                    {((day.total_tokens_input || 0) + (day.total_tokens_output || 0)).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-surface-900">
                    {formatCurrency(day.total_cost || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-surface-600">
                    {day.avg_duration_ms ? `${Math.round(day.avg_duration_ms / 1000)}s` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-surface-600">
                    {day.unique_users}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

