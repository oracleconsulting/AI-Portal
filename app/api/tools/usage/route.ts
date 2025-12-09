import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  
  // Can be called with or without authentication (for external tools)
  const { data: { user } } = await supabase.auth.getUser()
  
  const body = await req.json()
  const {
    tool_id,
    usage_type = 'query',
    tokens_input,
    tokens_output,
    cost_estimate,
    duration_ms,
    task_category,
    success = true,
    team,
    client_id,
    metadata,
  } = body

  if (!tool_id) {
    return NextResponse.json({ error: 'tool_id is required' }, { status: 400 })
  }

  // Validate tool exists
  const { data: tool } = await supabase
    .from('ai_tools')
    .select('id, name')
    .eq('id', tool_id)
    .single()

  if (!tool) {
    return NextResponse.json({ error: 'Invalid tool_id' }, { status: 400 })
  }

  // Get user's team if authenticated
  let userTeam = team
  if (user && !userTeam) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('team')
      .eq('id', user.id)
      .single()
    userTeam = profile?.team || null
  }

  // Log usage
  const { data: usage, error } = await supabase
    .from('ai_tool_usage')
    .insert({
      tool_id,
      user_id: user?.id || null,
      usage_type,
      tokens_input: tokens_input || null,
      tokens_output: tokens_output || null,
      cost_estimate: cost_estimate || null,
      duration_ms: duration_ms || null,
      task_category: task_category || null,
      success,
      team: userTeam,
      client_id: client_id || null,
      metadata: metadata || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, usage_id: usage.id })
}

// GET - Usage statistics
export async function GET(req: NextRequest) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = req.nextUrl.searchParams
  const toolId = searchParams.get('tool_id')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const team = searchParams.get('team')

  // Check if user has permission
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, committee, team')
    .eq('id', user.id)
    .single()

  const canViewAll = profile?.role === 'admin' || profile?.committee === 'oversight'

  let query = supabase
    .from('tool_usage_daily')
    .select('*')

  if (toolId) query = query.eq('tool_id', toolId)
  if (startDate) query = query.gte('usage_date', startDate)
  if (endDate) query = query.lte('usage_date', endDate)
  if (team) query = query.eq('team', team)
  if (!canViewAll) {
    // Users can only see their own team's usage
    query = query.eq('team', profile?.team || '')
  }

  const { data, error } = await query.order('usage_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Calculate aggregates
  const totals = {
    total_uses: data?.reduce((sum: number, d: any) => sum + (d.total_uses || 0), 0) || 0,
    total_cost: data?.reduce((sum: number, d: any) => sum + parseFloat(d.total_cost || '0'), 0) || 0,
    unique_users: new Set(data?.flatMap((d: any) => d.unique_users || []) || []).size,
  }

  return NextResponse.json({ data, totals })
}

