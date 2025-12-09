'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Lightbulb, Shield, ChevronDown } from 'lucide-react'

interface CommitteeSwitcherProps {
  currentCommittee: 'implementation' | 'oversight'
  className?: string
}

export function CommitteeSwitcher({ currentCommittee, className }: CommitteeSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [availableCommittees, setAvailableCommittees] = useState<('implementation' | 'oversight')[]>([currentCommittee])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserCommittees = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('committees, committee')
        .eq('id', user.id)
        .single()

      if (profile) {
        // Check both committees array and legacy committee field
        const committees: ('implementation' | 'oversight')[] = []
        
        // Check committees array
        if (profile.committees && Array.isArray(profile.committees)) {
          if (profile.committees.includes('implementation')) committees.push('implementation')
          if (profile.committees.includes('oversight')) committees.push('oversight')
        }
        
        // Fallback to legacy committee field if no committees array
        if (committees.length === 0 && profile.committee) {
          committees.push(profile.committee as 'implementation' | 'oversight')
        }
        
        // If still empty, default to current committee
        if (committees.length === 0) {
          committees.push(currentCommittee)
        }

        setAvailableCommittees(committees)
      }
      setIsLoading(false)
    }

    fetchUserCommittees()
  }, [supabase, currentCommittee])

  const switchCommittee = (committee: 'implementation' | 'oversight') => {
    if (committee === currentCommittee) {
      setIsOpen(false)
      return
    }

    // Replace current committee path with new one
    const newPath = pathname.replace(
      currentCommittee === 'implementation' ? '/implementation' : '/oversight',
      committee === 'implementation' ? '/implementation' : '/oversight'
    )

    router.push(newPath)
    setIsOpen(false)
  }

  // Don't show switcher if user only has access to one committee
  if (isLoading || availableCommittees.length <= 1) {
    return null
  }

  const committeeLabels = {
    implementation: 'Implementation',
    oversight: 'Oversight',
  }

  const committeeIcons = {
    implementation: Lightbulb,
    oversight: Shield,
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200',
          currentCommittee === 'implementation'
            ? 'bg-implementation-50 border-implementation-200 text-implementation-700 hover:bg-implementation-100'
            : 'bg-oversight-50 border-oversight-200 text-oversight-700 hover:bg-oversight-100'
        )}
      >
        {(() => {
          const Icon = committeeIcons[currentCommittee]
          return <Icon className="w-4 h-4" />
        })()}
        <span className="text-sm font-medium">{committeeLabels[currentCommittee]}</span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl border border-surface-200 shadow-lg z-20 overflow-hidden">
            {availableCommittees.map((committee) => {
              const Icon = committeeIcons[committee]
              const isActive = committee === currentCommittee
              return (
                <button
                  key={committee}
                  onClick={() => switchCommittee(committee)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    isActive
                      ? committee === 'implementation'
                        ? 'bg-implementation-50 text-implementation-700'
                        : 'bg-oversight-50 text-oversight-700'
                      : 'text-surface-700 hover:bg-surface-50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{committeeLabels[committee]}</span>
                  {isActive && (
                    <span className="ml-auto text-xs text-surface-500">Current</span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

