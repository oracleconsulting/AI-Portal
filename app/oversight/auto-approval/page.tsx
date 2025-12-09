'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Settings,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Trash2,
} from 'lucide-react'
import type { TeamType } from '@/types/database'

interface AutoApprovalRule {
  id: string
  name: string
  description: string | null
  is_active: boolean
  max_cost: number | null
  max_risk_score: number | null
  allowed_data_classifications: string[] | null
  allowed_teams: TeamType[] | null
  require_all_conditions: boolean
  auto_approve: boolean
  approval_conditions: string | null
  created_at: string
}

const DATA_CLASSIFICATIONS = ['public', 'internal', 'confidential', 'restricted']
const TEAMS: { value: TeamType; label: string }[] = [
  { value: 'bsg', label: 'Business Services' },
  { value: 'audit', label: 'Audit' },
  { value: 'tax', label: 'Tax' },
  { value: 'corporate_finance', label: 'Corporate Finance' },
  { value: 'bookkeeping', label: 'Bookkeeping' },
  { value: 'admin', label: 'Admin' },
]

export default function AutoApprovalPage() {
  const supabase = createClient()
  const [rules, setRules] = useState<AutoApprovalRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewRule, setShowNewRule] = useState(false)
  const [saving, setSaving] = useState(false)

  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    is_active: true,
    max_cost: '',
    max_risk_score: '',
    allowed_data_classifications: [] as string[],
    allowed_teams: [] as TeamType[],
    require_all_conditions: true,
    auto_approve: true,
    approval_conditions: '',
  })

  useEffect(() => {
    fetchRules()
  }, [])

  async function fetchRules() {
    const { data, error } = await supabase
      .from('auto_approval_rules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError('Failed to load rules')
      setLoading(false)
      return
    }

    setRules(data || [])
    setLoading(false)
  }

  async function createRule() {
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated')
      setSaving(false)
      return
    }

    const { error: insertError } = await supabase
      .from('auto_approval_rules')
      .insert({
        name: newRule.name,
        description: newRule.description || null,
        is_active: newRule.is_active,
        max_cost: newRule.max_cost ? parseFloat(newRule.max_cost) : null,
        max_risk_score: newRule.max_risk_score ? parseInt(newRule.max_risk_score) : null,
        allowed_data_classifications: newRule.allowed_data_classifications.length > 0 ? newRule.allowed_data_classifications : null,
        allowed_teams: newRule.allowed_teams.length > 0 ? newRule.allowed_teams : null,
        require_all_conditions: newRule.require_all_conditions,
        auto_approve: newRule.auto_approve,
        approval_conditions: newRule.approval_conditions || null,
        created_by: user.id,
      })

    if (insertError) {
      setError('Failed to create rule: ' + insertError.message)
      setSaving(false)
      return
    }

    setShowNewRule(false)
    setNewRule({
      name: '',
      description: '',
      is_active: true,
      max_cost: '',
      max_risk_score: '',
      allowed_data_classifications: [],
      allowed_teams: [],
      require_all_conditions: true,
      auto_approve: true,
      approval_conditions: '',
    })
    setSaving(false)
    fetchRules()
  }

  async function toggleRuleActive(ruleId: string, currentValue: boolean) {
    const { error } = await supabase
      .from('auto_approval_rules')
      .update({ is_active: !currentValue })
      .eq('id', ruleId)

    if (!error) {
      fetchRules()
    }
  }

  async function deleteRule(ruleId: string) {
    if (!confirm('Are you sure you want to delete this rule?')) return

    const { error } = await supabase
      .from('auto_approval_rules')
      .delete()
      .eq('id', ruleId)

    if (!error) {
      fetchRules()
    }
  }

  const toggleDataClassification = (classification: string) => {
    setNewRule(prev => ({
      ...prev,
      allowed_data_classifications: prev.allowed_data_classifications.includes(classification)
        ? prev.allowed_data_classifications.filter(c => c !== classification)
        : [...prev.allowed_data_classifications, classification]
    }))
  }

  const toggleTeam = (team: TeamType) => {
    setNewRule(prev => ({
      ...prev,
      allowed_teams: prev.allowed_teams.includes(team)
        ? prev.allowed_teams.filter(t => t !== team)
        : [...prev.allowed_teams, team]
    }))
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-oversight-500" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl gradient-oversight">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">Auto-Approval Rules</h1>
            <p className="text-surface-600 mt-1">
              Configure automatic approval/rejection rules for proposals
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNewRule(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Rule
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* New Rule Form */}
      {showNewRule && (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Create Auto-Approval Rule</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Rule Name *</label>
              <input
                type="text"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                className="input-field"
                placeholder="e.g., Low-cost, low-risk auto-approval"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Description</label>
              <textarea
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                rows={2}
                className="input-field"
                placeholder="Describe when this rule should apply..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">Max Cost (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newRule.max_cost}
                  onChange={(e) => setNewRule({ ...newRule, max_cost: e.target.value })}
                  className="input-field"
                  placeholder="Leave empty for no limit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">Max Risk Score (1-5)</label>
                <select
                  value={newRule.max_risk_score}
                  onChange={(e) => setNewRule({ ...newRule, max_risk_score: e.target.value })}
                  className="input-field"
                >
                  <option value="">No limit</option>
                  <option value="1">1 - Very Low</option>
                  <option value="2">2 - Low</option>
                  <option value="3">3 - Moderate</option>
                  <option value="4">4 - High</option>
                  <option value="5">5 - Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Allowed Data Classifications</label>
              <div className="flex flex-wrap gap-2">
                {DATA_CLASSIFICATIONS.map(classification => (
                  <label key={classification} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRule.allowed_data_classifications.includes(classification)}
                      onChange={() => toggleDataClassification(classification)}
                      className="w-4 h-4 rounded border-surface-300 text-oversight-500 focus:ring-oversight-500"
                    />
                    <span className="ml-2 text-sm text-surface-700 capitalize">{classification}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Allowed Teams (leave empty for all)</label>
              <div className="flex flex-wrap gap-2">
                {TEAMS.map(team => (
                  <label key={team.value} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRule.allowed_teams.includes(team.value)}
                      onChange={() => toggleTeam(team.value)}
                      className="w-4 h-4 rounded border-surface-300 text-oversight-500 focus:ring-oversight-500"
                    />
                    <span className="ml-2 text-sm text-surface-700">{team.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRule.require_all_conditions}
                  onChange={(e) => setNewRule({ ...newRule, require_all_conditions: e.target.checked })}
                  className="w-4 h-4 rounded border-surface-300 text-oversight-500 focus:ring-oversight-500"
                />
                <span className="ml-2 text-sm text-surface-700">Require all conditions (uncheck for any condition)</span>
              </label>
            </div>

            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRule.auto_approve}
                  onChange={(e) => setNewRule({ ...newRule, auto_approve: e.target.checked })}
                  className="w-4 h-4 rounded border-surface-300 text-oversight-500 focus:ring-oversight-500"
                />
                <span className="ml-2 text-sm text-surface-700">
                  Auto-approve (uncheck to auto-reject matching proposals)
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Approval Conditions (optional)</label>
              <textarea
                value={newRule.approval_conditions}
                onChange={(e) => setNewRule({ ...newRule, approval_conditions: e.target.value })}
                rows={2}
                className="input-field"
                placeholder="Any conditions to attach to auto-approved proposals..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowNewRule(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={createRule}
              disabled={saving || !newRule.name}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Create Rule'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-8 text-center">
          <Settings className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <p className="text-surface-500">
            No auto-approval rules configured. Create a rule to automatically approve or reject proposals based on criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map(rule => (
            <div
              key={rule.id}
              className={`bg-white rounded-2xl border shadow-sm p-6 ${
                rule.is_active ? 'border-surface-100' : 'border-surface-200 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-display font-bold text-surface-900">{rule.name}</h3>
                    {rule.is_active ? (
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-surface-100 text-surface-800">
                        Inactive
                      </span>
                    )}
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      rule.auto_approve ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {rule.auto_approve ? 'Auto-Approve' : 'Auto-Reject'}
                    </span>
                  </div>
                  {rule.description && (
                    <p className="text-sm text-surface-600 mt-1">{rule.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleRuleActive(rule.id, rule.is_active)}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      rule.is_active ? 'bg-surface-100 text-surface-700' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {rule.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-surface-500">Conditions:</span>
                  <ul className="mt-1 space-y-1">
                    {rule.max_cost && (
                      <li>• Max cost: £{rule.max_cost.toLocaleString()}</li>
                    )}
                    {rule.max_risk_score && (
                      <li>• Max risk score: {rule.max_risk_score}/5</li>
                    )}
                    {rule.allowed_data_classifications && rule.allowed_data_classifications.length > 0 && (
                      <li>• Data classifications: {rule.allowed_data_classifications.join(', ')}</li>
                    )}
                    {rule.allowed_teams && rule.allowed_teams.length > 0 && (
                      <li>• Teams: {rule.allowed_teams.map(t => TEAMS.find(tt => tt.value === t)?.label || t).join(', ')}</li>
                    )}
                  </ul>
                  <p className="mt-2 text-surface-500">
                    Logic: {rule.require_all_conditions ? 'All conditions must match' : 'Any condition can match'}
                  </p>
                </div>
                {rule.approval_conditions && (
                  <div>
                    <span className="text-surface-500">Approval Conditions:</span>
                    <p className="mt-1 text-surface-700">{rule.approval_conditions}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

