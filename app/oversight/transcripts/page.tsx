'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { MeetingTranscript } from '@/types/database'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import {
  PlusCircle,
  FileStack,
  Search,
  Calendar,
  CheckCircle2,
  Circle,
} from 'lucide-react'

export default function TranscriptsPage() {
  const supabase = createClient()
  const [transcripts, setTranscripts] = useState<MeetingTranscript[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchTranscripts = async () => {
      const { data } = await supabase
        .from('meeting_transcripts')
        .select('*')
        .eq('committee', 'oversight')
        .order('meeting_date', { ascending: false })

      if (data) {
        setTranscripts(data)
      }
      setIsLoading(false)
    }

    fetchTranscripts()
  }, [supabase])

  const filteredTranscripts = transcripts.filter((transcript) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        transcript.title.toLowerCase().includes(query) ||
        transcript.summary?.toLowerCase().includes(query) ||
        transcript.transcript.toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-surface-900 mb-2">
            Meeting Transcripts
          </h1>
          <p className="text-surface-600">
            {filteredTranscripts.length} transcripts
          </p>
        </div>
        <Link href="/oversight/transcripts/new" className="btn-oversight flex items-center gap-2">
          <PlusCircle className="w-5 h-5" />
          New Transcript
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-surface-100 p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcripts..."
            className="input-field pl-12"
          />
        </div>
      </div>

      {/* Transcripts List */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-surface-500">Loading...</div>
        ) : filteredTranscripts.length === 0 ? (
          <div className="p-12 text-center">
            <FileStack className="w-12 h-12 text-surface-300 mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-surface-900 mb-2">
              No transcripts found
            </h3>
            <p className="text-surface-600 mb-6">
              {searchQuery ? 'Try a different search term' : 'Add your first meeting transcript.'}
            </p>
            {!searchQuery && (
              <Link href="/oversight/transcripts/new" className="btn-oversight inline-flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Add Transcript
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {filteredTranscripts.map((transcript) => {
              const completedActions = transcript.action_items?.filter(a => a.completed).length || 0
              const totalActions = transcript.action_items?.length || 0
              
              return (
                <Link
                  key={transcript.id}
                  href={`/oversight/transcripts/${transcript.id}`}
                  className="block p-6 hover:bg-surface-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-4 h-4 text-oversight-600" />
                        <span className="text-sm text-oversight-600 font-medium">
                          {formatDate(transcript.meeting_date)}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-semibold text-surface-900 mb-2">
                        {transcript.title}
                      </h3>
                      {transcript.summary && (
                        <p className="text-surface-600 line-clamp-2 mb-3">
                          {transcript.summary}
                        </p>
                      )}
                      {totalActions > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          {completedActions === totalActions ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-surface-400" />
                          )}
                          <span className="text-surface-600">
                            {completedActions}/{totalActions} action items complete
                          </span>
                        </div>
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

