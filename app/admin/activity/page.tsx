'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, TrendingUp, Clock, Users, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface LoginStats {
  user_id: string
  email: string
  full_name: string | null
  committee: string
  team: string | null
  total_logins: number
  last_login: string | null
  first_login: string | null
  unique_login_days: number
  logins_last_7_days: number
  logins_last_30_days: number
}

export default function UserActivityPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [stats, setStats] = useState<LoginStats[]>([])
  const [sortBy, setSortBy] = useState<keyof LoginStats>('logins_last_7_days')
  const [sortDesc, setSortDesc] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || (profile.role !== 'admin' && profile.role !== 'chair')) {
        router.push('/dashboard')
        return
      }

      setIsAuthorized(true)
      fetchStats()
    }

    checkAuth()
  }, [router, supabase])

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from('login_statistics')
      .select('*')
      .order('logins_last_7_days', { ascending: false })

    if (error) {
      console.error('Error fetching stats:', error)
    } else {
      setStats(data || [])
    }
    setIsLoading(false)
  }

  const handleSort = (field: keyof LoginStats) => {
    if (sortBy === field) {
      setSortDesc(!sortDesc)
    } else {
      setSortBy(field)
      setSortDesc(true)
    }
  }

  const sortedStats = [...stats].sort((a, b) => {
    const aVal = a[sortBy]
    const bVal = b[sortBy]
    
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
    }
    
    const numA = Number(aVal)
    const numB = Number(bVal)
    return sortDesc ? numB - numA : numA - numB
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Loader2 className="w-8 h-8 text-implementation-600 animate-spin" />
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  const totalLogins = stats.reduce((sum, s) => sum + s.total_logins, 0)
  const activeUsers7d = stats.filter(s => s.logins_last_7_days > 0).length
  const activeUsers30d = stats.filter(s => s.logins_last_30_days > 0).length

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-surface-500 hover:text-surface-700 mb-4 inline-block">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="font-display text-4xl font-bold text-surface-900 mb-2">
            User Activity & Login Statistics
          </h1>
          <p className="text-surface-600">
            Track user engagement and portal usage
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <TrendingUp className="w-8 h-8 text-implementation-500 mb-2" />
            <p className="text-sm text-surface-500 mb-1">Total Logins</p>
            <p className="text-3xl font-bold text-surface-900">{totalLogins}</p>
          </div>
          <div className="stat-card">
            <Users className="w-8 h-8 text-oversight-500 mb-2" />
            <p className="text-sm text-surface-500 mb-1">Active (7 days)</p>
            <p className="text-3xl font-bold text-surface-900">{activeUsers7d}</p>
          </div>
          <div className="stat-card">
            <Users className="w-8 h-8 text-implementation-500 mb-2" />
            <p className="text-sm text-surface-500 mb-1">Active (30 days)</p>
            <p className="text-3xl font-bold text-surface-900">{activeUsers30d}</p>
          </div>
          <div className="stat-card">
            <Calendar className="w-8 h-8 text-oversight-500 mb-2" />
            <p className="text-sm text-surface-500 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-surface-900">{stats.length}</p>
          </div>
        </div>

        {/* User Stats Table */}
        <div className="bg-white rounded-xl shadow-sm border border-surface-100 overflow-hidden">
          <div className="p-6 border-b border-surface-100">
            <h2 className="font-display text-xl font-bold text-surface-900">User Login Statistics</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100"
                    onClick={() => handleSort('full_name')}
                  >
                    User {sortBy === 'full_name' && (sortDesc ? '↓' : '↑')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100"
                    onClick={() => handleSort('committee')}
                  >
                    Committee {sortBy === 'committee' && (sortDesc ? '↓' : '↑')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100"
                    onClick={() => handleSort('team')}
                  >
                    Team {sortBy === 'team' && (sortDesc ? '↓' : '↑')}
                  </th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100"
                    onClick={() => handleSort('total_logins')}
                  >
                    Total {sortBy === 'total_logins' && (sortDesc ? '↓' : '↑')}
                  </th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100"
                    onClick={() => handleSort('logins_last_7_days')}
                  >
                    Last 7 Days {sortBy === 'logins_last_7_days' && (sortDesc ? '↓' : '↑')}
                  </th>
                  <th 
                    className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100"
                    onClick={() => handleSort('logins_last_30_days')}
                  >
                    Last 30 Days {sortBy === 'logins_last_30_days' && (sortDesc ? '↓' : '↑')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider cursor-pointer hover:bg-surface-100"
                    onClick={() => handleSort('last_login')}
                  >
                    Last Login {sortBy === 'last_login' && (sortDesc ? '↓' : '↑')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-surface-100">
                {sortedStats.map((stat) => (
                  <tr key={stat.user_id} className="hover:bg-surface-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-surface-900">
                          {stat.full_name || 'No name'}
                        </div>
                        <div className="text-sm text-surface-500">{stat.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full capitalize
                        bg-implementation-50 text-implementation-700">
                        {stat.committee}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600 capitalize">
                      {stat.team || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-surface-900">
                      {stat.total_logins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-surface-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        stat.logins_last_7_days > 5 
                          ? 'bg-green-100 text-green-700' 
                          : stat.logins_last_7_days > 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-surface-100 text-surface-600'
                      }`}>
                        {stat.logins_last_7_days}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-surface-900">
                      {stat.logins_last_30_days}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-surface-600">
                      {stat.last_login ? (
                        <div>
                          <div>{format(new Date(stat.last_login), 'dd MMM yyyy')}</div>
                          <div className="text-xs text-surface-500">
                            {format(new Date(stat.last_login), 'HH:mm')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-surface-400">Never</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

