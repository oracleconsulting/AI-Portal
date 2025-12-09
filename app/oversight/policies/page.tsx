'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { StatusBadge } from '@/components/StatusBadge'
import {
  FileText,
  Plus,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import type { PolicyStatus, PolicyCategory } from '@/types/database'

interface PolicyDocument {
  id: string
  policy_code: string | null
  title: string
  category: PolicyCategory
  summary: string | null
  version: string
  status: PolicyStatus
  effective_from: string | null
  review_date: string | null
  created_at: string
  updated_at: string
}

const CATEGORY_LABELS: Record<PolicyCategory, string> = {
  acceptable_use: 'Acceptable Use',
  security: 'Security',
  data_handling: 'Data Handling',
  procurement: 'Procurement',
  training: 'Training',
  governance: 'Governance',
  compliance: 'Compliance',
  other: 'Other',
}

const CATEGORY_COLORS: Record<PolicyCategory, string> = {
  acceptable_use: 'bg-blue-100 text-blue-800',
  security: 'bg-red-100 text-red-800',
  data_handling: 'bg-purple-100 text-purple-800',
  procurement: 'bg-green-100 text-green-800',
  training: 'bg-yellow-100 text-yellow-800',
  governance: 'bg-indigo-100 text-indigo-800',
  compliance: 'bg-orange-100 text-orange-800',
  other: 'bg-surface-100 text-surface-800',
}

export default function PoliciesPage() {
  const supabase = createClient()

  const [policies, setPolicies] = useState<PolicyDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchPolicies()
  }, [])

  async function fetchPolicies() {
    const { data, error } = await supabase
      .from('policy_documents')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      setError('Failed to load policies')
      setLoading(false)
      return
    }

    setPolicies(data || [])
    setLoading(false)
  }

  const filteredPolicies = policies.filter(policy => {
    if (statusFilter !== 'all' && policy.status !== statusFilter) return false
    if (categoryFilter !== 'all' && policy.category !== categoryFilter) return false
    if (searchQuery) {
      const search = searchQuery.toLowerCase()
      return (
        policy.title.toLowerCase().includes(search) ||
        (policy.policy_code?.toLowerCase().includes(search)) ||
        (policy.summary?.toLowerCase().includes(search))
      )
    }
    return true
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const isReviewOverdue = (reviewDate: string | null) => {
    if (!reviewDate) return false
    return new Date(reviewDate) < new Date()
  }

  // Stats
  const stats = {
    total: policies.length,
    approved: policies.filter(p => p.status === 'approved').length,
    draft: policies.filter(p => p.status === 'draft').length,
    pendingReview: policies.filter(p => p.review_date && isReviewOverdue(p.review_date) && p.status === 'approved').length,
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-oversight-500" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl gradient-oversight">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">AI Policies</h1>
            <p className="text-surface-600 mt-1">
              Manage AI usage policies, guidelines, and governance documents
            </p>
          </div>
        </div>
        <Link
          href="/oversight/policies/new"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Policy
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4">
          <div className="text-2xl font-bold text-surface-900">{stats.total}</div>
          <div className="text-sm text-surface-500">Total Policies</div>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          <div className="text-sm text-surface-500">Active Policies</div>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4">
          <div className="text-2xl font-bold text-surface-600">{stats.draft}</div>
          <div className="text-sm text-surface-500">Drafts</div>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.pendingReview}</div>
          <div className="text-sm text-surface-500">Review Overdue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="superseded">Superseded</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Policies List */}
      {filteredPolicies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-8 text-center">
          <p className="text-surface-500">
            {policies.length === 0
              ? 'No policies created yet. Create your first policy to get started.'
              : 'No policies match your filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-surface-100">
            <thead className="bg-surface-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                  Policy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                  Review Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-surface-100">
              {filteredPolicies.map((policy) => (
                <tr key={policy.id} className="hover:bg-surface-50">
                  <td className="px-6 py-4">
                    <div>
                      <Link
                        href={`/oversight/policies/${policy.id}`}
                        className="font-medium text-surface-900 hover:text-oversight-600"
                      >
                        {policy.title}
                      </Link>
                      {policy.policy_code && (
                        <span className="ml-2 text-xs text-surface-500">
                          ({policy.policy_code})
                        </span>
                      )}
                      {policy.summary && (
                        <p className="text-sm text-surface-500 mt-1 line-clamp-1">
                          {policy.summary}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${CATEGORY_COLORS[policy.category]}`}>
                      {CATEGORY_LABELS[policy.category]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={policy.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500">
                    v{policy.version}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {policy.review_date ? (
                      <span className={isReviewOverdue(policy.review_date) ? 'text-red-600 font-medium' : 'text-surface-500'}>
                        {formatDate(policy.review_date)}
                        {isReviewOverdue(policy.review_date) && ' ⚠️'}
                      </span>
                    ) : (
                      <span className="text-surface-400">Not set</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <Link
                      href={`/oversight/policies/${policy.id}`}
                      className="text-oversight-600 hover:text-oversight-700 mr-4"
                    >
                      View
                    </Link>
                    <Link
                      href={`/oversight/policies/${policy.id}/acknowledgments`}
                      className="text-oversight-600 hover:text-oversight-700 mr-4"
                    >
                      Acknowledgments
                    </Link>
                    <Link
                      href={`/oversight/policies/${policy.id}/edit`}
                      className="text-surface-600 hover:text-surface-800"
                    >
                      Edit
                    </Link>
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

