'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  Mail,
  Download,
  UserCheck,
  Clock,
} from 'lucide-react'

interface Policy {
  id: string
  title: string
  version: string
  status: string
  applies_to_committees: string[]
  applies_to_teams: string[] | null
}

interface Acknowledgment {
  id: string
  user_id: string
  acknowledged_at: string
  acknowledgment_type: string | null
  user: {
    email: string
    full_name: string | null
    team: string
    committee: string
  }
}

interface PendingUser {
  id: string
  email: string
  full_name: string | null
  team: string
  committee: string
}

export default function PolicyAcknowledgmentsPage() {
  const params = useParams()
  const policyId = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [acknowledgments, setAcknowledgments] = useState<Acknowledgment[]>([])
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [sendingReminders, setSendingReminders] = useState(false)

  useEffect(() => {
    fetchData()
  }, [policyId])

  async function fetchData() {
    setLoading(true)

    // Fetch policy
    const { data: policyData, error: policyError } = await supabase
      .from('policy_documents')
      .select('id, title, version, status, applies_to_committees, applies_to_teams')
      .eq('id', policyId)
      .single()

    if (policyError || !policyData) {
      setError('Policy not found')
      setLoading(false)
      return
    }
    setPolicy(policyData)

    // Fetch acknowledgments with user details
    const { data: ackData } = await supabase
      .from('policy_acknowledgments')
      .select(`
        id,
        user_id,
        acknowledged_at,
        acknowledgment_type,
        user:profiles!policy_acknowledgments_user_id_fkey(
          email,
          full_name,
          team,
          committee
        )
      `)
      .eq('policy_id', policyId)
      .order('acknowledged_at', { ascending: false })

    setAcknowledgments((ackData || []).map((a: any) => ({
      ...a,
      user: a.user || { email: 'Unknown', full_name: null, team: 'unknown', committee: 'unknown' }
    })))

    // Fetch all users who should acknowledge
    let usersQuery = supabase
      .from('profiles')
      .select('id, email, full_name, team, committee')

    // Filter by committees if specified
    if (policyData.applies_to_committees && policyData.applies_to_committees.length > 0) {
      usersQuery = usersQuery.in('committee', policyData.applies_to_committees)
    }

    const { data: allUsers } = await usersQuery

    // Filter to users who haven't acknowledged
    const acknowledgedUserIds = new Set((ackData || []).map((a: any) => a.user_id))
    const pending = (allUsers || []).filter(u => !acknowledgedUserIds.has(u.id))
    setPendingUsers(pending)

    setLoading(false)
  }

  const sendReminders = async () => {
    setSendingReminders(true)
    
    try {
      const response = await fetch('/api/policies/send-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policy_id: policyId,
          user_ids: pendingUsers.map(u => u.id),
        }),
      })

      if (!response.ok) throw new Error('Failed to send reminders')
      
      alert(`Reminders sent to ${pendingUsers.length} users`)
    } catch (err) {
      setError('Failed to send reminders: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
    
    setSendingReminders(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const acknowledgmentRate = policy 
    ? (acknowledgments.length / (acknowledgments.length + pendingUsers.length)) * 100 
    : 0

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-oversight-500" />
      </div>
    )
  }

  if (!policy) {
    return (
      <div className="p-8 text-center">
        <h2 className="font-display text-xl font-bold text-surface-900 mb-2">Policy not found</h2>
        <Link href="/oversight/policies" className="text-oversight-600 hover:underline mt-4 inline-block">
          Back to Policies
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <Link 
          href={`/oversight/policies/${policyId}`} 
          className="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {policy.title}
        </Link>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl gradient-oversight">
            <UserCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">Acknowledgments</h1>
            <p className="text-surface-600 mt-1">
              {policy.title} (v{policy.version})
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4">
          <div className="text-3xl font-bold text-green-600">{acknowledgments.length}</div>
          <div className="text-sm text-surface-500">Acknowledged</div>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4">
          <div className="text-3xl font-bold text-orange-600">{pendingUsers.length}</div>
          <div className="text-sm text-surface-500">Pending</div>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4">
          <div className="text-3xl font-bold text-oversight-600">{acknowledgmentRate.toFixed(0)}%</div>
          <div className="text-sm text-surface-500">Completion Rate</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4 mb-6">
        <div className="flex justify-between text-sm text-surface-600 mb-2">
          <span>Progress</span>
          <span>{acknowledgments.length} of {acknowledgments.length + pendingUsers.length} users</span>
        </div>
        <div className="w-full h-4 bg-surface-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${acknowledgmentRate}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acknowledged Users */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100 bg-green-50">
            <h2 className="font-display text-lg font-semibold text-green-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Acknowledged ({acknowledgments.length})
            </h2>
          </div>
          {acknowledgments.length === 0 ? (
            <div className="p-6 text-center text-surface-500">
              No acknowledgments yet
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-surface-100">
                <thead className="bg-surface-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-surface-500 uppercase">User</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-surface-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {acknowledgments.map((ack) => (
                    <tr key={ack.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-surface-900 text-sm">
                          {ack.user.full_name || ack.user.email}
                        </div>
                        <div className="text-xs text-surface-500 capitalize">
                          {ack.user.team.replace(/_/g, ' ')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-500">
                        {formatDate(ack.acknowledged_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending Users */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100 bg-orange-50 flex justify-between items-center">
            <h2 className="font-display text-lg font-semibold text-orange-800 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending ({pendingUsers.length})
            </h2>
            {pendingUsers.length > 0 && (
              <button
                onClick={sendReminders}
                disabled={sendingReminders}
                className="px-3 py-1 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
              >
                {sendingReminders ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Reminders
                  </>
                )}
              </button>
            )}
          </div>
          {pendingUsers.length === 0 ? (
            <div className="p-6 text-center text-surface-500">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p>🎉 Everyone has acknowledged this policy!</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-surface-100">
                <thead className="bg-surface-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-surface-500 uppercase">User</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-surface-500 uppercase">Team</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {pendingUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-surface-900 text-sm">
                          {user.full_name || user.email}
                        </div>
                        <div className="text-xs text-surface-500">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-500 capitalize">
                        {user.team.replace(/_/g, ' ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Export Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => {
            // Export to CSV
            const rows = [
              ['User', 'Email', 'Team', 'Status', 'Date'],
              ...acknowledgments.map(a => [
                a.user.full_name || '',
                a.user.email,
                a.user.team,
                'Acknowledged',
                formatDate(a.acknowledged_at)
              ]),
              ...pendingUsers.map(u => [
                u.full_name || '',
                u.email,
                u.team,
                'Pending',
                ''
              ])
            ]
            const csv = rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `policy-acknowledgments-${policy.title.toLowerCase().replace(/\s+/g, '-')}.csv`
            a.click()
          }}
          className="btn-secondary flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>
    </div>
  )
}

