'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { IdentificationForm, Priority, IdentificationStatus } from '@/types/database'
import { formatCurrency, formatDate, calculateROI } from '@/lib/utils'
import Link from 'next/link'
import {
  PlusCircle,
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  TrendingUp,
} from 'lucide-react'

export default function FormsListPage() {
  const supabase = createClient()
  const [forms, setForms] = useState<IdentificationForm[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<IdentificationStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'priority' | 'cost' | 'roi'>('created_at')

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

  // Filter and sort forms
  const filteredForms = forms
    .filter((form) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          form.problem_identified.toLowerCase().includes(query) ||
          form.solution?.toLowerCase().includes(query) ||
          form.submitted_by_name?.toLowerCase().includes(query)
        )
      }
      return true
    })
    .filter((form) => statusFilter === 'all' || form.status === statusFilter)
    .filter((form) => priorityFilter === 'all' || form.priority === priorityFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case 'cost':
          return (b.cost_of_solution || 0) - (a.cost_of_solution || 0)
        case 'roi':
          const roiA = calculateROI(a.cost_of_solution, a.time_saving_hours) || 0
          const roiB = calculateROI(b.cost_of_solution, b.time_saving_hours) || 0
          return roiB - roiA
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

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
            All Identification Forms
          </h1>
          <p className="text-surface-600">
            {filteredForms.length} forms found
          </p>
        </div>
        <Link href="/implementation/new" className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-5 h-5" />
          New Form
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-surface-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search forms..."
                className="input-field pl-12"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-surface-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as IdentificationStatus | 'all')}
              className="input-field py-2 pr-10"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
            className="input-field py-2 pr-10"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-surface-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="input-field py-2 pr-10"
            >
              <option value="created_at">Newest First</option>
              <option value="priority">Priority</option>
              <option value="cost">Cost (High to Low)</option>
              <option value="roi">ROI (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Forms List */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-surface-500">Loading...</div>
        ) : filteredForms.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-surface-300 mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-surface-900 mb-2">
              No forms found
            </h3>
            <p className="text-surface-600">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first identification form to get started.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {filteredForms.map((form) => {
              const roi = calculateROI(form.cost_of_solution, form.time_saving_hours)
              return (
                <Link
                  key={form.id}
                  href={`/implementation/forms/${form.id}`}
                  className="flex items-start justify-between p-6 hover:bg-surface-50 transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-6">
                    <h3 className="font-medium text-surface-900 mb-2">
                      {form.problem_identified}
                    </h3>
                    {form.solution && (
                      <p className="text-sm text-surface-600 mb-2 line-clamp-2">
                        <span className="font-medium">Solution:</span> {form.solution}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-surface-500">
                      <span>{formatDate(form.created_at)}</span>
                      <span>•</span>
                      <span>{form.submitted_by_name || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${priorityColors[form.priority]}`}>
                        {form.priority}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[form.status]}`}>
                        {form.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      {form.cost_of_solution && (
                        <p className="text-sm font-medium text-surface-900">
                          {formatCurrency(form.cost_of_solution)}
                        </p>
                      )}
                      {form.time_saving_hours && (
                        <p className="text-xs text-surface-500">
                          {form.time_saving_hours}hrs/week saved
                        </p>
                      )}
                      {roi !== null && (
                        <p className="text-xs text-green-600 flex items-center gap-1 justify-end mt-1">
                          <TrendingUp className="w-3 h-3" />
                          {roi.toFixed(0)}% ROI
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

