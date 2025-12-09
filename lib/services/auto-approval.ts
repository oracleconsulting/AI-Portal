import { createClient } from '@/lib/supabase/server'

interface AutoApprovalRule {
  id: string
  name: string
  is_active: boolean
  max_cost: number | null
  max_risk_score: number | null
  allowed_data_classifications: string[] | null
  allowed_teams: string[] | null
  require_all_conditions: boolean
  auto_approve: boolean
  approval_conditions: string | null
}

interface FormData {
  id: string
  cost_of_solution: number
  risk_score: number | null
  data_classification: string | null
  team: string
}

export async function evaluateAutoApproval(formId: string): Promise<{
  shouldProcess: boolean
  action: 'approve' | 'reject' | 'escalate'
  ruleId?: string
  ruleName?: string
  conditions?: string
  reason: string
}> {
  const supabase = createClient()

  // Get form details
  const { data: form } = await supabase
    .from('identification_forms')
    .select('id, cost_of_solution, risk_score, data_classification, team')
    .eq('id', formId)
    .single()

  if (!form) {
    return {
      shouldProcess: false,
      action: 'escalate',
      reason: 'Form not found',
    }
  }

  // Get active rules
  const { data: rules } = await supabase
    .from('auto_approval_rules')
    .select('*')
    .eq('is_active', true)
    .order('created_at')

  if (!rules || rules.length === 0) {
    return {
      shouldProcess: false,
      action: 'escalate',
      reason: 'No auto-approval rules configured',
    }
  }

  // Evaluate each rule
  for (const rule of rules) {
    const result = evaluateRule(rule, form)
    if (result.matches) {
      // Log the action
      await supabase.from('auto_approval_log').insert({
        rule_id: rule.id,
        form_id: formId,
        action: rule.auto_approve ? 'approved' : 'rejected',
        reason: `Matched rule: ${rule.name}`,
      })

      return {
        shouldProcess: true,
        action: rule.auto_approve ? 'approve' : 'reject',
        ruleId: rule.id,
        ruleName: rule.name,
        conditions: rule.approval_conditions || undefined,
        reason: result.reason,
      }
    }
  }

  // No rules matched - escalate to manual review
  return {
    shouldProcess: false,
    action: 'escalate',
    reason: 'No auto-approval rules matched',
  }
}

function evaluateRule(
  rule: AutoApprovalRule,
  form: FormData
): { matches: boolean; reason: string } {
  const conditions: { met: boolean; description: string }[] = []

  // Check cost
  if (rule.max_cost !== null) {
    conditions.push({
      met: (form.cost_of_solution || 0) <= rule.max_cost,
      description: `Cost £${form.cost_of_solution || 0} ${(form.cost_of_solution || 0) <= rule.max_cost ? '≤' : '>'} £${rule.max_cost}`,
    })
  }

  // Check risk score
  if (rule.max_risk_score !== null && form.risk_score !== null) {
    conditions.push({
      met: form.risk_score <= rule.max_risk_score,
      description: `Risk ${form.risk_score} ${form.risk_score <= rule.max_risk_score ? '≤' : '>'} ${rule.max_risk_score}`,
    })
  }

  // Check data classification
  if (rule.allowed_data_classifications && rule.allowed_data_classifications.length > 0) {
    const allowed = form.data_classification 
      ? rule.allowed_data_classifications.includes(form.data_classification)
      : false
    conditions.push({
      met: allowed,
      description: `Data classification ${form.data_classification || 'none'} ${allowed ? 'is' : 'is not'} in allowed list`,
    })
  }

  // Check team
  if (rule.allowed_teams && rule.allowed_teams.length > 0) {
    const allowed = rule.allowed_teams.includes(form.team)
    conditions.push({
      met: allowed,
      description: `Team ${form.team} ${allowed ? 'is' : 'is not'} in allowed list`,
    })
  }

  if (conditions.length === 0) {
    return { matches: false, reason: 'No conditions to evaluate' }
  }

  const allMet = conditions.every(c => c.met)
  const anyMet = conditions.some(c => c.met)
  const matches = rule.require_all_conditions ? allMet : anyMet

  return {
    matches,
    reason: conditions.map(c => `${c.met ? '✓' : '✗'} ${c.description}`).join('; '),
  }
}

// Apply auto-approval to a form
export async function applyAutoApproval(
  formId: string,
  action: 'approve' | 'reject',
  conditions?: string
) {
  const supabase = createClient()

  const updateData: any = {
    oversight_status: action === 'approve' ? 'approved' : 'rejected',
    oversight_reviewed_at: new Date().toISOString(),
    oversight_notes: `Auto-${action}ed by system rule`,
  }

  if (conditions) {
    updateData.oversight_conditions = conditions
  }

  const { error } = await supabase
    .from('identification_forms')
    .update(updateData)
    .eq('id', formId)

  return { success: !error, error }
}

