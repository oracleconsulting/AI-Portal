import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(apiKey)
}

export async function POST() {
  try {
    const supabase = createServerSupabaseClient()
    
    // Check if user is authenticated and is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can send bulk invites' }, { status: 403 })
    }

    // Get all pending invites (not accepted, not expired)
    const { data: pendingInvites, error: fetchError } = await supabase
      .from('invites')
      .select('*')
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
    }

    if (!pendingInvites || pendingInvites.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No pending invites to send',
        sent: 0 
      })
    }

    const resend = getResendClient()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3030'
    
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Send emails for each pending invite
    for (const invite of pendingInvites) {
      const inviteUrl = `${baseUrl}/invite/${invite.token}`
      const committeeName = invite.committee === 'implementation' ? 'Implementation Committee' : 'Oversight Committee'
      const teamName = invite.team ? invite.team.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : ''

      try {
        const { error: emailError } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'AI Portal <noreply@torsor.co.uk>',
          to: invite.email,
          subject: `You're invited to join the RPGCC AI Portal - ${committeeName}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                  <!-- Logo -->
                  <div style="text-align: center; margin-bottom: 32px;">
                    <span style="font-size: 32px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em;">RPGCC</span>
                    <span style="display: inline-block; margin-left: 8px;">
                      <span style="display: inline-block; width: 10px; height: 10px; background: #2D9CDB; border-radius: 50%;"></span>
                      <span style="display: inline-block; width: 10px; height: 10px; background: #EB5757; border-radius: 50%; margin-left: 4px;"></span>
                      <span style="display: inline-block; width: 10px; height: 10px; background: #F2994A; border-radius: 50%; margin-left: 4px;"></span>
                    </span>
                  </div>
                  
                  <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; text-align: center;">
                    You're Invited!
                  </h1>
                  
                  <p style="font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                    You've been invited to join the RPGCC AI Portal as a member of the <strong style="color: ${invite.committee === 'implementation' ? '#2D9CDB' : '#F2994A'}">${committeeName}</strong>.
                  </p>
                  
                  <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                      <span style="font-size: 14px; color: #64748b;">Role:</span>
                      <span style="font-size: 14px; font-weight: 600; color: #0f172a; text-transform: capitalize;">${invite.role}</span>
                    </div>
                    ${teamName ? `
                    <div style="display: flex; justify-content: space-between;">
                      <span style="font-size: 14px; color: #64748b;">Team:</span>
                      <span style="font-size: 14px; font-weight: 600; color: #0f172a;">${teamName}</span>
                    </div>
                    ` : ''}
                  </div>
                  
                  <div style="text-align: center; margin-bottom: 24px;">
                    <a href="${inviteUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, ${invite.committee === 'implementation' ? '#2D9CDB' : '#F2994A'} 0%, ${invite.committee === 'implementation' ? '#1e7fc2' : '#ee7c21'} 100%); 
                              color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; 
                              font-weight: 600; font-size: 16px;">
                      Accept Invitation
                    </a>
                  </div>
                  
                  <p style="font-size: 14px; color: #94a3b8; text-align: center; margin: 0 0 16px 0;">
                    This invitation expires in 30 days.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                  
                  <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
                    If you didn't expect this invitation, you can safely ignore this email.
                  </p>
                </div>
                
                <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">
                  © ${new Date().getFullYear()} RPGCC. AI Portal
                </p>
              </div>
            </body>
            </html>
          `,
        })

        if (emailError) {
          console.error(`Failed to send to ${invite.email}:`, emailError)
          results.failed++
          results.errors.push(`${invite.email}: ${emailError.message}`)
        } else {
          results.sent++
        }
      } catch (err) {
        console.error(`Error sending to ${invite.email}:`, err)
        results.failed++
        results.errors.push(`${invite.email}: Unknown error`)
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sent ${results.sent} invite${results.sent !== 1 ? 's' : ''} successfully`,
      ...results
    })
  } catch (error) {
    console.error('Bulk invite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

