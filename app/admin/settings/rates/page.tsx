'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  PoundSterling,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

interface StaffRate {
  id: string
  staff_level: string
  hourly_rate: number
  display_name: string | null
  display_order: number
  is_active: boolean
  effective_from: string
  effective_to: string | null
  updated_at: string
}

interface RateHistory {
  id: string
  staff_level: string
  hourly_rate: number
  effective_from: string
  effective_to: string | null
}

export default function StaffRatesPage() {
  const supabase = createClient()
  const router = useRouter()

  const [rates, setRates] = useState<StaffRate[]>([])
  const [history, setHistory] = useState<RateHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)
  const [showHistory, setShowHistory] = useState(false)

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
      fetchRates()
    }

    checkAuth()
  }, [router, supabase])

  async function fetchRates() {
    setLoading(true)
    
    const { data: ratesData, error: ratesError } = await supabase
      .from('staff_rates')
      .select('*')
      .order('display_order')

    if (ratesError) {
      setError('Failed to load staff rates')
      setLoading(false)
      return
    }

    const { data: historyData } = await supabase
      .from('staff_rates_history')
      .select('*')
      .order('effective_from', { ascending: false })

    setRates(ratesData || [])
    setHistory(historyData || [])
    setLoading(false)
  }

  const startEditing = (rate: StaffRate) => {
    setEditingId(rate.id)
    setEditValue(rate.hourly_rate)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditValue(0)
  }

  const saveRate = async (id: string) => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    const { error: updateError } = await supabase
      .from('staff_rates')
      .update({ 
        hourly_rate: editValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      setError('Failed to update rate: ' + updateError.message)
      setSaving(false)
      return
    }

    setSuccess('Rate updated successfully. Historical rates have been preserved.')
    setEditingId(null)
    setSaving(false)
    fetchRates()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading || !isAuthorized) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-oversight-500" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl gradient-oversight">
            <PoundSterling className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">Staff Rates</h1>
            <p className="text-surface-600 mt-1">
              Manage hourly rates used for ROI calculations. Changes are tracked for audit purposes.
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

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3 text-green-700">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Current Rates Table */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-surface-100 bg-surface-50">
          <h2 className="font-display text-lg font-bold text-surface-900">Current Rates</h2>
        </div>
        <table className="min-w-full divide-y divide-surface-100">
          <thead className="bg-surface-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                Staff Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                Hourly Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                Effective From
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-surface-100">
            {rates.map((rate) => (
              <tr key={rate.id} className={!rate.is_active ? 'bg-surface-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-surface-900 capitalize">
                    {rate.display_name || rate.staff_level.replace(/_/g, ' ')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === rate.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-surface-500">£</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editValue}
                        onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-oversight-500"
                        autoFocus
                      />
                      <span className="text-surface-500">/hr</span>
                    </div>
                  ) : (
                    <span className="text-surface-900 font-medium">{formatCurrency(rate.hourly_rate)}/hr</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500">
                  {formatDate(rate.effective_from)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {rate.is_active ? (
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-surface-100 text-surface-800">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  {editingId === rate.id ? (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={cancelEditing}
                        className="text-surface-600 hover:text-surface-800"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveRate(rate.id)}
                        className="text-oversight-600 hover:text-oversight-700 font-medium"
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(rate)}
                      className="text-oversight-600 hover:text-oversight-700"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rate History */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-100 bg-surface-50 flex justify-between items-center">
          <h2 className="font-display text-lg font-bold text-surface-900">Rate History</h2>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-oversight-600 hover:text-oversight-700"
          >
            {showHistory ? 'Hide History' : 'Show History'}
          </button>
        </div>
        
        {showHistory && (
          <>
            {history.length === 0 ? (
              <div className="px-6 py-8 text-center text-surface-500">
                No rate changes recorded yet. History will appear here when rates are modified.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-surface-100">
                <thead className="bg-surface-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                      Staff Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                      Previous Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                      Effective Period
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-surface-100">
                  {history.map((record) => (
                    <tr key={record.id} className="bg-surface-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 capitalize">
                        {record.staff_level.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-700 font-medium">
                        {formatCurrency(record.hourly_rate)}/hr
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-500">
                        {formatDate(record.effective_from)} — {record.effective_to ? formatDate(record.effective_to) : 'Present'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <h3 className="font-medium text-blue-800 mb-2">ℹ️ About Rate Changes</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Rate changes take effect immediately for new calculations</li>
          <li>• Historical rate changes are preserved for audit purposes</li>
          <li>• Existing form valuations are not automatically recalculated</li>
          <li>• All rate changes are logged in the audit trail</li>
        </ul>
      </div>
    </div>
  )
}

