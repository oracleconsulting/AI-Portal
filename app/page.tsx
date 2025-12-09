'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Shield, Lightbulb, ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import { RPGCCLogo, RPGCCLogoIcon } from '@/components/RPGCCLogo'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/dashboard')
      } else {
        setIsLoading(false)
      }
    }
    checkUser()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4">
          <RPGCCLogoIcon className="animate-pulse-soft" />
          <Loader2 className="w-6 h-6 text-implementation-600 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-implementation-100/30 via-white to-oversight-100/20" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-rpgcc-blue/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-rpgcc-amber/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-rpgcc-red/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-20 animate-fade-in">
          <div className="flex items-center gap-4">
            <RPGCCLogo size="md" variant="dark" />
            <div className="h-8 w-px bg-surface-200" />
            <span className="font-display font-semibold text-lg text-surface-600">AI Portal</span>
          </div>
          <Link href="/login" className="btn-primary flex items-center gap-2">
            Sign In
            <ArrowRight className="w-4 h-4" />
          </Link>
        </header>

        {/* Hero Section */}
        <section className="text-center mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-implementation-50 border border-implementation-200 text-implementation-700 text-sm font-medium mb-8 animate-slide-up">
            <Sparkles className="w-4 h-4" />
            RPGCC AI Initiative
          </div>
          
          <h1 className="font-display text-5xl md:text-7xl font-bold text-surface-900 mb-6 animate-slide-up animate-delay-100">
            Shaping the Future
            <br />
            <span className="bg-gradient-to-r from-implementation-600 via-implementation-500 to-oversight-500 bg-clip-text text-transparent">
              with AI
            </span>
          </h1>
          
          <p className="text-xl text-surface-600 max-w-2xl mx-auto mb-12 animate-slide-up animate-delay-200">
            A secure collaboration platform for our AI committees to identify opportunities,
            manage implementations, and ensure responsible governance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up animate-delay-300">
            <Link href="/login" className="btn-primary flex items-center justify-center gap-2 text-lg px-8">
              Access Portal
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Committee Cards */}
        <section className="grid md:grid-cols-2 gap-8 mb-24">
          {/* Implementation Committee */}
          <div className="group relative overflow-hidden rounded-3xl p-8 bg-white border border-surface-100 shadow-xl hover:shadow-2xl transition-all duration-500 animate-slide-up animate-delay-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-implementation-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative">
              <div className="p-4 rounded-2xl gradient-implementation w-fit mb-6">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="font-display text-2xl font-bold text-surface-900 mb-3">
                Implementation Committee
              </h2>
              
              <p className="text-surface-600 mb-6">
                Identify and prioritise AI opportunities within our team structure. 
                Track problems, solutions, costs, and time savings.
              </p>
              
              <ul className="space-y-3 text-sm text-surface-600">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-implementation-500" />
                  Submit identification forms
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-implementation-500" />
                  Calculate ROI and prioritise projects
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-implementation-500" />
                  Track implementation progress
                </li>
              </ul>
            </div>
          </div>

          {/* Oversight Committee */}
          <div className="group relative overflow-hidden rounded-3xl p-8 bg-white border border-surface-100 shadow-xl hover:shadow-2xl transition-all duration-500 animate-slide-up animate-delay-400">
            <div className="absolute top-0 right-0 w-64 h-64 bg-oversight-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative">
              <div className="p-4 rounded-2xl gradient-oversight w-fit mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="font-display text-2xl font-bold text-surface-900 mb-3">
                Oversight Committee
              </h2>
              
              <p className="text-surface-600 mb-6">
                Establish security and funding frameworks. 
                Review risks, costs, and maintain governance documentation.
              </p>
              
              <ul className="space-y-3 text-sm text-surface-600">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-oversight-500" />
                  Review cost and security proposals
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-oversight-500" />
                  Manage meeting transcripts
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-oversight-500" />
                  Generate summaries and action items
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-surface-500 text-sm pb-8">
          <p>© {new Date().getFullYear()} RPGCC. AI Portal v1.0</p>
        </footer>
      </div>
    </div>
  )
}

