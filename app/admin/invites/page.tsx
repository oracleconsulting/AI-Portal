'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RPGCCLogo } from '@/components/RPGCCLogo'
import { 
  Send, 
  Mail, 
  Users, 
  Lightbulb, 
  Shield,
  Check,
  X,
  Clock,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Copy,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Invite {
  id: string
  email: string
  committee: 'implementation' | 'oversight'
  role: string
  team?: string
  token: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export default function InvitesAdminPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [invites, setInvites] = useState<Invite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    committee: 'implementation' as 'implementation' | 'oversight',
    role: 'member',
  })
  const [isBulkSending, setIsBulkSending] = useState(false)
  const [bulkResult, setBulkResult] = useState<{ sent: number; failed: number } | null>(null)

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // For demo purposes, allow access. In production, check role
      fetchInvites()
    }

    checkAuthAndFetch()
  }, [router, supabase])

  const fetchInvites = async () => {
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setInvites(data)
    }
    setIsLoading(false)
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/invite/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send invite')
        return
      }

      setSuccess(`Invitation sent to ${formData.email}`)
      setFormData({ ...formData, email: '' })
      fetchInvites()
    } catch {
      setError('Failed to send invite')
    } finally {
      setIsSending(false)
    }
  }

  const copyInviteLink = (token: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const link = `${baseUrl}/invite/${token}`
    navigator.clipboard.writeText(link)
    setCopiedId(token)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleBulkSend = async () => {
    setIsBulkSending(true)
    setError(null)
    setSuccess(null)
    setBulkResult(null)

    try {
      const response = await fetch('/api/invite/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send bulk invites')
        return
      }

      setBulkResult({ sent: data.sent, failed: data.failed })
      setSuccess(data.message)
      fetchInvites()
    } catch {
      setError('Failed to send bulk invites')
    } finally {
      setIsBulkSending(false)
    }
  }

  const pendingInvites = invites.filter(
    i => !i.accepted_at && new Date(i.expires_at) > new Date()
  )

  const getStatusBadge = (invite: Invite) => {
    if (invite.accepted_at) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <Check className="w-3 h-3" />
          Accepted
        </span>
      )
    }
    if (new Date(invite.expires_at) < new Date()) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <X className="w-3 h-3" />
          Expired
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    )
  }

  const implementationInvites = invites.filter(i => i.committee === 'implementation')
  const oversightInvites = invites.filter(i => i.committee === 'oversight')

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-white border-b border-surface-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <RPGCCLogo size="sm" />
              <div className="h-6 w-px bg-surface-200" />
              <span className="font-medium text-surface-600">Invite Management</span>
            </div>
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 text-surface-600 hover:text-surface-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-surface-900 mb-2">
            Send Committee Invitations
          </h1>
          <p className="text-surface-600">
            Invite members to join the Implementation or Oversight committee
          </p>
        </div>

        {/* Bulk Send Section */}
        {pendingInvites.length > 0 && (
          <div className="bg-gradient-to-r from-implementation-50 to-oversight-50 rounded-2xl border border-surface-100 shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-surface-900 mb-1 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-implementation-600" />
                  Send All Pending Invites
                </h2>
                <p className="text-surface-600">
                  {pendingInvites.length} pending invite{pendingInvites.length !== 1 ? 's' : ''} ready to send
                </p>
              </div>
              <button
                onClick={handleBulkSend}
                disabled={isBulkSending}
                className="btn-primary flex items-center gap-2 px-6"
              >
                {isBulkSending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending {pendingInvites.length} emails...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send All Invites
                  </>
                )}
              </button>
            </div>
            {bulkResult && (
              <div className="mt-4 p-4 rounded-xl bg-white/50">
                <p className="text-sm text-surface-700">
                  ✅ <strong>{bulkResult.sent}</strong> email{bulkResult.sent !== 1 ? 's' : ''} sent successfully
                  {bulkResult.failed > 0 && (
                    <span className="text-red-600 ml-2">
                      ❌ {bulkResult.failed} failed
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Send Invite Form */}
        <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-6 mb-8">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-6 flex items-center gap-2">
            <Send className="w-5 h-5 text-implementation-600" />
            Send New Invite
          </h2>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 mb-6">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSendInvite} className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field pl-12"
                  placeholder="member@rpgcc.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Committee
              </label>
              <select
                value={formData.committee}
                onChange={(e) => setFormData({ ...formData, committee: e.target.value as 'implementation' | 'oversight' })}
                className="input-field"
              >
                <option value="implementation">Implementation</option>
                <option value="oversight">Oversight</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="input-field"
              >
                <option value="member">Member</option>
                <option value="chair">Chair</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSending}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Invite
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Invites Lists */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Implementation Committee */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-implementation-50 border-b border-implementation-100 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-implementation-100">
                <Lightbulb className="w-5 h-5 text-implementation-600" />
              </div>
              <div>
                <h3 className="font-display font-bold text-surface-900">Implementation Committee</h3>
                <p className="text-sm text-surface-600">{implementationInvites.length} invites</p>
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-surface-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              </div>
            ) : implementationInvites.length === 0 ? (
              <div className="p-8 text-center text-surface-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-surface-300" />
                <p>No invites sent yet</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-100">
                {implementationInvites.map((invite) => (
                  <div key={invite.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-surface-900">{invite.email}</span>
                      {getStatusBadge(invite)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-surface-500 capitalize">{invite.role}</span>
                        {invite.team && (
                          <span className="px-2 py-0.5 bg-implementation-100 text-implementation-700 rounded text-xs capitalize">
                            {invite.team.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-surface-400">{formatDate(invite.created_at)}</span>
                        {!invite.accepted_at && new Date(invite.expires_at) > new Date() && (
                          <button
                            onClick={() => copyInviteLink(invite.token)}
                            className="p-1 rounded hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors"
                            title="Copy invite link"
                          >
                            {copiedId === invite.token ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Oversight Committee */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-oversight-50 border-b border-oversight-100 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-oversight-100">
                <Shield className="w-5 h-5 text-oversight-600" />
              </div>
              <div>
                <h3 className="font-display font-bold text-surface-900">Oversight Committee</h3>
                <p className="text-sm text-surface-600">{oversightInvites.length} invites</p>
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-surface-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              </div>
            ) : oversightInvites.length === 0 ? (
              <div className="p-8 text-center text-surface-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-surface-300" />
                <p>No invites sent yet</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-100">
                {oversightInvites.map((invite) => (
                  <div key={invite.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-surface-900">{invite.email}</span>
                      {getStatusBadge(invite)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-surface-500 capitalize">{invite.role}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-surface-400">{formatDate(invite.created_at)}</span>
                        {!invite.accepted_at && new Date(invite.expires_at) > new Date() && (
                          <button
                            onClick={() => copyInviteLink(invite.token)}
                            className="p-1 rounded hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors"
                            title="Copy invite link"
                          >
                            {copiedId === invite.token ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

