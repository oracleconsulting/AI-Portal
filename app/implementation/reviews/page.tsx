'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ClipboardCheck,
  Plus,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Star,
  Loader2,
  ChevronRight,
  Calendar,
} from 'lucide-react'
import type { ImplementationReview, IdentificationForm, ReviewRecommendation } from '@/types/database'

const RECOMMENDATION_CONFIG: Record<ReviewRecommendation, { color: string; label: string; icon: typeof TrendingUp }> = {
  continue: { color: 'bg-blue-100 text-blue-700', label: 'Continue', icon: TrendingUp },
  expand: { color: 'bg-green-100 text-green-700', label: 'Expand', icon: TrendingUp },
  modify: { color: 'bg-amber-100 text-amber-700', label: 'Modify', icon: Clock },
  pause: { color: 'bg-orange-100 text-orange-700', label: 'Pause', icon: AlertTriangle },
  discontinue: { color: 'bg-red-100 text-red-700', label: 'Discontinue', icon: TrendingDown },
}

interface ReviewWithForm extends ImplementationReview {
  form?: Partial<IdentificationForm>
}

export default function ImplementationReviewsPage() {
  const supabase = createClient()
  const [reviews, setReviews] = useState<ReviewWithForm[]>([])
  const [formsNeedingReview, setFormsNeedingReview] = useState<IdentificationForm[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // Fetch reviews with form details
    const { data: reviewData } = await supabase
      .from('implementation_reviews')
      .select(`
        *,
        form:identification_forms(id, problem_identified, solution, status)
      `)
      .order('review_date', { ascending: false })
      .limit(20)

    setReviews(reviewData || [])

    // Fetch forms that might need reviews (in_progress or completed)
    const { data: formsData } = await supabase
      .from('identification_forms')
      .select('*')
      .in('status', ['in_progress', 'completed'])
      .order('updated_at', { ascending: true })

    // Filter forms that are overdue for review
    const overdueThreshold = new Date()
    overdueThreshold.setDate(overdueThreshold.getDate() - 30)
    
    const formsNeedingReviewFiltered = (formsData || []).filter((form: IdentificationForm) => {
      const formDate = new Date(form.updated_at)
      // Check if form has no recent review
      const hasRecentReview = (reviews || []).some(
        (r: ReviewWithForm) => r.form_id === form.id && new Date(r.review_date) > overdueThreshold
      )
      return !hasRecentReview && formDate < overdueThreshold
    })

    setFormsNeedingReview(formsNeedingReviewFiltered)
    setIsLoading(false)
  }

  const overdueCount = formsNeedingReview.length
  const averageSatisfaction = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.user_satisfaction_score || 0), 0) / 
      reviews.filter(r => r.user_satisfaction_score).length
    : 0

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-implementation-500" />
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl gradient-implementation">
            <ClipboardCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">
              Implementation Reviews
            </h1>
            <p className="text-surface-600">
              Track actual outcomes vs projected for ROI validation
            </p>
          </div>
        </div>
        <Link href="/implementation/reviews/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Review
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-surface-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardCheck className="w-5 h-5 text-implementation-500" />
            <span className="text-sm text-surface-600">Total Reviews</span>
          </div>
          <p className="text-2xl font-bold text-surface-900">{reviews.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-surface-600">Overdue Reviews</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-surface-600">Avg. Satisfaction</span>
          </div>
          <p className="text-2xl font-bold text-surface-900">
            {averageSatisfaction ? averageSatisfaction.toFixed(1) : '-'}/5
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-sm text-surface-600">Expanding</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {reviews.filter(r => r.recommendation === 'expand').length}
          </p>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">
              <strong>{overdueCount} implementations</strong> are overdue for review
            </p>
          </div>
          <Link href="#overdue" className="text-red-700 hover:text-red-800 font-medium">
            View →
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Reviews */}
        <div className="lg:col-span-2">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">
            Recent Reviews
          </h2>
          
          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-surface-100 p-12 text-center">
              <ClipboardCheck className="w-12 h-12 text-surface-300 mx-auto mb-4" />
              <h3 className="font-display text-lg font-bold text-surface-900 mb-2">
                No reviews yet
              </h3>
              <p className="text-surface-600 mb-4">
                Start tracking implementation outcomes by creating your first review.
              </p>
              <Link href="/implementation/reviews/new" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Review
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const RecommendationIcon = RECOMMENDATION_CONFIG[review.recommendation].icon
                return (
                  <Link
                    key={review.id}
                    href={`/implementation/reviews/${review.id}`}
                    className="block bg-white rounded-2xl border border-surface-100 p-5 hover:border-implementation-200 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${RECOMMENDATION_CONFIG[review.recommendation].color}`}>
                            <RecommendationIcon className="w-3 h-3 inline mr-1" />
                            {RECOMMENDATION_CONFIG[review.recommendation].label}
                          </span>
                          <span className="text-xs text-surface-400 capitalize">
                            {review.review_type.replace('_', ' ')} Review
                          </span>
                        </div>
                        <h3 className="font-medium text-surface-900 mb-1 line-clamp-1">
                          {review.form?.problem_identified || 'Unknown Form'}
                        </h3>
                        <p className="text-sm text-surface-500">
                          Reviewed on {new Date(review.review_date).toLocaleDateString()} by {review.reviewed_by_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-6 ml-4">
                        {review.variance_percentage !== null && (
                          <div className="text-right">
                            <p className="text-xs text-surface-400">Variance</p>
                            <p className={`font-semibold ${
                              review.variance_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {review.variance_percentage >= 0 ? '+' : ''}{review.variance_percentage.toFixed(0)}%
                            </p>
                          </div>
                        )}
                        {review.user_satisfaction_score && (
                          <div className="text-right">
                            <p className="text-xs text-surface-400">Satisfaction</p>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                              <span className="font-semibold">{review.user_satisfaction_score}/5</span>
                            </div>
                          </div>
                        )}
                        <ChevronRight className="w-5 h-5 text-surface-300" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar - Needs Review */}
        <div id="overdue">
          <h2 className="font-display text-lg font-bold text-surface-900 mb-4">
            Needs Review
          </h2>
          
          {formsNeedingReview.length === 0 ? (
            <div className="bg-green-50 rounded-2xl border border-green-200 p-6 text-center">
              <ClipboardCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 font-medium">All caught up!</p>
              <p className="text-sm text-green-600">No implementations need review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formsNeedingReview.map((form) => (
                <div
                  key={form.id}
                  className="bg-white rounded-xl border border-surface-100 p-4"
                >
                  <h4 className="font-medium text-surface-900 text-sm line-clamp-2 mb-2">
                    {form.problem_identified}
                  </h4>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-surface-500">
                      Last updated {new Date(form.updated_at).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/implementation/reviews/new?form_id=${form.id}`}
                      className="text-implementation-600 hover:text-implementation-700 font-medium"
                    >
                      Review →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Review Schedule Info */}
          <div className="mt-6 bg-surface-50 rounded-2xl p-4">
            <h3 className="font-medium text-surface-900 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Review Schedule
            </h3>
            <ul className="text-sm text-surface-600 space-y-1">
              <li>• <strong>30 days:</strong> Initial pilot check</li>
              <li>• <strong>90 days:</strong> Full assessment</li>
              <li>• <strong>180 days:</strong> Mid-term review</li>
              <li>• <strong>365 days:</strong> Annual review</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

