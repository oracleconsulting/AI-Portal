// ROI Tiers System - Defines approval pathways based on cost, risk, and data classification

export interface ROITier {
  id: string
  name: string
  description: string

  // Cost thresholds
  costMin: number
  costMax: number | null // null = unlimited

  // Risk thresholds
  maxRiskScore: number
  allowedDataClassifications: string[]

  // Approval pathway
  approvalPathway: 'auto' | 'fast_track' | 'full_oversight' | 'partner'
  approvalDescription: string

  // Time expectations
  targetApprovalDays: number

  // Requirements
  requiresROIProjection: boolean
  requiresRiskAssessment: boolean
  requiresToolApproval: boolean
  requiresPostReview: boolean
  postReviewSchedule?: string[] // e.g., ['30_day', '90_day']
}

export interface EscalationTrigger {
  trigger: string
  description: string
  escalateTo: 'full_oversight' | 'partner'
}

export const ROI_TIERS: ROITier[] = [
  {
    id: 'tier-1-minimal',
    name: 'Tier 1: Minimal Investment',
    description: 'Low-cost, low-risk experiments using approved tools',
    costMin: 0,
    costMax: 1000,
    maxRiskScore: 2,
    allowedDataClassifications: ['public', 'internal'],
    approvalPathway: 'auto',
    approvalDescription: 'Auto-approved if using approved tool within policy bounds',
    targetApprovalDays: 0,
    requiresROIProjection: false,
    requiresRiskAssessment: false,
    requiresToolApproval: true, // Tool must be pre-approved
    requiresPostReview: false,
  },
  {
    id: 'tier-2-standard',
    name: 'Tier 2: Standard Investment',
    description: 'Moderate investment with clear ROI potential',
    costMin: 1001,
    costMax: 5000,
    maxRiskScore: 3,
    allowedDataClassifications: ['public', 'internal', 'confidential'],
    approvalPathway: 'fast_track',
    approvalDescription: 'Fast-track by dual-committee members (James, Katy, Steve)',
    targetApprovalDays: 2,
    requiresROIProjection: true,
    requiresRiskAssessment: true,
    requiresToolApproval: true,
    requiresPostReview: true,
    postReviewSchedule: ['90_day'],
  },
  {
    id: 'tier-3-significant',
    name: 'Tier 3: Significant Investment',
    description: 'Substantial investment requiring full oversight review',
    costMin: 5001,
    costMax: 25000,
    maxRiskScore: 4,
    allowedDataClassifications: ['public', 'internal', 'confidential'],
    approvalPathway: 'full_oversight',
    approvalDescription: 'Full Oversight Committee (3/5 majority)',
    targetApprovalDays: 5,
    requiresROIProjection: true,
    requiresRiskAssessment: true,
    requiresToolApproval: true,
    requiresPostReview: true,
    postReviewSchedule: ['30_day', '90_day', '365_day'],
  },
  {
    id: 'tier-4-strategic',
    name: 'Tier 4: Strategic Investment',
    description: 'Major investment or high-risk initiatives requiring partner involvement',
    costMin: 25001,
    costMax: null,
    maxRiskScore: 5,
    allowedDataClassifications: ['public', 'internal', 'confidential', 'restricted'],
    approvalPathway: 'partner',
    approvalDescription: 'Full Oversight + Partner sign-off required',
    targetApprovalDays: 10,
    requiresROIProjection: true,
    requiresRiskAssessment: true,
    requiresToolApproval: true,
    requiresPostReview: true,
    postReviewSchedule: ['30_day', '90_day', '180_day', '365_day'],
  },
]

// Special cases that always escalate regardless of tier
export const ESCALATION_TRIGGERS: EscalationTrigger[] = [
  {
    trigger: 'restricted_data',
    description: 'Any use of restricted data classification',
    escalateTo: 'partner',
  },
  {
    trigger: 'client_facing',
    description: 'AI outputs shared directly with clients',
    escalateTo: 'full_oversight',
  },
  {
    trigger: 'new_vendor',
    description: 'Tool from vendor not yet in registry',
    escalateTo: 'full_oversight',
  },
  {
    trigger: 'audit_use',
    description: 'AI used in audit evidence or conclusions',
    escalateTo: 'full_oversight',
  },
  {
    trigger: 'regulatory_filing',
    description: 'AI used in regulatory filings (tax returns, etc.)',
    escalateTo: 'full_oversight',
  },
]

// Function to determine tier for a proposal
export function determineROITier(proposal: {
  cost: number
  riskScore: number | null
  dataClassification: string | null
  escalationTriggers: string[]
}): ROITier {
  // Check for escalation triggers first
  if (proposal.escalationTriggers.length > 0) {
    // Find highest escalation level
    const hasPartnerEscalation = proposal.escalationTriggers.some(
      t => ESCALATION_TRIGGERS.find(et => et.trigger === t)?.escalateTo === 'partner'
    )
    if (hasPartnerEscalation) {
      return ROI_TIERS.find(t => t.id === 'tier-4-strategic')!
    }
    return ROI_TIERS.find(t => t.id === 'tier-3-significant')!
  }

  // Find tier by cost
  for (const tier of ROI_TIERS) {
    const costInRange =
      proposal.cost >= tier.costMin && (tier.costMax === null || proposal.cost <= tier.costMax)

    if (!costInRange) continue

    // Check risk score
    if (proposal.riskScore && proposal.riskScore > tier.maxRiskScore) {
      continue // Risk too high for this tier
    }

    // Check data classification
    if (
      proposal.dataClassification &&
      !tier.allowedDataClassifications.includes(proposal.dataClassification)
    ) {
      continue // Data class not allowed
    }

    return tier
  }

  // Default to highest tier if nothing matches
  return ROI_TIERS[ROI_TIERS.length - 1]
}

// Get tier by ID
export function getTierById(tierId: string): ROITier | undefined {
  return ROI_TIERS.find(t => t.id === tierId)
}

// Get tier color for UI
export function getTierColor(tierId: string): string {
  const colors: Record<string, string> = {
    'tier-1-minimal': 'bg-gray-100 text-gray-700 border-gray-300',
    'tier-2-standard': 'bg-green-100 text-green-700 border-green-300',
    'tier-3-significant': 'bg-blue-100 text-blue-700 border-blue-300',
    'tier-4-strategic': 'bg-purple-100 text-purple-700 border-purple-300',
  }
  return colors[tierId] || colors['tier-1-minimal']
}

// Get tier icon for UI
export function getTierIcon(tierId: string): string {
  const icons: Record<string, string> = {
    'tier-1-minimal': '⚡',
    'tier-2-standard': '🚀',
    'tier-3-significant': '📋',
    'tier-4-strategic': '🎯',
  }
  return icons[tierId] || '⚡'
}

