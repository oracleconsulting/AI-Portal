'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft,
  Cpu,
  Loader2,
  CheckCircle,
  Plus,
  X,
} from 'lucide-react'
import type { AITool, ToolCategory, ToolStatus, DataClassification } from '@/types/database'

const TOOL_CATEGORIES: { value: ToolCategory; label: string }[] = [
  { value: 'llm_general', label: 'LLM - General Purpose' },
  { value: 'llm_coding', label: 'LLM - Coding Assistant' },
  { value: 'audit_specific', label: 'Audit Specific' },
  { value: 'tax_specific', label: 'Tax Specific' },
  { value: 'data_extraction', label: 'Data Extraction' },
  { value: 'document_processing', label: 'Document Processing' },
  { value: 'automation', label: 'Automation' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'transcription', label: 'Transcription' },
  { value: 'image_generation', label: 'Image Generation' },
  { value: 'other', label: 'Other' },
]

const TOOL_STATUSES: { value: ToolStatus; label: string; description: string }[] = [
  { value: 'proposed', label: 'Proposed', description: 'Awaiting initial evaluation' },
  { value: 'evaluating', label: 'Evaluating', description: 'Under active assessment' },
  { value: 'pilot', label: 'Pilot', description: 'Limited trial deployment' },
  { value: 'approved', label: 'Approved', description: 'Approved for general use' },
  { value: 'approved_restricted', label: 'Approved (Restricted)', description: 'Approved with limitations' },
  { value: 'deprecated', label: 'Deprecated', description: 'Being phased out' },
  { value: 'banned', label: 'Banned', description: 'Not permitted for use' },
]

const DATA_CLASSIFICATIONS: { value: DataClassification; label: string; description: string }[] = [
  { value: 'public', label: 'Public', description: 'Non-sensitive, publicly available information' },
  { value: 'internal', label: 'Internal', description: 'Internal business information' },
  { value: 'confidential', label: 'Confidential', description: 'Client data, financial records' },
  { value: 'restricted', label: 'Restricted', description: 'Highly sensitive, regulated data' },
]

const PRICING_MODELS = [
  { value: 'free', label: 'Free' },
  { value: 'per_user', label: 'Per User/Seat' },
  { value: 'per_token', label: 'Per Token/Usage' },
  { value: 'flat_rate', label: 'Flat Rate' },
  { value: 'tiered', label: 'Tiered Pricing' },
  { value: 'enterprise', label: 'Enterprise Agreement' },
]

