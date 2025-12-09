'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface CompetitorProfile {
  id: string
  name: string
  ranking: number | null
  website: string | null
  linkedin_url: string | null
  ai_platform_name: string | null
  ai_strategy_summary: string | null
  known_ai_tools: string[] | null
  known_investments: string | null
  last_announcement_date: string | null
  threat_level: 'low' | 'medium' | 'high' | null
  notes: string | null
}

export default function CompetitorTrackerPage() {
  const supabase = createClient()
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompetitors()
  }, [])

  async function fetchCompetitors() {
    setLoading(true)
    const { data, error } = await supabase
      .from('competitor_profiles')
      .select('*')
      .order('ranking', { ascending: true, nullsLast: true })

    if (error) {
      console.error('Error fetching competitors:', error)
    } else {
      setCompetitors((data as CompetitorProfile[]) || [])
    }
    setLoading(false)
  }

  const getThreatColor = (level: string | null) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-surface-100 text-surface-800 border-surface-200'
    }
  }

  const getThreatIcon = (level: string | null) => {
    switch (level) {
      case 'high':
        return <TrendingUp className="w-4 h-4" />
      case 'medium':
        return <Minus className="w-4 h-4" />
      case 'low':
        return <TrendingDown className="w-4 h-4" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-implementation-600 mx-auto mb-4"></div>
          <p className="text-surface-600">Loading competitor profiles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/intelligence"
            className="btn-secondary flex items-center gap-2 mb-4 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Intelligence Hub
          </Link>
          <h1 className="font-display text-3xl font-bold text-surface-900">Competitor Tracker</h1>
          <p className="text-surface-500 mt-1">
            Monitor AI initiatives and strategies of key UK accounting firm competitors
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {competitors.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-8 text-center text-surface-600">
            <p>No competitor profiles found.</p>
          </div>
        ) : (
          competitors.map((competitor) => (
            <div
              key={competitor.id}
              className="bg-white rounded-xl shadow-sm border border-surface-100 p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="font-display text-2xl font-bold text-surface-900">
                      {competitor.name}
                    </h2>
                    {competitor.ranking && (
                      <span className="px-2 py-1 text-xs font-medium bg-surface-100 text-surface-600 rounded">
                        UK Rank #{competitor.ranking}
                      </span>
                    )}
                    {competitor.threat_level && (
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border flex items-center gap-1 ${getThreatColor(
                          competitor.threat_level
                        )}`}
                      >
                        {getThreatIcon(competitor.threat_level)}
                        {competitor.threat_level.toUpperCase()} Threat
                      </span>
                    )}
                  </div>
                  {competitor.ai_platform_name && (
                    <p className="text-sm text-surface-600 mb-1">
                      <span className="font-medium">AI Platform:</span> {competitor.ai_platform_name}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {competitor.website && (
                    <a
                      href={competitor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-sm"
                    >
                      Website
                    </a>
                  )}
                  {competitor.linkedin_url && (
                    <a
                      href={competitor.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-sm"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>

              {competitor.ai_strategy_summary && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-surface-700 mb-2">Strategy Summary</h3>
                  <p className="text-sm text-surface-600">{competitor.ai_strategy_summary}</p>
                </div>
              )}

              {competitor.known_ai_tools && competitor.known_ai_tools.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-surface-700 mb-2">Known AI Tools</h3>
                  <div className="flex gap-2 flex-wrap">
                    {competitor.known_ai_tools.map((tool) => (
                      <span
                        key={tool}
                        className="px-2 py-1 text-xs bg-implementation-50 text-implementation-700 rounded border border-implementation-200"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {competitor.known_investments && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-surface-700 mb-2">Known Investments</h3>
                  <p className="text-sm text-surface-600">{competitor.known_investments}</p>
                </div>
              )}

              {competitor.last_announcement_date && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-surface-700 mb-2">Last Announcement</h3>
                  <p className="text-sm text-surface-600">
                    {new Date(competitor.last_announcement_date).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}

              {competitor.notes && (
                <div className="pt-4 border-t border-surface-100">
                  <h3 className="text-sm font-semibold text-surface-700 mb-2">Notes</h3>
                  <p className="text-sm text-surface-600 whitespace-pre-wrap">{competitor.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

