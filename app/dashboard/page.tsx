'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { CommitteeType } from '@/types/database'
import { Loader2, Lightbulb, Shield } from 'lucide-react'
import { RPGCCLogoIcon } from '@/components/RPGCCLogo'
import Link from 'next/link'

interface ProfileData {
  id: string
  committee: CommitteeType
  full_name: string | null
  committees?: string[] | null
  role?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, committees')
        .eq('id', user.id)
        .single() as { data: (ProfileData & { committees?: string[] | null; role?: string }) | null }

      if (profileData) {
        setProfile(profileData)
        
        // Check if admin - only jhoward@rpgcc.co.uk has admin access
        if (user.email === 'jhoward@rpgcc.co.uk') {
          router.push('/admin')
          return
        }
        
        // Check committees array first (for multiple committee support)
        const committees = profileData.committees && Array.isArray(profileData.committees) && profileData.committees.length > 0
          ? profileData.committees
          : profileData.committee
            ? [profileData.committee]
            : []
        
        // If user has multiple committees, show selection
        if (committees.length > 1) {
          setIsLoading(false)
          return // Show committee selection
        }
        
        // Redirect to appropriate committee portal
        if (committees.includes('implementation')) {
          router.push('/implementation')
        } else if (committees.includes('oversight')) {
          router.push('/oversight')
        } else if (profileData.committee === 'implementation') {
          router.push('/implementation')
        } else if (profileData.committee === 'oversight') {
          router.push('/oversight')
        } else {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-implementation-600 animate-spin mx-auto mb-4" />
          <p className="text-surface-600">Loading your portal...</p>
        </div>
      </div>
    )
  }

  // If no profile found, show committee selection (for demo purposes)
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="font-display text-3xl font-black text-surface-900">RPGCC</span>
            <RPGCCLogoIcon />
          </div>
          <h1 className="font-display text-3xl font-bold text-surface-900 mb-3">
            Welcome to AI Portal
          </h1>
          <p className="text-surface-600">
            Your account hasn&apos;t been assigned to a committee yet.
            <br />
            Please contact your administrator or select a portal below.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link 
            href="/implementation"
            className="group p-8 rounded-2xl bg-white border border-surface-100 shadow-lg hover:shadow-xl hover:border-implementation-200 transition-all duration-300"
          >
            <div className="p-4 rounded-xl gradient-implementation w-fit mb-4 group-hover:scale-110 transition-transform">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <h2 className="font-display text-xl font-bold text-surface-900 mb-2">
              Implementation Committee
            </h2>
            <p className="text-surface-600 text-sm">
              Identify opportunities and track AI implementations
            </p>
          </Link>

          <Link 
            href="/oversight"
            className="group p-8 rounded-2xl bg-white border border-surface-100 shadow-lg hover:shadow-xl hover:border-oversight-200 transition-all duration-300"
          >
            <div className="p-4 rounded-xl gradient-oversight w-fit mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h2 className="font-display text-xl font-bold text-surface-900 mb-2">
              Oversight Committee
            </h2>
            <p className="text-surface-600 text-sm">
              Review security, costs, and governance frameworks
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}

