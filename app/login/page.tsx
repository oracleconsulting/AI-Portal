'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'
import { RPGCCLogo } from '@/components/RPGCCLogo'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            setError(error.message)
            return
          }

          // Log login activity
          if (data.user) {
            try {
              // Get IP and user agent from headers (if available)
              const ipAddress = null // Could be passed from server if needed
              const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null
              
              await fetch('/api/activity/log-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: data.user.id,
                  ip_address: ipAddress,
                  user_agent: userAgent,
                }),
              })
            } catch (logError) {
              // Don't block login if logging fails
              console.error('Failed to log login activity:', logError)
            }
          }

          router.push('/dashboard')
          router.refresh()
        } catch {
          setError('An unexpected error occurred')
        } finally {
          setIsLoading(false)
        }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-100 via-surface-50 to-white" />
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-implementation-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-oversight-200/20 rounded-full blur-3xl" />
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-rpgcc-dark">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
        {/* Brand color accents */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-rpgcc-blue/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-20 w-48 h-48 bg-rpgcc-red/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-40 w-56 h-56 bg-rpgcc-amber/15 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-12">
            <RPGCCLogo size="xl" variant="light" className="mb-3" />
            <span className="text-white/70 font-medium text-lg">AI Portal</span>
          </div>
          
          <h1 className="font-display text-5xl font-bold leading-tight mb-6">
            Welcome to the
            <br />
            AI Committee Portal
          </h1>
          
          <p className="text-lg text-white/80 max-w-md leading-relaxed">
            Collaborate securely with your committee members to shape 
            the future of AI at RPGCC.
          </p>

          {/* Decorative elements - brand colors */}
          <div className="absolute bottom-16 left-16 right-16">
            <div className="flex gap-4">
              <div className="flex-1 h-1 rounded-full bg-rpgcc-blue/50" />
              <div className="flex-1 h-1 rounded-full bg-rpgcc-red/50" />
              <div className="flex-1 h-1 rounded-full bg-rpgcc-amber/50" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center justify-center gap-2 mb-12">
            <RPGCCLogo size="lg" variant="dark" />
            <span className="text-surface-500 font-medium">AI Portal</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-surface-100 p-8 animate-slide-up">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-bold text-surface-900 mb-2">
                Sign in to your account
              </h2>
              <p className="text-surface-500">
                Enter your credentials to access your committee portal
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 mb-6 animate-fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-12"
                    placeholder="you@rpgcc.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-surface-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-12"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-surface-100 text-center">
              <p className="text-sm text-surface-500">
                Need access? Contact your committee chair.
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-surface-500 mt-8">
            <Link href="/" className="hover:text-implementation-600 transition-colors">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

