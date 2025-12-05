'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  Home,
  FileText,
  PlusCircle,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  FileStack,
  MessageSquare,
  Shield,
  Lightbulb,
  Users,
} from 'lucide-react'

interface SidebarProps {
  committee: 'implementation' | 'oversight'
  userName?: string
}

export function Sidebar({ committee, userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const implementationLinks = [
    { href: '/implementation', label: 'Dashboard', icon: Home },
    { href: '/implementation/forms', label: 'All Forms', icon: FileText },
    { href: '/implementation/new', label: 'New Identification', icon: PlusCircle },
    { href: '/implementation/analytics', label: 'Analytics', icon: BarChart3 },
  ]

  const oversightLinks = [
    { href: '/oversight', label: 'Dashboard', icon: Home },
    { href: '/oversight/suggestions', label: 'Suggestions', icon: MessageSquare },
    { href: '/oversight/transcripts', label: 'Meeting Transcripts', icon: FileStack },
    { href: '/oversight/analytics', label: 'Analytics', icon: BarChart3 },
  ]

  const links = committee === 'implementation' ? implementationLinks : oversightLinks
  const isImpl = committee === 'implementation'

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-surface-100 transition-all duration-300 z-40 flex flex-col',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-surface-100">
        <div className="flex items-center justify-between">
          <Link href={isImpl ? '/implementation' : '/oversight'} className="flex items-center gap-3">
            <div className={cn('p-2 rounded-xl', isImpl ? 'gradient-implementation' : 'gradient-oversight')}>
              {isImpl ? (
                <Lightbulb className="w-5 h-5 text-white" />
              ) : (
                <Shield className="w-5 h-5 text-white" />
              )}
            </div>
            {!isCollapsed && (
              <div>
                <span className="font-display font-bold text-surface-900 block text-sm">
                  {isImpl ? 'Implementation' : 'Oversight'}
                </span>
                <span className="text-xs text-surface-500">Committee</span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-surface-100 transition-colors text-surface-500"
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive
                  ? isImpl
                    ? 'bg-implementation-50 text-implementation-700 font-medium'
                    : 'bg-oversight-50 text-oversight-700 font-medium'
                  : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{link.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-surface-100">
        {!isCollapsed && userName && (
          <div className="mb-4 px-4 py-2 rounded-xl bg-surface-50">
            <p className="text-sm font-medium text-surface-900 truncate">{userName}</p>
            <p className="text-xs text-surface-500 capitalize">{committee} Committee</p>
          </div>
        )}
        <div className="space-y-1">
          <Link
            href="/admin/invites"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-surface-600 hover:bg-surface-50 hover:text-surface-900 transition-all"
          >
            <Users className="w-5 h-5" />
            {!isCollapsed && <span>Invite Members</span>}
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-surface-600 hover:bg-surface-50 hover:text-surface-900 transition-all"
          >
            <Settings className="w-5 h-5" />
            {!isCollapsed && <span>Settings</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-surface-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}

