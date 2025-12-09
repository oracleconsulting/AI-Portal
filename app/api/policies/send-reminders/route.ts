import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Initialize Resend lazily to avoid build-time errors
  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabase = createClient()
  
  // Check authorization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, committee')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.committee !== 'oversight')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { policy_id, user_ids } = body

  // Get policy details
  const { data: policy } = await supabase
    .from('policy_documents')
    .select('title, version')
    .eq('id', policy_id)
    .single()

  if (!policy) {
    return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
  }

  // Get user emails
  const { data: users } = await supabase
    .from('profiles')
    .select('email, full_name')
    .in('id', user_ids)

  if (!users || users.length === 0) {
    return NextResponse.json({ error: 'No users found' }, { status: 404 })
  }

  // Send emails (with rate limiting)
  const results = []
  for (const targetUser of users) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: targetUser.email,
        subject: `Action Required: Please acknowledge "${policy.title}"`,
        html: `
          <p>Dear ${targetUser.full_name || 'Colleague'},</p>
          <p>A policy requires your acknowledgment:</p>
          <h2>${policy.title}</h2>
          <p>Version: ${policy.version}</p>
          <p>Please log in to the AI Portal to read and acknowledge this policy.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/oversight/policies/${policy_id}">View Policy</a></p>
          <p>Thank you,<br>RPGCC AI Portal</p>
        `,
      })
      results.push({ email: targetUser.email, success: true })
      
      // Rate limiting - Resend allows 2 requests per second
      await new Promise(resolve => setTimeout(resolve, 600))
    } catch (err) {
      results.push({ email: targetUser.email, success: false, error: String(err) })
    }
  }

  return NextResponse.json({ 
    sent: results.filter((r: any) => r.success).length, 
    total: results.length,
    results 
  })
}