export default function EditToolPage() {
  const router = useRouter()
  const params = useParams()
  const toolId = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [tool, setTool] = useState<AITool | null>(null)

  const [formData, setFormData] = useState<Partial<AITool>>({})
  const [newApprovedUseCase, setNewApprovedUseCase] = useState('')
  const [newProhibitedUseCase, setNewProhibitedUseCase] = useState('')

  useEffect(() => {
    async function fetchTool() {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*')
        .eq('id', toolId)
        .single()

      if (error) {
        setError('Failed to load tool')
        setLoading(false)
        return
      }

      setTool(data)
      setFormData({
        name: data.name,
        vendor: data.vendor,
        version: data.version,
        category: data.category,
        status: data.status,
        description: data.description,
        approved_use_cases: data.approved_use_cases || [],
        prohibited_use_cases: data.prohibited_use_cases || [],
        data_classification_permitted: data.data_classification_permitted,
        data_residency: data.data_residency,
        processes_pii: data.processes_pii,
        processes_client_data: data.processes_client_data,
        pricing_model: data.pricing_model,
        annual_cost: data.annual_cost,
        cost_per_unit: data.cost_per_unit,
        cost_notes: data.cost_notes,
        security_score: data.security_score,
        security_notes: data.security_notes,
        risk_score: data.risk_score,
        risk_notes: data.risk_notes,
        has_soc2: data.has_soc2,
        has_iso27001: data.has_iso27001,
        gdpr_compliant: data.gdpr_compliant,
        vendor_url: data.vendor_url,
        documentation_url: data.documentation_url,
        internal_guidance_url: data.internal_guidance_url,
        next_review_date: data.next_review_date,
        review_frequency_months: data.review_frequency_months,
      })
      setLoading(false)
    }

    fetchTool()
  }, [toolId, supabase])

  const handleChange = (field: keyof AITool, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addApprovedUseCase = () => {
    if (newApprovedUseCase.trim()) {
      setFormData(prev => ({
        ...prev,
        approved_use_cases: [...(prev.approved_use_cases || []), newApprovedUseCase.trim()]
      }))
      setNewApprovedUseCase('')
    }
  }

  const removeApprovedUseCase = (index: number) => {
    setFormData(prev => ({
      ...prev,
      approved_use_cases: (prev.approved_use_cases || []).filter((_, i) => i !== index)
    }))
  }

  const addProhibitedUseCase = () => {
    if (newProhibitedUseCase.trim()) {
      setFormData(prev => ({
        ...prev,
        prohibited_use_cases: [...(prev.prohibited_use_cases || []), newProhibitedUseCase.trim()]
      }))
      setNewProhibitedUseCase('')
    }
  }

  const removeProhibitedUseCase = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prohibited_use_cases: (prev.prohibited_use_cases || []).filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('ai_tools')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', toolId)

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => {
        router.push(`/oversight/tools/${toolId}`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-oversight-500" />
      </div>
    )
  }

  if (!tool) {
    return (
      <div className="p-8 text-center">
        <h2 className="font-display text-xl font-bold text-surface-900 mb-2">Tool not found</h2>
        <Link href="/oversight/tools" className="text-oversight-600 hover:underline mt-4 inline-block">
          Back to Tool Registry
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-surface-900 mb-2">Tool Updated</h2>
          <p className="text-surface-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/oversight/tools/${toolId}`}
          className="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tool Details
        </Link>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl gradient-oversight">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">Edit Tool: {tool.name}</h1>
            <p className="text-surface-600">Update tool details and settings</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Basic Information</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Tool Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Vendor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.vendor || ''}
                onChange={(e) => handleChange('vendor', e.target.value)}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Version</label>
              <input
                type="text"
                value={formData.version || ''}
                onChange={(e) => handleChange('version', e.target.value)}
                placeholder="e.g., 4.0, 2024.1"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category || ''}
                onChange={(e) => handleChange('category', e.target.value)}
                required
                className="input-field"
              >
                {TOOL_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-surface-700 mb-2">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="input-field"
              placeholder="Brief description of the tool and its primary purpose..."
            />
          </div>
        </div>

        {/* Status & Classification */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Status & Classification</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status || ''}
                onChange={(e) => handleChange('status', e.target.value)}
                required
                className="input-field"
              >
                {TOOL_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label} - {status.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Max Data Classification Permitted <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.data_classification_permitted || ''}
                onChange={(e) => handleChange('data_classification_permitted', e.target.value)}
                required
                className="input-field"
              >
                {DATA_CLASSIFICATIONS.map(dc => (
                  <option key={dc.value} value={dc.value}>
                    {dc.label} - {dc.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Data Residency</label>
              <input
                type="text"
                value={formData.data_residency || ''}
                onChange={(e) => handleChange('data_residency', e.target.value)}
                placeholder="e.g., UK, EU, US, Global"
                className="input-field"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.processes_pii || false}
                onChange={(e) => handleChange('processes_pii', e.target.checked)}
                className="w-4 h-4 rounded border-surface-300 text-oversight-500 focus:ring-oversight-500"
              />
              <span className="ml-2 text-sm text-surface-700">Processes PII</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.processes_client_data || false}
                onChange={(e) => handleChange('processes_client_data', e.target.checked)}
                className="w-4 h-4 rounded border-surface-300 text-oversight-500 focus:ring-oversight-500"
              />
              <span className="ml-2 text-sm text-surface-700">Processes Client Data</span>
            </label>
          </div>
        </div>

        {/* Security & Compliance */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Security & Compliance</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Security Score (1-5)
              </label>
              <select
                value={formData.security_score || ''}
                onChange={(e) => handleChange('security_score', e.target.value ? parseInt(e.target.value) : null)}
                className="input-field"
              >
                <option value="">Not assessed</option>
                <option value="1">1 - Critical concerns</option>
                <option value="2">2 - Significant concerns</option>
                <option value="3">3 - Moderate concerns</option>
                <option value="4">4 - Minor concerns</option>
                <option value="5">5 - Excellent security</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Risk Score (1-5)
              </label>
              <select
                value={formData.risk_score || ''}
                onChange={(e) => handleChange('risk_score', e.target.value ? parseInt(e.target.value) : null)}
                className="input-field"
              >
                <option value="">Not assessed</option>
                <option value="1">1 - Very low risk</option>
                <option value="2">2 - Low risk</option>
                <option value="3">3 - Moderate risk</option>
                <option value="4">4 - High risk</option>
                <option value="5">5 - Critical risk</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-surface-700 mb-2">Security Notes</label>
            <textarea
              value={formData.security_notes || ''}
              onChange={(e) => handleChange('security_notes', e.target.value)}
              rows={2}
              className="input-field"
              placeholder="Security assessment notes, concerns, or recommendations..."
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-surface-700 mb-2">Risk Notes</label>
            <textarea
              value={formData.risk_notes || ''}
              onChange={(e) => handleChange('risk_notes', e.target.value)}
              rows={2}
              className="input-field"
              placeholder="Risk assessment notes, mitigations required..."
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.has_soc2 || false}
                onChange={(e) => handleChange('has_soc2', e.target.checked)}
                className="w-4 h-4 rounded border-surface-300 text-green-500 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-surface-700">SOC 2 Certified</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.has_iso27001 || false}
                onChange={(e) => handleChange('has_iso27001', e.target.checked)}
                className="w-4 h-4 rounded border-surface-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-surface-700">ISO 27001 Certified</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.gdpr_compliant || false}
                onChange={(e) => handleChange('gdpr_compliant', e.target.checked)}
                className="w-4 h-4 rounded border-surface-300 text-purple-500 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-surface-700">GDPR Compliant</span>
            </label>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Pricing</h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Pricing Model</label>
              <select
                value={formData.pricing_model || ''}
                onChange={(e) => handleChange('pricing_model', e.target.value)}
                className="input-field"
              >
                <option value="">Select pricing model</option>
                {PRICING_MODELS.map(pm => (
                  <option key={pm.value} value={pm.value}>{pm.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Annual Cost (£)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.annual_cost || ''}
                onChange={(e) => handleChange('annual_cost', e.target.value ? parseFloat(e.target.value) : null)}
                className="input-field"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Cost Per Unit (£)</label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={formData.cost_per_unit || ''}
                onChange={(e) => handleChange('cost_per_unit', e.target.value ? parseFloat(e.target.value) : null)}
                className="input-field"
                placeholder="For usage-based pricing"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-surface-700 mb-2">Cost Notes</label>
            <textarea
              value={formData.cost_notes || ''}
              onChange={(e) => handleChange('cost_notes', e.target.value)}
              rows={2}
              className="input-field"
              placeholder="Additional pricing details, discounts, tiers..."
            />
          </div>
        </div>

        {/* Use Cases */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Use Cases</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Approved Use Cases */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Approved Use Cases
              </label>
              <div className="space-y-2 mb-3">
                {(formData.approved_use_cases || []).map((useCase, index) => (
                  <div key={index} className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                    <span className="flex-1 text-sm text-green-800">{useCase}</span>
                    <button
                      type="button"
                      onClick={() => removeApprovedUseCase(index)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newApprovedUseCase}
                  onChange={(e) => setNewApprovedUseCase(e.target.value)}
                  placeholder="Add approved use case..."
                  className="flex-1 input-field text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addApprovedUseCase())}
                />
                <button
                  type="button"
                  onClick={addApprovedUseCase}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Prohibited Use Cases */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Prohibited Use Cases
              </label>
              <div className="space-y-2 mb-3">
                {(formData.prohibited_use_cases || []).map((useCase, index) => (
                  <div key={index} className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                    <span className="flex-1 text-sm text-red-800">{useCase}</span>
                    <button
                      type="button"
                      onClick={() => removeProhibitedUseCase(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProhibitedUseCase}
                  onChange={(e) => setNewProhibitedUseCase(e.target.value)}
                  placeholder="Add prohibited use case..."
                  className="flex-1 input-field text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProhibitedUseCase())}
                />
                <button
                  type="button"
                  onClick={addProhibitedUseCase}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Links & Documentation */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Links & Documentation</h2>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Vendor URL</label>
              <input
                type="url"
                value={formData.vendor_url || ''}
                onChange={(e) => handleChange('vendor_url', e.target.value)}
                placeholder="https://..."
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Documentation URL</label>
              <input
                type="url"
                value={formData.documentation_url || ''}
                onChange={(e) => handleChange('documentation_url', e.target.value)}
                placeholder="https://..."
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Internal Guidance URL</label>
              <input
                type="url"
                value={formData.internal_guidance_url || ''}
                onChange={(e) => handleChange('internal_guidance_url', e.target.value)}
                placeholder="SharePoint or internal documentation link..."
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Review Schedule */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Review Schedule</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Next Review Date</label>
              <input
                type="date"
                value={formData.next_review_date || ''}
                onChange={(e) => handleChange('next_review_date', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Review Frequency (months)</label>
              <select
                value={formData.review_frequency_months || 12}
                onChange={(e) => handleChange('review_frequency_months', parseInt(e.target.value))}
                className="input-field"
              >
                <option value={3}>Every 3 months</option>
                <option value={6}>Every 6 months</option>
                <option value={12}>Annually</option>
                <option value={24}>Every 2 years</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href={`/oversight/tools/${toolId}`}
            className="btn-secondary"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

