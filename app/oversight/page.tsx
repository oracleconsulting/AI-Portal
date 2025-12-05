'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { OversightSuggestion, MeetingTranscript, IdentificationForm } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import {
  Shield,
  AlertTriangle,
  Wallet,
  Lock,
  FileStack,
  MessageSquare,
  ArrowUpRight,
  CheckCircle2,
  Clock,
} from 'lucide-react'

export default function OversightDashboard() {
  const supabase = createClient()
  const [suggestions, setSuggestions] = useState<OversightSuggestion[]>([])
  const [transcripts, setTranscripts] = useState<MeetingTranscript[]>([])
  const [implementationForms, setImplementationForms] = useState<IdentificationForm[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      // Fetch oversight suggestions
      const { data: suggestionsData } = await supabase
        .from('oversight_suggestions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (suggestionsData) setSuggestions(suggestionsData)

      // Fetch meeting transcripts
      const { data: transcriptsData } = await supabase
        .from('meeting_transcripts')
        .select('*')
        .eq('committee', 'oversight')
        .order('meeting_date', { ascending: false })
        .limit(3)

      if (transcriptsData) setTranscripts(transcriptsData)

      // Fetch implementation forms for oversight review
      const { data: formsData } = await supabase
        .from('identification_forms')
        .select('*')
        .in('status', ['submitted', 'under_review', 'approved'])
        .order('created_at', { ascending: false })
        .limit(5)

      if (formsData) setImplementationForms(formsData)

      setIsLoading(false)
    }

    fetchData()
  }, [supabase])

  // Calculate summary stats
  const totalProposedCost = implementationForms.reduce((sum, f) => sum + (f.cost_of_solution || 0), 0)
  const pendingReview = suggestions.filter(s => s.status === 'pending').length
  const highRiskItems = suggestions.filter(s => s.risk_level === 'high').length

  const categoryIcons = {
    cost: Wallet,
    security: Lock,
    risk: AlertTriangle,
    general: MessageSquare,
  }

  const riskColors = {
    low: 'text-green-600 bg-green-50',
    medium: 'text-amber-600 bg-amber-50',
    high: 'text-red-600 bg-red-50',
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-surface-900 mb-2">
            Oversight Dashboard
          </h1>
          <p className="text-surface-600">
            Monitor security, costs, and governance across AI initiatives
          </p>
        </div>
        <Link href="/oversight/transcripts/new" className="btn-oversight flex items-center gap-2">
          <FileStack className="w-5 h-5" />
          New Transcript
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card border-l-4 border-l-oversight-500">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-oversight-100">
              <Wallet className="w-6 h-6 text-oversight-600" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Total Proposed Cost</p>
              <p className="text-2xl font-bold text-surface-900">{formatCurrency(totalProposedCost)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-l-blue-500">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Pending Review</p>
              <p className="text-2xl font-bold text-surface-900">{pendingReview}</p>
            </div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-l-red-500">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-100">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-surface-500">High Risk Items</p>
              <p className="text-2xl font-bold text-surface-900">{highRiskItems}</p>
            </div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-l-green-500">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Active Projects</p>
              <p className="text-2xl font-bold text-surface-900">{implementationForms.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Implementation Proposals for Review */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-surface-100 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-surface-900">
              Implementation Proposals
            </h2>
            <Link 
              href="/oversight/proposals" 
              className="text-oversight-600 hover:text-oversight-700 text-sm font-medium flex items-center gap-1"
            >
              View all
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-surface-500">Loading...</div>
          ) : implementationForms.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-10 h-10 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-600">No proposals to review</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-100">
              {implementationForms.map((form) => (
                <div key={form.id} className="p-4 hover:bg-surface-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-medium text-surface-900 truncate mb-1">
                        {form.problem_identified}
                      </h3>
                      <p className="text-sm text-surface-500">
                        {formatDate(form.created_at)} • {form.submitted_by_name}
                      </p>
                    </div>
                    {form.cost_of_solution && (
                      <span className="text-sm font-semibold text-surface-900">
                        {formatCurrency(form.cost_of_solution)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Meeting Transcripts */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-surface-100 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-surface-900">
              Recent Transcripts
            </h2>
            <Link 
              href="/oversight/transcripts" 
              className="text-oversight-600 hover:text-oversight-700 text-sm font-medium flex items-center gap-1"
            >
              View all
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-surface-500">Loading...</div>
          ) : transcripts.length === 0 ? (
            <div className="p-12 text-center">
              <FileStack className="w-10 h-10 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-600 mb-4">No transcripts yet</p>
              <Link href="/oversight/transcripts/new" className="btn-oversight inline-flex items-center gap-2">
                Add First Transcript
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-surface-100">
              {transcripts.map((transcript) => (
                <Link
                  key={transcript.id}
                  href={`/oversight/transcripts/${transcript.id}`}
                  className="block p-4 hover:bg-surface-50 transition-colors"
                >
                  <h3 className="font-medium text-surface-900 mb-1">
                    {transcript.title}
                  </h3>
                  <p className="text-sm text-surface-500">
                    {formatDate(transcript.meeting_date)}
                  </p>
                  {transcript.action_items && transcript.action_items.length > 0 && (
                    <p className="text-xs text-oversight-600 mt-2">
                      {transcript.action_items.filter(a => !a.completed).length} action items pending
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Suggestions */}
      <div className="mt-8 bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-surface-100 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-surface-900">
            Recent Suggestions & Ideas
          </h2>
          <Link 
            href="/oversight/suggestions" 
            className="text-oversight-600 hover:text-oversight-700 text-sm font-medium flex items-center gap-1"
          >
            View all
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-surface-500">Loading...</div>
        ) : suggestions.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-10 h-10 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-600">No suggestions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {suggestions.map((suggestion) => {
              const Icon = categoryIcons[suggestion.category]
              return (
                <div key={suggestion.id} className="p-4 hover:bg-surface-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-oversight-50">
                      <Icon className="w-5 h-5 text-oversight-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-surface-900">{suggestion.title}</h3>
                        {suggestion.risk_level && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskColors[suggestion.risk_level]}`}>
                            {suggestion.risk_level} risk
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-surface-600 line-clamp-2">{suggestion.description}</p>
                    </div>
                    {suggestion.estimated_cost && (
                      <span className="text-sm font-medium text-surface-900">
                        {formatCurrency(suggestion.estimated_cost)}
                      </span>
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

