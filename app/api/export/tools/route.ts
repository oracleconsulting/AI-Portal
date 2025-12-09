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
  const status = searchParams.get('status')
  const category = searchParams.get('category')

  let query = supabase
    .from('ai_tools')
    .select('*')
    .order('name')

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }
  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data: tools, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const exportData = (tools || []).map(tool => ({
    name: tool.name,
    vendor: tool.vendor,
    version: tool.version || '',
    category: tool.category,
    status: tool.status,
    description: tool.description || '',
    data_classification_permitted: tool.data_classification_permitted,
    data_residency: tool.data_residency || '',
    processes_pii: tool.processes_pii ? 'Yes' : 'No',
    processes_client_data: tool.processes_client_data ? 'Yes' : 'No',
    pricing_model: tool.pricing_model || '',
    annual_cost: formatExportCurrency(tool.annual_cost),
    cost_per_unit: formatExportCurrency(tool.cost_per_unit),
    security_score: tool.security_score || '',
    risk_score: tool.risk_score || '',
    has_soc2: tool.has_soc2 ? 'Yes' : 'No',
    has_iso27001: tool.has_iso27001 ? 'Yes' : 'No',
    gdpr_compliant: tool.gdpr_compliant ? 'Yes' : 'No',
    approved_use_cases: (tool.approved_use_cases || []).join('; '),
    prohibited_use_cases: (tool.prohibited_use_cases || []).join('; '),
    vendor_url: tool.vendor_url || '',
    documentation_url: tool.documentation_url || '',
    next_review_date: formatExportDate(tool.next_review_date),
    created_at: formatExportDate(tool.created_at),
    updated_at: formatExportDate(tool.updated_at),
  }))

  const columns = [
    { key: 'name', header: 'Tool Name' },
    { key: 'vendor', header: 'Vendor' },
    { key: 'version', header: 'Version' },
    { key: 'category', header: 'Category' },
    { key: 'status', header: 'Status' },
    { key: 'description', header: 'Description' },
    { key: 'data_classification_permitted', header: 'Max Data Classification' },
    { key: 'data_residency', header: 'Data Residency' },
    { key: 'processes_pii', header: 'Processes PII' },
    { key: 'processes_client_data', header: 'Processes Client Data' },
    { key: 'pricing_model', header: 'Pricing Model' },
    { key: 'annual_cost', header: 'Annual Cost (£)' },
    { key: 'cost_per_unit', header: 'Cost Per Unit (£)' },
    { key: 'security_score', header: 'Security Score (1-5)' },
    { key: 'risk_score', header: 'Risk Score (1-5)' },
    { key: 'has_soc2', header: 'SOC 2' },
    { key: 'has_iso27001', header: 'ISO 27001' },
    { key: 'gdpr_compliant', header: 'GDPR Compliant' },
    { key: 'approved_use_cases', header: 'Approved Use Cases' },
    { key: 'prohibited_use_cases', header: 'Prohibited Use Cases' },
    { key: 'vendor_url', header: 'Vendor URL' },
    { key: 'documentation_url', header: 'Documentation URL' },
    { key: 'next_review_date', header: 'Next Review' },
    { key: 'created_at', header: 'Created' },
    { key: 'updated_at', header: 'Last Updated' },
  ]

  const csv = toCSV(exportData, columns)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="ai-tools-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}

