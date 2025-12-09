import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { notifyReviewDue, sendWeeklyDigest } from '@/lib/services/notifications'

// Protect with a secret
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()
  const results: any = { reviewReminders: [], weeklyDigests: [] }

  // 1. Send review due reminders
  const today = new Date()
  const inFiveDays = new Date(today)
  inFiveDays.setDate(inFiveDays.getDate() + 5)

  // Get forms with reviews due soon or overdue
  const { data: pendingReviews } = await supabase
    .from('identification_forms')
    .select(`
      id,
      problem_identified,
      submitted_by,
      next_review_date,
      profiles!identification_forms_submitted_by_fkey (
        email,
        full_name
      )
    `)
    .eq('status', 'in_progress')
    .not('next_review_date', 'is', null)
    .lte('next_review_date', inFiveDays.toISOString())

  for (const form of pendingReviews || []) {
    if (!form.next_review_date) continue
    
    const dueDate = new Date(form.next_review_date)
    const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    // Only send if due in 5 days, 1 day, or overdue
    if (daysUntilDue === 5 || daysUntilDue === 1 || daysUntilDue < 0) {
      const profile = (form as any).profiles
      if (profile?.email) {
        const result = await notifyReviewDue({
          recipientEmail: profile.email,
          recipientName: profile.full_name || 'Team Member',
          formTitle: form.problem_identified,
          formId: form.id,
          reviewType: 'scheduled',
          dueDate: dueDate.toLocaleDateString('en-GB'),
          daysOverdue: daysUntilDue < 0 ? Math.abs(daysUntilDue) : undefined,
        })
        results.reviewReminders.push({ formId: form.id, ...result })
      }
    }
  }

  // 2. Send weekly digests (only on Mondays)
  if (today.getDay() === 1) {
    const { data: users } = await supabase
      .from('profiles')
      .select('id, email, full_name, committee, team')

    for (const user of users || []) {
      // Get user's pending reviews
      const { data: userReviews } = await supabase
        .from('identification_forms')
        .select('id, problem_identified, next_review_date')
        .eq('submitted_by', user.id)
        .eq('status', 'in_progress')
        .not('next_review_date', 'is', null)
        .lte('next_review_date', inFiveDays.toISOString())

      // Get new proposals this week
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const { data: newProposals } = await supabase
        .from('identification_forms')
        .select('problem_identified, team, time_savings')
        .eq('committee', user.committee)
        .gte('created_at', weekAgo.toISOString())
        .limit(5)

      // Get pending policy acknowledgments
      const { data: policies } = await supabase
        .from('policy_documents')
        .select('id, title')
        .eq('status', 'approved')
        .contains('applies_to_committees', [user.committee])

      const { data: acknowledged } = await supabase
        .from('policy_acknowledgments')
        .select('policy_id')
        .eq('user_id', user.id)

      const acknowledgedIds = new Set((acknowledged || []).map((a: any) => a.policy_id))
      const pendingAcknowledgments = (policies || [])
        .filter((p: any) => !acknowledgedIds.has(p.id))
        .map((p: any) => ({ title: p.title, policyId: p.id }))

      // Calculate proposal values
      const proposalsWithValues = (newProposals || []).map((p: any) => {
        const timeSavings = p.time_savings || []
        const weeklyValue = Array.isArray(timeSavings) 
          ? timeSavings.reduce((sum: number, ts: any) => {
              const rate = getStaffRate(ts.staff_level)
              return sum + (ts.hours_per_week || 0) * rate
            }, 0)
          : 0
        return {
          title: p.problem_identified,
          team: p.team || 'unknown',
          value: weeklyValue * 52,
        }
      })

      const result = await sendWeeklyDigest({
        recipientEmail: user.email,
        recipientName: user.full_name || 'Team Member',
        pendingReviews: (userReviews || []).map((r: any) => ({
          title: r.problem_identified,
          dueDate: r.next_review_date ? new Date(r.next_review_date).toLocaleDateString('en-GB') : '',
          formId: r.id,
        })),
        newProposals: proposalsWithValues,
        toolUpdates: [], // Add tool updates if needed
        pendingAcknowledgments,
      })

      if (!('skipped' in result && result.skipped)) {
        results.weeklyDigests.push({ userId: user.id, ...result })
      }
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results,
  })
}

function getStaffRate(staffLevel: string): number {
  const rates: Record<string, number> = {
    admin: 80,
    junior: 100,
    senior: 120,
    assistant_manager: 150,
    manager: 175,
    director: 250,
    partner: 400,
  }
  return rates[staffLevel] || 0
}

