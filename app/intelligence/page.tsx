'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ExternalLink, Star, Filter, AlertCircle, TrendingUp, Users, FileText } from 'lucide-react'
import { format } from 'date-fns'

interface IntelligenceItem {
  id: string
  source_name: string
  category: 'industry' | 'regulatory' | 'technology' | 'competitor'
  title: string
  summary: string | null
  url: string
  published_at: string | null
  ai_summary: string | null
  ai_relevance_score: number | null
  ai_tags: string[] | null
  ai_competitors_mentioned: string[] | null
  ai_action_required: boolean
  is_read: boolean
  is_starred: boolean
}

export default function IntelligencePage() {
  const supabase = createClient()
  const [items, setItems] = useState<IntelligenceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    category: 'all' as string,
    relevance: 'all' as string,
    status: 'unread' as string,
  })

  useEffect(() => {
    fetchItems()
  }, [filter])

  async function fetchItems() {
    setLoading(true)
    let query = supabase
      .from('intelligence_items')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(100)

    if (filter.category !== 'all') {
      query = query.eq('category', filter.category)
    }
    if (filter.relevance === 'high') {
      query = query.gte('ai_relevance_score', 7)
    }
    if (filter.status === 'unread') {
      query = query.eq('is_read', false)
    }
    if (filter.status === 'starred') {
      query = query.eq('is_starred', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching items:', error)
    } else {
      setItems((data as IntelligenceItem[]) || [])
    }
    setLoading(false)
  }

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from('intelligence_items').update({ is_read: true }).eq('id', id)
    if (!error) {
      setItems(items.map(i => (i.id === id ? { ...i, is_read: true } : i)))
    }
  }

  const toggleStar = async (id: string, current: boolean) => {
    const { error } = await supabase.from('intelligence_items').update({ is_starred: !current }).eq('id', id)
    if (!error) {
      setItems(items.map(i => (i.id === id ? { ...i, is_starred: !current } : i)))
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'regulatory':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'competitor':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'industry':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'technology':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-surface-100 text-surface-800 border-surface-200'
    }
  }

  // Stats
  const stats = {
    unread: items.filter(i => !i.is_read).length,
    actionRequired: items.filter(i => i.ai_action_required).length,
    highRelevance: items.filter(i => (i.ai_relevance_score || 0) >= 7).length,
    competitorMentions: items.filter(i => (i.ai_competitors_mentioned?.length || 0) > 0).length,
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-implementation-600 mx-auto mb-4"></div>
          <p className="text-surface-600">Loading intelligence items...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-surface-900">Intelligence Hub</h1>
          <p className="text-surface-500 mt-1">
            AI-curated industry news, competitor moves, and regulatory updates
          </p>
        </div>
        <Link
          href="/intelligence/competitors"
          className="btn-secondary flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          Competitor Tracker
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold text-surface-900">{stats.unread}</div>
            <FileText className="w-5 h-5 text-surface-400" />
          </div>
          <div className="text-sm text-surface-500">Unread Items</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold text-red-600">{stats.actionRequired}</div>
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-sm text-surface-500">Action Required</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold text-green-600">{stats.highRelevance}</div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-sm text-surface-500">High Relevance</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold text-orange-600">{stats.competitorMentions}</div>
            <Users className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-sm text-surface-500">Competitor Mentions</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-surface-400" />
            <span className="text-sm font-medium text-surface-700">Filters:</span>
          </div>
          <select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="input-field w-auto"
          >
            <option value="all">All Categories</option>
            <option value="regulatory">Regulatory</option>
            <option value="competitor">Competitors</option>
            <option value="industry">Industry</option>
            <option value="technology">Technology</option>
          </select>

          <select
            value={filter.relevance}
            onChange={(e) => setFilter({ ...filter, relevance: e.target.value })}
            className="input-field w-auto"
          >
            <option value="all">All Relevance</option>
            <option value="high">High Relevance (7+)</option>
          </select>

          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="input-field w-auto"
          >
            <option value="all">All Items</option>
            <option value="unread">Unread Only</option>
            <option value="starred">Starred</option>
          </select>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-8 text-center text-surface-600">
            <p>No intelligence items found. Items will appear here once feeds are fetched.</p>
            <p className="text-sm mt-2">Admin users can trigger feed fetching via the API.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl shadow-sm border p-6 ${
                !item.is_read ? 'border-l-4 border-l-implementation-500' : 'border-surface-100'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getCategoryColor(
                        item.category
                      )}`}
                    >
                      {item.category}
                    </span>
                    <span className="text-xs text-surface-500">{item.source_name}</span>
                    {item.ai_relevance_score && (
                      <span
                        className={`text-xs font-medium ${
                          item.ai_relevance_score >= 7 ? 'text-green-600' : 'text-surface-500'
                        }`}
                      >
                        Relevance: {item.ai_relevance_score}/10
                      </span>
                    )}
                    {item.ai_action_required && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
                        ⚡ Action Required
                      </span>
                    )}
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markAsRead(item.id)}
                    className="text-lg font-semibold text-surface-900 hover:text-implementation-600 transition-colors flex items-center gap-2"
                  >
                    {item.title}
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <p className="text-sm text-surface-600 mt-2">
                    {item.ai_summary || item.summary || 'No summary available'}
                  </p>

                  {item.ai_tags && item.ai_tags.length > 0 && (
                    <div className="flex gap-1 mt-3 flex-wrap">
                      {item.ai_tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs bg-surface-100 text-surface-600 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.ai_competitors_mentioned && item.ai_competitors_mentioned.length > 0 && (
                    <div className="mt-3 text-sm">
                      <span className="text-orange-600 font-medium">Competitors: </span>
                      {item.ai_competitors_mentioned.join(', ')}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <button
                    onClick={() => toggleStar(item.id, item.is_starred)}
                    className={`p-2 rounded-lg hover:bg-surface-100 transition-colors ${
                      item.is_starred ? 'text-yellow-500' : 'text-surface-400'
                    }`}
                    title={item.is_starred ? 'Unstar' : 'Star'}
                  >
                    <Star className={`w-5 h-5 ${item.is_starred ? 'fill-current' : ''}`} />
                  </button>
                  {item.published_at && (
                    <span className="text-xs text-surface-400 whitespace-nowrap">
                      {format(new Date(item.published_at), 'dd MMM yyyy')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

