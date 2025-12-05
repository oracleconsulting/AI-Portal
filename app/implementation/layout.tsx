'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/Sidebar'
import { Loader2 } from 'lucide-react'

export default function ImplementationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()
  const [userName, setUserName] = useState<string>('')
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
        .select('full_name, committee')
        .eq('id', user.id)
        .single() as { data: { full_name: string | null; committee: string } | null }

      if (profile) {
        setUserName(profile.full_name || user.email || '')
      } else {
        setUserName(user.email || '')
      }
      
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

  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar committee="implementation" userName={userName} />
      <main className="ml-64 min-h-screen transition-all duration-300">
        {children}
      </main>
    </div>
  )
}

