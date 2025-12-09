import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Using dynamic import to avoid build errors if package not installed
let Anthropic: any = null
try {
  Anthropic = require('@anthropic-ai/sdk').default
} catch {
  // Package not installed - will handle gracefully
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { formData } = await req.json()

  if (!formData) {
    return NextResponse.json({ error: 'Form data required' }, { status: 400 })
  }

  // Check if Anthropic is configured
  if (!Anthropic || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'AI prediction not configured. Please set ANTHROPIC_API_KEY environment variable.' },
      { status: 503 }
    )
  }

  // Fetch historical data for context
  const { data: historicalReviews } = await supabase
    .from('implementation_reviews')
    .select(`
      *,
      identification_forms (
        problem_identified,
        solution,
        cost_of_solution,
        time_savings,
        priority,
        team,
        risk_category
      )
    `)
    .not('actual_annual_value', 'is', null)
    .not('variance_percentage', 'is', null)

  // Calculate statistics
  const stats = calculateHistoricalStats(historicalReviews || [])

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    // Calculate projected annual value from time savings
    let projectedAnnualValue = 0
    if (formData.time_savings && Array.isArray(formData.time_savings)) {
      const DEFAULT_RATES: Record<string, number> = {
        admin: 80,
        junior: 100,
        senior: 120,
        assistant_manager: 150,
        manager: 175,
        director: 250,
        partner: 400,
      }
      const weeklyValue = formData.time_savings.reduce((sum: number, ts: any) => {
        const rate = DEFAULT_RATES[ts.staff_level] || 100
        return sum + (ts.hours_per_week || 0) * rate
      }, 0)
      projectedAnnualValue = weeklyValue * 52
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `You are an AI ROI prediction assistant for an accounting firm's AI implementation initiatives.

Based on historical data and the new proposal, predict the likely actual ROI and provide confidence levels.

HISTORICAL STATISTICS:
- Average variance: ${stats.avgVariance.toFixed(1)}%
- Typical overestimate: ${stats.avgOverestimate.toFixed(1)}%
- Accuracy rate (within ±15%): ${stats.accuracyRate.toFixed(0)}%
- Team-specific adjustments:
${Object.entries(stats.teamAdjustments).map(([team, adj]) => `  - ${team}: ${(adj as number).toFixed(1)}%`).join('\n')}

NEW PROPOSAL:
- Problem: ${formData.problem_identified}
- Solution: ${formData.solution || 'Not specified'}
- Estimated Cost: £${formData.cost_of_solution || 0}
- Projected Annual Value: £${projectedAnnualValue}
- Team: ${formData.team || 'Not specified'}
- Priority: ${formData.priority || 'medium'}
- Risk Category: ${formData.risk_category || 'Not specified'}

Please provide:
1. **Predicted Actual Annual Value** (£) with confidence range
2. **Predicted ROI** (%) with confidence range
3. **Risk Factors** that could affect the prediction
4. **Recommendations** to improve accuracy
5. **Confidence Level** (low/medium/high) with explanation

Return as JSON:
{
  "predicted_annual_value": number,
  "value_range_low": number,
  "value_range_high": number,
  "predicted_roi": number,
  "roi_range_low": number,
  "roi_range_high": number,
  "confidence_level": "low" | "medium" | "high",
  "confidence_explanation": "string",
  "risk_factors": ["string"],
  "recommendations": ["string"]
}`,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}'
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    const prediction = jsonMatch ? JSON.parse(jsonMatch[0]) : null

    if (!prediction) {
      throw new Error('Failed to parse AI response')
    }

    return NextResponse.json({
      success: true,
      prediction,
      historicalStats: stats,
    })
  } catch (error) {
    console.error('ROI prediction error:', error)
    return NextResponse.json(
      { error: 'Failed to generate prediction: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}

function calculateHistoricalStats(reviews: any[]) {
  if (reviews.length === 0) {
    return {
      avgVariance: 0,
      avgOverestimate: 0,
      accuracyRate: 0,
      teamAdjustments: {},
    }
  }

  const variances = reviews.map(r => r.variance_percentage || 0)
  const avgVariance = variances.reduce((a, b) => a + b, 0) / variances.length
  
  const overestimates = variances.filter(v => v > 0)
  const avgOverestimate = overestimates.length > 0
    ? overestimates.reduce((a, b) => a + b, 0) / overestimates.length
    : 0
  
  const accurate = variances.filter(v => Math.abs(v) <= 15).length
  const accuracyRate = (accurate / variances.length) * 100

  // Team-specific adjustments
  const teamAdjustments: Record<string, number> = {}
  const teamGroups: Record<string, number[]> = {}
  
  reviews.forEach(r => {
    const team = r.identification_forms?.team
    if (team) {
      if (!teamGroups[team]) teamGroups[team] = []
      teamGroups[team].push(r.variance_percentage || 0)
    }
  })

  Object.entries(teamGroups).forEach(([team, variances]) => {
    teamAdjustments[team] = variances.reduce((a, b) => a + b, 0) / variances.length
  })

  return {
    avgVariance,
    avgOverestimate,
    accuracyRate,
    teamAdjustments,
  }
}

