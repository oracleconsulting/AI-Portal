'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Cpu,
  Loader2,
  ExternalLink,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Edit,
  PoundSterling,
  Calendar,
  User,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import type { AITool, ToolCategory, ToolStatus, DataClassification } from '@/types/database'

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

const STATUS_CONFIG: Record<ToolStatus, { color: string; label: string }> = {
  proposed: { color: 'bg-surface-100 text-surface-600', label: 'Proposed' },
  evaluating: { color: 'bg-blue-100 text-blue-700', label: 'Evaluating' },
  pilot: { color: 'bg-purple-100 text-purple-700', label: 'Pilot' },
  approved: { color: 'bg-green-100 text-green-700', label: 'Approved' },
  approved_restricted: { color: 'bg-green-100 text-green-700 border border-green-300', label: 'Approved (Restricted)' },
  deprecated: { color: 'bg-orange-100 text-orange-700', label: 'Deprecated' },
  banned: { color: 'bg-red-100 text-red-700', label: 'Banned' },
}

const DATA_CLASS_LABELS: Record<DataClassification, string> = {
  public: 'Public',
  internal: 'Internal',
  confidential: 'Confidential',
  restricted: 'Restricted',
}

export default function AIToolDetailPage() {
  const params = useParams()
  const supabase = createClient()
  const [tool, setTool] = useState<AITool | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('member')

  useEffect(() => {
    fetchTool()
    fetchUserRole()
  }, [params.id])

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

  const fetchTool = async () => {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching tool:', error)
    } else {
      setTool(data)
    }
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-oversight-500" />
      </div>
    )
  }

  if (!tool) {
    return (
      <div className="p-8 text-center">
        <h2 className="font-display text-xl font-bold text-surface-900 mb-2">
          Tool Not Found
        </h2>
        <p className="text-surface-600 mb-4">The requested tool could not be found.</p>
        <Link href="/oversight/tools" className="btn-primary">
          Back to Registry
        </Link>
      </div>
    )
  }

  const approvedUseCases = tool.approved_use_cases as string[] || []
  const prohibitedUseCases = tool.prohibited_use_cases as string[] || []

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/oversight/tools"
          className="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Registry
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl gradient-oversight">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-display text-2xl font-bold text-surface-900">
                  {tool.name}
                </h1>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[tool.status].color}`}>
                  {STATUS_CONFIG[tool.status].label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-surface-600">
                <span>{tool.vendor}</span>
                {tool.version && (
                  <>
                    <span>•</span>
                    <span>v{tool.version}</span>
                  </>
                )}
                <span>•</span>
                <span>{CATEGORY_LABELS[tool.category]}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {tool.vendor_url && (
              <a
                href={tool.vendor_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Visit Vendor
              </a>
            )}
            {(userRole === 'admin' || userRole === 'chair') && (
              <>
                <Link
                  href={`/oversight/tools/${tool.id}/edit`}
                  className="btn-primary flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Tool
                </Link>
                <Link
                  href={`/oversight/tools/${tool.id}/permissions`}
                  className="btn-secondary flex items-center gap-2"
                >
                  Manage Permissions
                </Link>
                <Link
                  href={`/oversight/tools/${tool.id}/usage`}
                  className="btn-secondary flex items-center gap-2"
                >
                  Usage Analytics
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {tool.description && (
            <div className="bg-white rounded-2xl border border-surface-100 p-6">
              <h2 className="font-display text-lg font-bold text-surface-900 mb-3">
                Description
              </h2>
              <p className="text-surface-600">{tool.description}</p>
            </div>
          )}

          {/* Use Cases */}
          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            <h2 className="font-display text-lg font-bold text-surface-900 mb-4">
              Use Cases
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="flex items-center gap-2 font-medium text-green-700 mb-3">
                  <CheckCircle className="w-5 h-5" />
                  Approved Use Cases
                </h3>
                {approvedUseCases.length > 0 ? (
                  <ul className="space-y-2">
                    {approvedUseCases.map((useCase, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-surface-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {useCase}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-surface-500 italic">No approved use cases defined</p>
                )}
              </div>
              <div>
                <h3 className="flex items-center gap-2 font-medium text-red-700 mb-3">
                  <XCircle className="w-5 h-5" />
                  Prohibited Use Cases
                </h3>
                {prohibitedUseCases.length > 0 ? (
                  <ul className="space-y-2">
                    {prohibitedUseCases.map((useCase, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-surface-600">
                        <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        {useCase}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-surface-500 italic">No prohibited use cases defined</p>
                )}
              </div>
            </div>
          </div>

          {/* Security & Compliance */}
          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            <h2 className="font-display text-lg font-bold text-surface-900 mb-4">
              Security & Compliance
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-surface-100">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-surface-400" />
                    <span className="text-surface-600">Security Score</span>
                  </div>
                  {tool.security_score ? (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <div
                            key={n}
                            className={`w-3 h-3 rounded-full ${
                              n <= tool.security_score!
                                ? tool.security_score! >= 4
                                  ? 'bg-green-500'
                                  : tool.security_score! >= 3
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                                : 'bg-surface-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium">{tool.security_score}/5</span>
                    </div>
                  ) : (
                    <span className="text-surface-400">Not assessed</span>
                  )}
                </div>

                <div className="flex items-center justify-between py-2 border-b border-surface-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-surface-400" />
                    <span className="text-surface-600">Risk Score</span>
                  </div>
                  {tool.risk_score ? (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <div
                            key={n}
                            className={`w-3 h-3 rounded-full ${
                              n <= tool.risk_score!
                                ? tool.risk_score! <= 2
                                  ? 'bg-green-500'
                                  : tool.risk_score! <= 3
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                                : 'bg-surface-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium">{tool.risk_score}/5</span>
                    </div>
                  ) : (
                    <span className="text-surface-400">Not assessed</span>
                  )}
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-surface-600">Data Classification</span>
                  <span className="font-medium">{DATA_CLASS_LABELS[tool.data_classification_permitted]}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-surface-100">
                  <span className="text-surface-600">Processes PII</span>
                  <span className={tool.processes_pii ? 'text-red-600 font-medium' : 'text-green-600'}>
                    {tool.processes_pii ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-surface-100">
                  <span className="text-surface-600">Processes Client Data</span>
                  <span className={tool.processes_client_data ? 'text-amber-600 font-medium' : 'text-green-600'}>
                    {tool.processes_client_data ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-surface-600">Data Residency</span>
                  <span className="font-medium">{tool.data_residency || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Certifications */}
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-surface-100">
              <span className="text-sm text-surface-500">Certifications:</span>
              {tool.has_soc2 && (
                <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  SOC 2
                </span>
              )}
              {tool.has_iso27001 && (
                <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  ISO 27001
                </span>
              )}
              {tool.gdpr_compliant && (
                <span className="px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-700 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  GDPR
                </span>
              )}
              {!tool.has_soc2 && !tool.has_iso27001 && !tool.gdpr_compliant && (
                <span className="text-sm text-surface-400">None recorded</span>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            <h2 className="font-display text-lg font-bold text-surface-900 mb-4">
              Pricing
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-surface-600">Model</span>
                <span className="font-medium">{tool.pricing_model || 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PoundSterling className="w-4 h-4 text-surface-400" />
                  <span className="text-surface-600">Annual Cost</span>
                </div>
                <span className="font-medium text-lg">
                  {tool.annual_cost ? `£${tool.annual_cost.toLocaleString()}` : 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Review Schedule */}
          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            <h2 className="font-display text-lg font-bold text-surface-900 mb-4">
              Review Schedule
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-surface-400" />
                  <span className="text-surface-600">Next Review</span>
                </div>
                <span className="font-medium">
                  {tool.next_review_date 
                    ? new Date(tool.next_review_date).toLocaleDateString()
                    : 'Not scheduled'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-surface-600">Frequency</span>
                <span className="font-medium">{tool.review_frequency_months} months</span>
              </div>
            </div>
          </div>

          {/* Approval Info */}
          <div className="bg-white rounded-2xl border border-surface-100 p-6">
            <h2 className="font-display text-lg font-bold text-surface-900 mb-4">
              Tracking
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-surface-500">Proposed</p>
                <p className="font-medium">{new Date(tool.proposed_at).toLocaleDateString()}</p>
              </div>
              {tool.approved_at && (
                <div>
                  <p className="text-surface-500">Approved</p>
                  <p className="font-medium">{new Date(tool.approved_at).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <p className="text-surface-500">Last Updated</p>
                <p className="font-medium">{new Date(tool.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Linked Form */}
          {tool.linked_form_id && (
            <Link
              href={`/implementation/forms/${tool.linked_form_id}`}
              className="block bg-implementation-50 rounded-2xl border border-implementation-200 p-4 hover:bg-implementation-100 transition-colors"
            >
              <p className="text-sm text-implementation-600 mb-1">Linked Proposal</p>
              <p className="font-medium text-implementation-700">View Original Form →</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

