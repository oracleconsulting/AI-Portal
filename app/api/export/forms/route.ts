import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { toCSV, formatExportDate, formatExportCurrency } from '@/lib/utils/export'
import { calculateFullROI } from '@/lib/utils/roi'

// Default staff rates for calculation (will be fetched from DB in production)
const DEFAULT_RATES: Record<string, number> = {
  admin: 80,
  junior: 100,
  senior: 120,
  assistant_manager: 150,
  manager: 175,
  director: 250,
  partner: 400,
}

export async function GET(req: NextRequest) {
  const supabase = createClient()
  
  // Check authorization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get query params for filtering
  const searchParams = req.nextUrl.searchParams
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const team = searchParams.get('team')
  const oversightStatus = searchParams.get('oversight_status')

  // Build query
  let query = supabase
    .from('identification_forms')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }
  if (priority && priority !== 'all') {
    query = query.eq('priority', priority)
  }
  if (team && team !== 'all') {
    query = query.eq('team', team)
  }
  if (oversightStatus && oversightStatus !== 'all') {
    query = query.eq('oversight_status', oversightStatus)
  }

  const { data: forms, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform data for export
  const exportData = (forms || []).map(form => {
    // Calculate ROI values
    const timeSavings = form.time_savings || []
    let weeklyValue = 0
    let annualValue = 0
    let roi = 0
    let paybackMonths = 0

    if (Array.isArray(timeSavings) && timeSavings.length > 0) {
      const roiSummary = calculateFullROI(timeSavings, form.cost_of_solution || 0, DEFAULT_RATES)
      weeklyValue = roiSummary.weeklyValue
      annualValue = roiSummary.annualValue
      roi = roiSummary.roi
      paybackMonths = roiSummary.paybackMonths
    }

    return {
      id: form.id,
      problem_identified: form.problem_identified,
      solution: form.solution || '',
      cost_of_solution: formatExportCurrency(form.cost_of_solution),
      priority: form.priority,
      status: form.status,
      team: form.team || '',
      submitted_by_name: form.submitted_by_name || '',
      created_at: formatExportDate(form.created_at),
      updated_at: formatExportDate(form.updated_at),
      weekly_value: formatExportCurrency(weeklyValue),
      annual_value: formatExportCurrency(annualValue),
      roi_percentage: roi.toFixed(1),
      payback_months: paybackMonths === Infinity ? '' : paybackMonths.toFixed(1),
      oversight_status: form.oversight_status || '',
      oversight_reviewed_at: formatExportDate(form.oversight_reviewed_at),
      oversight_notes: form.oversight_notes || '',
      risk_category: form.risk_category || '',
      risk_score: form.risk_score || '',
      data_classification: form.data_classification || '',
      notes: form.notes || '',
    }
  })

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'problem_identified', header: 'Problem Identified' },
    { key: 'solution', header: 'Proposed Solution' },
    { key: 'cost_of_solution', header: 'Cost (£)' },
    { key: 'priority', header: 'Priority' },
    { key: 'status', header: 'Status' },
    { key: 'team', header: 'Team' },
    { key: 'submitted_by_name', header: 'Submitted By' },
    { key: 'created_at', header: 'Created' },
    { key: 'updated_at', header: 'Updated' },
    { key: 'weekly_value', header: 'Weekly Value (£)' },
    { key: 'annual_value', header: 'Annual Value (£)' },
    { key: 'roi_percentage', header: 'ROI (%)' },
    { key: 'payback_months', header: 'Payback (Months)' },
    { key: 'oversight_status', header: 'Oversight Status' },
    { key: 'oversight_reviewed_at', header: 'Oversight Reviewed' },
    { key: 'oversight_notes', header: 'Oversight Notes' },
    { key: 'risk_category', header: 'Risk Category' },
    { key: 'risk_score', header: 'Risk Score' },
    { key: 'data_classification', header: 'Data Classification' },
    { key: 'notes', header: 'Notes' },
  ]

  const csv = toCSV(exportData, columns)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="identification-forms-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}

