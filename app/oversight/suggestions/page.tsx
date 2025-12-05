'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { OversightSuggestion } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import {
  PlusCircle,
  MessageSquare,
  Search,
  Filter,
  Wallet,
  Lock,
  AlertTriangle,
} from 'lucide-react'

export default function SuggestionsPage() {
  const supabase = createClient()
  const [suggestions, setSuggestions] = useState<OversightSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'cost' | 'security' | 'risk' | 'general'>('all')

  useEffect(() => {
    const fetchSuggestions = async () => {
      const { data } = await supabase
        .from('oversight_suggestions')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) {
        setSuggestions(data)
      }
      setIsLoading(false)
    }

    fetchSuggestions()
  }, [supabase])

  const filteredSuggestions = suggestions
    .filter((suggestion) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          suggestion.title.toLowerCase().includes(query) ||
          suggestion.description.toLowerCase().includes(query)
        )
      }
      return true
    })
    .filter((suggestion) => categoryFilter === 'all' || suggestion.category === categoryFilter)

  const categoryIcons = {
    cost: Wallet,
    security: Lock,
    risk: AlertTriangle,
    general: MessageSquare,
  }

  const categoryColors = {
    cost: 'bg-green-100 text-green-700 border-green-200',
    security: 'bg-blue-100 text-blue-700 border-blue-200',
    risk: 'bg-red-100 text-red-700 border-red-200',
    general: 'bg-surface-100 text-surface-700 border-surface-200',
  }

  const riskColors = {
    low: 'bg-green-50 text-green-700',
    medium: 'bg-amber-50 text-amber-700',
    high: 'bg-red-50 text-red-700',
  }

  const statusColors = {
    pending: 'bg-surface-100 text-surface-600',
    reviewed: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-surface-900 mb-2">
            Suggestions & Ideas
          </h1>
          <p className="text-surface-600">
            {filteredSuggestions.length} suggestions
          </p>
        </div>
        <Link href="/oversight/suggestions/new" className="btn-oversight flex items-center gap-2">
          <PlusCircle className="w-5 h-5" />
          New Suggestion
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
                placeholder="Search suggestions..."
                className="input-field pl-12"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-surface-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
              className="input-field py-2 pr-10"
            >
              <option value="all">All Categories</option>
              <option value="cost">Cost</option>
              <option value="security">Security</option>
              <option value="risk">Risk</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-surface-500">Loading...</div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-surface-300 mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-surface-900 mb-2">
              No suggestions found
            </h3>
            <p className="text-surface-600 mb-6">
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first suggestion to get started.'}
            </p>
            {!searchQuery && categoryFilter === 'all' && (
              <Link href="/oversight/suggestions/new" className="btn-oversight inline-flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Add Suggestion
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {filteredSuggestions.map((suggestion) => {
              const Icon = categoryIcons[suggestion.category]
              return (
                <div key={suggestion.id} className="p-6 hover:bg-surface-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl border ${categoryColors[suggestion.category]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display text-lg font-semibold text-surface-900">
                          {suggestion.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[suggestion.status]}`}>
                          {suggestion.status}
                        </span>
                      </div>
                      <p className="text-surface-600 mb-3">{suggestion.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-surface-500">{formatDate(suggestion.created_at)}</span>
                        {suggestion.risk_level && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskColors[suggestion.risk_level]}`}>
                            {suggestion.risk_level} risk
                          </span>
                        )}
                      </div>
                    </div>
                    {suggestion.estimated_cost && (
                      <div className="text-right">
                        <p className="text-sm text-surface-500">Est. Cost</p>
                        <p className="text-lg font-semibold text-surface-900">
                          {formatCurrency(suggestion.estimated_cost)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

