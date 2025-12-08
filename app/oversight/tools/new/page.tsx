'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft,
  Cpu,
  Loader2,
  CheckCircle,
} from 'lucide-react'
import type { ToolCategory, ToolStatus, DataClassification } from '@/types/database'

const CATEGORIES: { value: ToolCategory; label: string }[] = [
  { value: 'llm_general', label: 'LLM (General Purpose)' },
  { value: 'llm_coding', label: 'LLM (Coding Assistant)' },
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

const STATUSES: { value: ToolStatus; label: string }[] = [
  { value: 'proposed', label: 'Proposed' },
  { value: 'evaluating', label: 'Evaluating' },
  { value: 'pilot', label: 'Pilot' },
  { value: 'approved', label: 'Approved' },
  { value: 'approved_restricted', label: 'Approved (Restricted)' },
  { value: 'deprecated', label: 'Deprecated' },
  { value: 'banned', label: 'Banned' },
]

const DATA_CLASSIFICATIONS: { value: DataClassification; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'internal', label: 'Internal' },
  { value: 'confidential', label: 'Confidential' },
  { value: 'restricted', label: 'Restricted' },
]

export default function NewAIToolPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    vendor: '',
    version: '',
    category: 'llm_general' as ToolCategory,
    status: 'proposed' as ToolStatus,
    description: '',
    data_classification_permitted: 'internal' as DataClassification,
    data_residency: '',
    processes_pii: false,
    processes_client_data: false,
    pricing_model: '',
    annual_cost: '',
    security_score: '',
    risk_score: '',
    has_soc2: false,
    has_iso27001: false,
    gdpr_compliant: false,
    vendor_url: '',
    documentation_url: '',
    approved_use_cases: '',
    prohibited_use_cases: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to add a tool')
        return
      }

      const { error: insertError } = await supabase
        .from('ai_tools')
        .insert({
          name: formData.name,
          vendor: formData.vendor,
          version: formData.version || null,
          category: formData.category,
          status: formData.status,
          description: formData.description || null,
          data_classification_permitted: formData.data_classification_permitted,
          data_residency: formData.data_residency || null,
          processes_pii: formData.processes_pii,
          processes_client_data: formData.processes_client_data,
          pricing_model: formData.pricing_model || null,
          annual_cost: formData.annual_cost ? parseFloat(formData.annual_cost) : null,
          security_score: formData.security_score ? parseInt(formData.security_score) : null,
          risk_score: formData.risk_score ? parseInt(formData.risk_score) : null,
          has_soc2: formData.has_soc2,
          has_iso27001: formData.has_iso27001,
          gdpr_compliant: formData.gdpr_compliant,
          vendor_url: formData.vendor_url || null,
          documentation_url: formData.documentation_url || null,
          approved_use_cases: formData.approved_use_cases 
            ? formData.approved_use_cases.split('\n').filter(Boolean)
            : [],
          prohibited_use_cases: formData.prohibited_use_cases
            ? formData.prohibited_use_cases.split('\n').filter(Boolean)
            : [],
          proposed_by: user.id,
        })

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        router.push('/oversight/tools')
      }, 1500)
    } catch (err) {
      console.error('Error adding tool:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-surface-900 mb-2">
            Tool Added Successfully
          </h2>
          <p className="text-surface-600">Redirecting to tool registry...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/oversight/tools"
          className="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Registry
        </Link>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl gradient-oversight">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">
              Add New AI Tool
            </h1>
            <p className="text-surface-600">
              Register a new tool for evaluation and approval
            </p>
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
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">
            Basic Information
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Tool Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="e.g., ChatGPT"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Vendor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="input-field"
                placeholder="e.g., OpenAI"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Version
              </label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="input-field"
                placeholder="e.g., 4.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ToolCategory })}
                className="input-field"
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ToolStatus })}
                className="input-field"
                required
              >
                {STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Vendor URL
              </label>
              <input
                type="url"
                value={formData.vendor_url}
                onChange={(e) => setFormData({ ...formData, vendor_url: e.target.value })}
                className="input-field"
                placeholder="https://..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field min-h-[80px]"
                placeholder="Brief description of the tool's capabilities..."
              />
            </div>
          </div>
        </div>

        {/* Data & Security */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">
            Data & Security
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Max Data Classification Permitted
              </label>
              <select
                value={formData.data_classification_permitted}
                onChange={(e) => setFormData({ ...formData, data_classification_permitted: e.target.value as DataClassification })}
                className="input-field"
              >
                {DATA_CLASSIFICATIONS.map((dc) => (
                  <option key={dc.value} value={dc.value}>{dc.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Data Residency
              </label>
              <input
                type="text"
                value={formData.data_residency}
                onChange={(e) => setFormData({ ...formData, data_residency: e.target.value })}
                className="input-field"
                placeholder="e.g., UK, EU, US"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Security Score (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.security_score}
                onChange={(e) => setFormData({ ...formData, security_score: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Risk Score (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.risk_score}
                onChange={(e) => setFormData({ ...formData, risk_score: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-6 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.processes_pii}
                  onChange={(e) => setFormData({ ...formData, processes_pii: e.target.checked })}
                  className="w-4 h-4 rounded border-surface-300 text-oversight-500 focus:ring-oversight-500"
                />
                <span className="text-sm text-surface-700">Processes PII</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.processes_client_data}
                  onChange={(e) => setFormData({ ...formData, processes_client_data: e.target.checked })}
                  className="w-4 h-4 rounded border-surface-300 text-oversight-500 focus:ring-oversight-500"
                />
                <span className="text-sm text-surface-700">Processes Client Data</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.has_soc2}
                  onChange={(e) => setFormData({ ...formData, has_soc2: e.target.checked })}
                  className="w-4 h-4 rounded border-surface-300 text-green-500 focus:ring-green-500"
                />
                <span className="text-sm text-surface-700">SOC 2 Certified</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.has_iso27001}
                  onChange={(e) => setFormData({ ...formData, has_iso27001: e.target.checked })}
                  className="w-4 h-4 rounded border-surface-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-surface-700">ISO 27001</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.gdpr_compliant}
                  onChange={(e) => setFormData({ ...formData, gdpr_compliant: e.target.checked })}
                  className="w-4 h-4 rounded border-surface-300 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-sm text-surface-700">GDPR Compliant</span>
              </label>
            </div>
          </div>
        </div>

        {/* Costs */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">
            Pricing
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Pricing Model
              </label>
              <input
                type="text"
                value={formData.pricing_model}
                onChange={(e) => setFormData({ ...formData, pricing_model: e.target.value })}
                className="input-field"
                placeholder="e.g., Per seat, Usage-based"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Estimated Annual Cost (£)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.annual_cost}
                onChange={(e) => setFormData({ ...formData, annual_cost: e.target.value })}
                className="input-field"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">
            Use Cases
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Approved Use Cases (one per line)
              </label>
              <textarea
                value={formData.approved_use_cases}
                onChange={(e) => setFormData({ ...formData, approved_use_cases: e.target.value })}
                className="input-field min-h-[100px]"
                placeholder="Drafting client communications&#10;Summarizing documents&#10;Code review assistance"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Prohibited Use Cases (one per line)
              </label>
              <textarea
                value={formData.prohibited_use_cases}
                onChange={(e) => setFormData({ ...formData, prohibited_use_cases: e.target.value })}
                className="input-field min-h-[100px]"
                placeholder="Processing restricted client data&#10;Financial advice generation"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/oversight/tools" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Adding Tool...
              </>
            ) : (
              'Add Tool'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

