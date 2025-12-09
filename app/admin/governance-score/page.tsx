import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, ExternalLink, FileText } from 'lucide-react'
import {
  ICAEW_RECOMMENDATIONS,
  calculateICAEWComplianceScore,
  getImplementationSummary,
} from '@/lib/data/icaew-mapping'

export default async function GovernanceScorePage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  // Only jhoward@rpgcc.co.uk has admin access
  if (user.email !== 'jhoward@rpgcc.co.uk') {
    return redirect('/dashboard')
  }

  const complianceScore = calculateICAEWComplianceScore()
  const summary = getImplementationSummary()
  const byPillar = Object.entries(summary)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="btn-secondary flex items-center gap-2 mb-4 w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Dashboard
          </Link>
          <h1 className="font-display text-3xl font-bold text-surface-900">
            ICAEW Governance Compliance
          </h1>
          <p className="text-surface-500 mt-1">
            Mapping of RPGCC AI Portal features to ICAEW AI Ethics and Governance recommendations
          </p>
        </div>
      </div>

      {/* Overall Score Card */}
      <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-8 mb-8">
        <div className="text-center">
          <div className="text-6xl font-bold text-implementation-600 mb-2">{complianceScore}%</div>
          <div className="text-xl text-surface-600 mb-4">ICAEW Aligned</div>
          <div className="w-full bg-surface-200 rounded-full h-4 max-w-md mx-auto">
            <div
              className="bg-implementation-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${complianceScore}%` }}
            />
          </div>
          <p className="text-sm text-surface-500 mt-4">
            {ICAEW_RECOMMENDATIONS.filter(r => r.implemented).length} of{' '}
            {ICAEW_RECOMMENDATIONS.length} recommendations implemented
          </p>
        </div>
      </div>

      {/* Pillar Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {byPillar.map(([pillar, stats]) => (
          <div key={pillar} className="bg-white rounded-xl shadow-sm border border-surface-100 p-6">
            <h3 className="font-semibold text-surface-900 mb-2">{pillar}</h3>
            <div className="text-3xl font-bold text-implementation-600 mb-1">
              {stats.percentage}%
            </div>
            <div className="text-sm text-surface-500">
              {stats.implemented} of {stats.total} implemented
            </div>
            <div className="w-full bg-surface-200 rounded-full h-2 mt-3">
              <div
                className="bg-implementation-500 h-2 rounded-full"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Recommendations */}
      <div className="bg-white rounded-xl shadow-sm border border-surface-100 overflow-hidden">
        <div className="p-6 border-b border-surface-100">
          <h2 className="font-display text-xl font-bold text-surface-900">
            Detailed Recommendations
          </h2>
        </div>
        <div className="divide-y divide-surface-100">
          {ICAEW_RECOMMENDATIONS.map(rec => (
            <div key={rec.id} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 text-xs font-medium bg-surface-100 text-surface-700 rounded">
                      {rec.pillar}
                    </span>
                    {rec.implemented ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Implemented
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                        <XCircle className="w-4 h-4" />
                        Not Implemented
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-surface-900 mb-2">{rec.recommendation}</h3>
                  <p className="text-sm text-surface-600 mb-3">{rec.evidenceNotes}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-surface-500">Portal Feature:</span>
                    <Link
                      href={rec.portalRoute}
                      className="text-sm text-implementation-600 hover:text-implementation-700 flex items-center gap-1"
                    >
                      {rec.portalFeature}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Section */}
      <div className="mt-8 bg-surface-50 rounded-xl border border-surface-200 p-6">
        <h3 className="font-semibold text-surface-900 mb-2">Export Compliance Report</h3>
        <p className="text-sm text-surface-600 mb-4">
          Generate a PDF report for partner presentations or client proposals.
        </p>
        <button className="btn-secondary flex items-center gap-2 w-fit">
          <FileText className="w-4 h-4" />
          Export PDF Report
        </button>
        <p className="text-xs text-surface-500 mt-2">
          Export functionality coming soon. For now, use browser print to PDF.
        </p>
      </div>
    </div>
  )
}

