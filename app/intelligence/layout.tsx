'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/Sidebar'
import { Loader2 } from 'lucide-react'
import type { CommitteeType } from '@/types/database'

export default function IntelligenceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()
  const [userName, setUserName] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('member')
  const [userCommittees, setUserCommittees] = useState<CommitteeType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, committee, role, committees')
        .eq('id', user.id)
        .single() as {
        data: {
          full_name: string | null
          committee: CommitteeType
          role: string
          committees: CommitteeType[]
        } | null
      }

      if (profile) {
        setUserName(profile.full_name || user.email || '')
        setUserRole(profile.role)
        setUserCommittees(profile.committees || [])
        setUserEmail(user.email || '')

        // Intelligence Hub is accessible to oversight committee and admins
        if (
          !profile.committees?.includes('oversight') &&
          profile.role !== 'admin' &&
          user.email !== 'jhoward@rpgcc.co.uk'
        ) {
          router.push('/dashboard')
          return
        }
      } else {
        setUserName(user.email || '')
        setUserEmail(user.email || '')
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Loader2 className="w-8 h-8 text-oversight-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar
        committee="oversight"
        userName={userName}
        userRole={userRole}
        userEmail={userEmail}
        userCommittees={userCommittees}
      />
      <main className="ml-64 min-h-screen transition-all duration-300 p-8">{children}</main>
    </div>
  )
}

