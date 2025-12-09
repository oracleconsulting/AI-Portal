import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { toCSV, formatExportDate, formatExportCurrency } from '@/lib/utils/export'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = req.nextUrl.searchParams
  const reviewType = searchParams.get('review_type')
  const recommendation = searchParams.get('recommendation')

  let query = supabase
    .from('implementation_reviews')
    .select(`
      *,
      identification_forms (
        problem_identified,
        team
      )
    `)
    .order('review_date', { ascending: false })

  if (reviewType && reviewType !== 'all') {
    query = query.eq('review_type', reviewType)
  }
  if (recommendation && recommendation !== 'all') {
    query = query.eq('recommendation', recommendation)
  }

  const { data: reviews, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const exportData = (reviews || []).map((review: any) => ({
    form_title: review.identification_forms?.problem_identified || 'Unknown',
    team: review.identification_forms?.team || 'Unknown',
    review_type: review.review_type,
    review_date: formatExportDate(review.review_date),
    review_due_date: formatExportDate(review.review_due_date),
    
    // Projected values
    projected_weekly_hours: review.projected_weekly_hours || '',
    projected_annual_value: formatExportCurrency(review.projected_annual_value),
    projected_cost: formatExportCurrency(review.projected_cost),
    
    // Actual values
    actual_weekly_hours: review.actual_weekly_hours || '',
    actual_annual_value: formatExportCurrency(review.actual_annual_value),
    actual_cost: formatExportCurrency(review.actual_cost),
    actual_roi: review.actual_roi ? review.actual_roi.toFixed(1) : '',
    
    // Variance
    variance_percentage: review.variance_percentage ? review.variance_percentage.toFixed(1) : '',
    
    // Qualitative
    user_satisfaction_score: review.user_satisfaction_score || '',
    adoption_rate_percentage: review.adoption_rate_percentage || '',
    quality_impact: review.quality_impact || '',
    
    // Notes
    challenges_encountered: review.challenges_encountered || '',
    unexpected_benefits: review.unexpected_benefits || '',
    lessons_learned: review.lessons_learned || '',
    
    // Outcome
    recommendation: review.recommendation || '',
    recommendation_notes: review.recommendation_notes || '',
    
    // Meta
    reviewed_by_name: review.reviewed_by_name || '',
    next_review_date: formatExportDate(review.next_review_date),
    requires_oversight_review: review.requires_oversight_review ? 'Yes' : 'No',
  }))

  const columns = [
    { key: 'form_title', header: 'Implementation' },
    { key: 'team', header: 'Team' },
    { key: 'review_type', header: 'Review Type' },
    { key: 'review_date', header: 'Review Date' },
    { key: 'review_due_date', header: 'Review Due Date' },
    { key: 'projected_weekly_hours', header: 'Projected Weekly Hours' },
    { key: 'projected_annual_value', header: 'Projected Annual Value (£)' },
    { key: 'projected_cost', header: 'Projected Cost (£)' },
    { key: 'actual_weekly_hours', header: 'Actual Weekly Hours' },
    { key: 'actual_annual_value', header: 'Actual Annual Value (£)' },
    { key: 'actual_cost', header: 'Actual Cost (£)' },
    { key: 'actual_roi', header: 'Actual ROI (%)' },
    { key: 'variance_percentage', header: 'Variance (%)' },
    { key: 'user_satisfaction_score', header: 'User Satisfaction (1-5)' },
    { key: 'adoption_rate_percentage', header: 'Adoption Rate (%)' },
    { key: 'quality_impact', header: 'Quality Impact' },
    { key: 'challenges_encountered', header: 'Challenges' },
    { key: 'unexpected_benefits', header: 'Unexpected Benefits' },
    { key: 'lessons_learned', header: 'Lessons Learned' },
    { key: 'recommendation', header: 'Recommendation' },
    { key: 'recommendation_notes', header: 'Recommendation Notes' },
    { key: 'reviewed_by_name', header: 'Reviewed By' },
    { key: 'next_review_date', header: 'Next Review' },
    { key: 'requires_oversight_review', header: 'Needs Oversight' },
  ]

  const csv = toCSV(exportData, columns)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="implementation-reviews-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}

