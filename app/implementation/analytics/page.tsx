'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { IdentificationForm } from '@/types/database'
import { formatCurrency, calculateROI } from '@/lib/utils'
import {
  TrendingUp,
  Clock,
  Wallet,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

export default function ImplementationAnalyticsPage() {
  const supabase = createClient()
  const [forms, setForms] = useState<IdentificationForm[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchForms = async () => {
      const { data } = await supabase
        .from('identification_forms')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) {
        setForms(data)
      }
      setIsLoading(false)
    }

    fetchForms()
  }, [supabase])

  // Calculate analytics
  const totalCost = forms.reduce((sum, f) => sum + (f.cost_of_solution || 0), 0)
  const totalTimeSaved = forms.reduce((sum, f) => sum + (f.time_saving_hours || 0), 0)
  const annualSavings = totalTimeSaved * 75 * 52 // £75/hour, 52 weeks

  const statusCounts = forms.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const priorityCounts = forms.reduce((acc, f) => {
    acc[f.priority] = (acc[f.priority] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const formsWithROI = forms
    .filter(f => f.cost_of_solution && f.time_saving_hours)
    .map(f => ({
      ...f,
      roi: calculateROI(f.cost_of_solution, f.time_saving_hours) || 0,
    }))
    .sort((a, b) => b.roi - a.roi)

  const avgROI = formsWithROI.length > 0
    ? formsWithROI.reduce((sum, f) => sum + f.roi, 0) / formsWithROI.length
    : 0

  const statusColors = {
    draft: '#94a3b8',
    submitted: '#3b82f6',
    under_review: '#f59e0b',
    approved: '#22c55e',
    rejected: '#ef4444',
    in_progress: '#a855f7',
    completed: '#14b8a6',
  }

  const priorityColors = {
    low: '#94a3b8',
    medium: '#3b82f6',
    high: '#f59e0b',
    critical: '#ef4444',
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-surface-900 mb-2">
          Implementation Analytics
        </h1>
        <p className="text-surface-600">
          Overview of AI implementation opportunities and ROI
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-surface-500">Loading analytics...</div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-implementation-100">
                  <Wallet className="w-6 h-6 text-implementation-600" />
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-surface-100 text-surface-600">
                  Total Investment
                </span>
              </div>
              <p className="text-3xl font-bold text-surface-900">{formatCurrency(totalCost)}</p>
              <p className="text-sm text-surface-500 mt-1">Across {forms.length} forms</p>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-green-100">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600">
                  Weekly Savings
                </span>
              </div>
              <p className="text-3xl font-bold text-surface-900">{totalTimeSaved} hrs</p>
              <p className="text-sm text-surface-500 mt-1">Per week saved</p>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-blue-100">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                  Annual Value
                </span>
              </div>
              <p className="text-3xl font-bold text-surface-900">{formatCurrency(annualSavings)}</p>
              <p className="text-sm text-surface-500 mt-1">Projected savings @ £75/hr</p>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-amber-100">
                  <BarChart3 className="w-6 h-6 text-amber-600" />
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-600">
                  Average ROI
                </span>
              </div>
              <p className="text-3xl font-bold text-surface-900">{avgROI.toFixed(0)}%</p>
              <p className="text-sm text-surface-500 mt-1">First year return</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Status Distribution */}
            <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
              <h2 className="font-display text-lg font-bold text-surface-900 mb-6">
                Status Distribution
              </h2>
              <div className="space-y-4">
                {Object.entries(statusCounts).map(([status, count]) => {
                  const percentage = (count / forms.length) * 100
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-surface-700 capitalize">
                          {status.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-surface-500">{count}</span>
                      </div>
                      <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: statusColors[status as keyof typeof statusColors]
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
              <h2 className="font-display text-lg font-bold text-surface-900 mb-6">
                Priority Distribution
              </h2>
              <div className="space-y-4">
                {Object.entries(priorityCounts).map(([priority, count]) => {
                  const percentage = (count / forms.length) * 100
                  return (
                    <div key={priority}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-surface-700 capitalize">
                          {priority}
                        </span>
                        <span className="text-sm text-surface-500">{count}</span>
                      </div>
                      <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: priorityColors[priority as keyof typeof priorityColors]
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Top ROI Opportunities */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-surface-100">
              <h2 className="font-display text-lg font-bold text-surface-900">
                Top ROI Opportunities
              </h2>
            </div>
            {formsWithROI.length === 0 ? (
              <div className="p-12 text-center text-surface-500">
                No forms with ROI data yet. Add cost and time savings to your forms.
              </div>
            ) : (
              <div className="divide-y divide-surface-100">
                {formsWithROI.slice(0, 10).map((form, index) => (
                  <div key={form.id} className="flex items-center gap-4 p-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index < 3 ? 'bg-implementation-100 text-implementation-700' : 'bg-surface-100 text-surface-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-surface-900 truncate">
                        {form.problem_identified}
                      </h3>
                      <p className="text-sm text-surface-500">
                        Cost: {formatCurrency(form.cost_of_solution || 0)} • 
                        Saves {form.time_saving_hours}hrs/week
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                      <ArrowUp className="w-4 h-4" />
                      <span className="font-bold">{form.roi.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

