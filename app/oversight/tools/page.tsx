'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Cpu,
  Plus,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  ExternalLink,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import type { AITool, ToolCategory, ToolStatus } from '@/types/database'

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  llm_general: 'LLM (General)',
  llm_coding: 'LLM (Coding)',
  audit_specific: 'Audit Specific',
  tax_specific: 'Tax Specific',
  data_extraction: 'Data Extraction',
  document_processing: 'Document Processing',
  automation: 'Automation',
  analytics: 'Analytics',
  transcription: 'Transcription',
  image_generation: 'Image Generation',
  other: 'Other',
}

const STATUS_CONFIG: Record<ToolStatus, { color: string; label: string; icon: typeof Shield }> = {
  proposed: { color: 'bg-surface-100 text-surface-600', label: 'Proposed', icon: Clock },
  evaluating: { color: 'bg-blue-100 text-blue-700', label: 'Evaluating', icon: Shield },
  pilot: { color: 'bg-purple-100 text-purple-700', label: 'Pilot', icon: Shield },
  approved: { color: 'bg-green-100 text-green-700', label: 'Approved', icon: ShieldCheck },
  approved_restricted: { color: 'bg-green-100 text-green-700 border border-green-300', label: 'Approved (Restricted)', icon: ShieldCheck },
  deprecated: { color: 'bg-orange-100 text-orange-700', label: 'Deprecated', icon: ShieldAlert },
  banned: { color: 'bg-red-100 text-red-700', label: 'Banned', icon: ShieldX },
}

export default function AIToolRegistryPage() {
  const supabase = createClient()
  const [tools, setTools] = useState<AITool[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [userRole, setUserRole] = useState<string>('member')

  useEffect(() => {
    fetchTools()
    fetchUserRole()
  }, [])

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (data) setUserRole(data.role)
    }
  }

  const fetchTools = async () => {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching tools:', error)
    } else {
      setTools(data || [])
    }
    setIsLoading(false)
  }

  const filteredTools = tools.filter(tool => {
    if (searchTerm && !tool.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !tool.vendor.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (filterCategory !== 'all' && tool.category !== filterCategory) return false
    if (filterStatus !== 'all' && tool.status !== filterStatus) return false
    return true
  })

  const approvedCount = tools.filter(t => t.status === 'approved' || t.status === 'approved_restricted').length
  const evaluatingCount = tools.filter(t => t.status === 'evaluating' || t.status === 'pilot').length
  const bannedCount = tools.filter(t => t.status === 'banned').length

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-oversight-500" />
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl gradient-oversight">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">
              AI Tool Registry
            </h1>
            <p className="text-surface-600">
              Manage approved, evaluated, and restricted AI tools
            </p>
          </div>
        </div>
        {(userRole === 'admin' || userRole === 'chair') && (
          <Link href="/oversight/tools/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Tool
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-surface-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Cpu className="w-5 h-5 text-surface-400" />
            <span className="text-sm text-surface-600">Total Tools</span>
          </div>
          <p className="text-2xl font-bold text-surface-900">{tools.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            <span className="text-sm text-surface-600">Approved</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-surface-600">Under Evaluation</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{evaluatingCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <ShieldX className="w-5 h-5 text-red-500" />
            <span className="text-sm text-surface-600">Banned</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{bannedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-surface-100 p-4 mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            placeholder="Search tools by name or vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <Filter className="w-5 h-5 text-surface-400" />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="input-field max-w-[200px]"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-field max-w-[180px]"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([value, config]) => (
            <option key={value} value={value}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Tools Grid */}
      {filteredTools.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-100 p-12 text-center">
          <Cpu className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h3 className="font-display text-lg font-bold text-surface-900 mb-2">
            No tools found
          </h3>
          <p className="text-surface-600 mb-4">
            {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your filters.'
              : 'Add your first AI tool to the registry.'}
          </p>
          {(userRole === 'admin' || userRole === 'chair') && !searchTerm && (
            <Link href="/oversight/tools/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Tool
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => {
            const StatusIcon = STATUS_CONFIG[tool.status].icon
            return (
              <Link
                key={tool.id}
                href={`/oversight/tools/${tool.id}`}
                className="bg-white rounded-2xl border border-surface-100 p-5 hover:border-oversight-200 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[tool.status].color}`}>
                      <StatusIcon className="w-3 h-3 inline mr-1" />
                      {STATUS_CONFIG[tool.status].label}
                    </span>
                  </div>
                  {tool.vendor_url && (
                    <ExternalLink className="w-4 h-4 text-surface-400 group-hover:text-oversight-500 transition-colors" />
                  )}
                </div>

                <h3 className="font-display font-bold text-surface-900 mb-1">
                  {tool.name}
                </h3>
                <p className="text-sm text-surface-500 mb-3">{tool.vendor}</p>

                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-surface-100 text-surface-600">
                    {CATEGORY_LABELS[tool.category]}
                  </span>
                  {tool.version && (
                    <span className="text-xs text-surface-400">v{tool.version}</span>
                  )}
                </div>

                {tool.description && (
                  <p className="text-sm text-surface-600 line-clamp-2 mb-4">
                    {tool.description}
                  </p>
                )}

                {/* Security & Risk Indicators */}
                <div className="flex items-center gap-4 pt-3 border-t border-surface-100">
                  {tool.security_score && (
                    <div className="flex items-center gap-1.5">
                      <Shield className={`w-4 h-4 ${tool.security_score >= 4 ? 'text-green-500' : tool.security_score >= 3 ? 'text-amber-500' : 'text-red-500'}`} />
                      <span className="text-xs text-surface-600">Security: {tool.security_score}/5</span>
                    </div>
                  )}
                  {tool.risk_score && (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className={`w-4 h-4 ${tool.risk_score <= 2 ? 'text-green-500' : tool.risk_score <= 3 ? 'text-amber-500' : 'text-red-500'}`} />
                      <span className="text-xs text-surface-600">Risk: {tool.risk_score}/5</span>
                    </div>
                  )}
                </div>

                {/* Compliance Badges */}
                <div className="flex items-center gap-2 mt-3">
                  {tool.has_soc2 && (
                    <span className="px-2 py-0.5 rounded text-xs bg-green-50 text-green-700 font-medium">SOC2</span>
                  )}
                  {tool.has_iso27001 && (
                    <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 font-medium">ISO 27001</span>
                  )}
                  {tool.gdpr_compliant && (
                    <span className="px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-700 font-medium">GDPR</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

