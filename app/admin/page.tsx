'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Users,
  History,
  Settings,
  FileText,
  TrendingUp,
  Clock,
  Shield,
  AlertCircle,
  Loader2,
  FileCheck,
  Lightbulb,
  Home,
} from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    recentLogins: 0,
    totalForms: 0,
    pendingInvites: 0,
  })

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

      // Fetch stats
      const [usersResult, invitesResult, formsResult, loginsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('invites').select('id', { count: 'exact', head: true }).is('accepted_at', null),
        supabase.from('identification_forms').select('id', { count: 'exact', head: true }),
        supabase
          .from('user_activity')
          .select('id', { count: 'exact', head: true })
          .eq('activity_type', 'login')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ])

      setStats({
        totalUsers: usersResult.count || 0,
        recentLogins: loginsResult.count || 0,
        totalForms: formsResult.count || 0,
        pendingInvites: invitesResult.count || 0,
      })

      setIsLoading(false)
    }

    checkAuth()
  }, [router, supabase])

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

  const adminLinks = [
    {
      href: '/admin/invites',
      label: 'Invite Members',
      description: 'Send invitations and manage user access',
      icon: Users,
      color: 'implementation',
    },
    {
      href: '/admin/audit-log',
      label: 'Audit Log',
      description: 'View complete activity and change history',
      icon: History,
      color: 'surface',
    },
    {
      href: '/admin/settings/rates',
      label: 'Staff Rates',
      description: 'Configure hourly rates for ROI calculations',
      icon: Settings,
      color: 'surface',
    },
    {
      href: '/admin/activity',
      label: 'User Activity',
      description: 'View login statistics and user engagement',
      icon: TrendingUp,
      color: 'oversight',
    },
    {
      href: '/admin/governance-score',
      label: 'ICAEW Compliance',
      description: 'View governance compliance score and ICAEW mapping',
      icon: FileCheck,
      color: 'implementation',
    },
    {
      href: '/reports/board-pack',
      label: 'Board Pack',
      description: 'Generate executive reporting pack',
      icon: FileText,
      color: 'surface',
    },
  ]

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-surface-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-surface-600">
            Manage users, settings, and view system analytics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-implementation-500" />
            </div>
            <p className="text-sm text-surface-500 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-surface-900">{stats.totalUsers}</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-oversight-500" />
            </div>
            <p className="text-sm text-surface-500 mb-1">Logins (7 days)</p>
            <p className="text-3xl font-bold text-surface-900">{stats.recentLogins}</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-implementation-500" />
            </div>
            <p className="text-sm text-surface-500 mb-1">Total Forms</p>
            <p className="text-3xl font-bold text-surface-900">{stats.totalForms}</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 text-oversight-500" />
            </div>
            <p className="text-sm text-surface-500 mb-1">Pending Invites</p>
            <p className="text-3xl font-bold text-surface-900">{stats.pendingInvites}</p>
          </div>
        </div>

        {/* Admin Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminLinks.map((link) => {
            const Icon = link.icon
            const colorClasses = {
              implementation: 'border-implementation-200 hover:border-implementation-300 hover:bg-implementation-50',
              oversight: 'border-oversight-200 hover:border-oversight-300 hover:bg-oversight-50',
              surface: 'border-surface-200 hover:border-surface-300 hover:bg-surface-50',
            }
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`stat-card group transition-all duration-200 ${colorClasses[link.color as keyof typeof colorClasses]}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${
                    link.color === 'implementation' ? 'bg-implementation-100' :
                    link.color === 'oversight' ? 'bg-oversight-100' :
                    'bg-surface-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      link.color === 'implementation' ? 'text-implementation-600' :
                      link.color === 'oversight' ? 'text-oversight-600' :
                      'text-surface-600'
                    }`} />
                  </div>
                </div>
                <h3 className="font-display text-xl font-bold text-surface-900 mb-2 group-hover:text-implementation-600 transition-colors">
                  {link.label}
                </h3>
                <p className="text-sm text-surface-600">{link.description}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

