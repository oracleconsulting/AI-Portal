'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { IdentificationForm } from '@/types/database'
import { formatCurrency, formatDate, calculateROI } from '@/lib/utils'
import Link from 'next/link'
import {
  PlusCircle,
  TrendingUp,
  Clock,
  Wallet,
  FileText,
  ArrowUpRight,
  Lightbulb,
} from 'lucide-react'

export default function ImplementationDashboard() {
  const supabase = createClient()
  const [forms, setForms] = useState<IdentificationForm[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchForms = async () => {
      const { data } = await supabase
        .from('identification_forms')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (data) {
        setForms(data)
      }
      setIsLoading(false)
    }

    fetchForms()
  }, [supabase])

  // Calculate totals
  const totalCost = forms.reduce((sum, f) => sum + (f.cost_of_solution || 0), 0)
  const totalTimeSaved = forms.reduce((sum, f) => sum + (f.time_saving_hours || 0), 0)
  const formsCount = forms.length
  const avgROI = forms.filter(f => f.cost_of_solution && f.time_saving_hours).length > 0
    ? forms.reduce((sum, f) => sum + (calculateROI(f.cost_of_solution, f.time_saving_hours) || 0), 0) / 
      forms.filter(f => f.cost_of_solution && f.time_saving_hours).length
    : 0

  const statusColors = {
    draft: 'bg-surface-100 text-surface-600',
    submitted: 'bg-blue-100 text-blue-700',
    under_review: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    in_progress: 'bg-purple-100 text-purple-700',
    completed: 'bg-implementation-100 text-implementation-700',
  }

  const priorityColors = {
    low: 'bg-surface-100 text-surface-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-amber-100 text-amber-700',
    critical: 'bg-red-100 text-red-700',
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-surface-900 mb-2">
            Implementation Dashboard
          </h1>
          <p className="text-surface-600">
            Track AI opportunities and implementation progress
          </p>
        </div>
        <Link href="/implementation/new" className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-5 h-5" />
          New Identification
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-implementation-100">
              <FileText className="w-6 h-6 text-implementation-600" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Total Forms</p>
              <p className="text-2xl font-bold text-surface-900">{formsCount}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Total Cost</p>
              <p className="text-2xl font-bold text-surface-900">{formatCurrency(totalCost)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Time Saved (hrs/week)</p>
              <p className="text-2xl font-bold text-surface-900">{totalTimeSaved}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Avg ROI</p>
              <p className="text-2xl font-bold text-surface-900">{avgROI.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Forms */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-surface-100 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-surface-900">
            Recent Identification Forms
          </h2>
          <Link 
            href="/implementation/forms" 
            className="text-implementation-600 hover:text-implementation-700 text-sm font-medium flex items-center gap-1"
          >
            View all
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-surface-500">Loading...</div>
        ) : forms.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex p-4 rounded-full bg-implementation-50 mb-4">
              <Lightbulb className="w-8 h-8 text-implementation-600" />
            </div>
            <h3 className="font-display text-lg font-semibold text-surface-900 mb-2">
              No forms yet
            </h3>
            <p className="text-surface-600 mb-6">
              Start identifying AI opportunities by creating your first form.
            </p>
            <Link href="/implementation/new" className="btn-primary inline-flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              Create First Form
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {forms.map((form) => (
              <Link
                key={form.id}
                href={`/implementation/forms/${form.id}`}
                className="flex items-center justify-between p-6 hover:bg-surface-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-surface-900 truncate mb-1">
                    {form.problem_identified}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-surface-500">
                    <span>{formatDate(form.created_at)}</span>
                    <span>•</span>
                    <span>{form.submitted_by_name || 'Unknown'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[form.priority]}`}>
                    {form.priority}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[form.status]}`}>
                    {form.status.replace('_', ' ')}
                  </span>
                  {form.cost_of_solution && (
                    <span className="text-sm font-medium text-surface-900">
                      {formatCurrency(form.cost_of_solution)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

