import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(apiKey)
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    
    // Check if user is authenticated and is admin/chair
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only jhoward@rpgcc.co.uk can send invites
    if (user.email !== 'jhoward@rpgcc.co.uk') {
      return NextResponse.json({ error: 'Only admins can send invites' }, { status: 403 })
    }

    const body = await request.json()
    const { email, committee, role = 'member' } = body

    if (!email || !committee) {
      return NextResponse.json({ error: 'Email and committee are required' }, { status: 400 })
    }

    // Generate unique token
    const token = crypto.randomUUID() + '-' + Date.now().toString(36)

    // Create invite in database
    const { data: invite, error: insertError } = await supabase
      .from('invites')
      .insert({
        email,
        committee,
        role,
        token,
        invited_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Get the base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3030'
    const inviteUrl = `${baseUrl}/invite/${token}`

    const committeeName = committee === 'implementation' ? 'Implementation Committee' : 'Oversight Committee'

    // Send email via Resend
    const resend = getResendClient()
    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'AI Portal <noreply@torsor.co.uk>',
      to: email,
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
                You've been invited to join the RPGCC AI Portal as a member of the <strong style="color: ${committee === 'implementation' ? '#2D9CDB' : '#F2994A'}">${committeeName}</strong>.
              </p>
              
              <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="font-size: 14px; color: #64748b; margin: 0 0 8px 0;">Your role:</p>
                <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0; text-transform: capitalize;">${role}</p>
              </div>
              
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${inviteUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, ${committee === 'implementation' ? '#2D9CDB' : '#F2994A'} 0%, ${committee === 'implementation' ? '#1e7fc2' : '#ee7c21'} 100%); 
                          color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; 
                          font-weight: 600; font-size: 16px;">
                  Accept Invitation
                </a>
              </div>
              
              <p style="font-size: 14px; color: #94a3b8; text-align: center; margin: 0 0 16px 0;">
                This invitation expires in 7 days.
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
      console.error('Email error:', emailError)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      invite: { id: invite.id, email, committee, role } 
    })
  } catch (error) {
    console.error('Invite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

