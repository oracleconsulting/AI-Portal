// ICAEW AI Ethics and Governance Recommendations Mapping
// Maps RPGCC AI Portal features to ICAEW guidance

export interface ICAEWRecommendation {
  id: string
  pillar: string
  recommendation: string
  portalFeature: string
  portalRoute: string
  implemented: boolean
  evidenceNotes: string
}

export const ICAEW_RECOMMENDATIONS: ICAEWRecommendation[] = [
  {
    id: 'transparency',
    pillar: 'Transparency',
    recommendation: 'Firms should document AI use cases and maintain audit trails',
    portalFeature: 'Audit Log System',
    portalRoute: '/admin/audit-log',
    implemented: true,
    evidenceNotes:
      'Complete audit trail of all AI-related decisions, tool approvals, and changes',
  },
  {
    id: 'accountability',
    pillar: 'Accountability',
    recommendation: 'Clear governance structures with defined responsibilities',
    portalFeature: 'Dual Committee Structure',
    portalRoute: '/oversight/reviews',
    implemented: true,
    evidenceNotes:
      'Implementation Committee + Oversight Committee with distinct roles and responsibilities',
  },
  {
    id: 'risk-assessment',
    pillar: 'Risk Management',
    recommendation: 'Risk assessment for AI tools before deployment',
    portalFeature: 'AI Tool Registry with Risk Scoring',
    portalRoute: '/oversight/tools',
    implemented: true,
    evidenceNotes:
      'Security scores, risk scores, data classification, compliance tracking for all AI tools',
  },
  {
    id: 'human-oversight',
    pillar: 'Human Oversight',
    recommendation: 'Human review of AI outputs, especially for high-risk decisions',
    portalFeature: 'Oversight Review Queue',
    portalRoute: '/oversight/reviews',
    implemented: true,
    evidenceNotes:
      'Mandatory oversight review for high-value/high-risk proposals with approval workflow',
  },
  {
    id: 'training',
    pillar: 'Competence',
    recommendation: 'Staff training on AI capabilities and limitations',
    portalFeature: 'Policy Acknowledgment System',
    portalRoute: '/oversight/policies',
    implemented: true,
    evidenceNotes:
      'Policy documents with mandatory acknowledgment tracking and version control',
  },
  {
    id: 'data-protection',
    pillar: 'Confidentiality',
    recommendation: 'Data classification and handling procedures',
    portalFeature: 'Data Classification Fields',
    portalRoute: '/oversight/tools',
    implemented: true,
    evidenceNotes:
      'Public/Internal/Confidential/Restricted classification on all tools and proposals',
  },
  {
    id: 'roi-measurement',
    pillar: 'Value Demonstration',
    recommendation: 'Measure and report on AI investment outcomes',
    portalFeature: 'ROI Validation Dashboard',
    portalRoute: '/implementation/analytics/roi-validation',
    implemented: true,
    evidenceNotes:
      'Projected vs actual ROI tracking with variance analysis and lessons learned',
  },
  {
    id: 'policy-framework',
    pillar: 'Governance',
    recommendation: 'Documented AI policies with version control',
    portalFeature: 'Policy Document Management',
    portalRoute: '/oversight/policies',
    implemented: true,
    evidenceNotes: 'Version-controlled policies with approval workflow and acknowledgment tracking',
  },
]

// Calculate compliance score
export function calculateICAEWComplianceScore(): number {
  const implemented = ICAEW_RECOMMENDATIONS.filter(r => r.implemented).length
  return Math.round((implemented / ICAEW_RECOMMENDATIONS.length) * 100)
}

// Get recommendations by pillar
export function getRecommendationsByPillar(): Record<string, ICAEWRecommendation[]> {
  const byPillar: Record<string, ICAEWRecommendation[]> = {}
  ICAEW_RECOMMENDATIONS.forEach(rec => {
    if (!byPillar[rec.pillar]) {
      byPillar[rec.pillar] = []
    }
    byPillar[rec.pillar].push(rec)
  })
  return byPillar
}

// Get implementation status summary
export function getImplementationSummary() {
  const byPillar = getRecommendationsByPillar()
  const summary: Record<string, { total: number; implemented: number; percentage: number }> = {}

  Object.keys(byPillar).forEach(pillar => {
    const recs = byPillar[pillar]
    const implemented = recs.filter(r => r.implemented).length
    summary[pillar] = {
      total: recs.length,
      implemented,
      percentage: Math.round((implemented / recs.length) * 100),
    }
  })

  return summary
}

