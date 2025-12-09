import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const body = await req.json()
    const { user_id, ip_address, user_agent } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    // Get IP address from request headers if not provided
    const clientIp = ip_address || 
      req.headers.get('x-forwarded-for')?.split(',')[0] || 
      req.headers.get('x-real-ip') || 
      null

    // Call the database function to log login
    const { error } = await supabase.rpc('log_user_login', {
      p_user_id: user_id,
      p_ip_address: clientIp,
      p_user_agent: user_agent || req.headers.get('user-agent') || null,
      p_session_id: null, // Could generate a session ID if needed
    })

    if (error) {
      console.error('Error logging login:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in log-login route:', error)
    return NextResponse.json(
      { error: 'Failed to log login activity' },
      { status: 500 }
    )
  }
}

