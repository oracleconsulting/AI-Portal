'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle,
  Plus,
  X,
  UserCheck,
} from 'lucide-react'
import type { TeamType } from '@/types/database'

interface ToolPermission {
  id: string
  tool_id: string
  team: TeamType | null
  role: string | null
  access_level: 'view' | 'use' | 'admin'
  requires_training: boolean
  training_completed_by: string[]
  granted_by: string
  granted_by_name?: string
  granted_at: string
  expires_at: string | null
  notes: string | null
}

interface Tool {
  id: string
  name: string
  vendor: string
  status: string
}

const TEAMS: { value: TeamType; label: string }[] = [
  { value: 'bsg', label: 'Business Services' },
  { value: 'audit', label: 'Audit' },
  { value: 'tax', label: 'Tax' },
  { value: 'corporate_finance', label: 'Corporate Finance' },
  { value: 'bookkeeping', label: 'Bookkeeping' },
  { value: 'admin', label: 'Admin' },
]

const ROLES = [
  { value: 'member', label: 'Member' },
  { value: 'chair', label: 'Chair' },
  { value: 'admin', label: 'Admin' },
]

const PERMISSION_LEVELS: { value: 'view' | 'use' | 'admin'; label: string; description: string }[] = [
  { value: 'view', label: 'View Only', description: 'Can see tool exists, cannot use' },
  { value: 'use', label: 'Use', description: 'Can use tool for approved purposes' },
  { value: 'admin', label: 'Admin', description: 'Can use and manage tool settings' },
]

