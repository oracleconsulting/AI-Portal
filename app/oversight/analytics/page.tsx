'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { OversightSuggestion, IdentificationForm } from '@/types/database'
import { formatCurrency } from '@/lib/utils'
import {
  Wallet,
  Lock,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  Clock,
  FileText,
  BarChart3,
} from 'lucide-react'

export default function OversightAnalyticsPage() {
  const supabase = createClient()
  const [suggestions, setSuggestions] = useState<OversightSuggestion[]>([])
  const [forms, setForms] = useState<IdentificationForm[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [suggestionsResult, formsResult] = await Promise.all([
        supabase.from('oversight_suggestions').select('*'),
        supabase.from('identification_forms').select('*'),
      ])

      if (suggestionsResult.data) setSuggestions(suggestionsResult.data)
      if (formsResult.data) setForms(formsResult.data)
      setIsLoading(false)
    }

    fetchData()
  }, [supabase])

  // Calculate metrics
  const totalProposedCost = forms.reduce((sum, f) => sum + (f.cost_of_solution || 0), 0)
  const approvedCost = forms
    .filter(f => f.status === 'approved' || f.status === 'completed')
    .reduce((sum, f) => sum + (f.cost_of_solution || 0), 0)

  const categoryCounts = suggestions.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const riskCounts = suggestions.reduce((acc, s) => {
    if (s.risk_level) {
      acc[s.risk_level] = (acc[s.risk_level] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const statusCounts = suggestions.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const formStatusCounts = forms.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const categoryIcons = {
    cost: Wallet,
    security: Lock,
    risk: AlertTriangle,
    general: MessageSquare,
  }

  const categoryColors = {
    cost: '#22c55e',
    security: '#3b82f6',
    risk: '#ef4444',
    general: '#64748b',
  }

  const riskColors = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#ef4444',
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-surface-900 mb-2">
          Oversight Analytics
        </h1>
        <p className="text-surface-600">
          Budget tracking, risk assessment, and governance metrics
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-surface-500">Loading analytics...</div>
      ) : (
        <>
          {/* Budget Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="stat-card border-l-4 border-l-oversight-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-oversight-100">
                  <Wallet className="w-6 h-6 text-oversight-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-surface-900">{formatCurrency(totalProposedCost)}</p>
              <p className="text-sm text-surface-500 mt-1">Total Proposed Budget</p>
            </div>

            <div className="stat-card border-l-4 border-l-green-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-green-100">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-surface-900">{formatCurrency(approvedCost)}</p>
              <p className="text-sm text-surface-500 mt-1">Approved Investment</p>
            </div>

            <div className="stat-card border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-blue-100">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-surface-900">{forms.length}</p>
              <p className="text-sm text-surface-500 mt-1">Total Proposals</p>
            </div>

            <div className="stat-card border-l-4 border-l-red-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-red-100">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-surface-900">{riskCounts['high'] || 0}</p>
              <p className="text-sm text-surface-500 mt-1">High Risk Items</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Suggestions by Category */}
            <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
              <h2 className="font-display text-lg font-bold text-surface-900 mb-6">
                Suggestions by Category
              </h2>
              {Object.keys(categoryCounts).length === 0 ? (
                <div className="text-center py-8 text-surface-500">No suggestions yet</div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(categoryCounts).map(([category, count]) => {
                    const Icon = categoryIcons[category as keyof typeof categoryIcons]
                    const percentage = (count / suggestions.length) * 100
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" style={{ color: categoryColors[category as keyof typeof categoryColors] }} />
                            <span className="text-sm font-medium text-surface-700 capitalize">{category}</span>
                          </div>
                          <span className="text-sm text-surface-500">{count}</span>
                        </div>
                        <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: categoryColors[category as keyof typeof categoryColors]
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Risk Distribution */}
            <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
              <h2 className="font-display text-lg font-bold text-surface-900 mb-6">
                Risk Distribution
              </h2>
              {Object.keys(riskCounts).length === 0 ? (
                <div className="text-center py-8 text-surface-500">No risk assessments yet</div>
              ) : (
                <div className="space-y-4">
                  {(['low', 'medium', 'high'] as const).map((risk) => {
                    const count = riskCounts[risk] || 0
                    const total = Object.values(riskCounts).reduce((a, b) => a + b, 0)
                    const percentage = total > 0 ? (count / total) * 100 : 0
                    return (
                      <div key={risk}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-surface-700 capitalize">{risk} Risk</span>
                          <span className="text-sm text-surface-500">{count}</span>
                        </div>
                        <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: riskColors[risk]
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Proposal Status Pipeline */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6">
            <h2 className="font-display text-lg font-bold text-surface-900 mb-6">
              Implementation Proposal Pipeline
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { status: 'draft', label: 'Draft', color: 'bg-surface-100 text-surface-600' },
                { status: 'submitted', label: 'Submitted', color: 'bg-blue-100 text-blue-700' },
                { status: 'under_review', label: 'Review', color: 'bg-amber-100 text-amber-700' },
                { status: 'approved', label: 'Approved', color: 'bg-green-100 text-green-700' },
                { status: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
                { status: 'in_progress', label: 'Active', color: 'bg-purple-100 text-purple-700' },
                { status: 'completed', label: 'Complete', color: 'bg-implementation-100 text-implementation-700' },
              ].map(({ status, label, color }) => (
                <div key={status} className={`p-4 rounded-xl ${color} text-center`}>
                  <p className="text-2xl font-bold">{formStatusCounts[status] || 0}</p>
                  <p className="text-sm font-medium mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

