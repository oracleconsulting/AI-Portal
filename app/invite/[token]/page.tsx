'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RPGCCLogo } from '@/components/RPGCCLogo'
import { 
  Mail, 
  Lock, 
  User, 
  AlertCircle, 
  Loader2, 
  Check,
  Lightbulb,
  Shield,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

interface InviteData {
  id: string
  email: string
  committee: 'implementation' | 'oversight'
  role: string
  expires_at: string
  accepted_at: string | null
}

export default function InviteSignupPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const supabase = createClient()

  const [invite, setInvite] = useState<InviteData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const { data, error } = await supabase
          .from('invites')
          .select('*')
          .eq('token', token)
          .single()

        if (error || !data) {
          setError('Invalid or expired invitation link')
          setIsLoading(false)
          return
        }

        // Check if expired
        if (new Date(data.expires_at) < new Date()) {
          setError('This invitation has expired')
          setIsLoading(false)
          return
        }

        // Check if already accepted
        if (data.accepted_at) {
          setError('This invitation has already been used')
          setIsLoading(false)
          return
        }

        setInvite(data)
      } catch {
        setError('Failed to load invitation')
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvite()
  }, [token, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsSubmitting(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      setIsSubmitting(false)
      return
    }

    try {
      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invite!.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            committee: invite!.committee,
            role: invite!.role,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setIsSubmitting(false)
        return
      }

      // Mark invite as accepted
      await supabase
        .from('invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invite!.id)

      // Update profile with committee info
      if (authData.user) {
        await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
            committee: invite!.committee,
            role: invite!.role,
          })
          .eq('id', authData.user.id)
      }

      setSuccess(true)
      
      // Redirect after success
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isImpl = invite?.committee === 'implementation'
  const CommitteeIcon = isImpl ? Lightbulb : Shield
  const committeeName = isImpl ? 'Implementation Committee' : 'Oversight Committee'

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4">
          <RPGCCLogo size="lg" />
          <Loader2 className="w-6 h-6 text-implementation-600 animate-spin" />
          <p className="text-surface-600">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4">
        <div className="max-w-md w-full text-center">
          <RPGCCLogo size="lg" className="justify-center mb-8" />
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-surface-100">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="font-display text-2xl font-bold text-surface-900 mb-3">
              Invalid Invitation
            </h1>
            <p className="text-surface-600 mb-6">{error}</p>
            <Link href="/" className="btn-primary inline-flex items-center gap-2">
              Go to Homepage
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4">
        <div className="max-w-md w-full text-center">
          <RPGCCLogo size="lg" className="justify-center mb-8" />
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-surface-100">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isImpl ? 'bg-implementation-50' : 'bg-oversight-50'}`}>
              <Check className={`w-8 h-8 ${isImpl ? 'text-implementation-600' : 'text-oversight-600'}`} />
            </div>
            <h1 className="font-display text-2xl font-bold text-surface-900 mb-3">
              Welcome to RPGCC!
            </h1>
            <p className="text-surface-600 mb-2">
              Your account has been created successfully.
            </p>
            <p className="text-surface-500 text-sm">
              Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <RPGCCLogo size="lg" className="justify-center mb-6" />
          <h1 className="font-display text-2xl font-bold text-surface-900 mb-2">
            Accept Your Invitation
          </h1>
          <p className="text-surface-600">
            Complete your signup to join the AI Portal
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-surface-100 overflow-hidden">
          {/* Committee Badge */}
          <div className={`p-4 ${isImpl ? 'bg-implementation-50' : 'bg-oversight-50'} border-b ${isImpl ? 'border-implementation-100' : 'border-oversight-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isImpl ? 'bg-implementation-100' : 'bg-oversight-100'}`}>
                <CommitteeIcon className={`w-5 h-5 ${isImpl ? 'text-implementation-600' : 'text-oversight-600'}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isImpl ? 'text-implementation-700' : 'text-oversight-700'}`}>
                  {committeeName}
                </p>
                <p className="text-xs text-surface-500 capitalize">
                  Role: {invite?.role}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type="email"
                  value={invite?.email || ''}
                  disabled
                  className="input-field pl-12 bg-surface-50 text-surface-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-surface-700 mb-2">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="input-field pl-12"
                  placeholder="John Smith"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-surface-700 mb-2">
                Create password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field pl-12"
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
              </div>
              <p className="text-xs text-surface-500 mt-1">
                Must be at least 8 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-surface-700 mb-2">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input-field pl-12"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all
                ${isImpl 
                  ? 'bg-gradient-to-r from-implementation-600 to-implementation-700 hover:from-implementation-500 hover:to-implementation-600' 
                  : 'bg-gradient-to-r from-oversight-600 to-oversight-700 hover:from-oversight-500 hover:to-oversight-600'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Complete Signup
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-surface-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-implementation-600 hover:text-implementation-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

