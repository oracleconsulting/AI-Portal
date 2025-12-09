// Regulatory Requirements Mapping
// Maps RPGCC AI Portal features to regulatory requirements from ICAEW, UK GDPR, EU AI Act, etc.

export interface RegulatoryRequirement {
  id: string
  source?: string
  pillar?: string
  article?: string
  requirement: string
  implementation: string
  evidence: string
  rpgccRelevance?: string
}

export interface RegulatorySource {
  source: string
  updateFrequency: string
  lastReviewed: string
  requirements: RegulatoryRequirement[]
  applicability?: string
  keyDates?: Record<string, string>
}

export const REGULATORY_REQUIREMENTS: Record<string, RegulatorySource> = {
  icaew: {
    source: 'ICAEW Code of Ethics + AI Roundtable Oct 2024',
    updateFrequency: 'annual',
    lastReviewed: '2024-10-18',
    requirements: [
      {
        id: 'icaew-transparency',
        pillar: 'Transparency',
        requirement: 'Document AI use cases and maintain audit trails',
        implementation: 'Audit log system with complete change tracking',
        evidence: '/admin/audit-log',
      },
      {
        id: 'icaew-accountability',
        pillar: 'Accountability',
        requirement: 'Clear governance structures with defined responsibilities',
        implementation: 'Dual committee structure with voting system',
        evidence: '/oversight/reviews',
      },
      {
        id: 'icaew-fairness',
        pillar: 'Fairness',
        requirement: 'Ensure AI outputs are non-discriminatory',
        implementation: 'Bias assessment in tool evaluation',
        evidence: '/oversight/tools',
      },
      {
        id: 'icaew-skepticism',
        pillar: 'Professional Skepticism',
        requirement: 'Human oversight of AI outputs',
        implementation: 'Review workflows, human approval gates',
        evidence: '/oversight/reviews',
      },
      {
        id: 'icaew-competence',
        pillar: 'Competence',
        requirement: 'Staff training on AI capabilities and limitations',
        implementation: 'Policy acknowledgment tracking',
        evidence: '/oversight/policies',
      },
    ],
  },

  ukGdpr: {
    source: 'UK GDPR + DPA 2018 + ICO AI Guidance',
    updateFrequency: 'ongoing',
    lastReviewed: '2024-12-01',
    requirements: [
      {
        id: 'gdpr-lawfulness',
        article: 'Article 6',
        requirement: 'Lawful basis for processing (legitimate interest)',
        implementation: 'LIA documented for each AI tool use case',
        evidence: '/oversight/tools/{id}/lia',
      },
      {
        id: 'gdpr-purpose',
        article: 'Article 5(1)(b)',
        requirement: 'Purpose limitation - defined use cases only',
        implementation: 'Approved/prohibited use cases on each tool',
        evidence: '/oversight/tools',
      },
      {
        id: 'gdpr-minimisation',
        article: 'Article 5(1)(c)',
        requirement: 'Data minimisation',
        implementation: 'Data classification controls',
        evidence: 'Tool data_classification_permitted field',
      },
      {
        id: 'gdpr-accuracy',
        article: 'Article 5(1)(d)',
        requirement: 'Accuracy of data',
        implementation: 'Output verification requirements',
        evidence: 'Policy documents',
      },
      {
        id: 'gdpr-security',
        article: 'Article 32',
        requirement: 'Security of processing',
        implementation: 'Security scoring, vendor due diligence',
        evidence: 'Tool security_score + certifications',
      },
      {
        id: 'gdpr-dpia',
        article: 'Article 35',
        requirement: 'DPIA for high-risk processing',
        implementation: 'Risk assessment on proposals',
        evidence: 'Form risk_score + data_classification',
      },
    ],
  },

  euAiAct: {
    source: 'EU AI Act (Regulation 2024/1689)',
    updateFrequency: 'as published',
    lastReviewed: '2024-12-01',
    applicability: 'Limited - RPGCC is UK-based, applies if serving EU clients',
    keyDates: {
      prohibitedPractices: '2025-02-02',
      gpaiObligations: '2025-08-02',
      fullApplication: '2026-08-02',
    },
    requirements: [
      {
        id: 'euai-risk-class',
        requirement: 'Classify AI systems by risk level',
        implementation: 'Risk scoring aligns with EU categories',
        rpgccRelevance: 'Most RPGCC uses are limited/minimal risk',
      },
      {
        id: 'euai-transparency',
        requirement: 'Inform users when interacting with AI',
        implementation: 'Client disclosure policy',
        rpgccRelevance: 'Required for client-facing AI outputs',
      },
      {
        id: 'euai-human-oversight',
        requirement: 'Human oversight for high-risk systems',
        implementation: 'Dual committee approval system',
        rpgccRelevance: 'Already exceeds requirements',
      },
    ],
  },
}

// Get all requirements as a flat array
export function getAllRegulatoryRequirements(): RegulatoryRequirement[] {
  return Object.values(REGULATORY_REQUIREMENTS).flatMap(source => source.requirements)
}

// Get requirements by source
export function getRequirementsBySource(sourceKey: string): RegulatoryRequirement[] {
  return REGULATORY_REQUIREMENTS[sourceKey]?.requirements || []
}

// Calculate compliance score for a source
export function calculateComplianceScore(sourceKey: string): number {
  const source = REGULATORY_REQUIREMENTS[sourceKey]
  if (!source) return 0

  // For now, assume all requirements are implemented if they have evidence
  const implemented = source.requirements.filter(r => r.evidence).length
  return Math.round((implemented / source.requirements.length) * 100)
}