export default function ToolPermissionsPage() {
  const params = useParams()
  const router = useRouter()
  const toolId = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [tool, setTool] = useState<Tool | null>(null)
  const [permissions, setPermissions] = useState<ToolPermission[]>([])
  const [users, setUsers] = useState<{ id: string; email: string; full_name: string; team: string }[]>([])

  // New permission form
  const [showAddForm, setShowAddForm] = useState(false)
  const [permissionType, setPermissionType] = useState<'team' | 'role'>('team')
  const [newPermission, setNewPermission] = useState({
    team: '' as TeamType | '',
    role: '',
    access_level: 'use' as 'view' | 'use' | 'admin',
    requires_training: false,
    expires_at: '',
    notes: '',
  })

  useEffect(() => {
    fetchData()
  }, [toolId])

  async function fetchData() {
    setLoading(true)

    // Fetch tool
    const { data: toolData, error: toolError } = await supabase
      .from('ai_tools')
      .select('id, name, vendor, status')
      .eq('id', toolId)
      .single()

    if (toolError || !toolData) {
      setError('Tool not found')
      setLoading(false)
      return
    }
    setTool(toolData)

    // Fetch permissions with granter details
    const { data: permData } = await supabase
      .from('ai_tool_permissions')
      .select(`
        *,
        granter:profiles!ai_tool_permissions_granted_by_fkey(full_name)
      `)
      .eq('tool_id', toolId)
      .order('created_at', { ascending: false })

    const transformedPerms = (permData || []).map((p: any) => ({
      ...p,
      granted_by_name: p.granter?.full_name,
      training_completed_by: p.training_completed_by || [],
    }))
    setPermissions(transformedPerms)

    // Fetch all users for reference
    const { data: usersData } = await supabase
      .from('profiles')
      .select('id, email, full_name, team')
      .order('full_name')
    setUsers(usersData || [])

    setLoading(false)
  }

  async function addPermission() {
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not authenticated')
      setSaving(false)
      return
    }

    const permissionData: any = {
      tool_id: toolId,
      access_level: newPermission.access_level,
      requires_training: newPermission.requires_training,
      granted_by: user.id,
      notes: newPermission.notes || null,
    }

    // Set scope based on type
    if (permissionType === 'team' && newPermission.team) {
      permissionData.team = newPermission.team
    } else if (permissionType === 'role' && newPermission.role) {
      permissionData.role = newPermission.role
    } else {
      setError('Please select a scope for the permission')
      setSaving(false)
      return
    }

    // Optional expiry date
    if (newPermission.expires_at) {
      permissionData.expires_at = newPermission.expires_at
    }

    const { error: insertError } = await supabase
      .from('ai_tool_permissions')
      .insert(permissionData)

    if (insertError) {
      setError('Failed to add permission: ' + insertError.message)
      setSaving(false)
      return
    }

    setSuccess('Permission added successfully')
    setShowAddForm(false)
    setNewPermission({
      team: '',
      role: '',
      access_level: 'use',
      requires_training: false,
      expires_at: '',
      notes: '',
    })
    setSaving(false)
    fetchData()
  }

  async function deletePermission(permissionId: string) {
    if (!confirm('Are you sure you want to remove this permission?')) {
      return
    }

    const { error: deleteError } = await supabase
      .from('ai_tool_permissions')
      .delete()
      .eq('id', permissionId)

    if (deleteError) {
      setError('Failed to remove permission')
      return
    }

    setSuccess('Permission removed')
    fetchData()
  }

  async function markTrainingComplete(permissionId: string, userId: string) {
    const permission = permissions.find(p => p.id === permissionId)
    if (!permission) return

    const updatedTraining = [...(permission.training_completed_by || [])]
    if (!updatedTraining.includes(userId)) {
      updatedTraining.push(userId)
    }

    const { error: updateError } = await supabase
      .from('ai_tool_permissions')
      .update({
        training_completed_by: updatedTraining,
      })
      .eq('id', permissionId)

    if (updateError) {
      setError('Failed to update training status')
      return
    }

    setSuccess('Training marked as complete')
    fetchData()
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getPermissionScopeDisplay = (perm: ToolPermission) => {
    if (perm.team) return `Team: ${TEAMS.find(t => t.value === perm.team)?.label || perm.team}`
    if (perm.role) return `Role: ${perm.role}`
    return 'Unknown scope'
  }

  const isExpired = (perm: ToolPermission) => {
    if (!perm.expires_at) return false
    return new Date(perm.expires_at) < new Date()
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

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <Link 
          href={`/oversight/tools/${toolId}`} 
          className="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {tool.name}
        </Link>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl gradient-oversight">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-surface-900">Permissions: {tool.name}</h1>
            <p className="text-surface-600 mt-1">
              Manage who can access and use this tool
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Permission
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3 text-green-700">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Add Permission Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">Add Permission</h2>

          {/* Permission Type Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-surface-700 mb-2">Permission Scope</label>
            <div className="flex gap-4">
              {(['team', 'role'] as const).map((type) => (
                <label key={type} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="permissionType"
                    value={type}
                    checked={permissionType === type}
                    onChange={() => setPermissionType(type)}
                    className="w-4 h-4 text-oversight-500 focus:ring-oversight-500"
                  />
                  <span className="ml-2 text-sm text-surface-700 capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Scope Selection */}
            {permissionType === 'team' && (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">Team</label>
                <select
                  value={newPermission.team}
                  onChange={(e) => setNewPermission({ ...newPermission, team: e.target.value as TeamType })}
                  className="input-field"
                >
                  <option value="">Select team...</option>
                  {TEAMS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            )}

            {permissionType === 'role' && (
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">Role</label>
                <select
                  value={newPermission.role}
                  onChange={(e) => setNewPermission({ ...newPermission, role: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select role...</option>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Permission Level */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Permission Level</label>
              <select
                value={newPermission.access_level}
                onChange={(e) => setNewPermission({ ...newPermission, access_level: e.target.value as 'view' | 'use' | 'admin' })}
                className="input-field"
              >
                {PERMISSION_LEVELS.map((pl) => (
                  <option key={pl.value} value={pl.value}>
                    {pl.label} - {pl.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Permission Expires (optional)
              </label>
              <input
                type="date"
                value={newPermission.expires_at}
                onChange={(e) => setNewPermission({ ...newPermission, expires_at: e.target.value })}
                className="input-field"
              />
            </div>

            {/* Training Requirement */}
            <div className="md:col-span-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPermission.requires_training}
                  onChange={(e) => setNewPermission({ ...newPermission, requires_training: e.target.checked })}
                  className="w-4 h-4 rounded border-surface-300 text-oversight-500 focus:ring-oversight-500"
                />
                <span className="ml-2 text-sm text-surface-700">Requires training before use</span>
              </label>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-surface-700 mb-2">Notes</label>
              <textarea
                value={newPermission.notes}
                onChange={(e) => setNewPermission({ ...newPermission, notes: e.target.value })}
                rows={2}
                placeholder="Any additional notes about this permission..."
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addPermission}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Permission
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Permissions List */}
      {permissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-8 text-center">
          <Shield className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <p className="text-surface-500">
            No permissions configured yet. Add permissions to control who can access this tool.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-surface-100">
            <thead className="bg-surface-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Scope</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Training</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Granted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Expires</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-surface-100">
              {permissions.map((perm) => (
                <tr key={perm.id} className={`hover:bg-surface-50 ${isExpired(perm) ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-surface-900">
                      {getPermissionScopeDisplay(perm)}
                    </div>
                    {perm.notes && (
                      <div className="text-sm text-surface-500 mt-1">{perm.notes}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      perm.access_level === 'admin' ? 'bg-purple-100 text-purple-800' :
                      perm.access_level === 'use' ? 'bg-green-100 text-green-800' :
                      'bg-surface-100 text-surface-800'
                    }`}>
                      {perm.access_level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {perm.requires_training ? (
                      <div>
                        <span className="text-sm text-orange-600">
                          ⚠ Required
                        </span>
                        <div className="text-xs text-surface-500 mt-1">
                          {perm.training_completed_by?.length || 0} completed
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-surface-500">Not required</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-500">
                    {formatDate(perm.granted_at)}
                    {perm.granted_by_name && (
                      <span className="block text-xs">by {perm.granted_by_name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {perm.expires_at ? (
                      <span className={isExpired(perm) ? 'text-red-600 font-medium' : 'text-surface-600'}>
                        {formatDate(perm.expires_at)}
                        {isExpired(perm) && ' (Expired)'}
                      </span>
                    ) : (
                      <span className="text-surface-400">Never</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deletePermission(perm.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Add Buttons */}
      <div className="mt-6 p-4 bg-surface-50 rounded-xl border border-surface-100">
        <h3 className="font-medium text-surface-900 mb-3">Quick Add</h3>
        <div className="flex flex-wrap gap-2">
          {TEAMS.map((team) => (
            <button
              key={team.value}
              onClick={() => {
                setPermissionType('team')
                setNewPermission({ ...newPermission, team: team.value, access_level: 'use' })
                setShowAddForm(true)
              }}
              className="px-3 py-1 text-sm border border-surface-300 rounded-lg hover:bg-white transition-colors"
            >
              + All {team.label}
            </button>
          ))}
          <button
            onClick={() => {
              setPermissionType('role')
              setNewPermission({ ...newPermission, role: 'admin', access_level: 'admin' })
              setShowAddForm(true)
            }}
            className="px-3 py-1 text-sm border border-surface-300 rounded-lg hover:bg-white transition-colors"
          >
            + All Admins
          </button>
        </div>
      </div>
    </div>
  )
}

