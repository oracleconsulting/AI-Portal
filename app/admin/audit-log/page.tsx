'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  History,
  Loader2,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  FileText,
  Plus,
  Edit,
  Trash2,
  Download,
} from 'lucide-react'
import type { AuditLog, AuditAction } from '@/types/database'

const ACTION_CONFIG: Record<AuditAction, { color: string; icon: typeof Plus }> = {
  create: { color: 'bg-green-100 text-green-700', icon: Plus },
  update: { color: 'bg-blue-100 text-blue-700', icon: Edit },
  delete: { color: 'bg-red-100 text-red-700', icon: Trash2 },
  status_change: { color: 'bg-purple-100 text-purple-700', icon: Edit },
  approval: { color: 'bg-green-100 text-green-700', icon: Plus },
  rejection: { color: 'bg-red-100 text-red-700', icon: Trash2 },
  submission: { color: 'bg-blue-100 text-blue-700', icon: FileText },
  review: { color: 'bg-amber-100 text-amber-700', icon: Edit },
  comment: { color: 'bg-surface-100 text-surface-700', icon: FileText },
}

const TABLE_LABELS: Record<string, string> = {
  identification_forms: 'Identification Forms',
  profiles: 'User Profiles',
  meeting_transcripts: 'Meeting Transcripts',
  oversight_suggestions: 'Oversight Suggestions',
  ai_tools: 'AI Tools',
  staff_rates: 'Staff Rates',
  policy_documents: 'Policy Documents',
  implementation_reviews: 'Implementation Reviews',
}

export default function AuditLogPage() {
  const supabase = createClient()
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTable, setFilterTable] = useState<string>('all')
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterDateRange, setFilterDateRange] = useState<string>('week')

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Only jhoward@rpgcc.co.uk has admin access
      if (user.email !== 'jhoward@rpgcc.co.uk') {
        router.push('/dashboard')
        return
      }

      setIsAuthorized(true)
      fetchLogs()
    }

    checkAuth()
  }, [router, supabase, filterDateRange])

  const fetchLogs = async () => {
    setIsLoading(true)
    
    let query = supabase
      .from('audit_log')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(200)

    // Date filter
    const now = new Date()
    let startDate: Date | null = null
    switch (filterDateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0))
        break
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7))
        break
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1))
        break
    }
    if (startDate) {
      query = query.gte('changed_at', startDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching audit logs:', error)
    } else {
      setLogs(data || [])
    }
    setIsLoading(false)
  }

  const filteredLogs = logs.filter(log => {
    if (filterTable !== 'all' && log.table_name !== filterTable) return false
    if (filterAction !== 'all' && log.action !== filterAction) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      if (!log.change_summary?.toLowerCase().includes(search) &&
          !log.changed_by_name?.toLowerCase().includes(search) &&
          !log.changed_by_email?.toLowerCase().includes(search)) {
        return false
      }
    }
    return true
  })

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Table', 'Action', 'User', 'Email', 'Summary'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.changed_at).toISOString(),
        log.table_name,
        log.action,
        log.changed_by_name || '',
        log.changed_by_email || '',
        `"${(log.change_summary || '').replace(/"/g, '""')}"`,
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const renderDiff = (oldVals: Record<string, unknown> | null, newVals: Record<string, unknown> | null) => {
    if (!oldVals && !newVals) return null
    
    const allKeys = new Set([
      ...Object.keys(oldVals || {}),
      ...Object.keys(newVals || {}),
    ])

    const changes: Array<{ key: string; old: unknown; new: unknown }> = []
    allKeys.forEach(key => {
      const oldVal = oldVals?.[key]
      const newVal = newVals?.[key]
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        // Skip metadata fields
        if (!['updated_at', 'created_at'].includes(key)) {
          changes.push({ key, old: oldVal, new: newVal })
        }
      }
    })

    if (changes.length === 0) return <p className="text-sm text-surface-500 italic">No significant changes</p>

    return (
      <div className="space-y-2">
        {changes.slice(0, 10).map(({ key, old, new: newVal }) => (
          <div key={key} className="text-sm">
            <span className="font-medium text-surface-700">{key}:</span>
            <div className="ml-4 flex gap-4">
              {old !== undefined && (
                <span className="text-red-600 line-through">
                  {typeof old === 'object' ? JSON.stringify(old).slice(0, 50) : String(old).slice(0, 50)}
                </span>
              )}
              {newVal !== undefined && (
                <span className="text-green-600">
                  {typeof newVal === 'object' ? JSON.stringify(newVal).slice(0, 50) : String(newVal).slice(0, 50)}
                </span>
              )}
            </div>
          </div>
        ))}
        {changes.length > 10 && (
          <p className="text-xs text-surface-400">...and {changes.length - 10} more changes</p>
        )}
      </div>
    )
  }

  if (isLoading || !isAuthorized) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-surface-400" />
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-surface-800">
            <History className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">
              Audit Log
            </h1>
            <p className="text-surface-600">
              Complete history of all system changes
            </p>
          </div>
        </div>
        <button
          onClick={exportLogs}
          className="btn-secondary flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-surface-100 p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            placeholder="Search by summary or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <Filter className="w-5 h-5 text-surface-400" />
        <select
          value={filterTable}
          onChange={(e) => setFilterTable(e.target.value)}
          className="input-field max-w-[200px]"
        >
          <option value="all">All Tables</option>
          {Object.entries(TABLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="input-field max-w-[150px]"
        >
          <option value="all">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>
        <select
          value={filterDateRange}
          onChange={(e) => setFilterDateRange(e.target.value)}
          className="input-field max-w-[150px]"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Log Entries */}
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-surface-100 p-12 text-center">
            <History className="w-12 h-12 text-surface-300 mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold text-surface-900 mb-2">
              No audit logs found
            </h3>
            <p className="text-surface-600">
              Try adjusting your filters or date range.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const ActionIcon = ACTION_CONFIG[log.action]?.icon || Edit
            return (
              <div
                key={log.id}
                className="bg-white rounded-xl border border-surface-100 overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer hover:bg-surface-50 transition-colors"
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                >
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ACTION_CONFIG[log.action]?.color || 'bg-surface-100'}`}>
                      <ActionIcon className="w-3 h-3 inline mr-1" />
                      {log.action.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-medium text-surface-700">
                      {TABLE_LABELS[log.table_name] || log.table_name}
                    </span>
                    <span className="text-sm text-surface-500 flex-1">
                      {log.change_summary}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-surface-400">
                      <User className="w-4 h-4" />
                      {log.changed_by_name || 'System'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-surface-400">
                      <Calendar className="w-4 h-4" />
                      {new Date(log.changed_at).toLocaleString()}
                    </div>
                    {expandedId === log.id ? (
                      <ChevronUp className="w-5 h-5 text-surface-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-surface-400" />
                    )}
                  </div>
                </div>

                {expandedId === log.id && (
                  <div className="border-t border-surface-100 p-4 bg-surface-50">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-surface-700 mb-2">Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-surface-500">Record ID:</span>
                            <code className="text-xs bg-surface-200 px-2 py-0.5 rounded">{log.record_id}</code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-surface-500">User Email:</span>
                            <span>{log.changed_by_email || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-surface-500">Session ID:</span>
                            <span className="text-xs">{log.session_id || '-'}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-surface-700 mb-2">Changes</h4>
                        {renderDiff(log.old_values, log.new_values)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Load More */}
      {logs.length >= 200 && (
        <p className="text-center text-sm text-surface-500 mt-6">
          Showing first 200 entries. Use filters to narrow results.
        </p>
      )}
    </div>
  )
}

