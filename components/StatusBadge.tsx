'use client'

import type { IdentificationStatus, OversightStatus, ToolStatus, ReviewRecommendation } from '@/types/database'

interface StatusBadgeProps {
  status: string
  type?: 'form' | 'oversight' | 'tool' | 'review' | 'priority'
  size?: 'sm' | 'md'
}

const statusColors: Record<string, string> = {
  // Form statuses
  draft: 'bg-surface-100 text-surface-600',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  
  // Oversight statuses
  not_required: 'bg-surface-100 text-surface-500',
  pending_review: 'bg-orange-100 text-orange-700',
  deferred: 'bg-yellow-100 text-yellow-700',
  requires_changes: 'bg-amber-100 text-amber-700',
  
  // Tool statuses
  proposed: 'bg-surface-100 text-surface-600',
  evaluating: 'bg-blue-100 text-blue-700',
  pilot: 'bg-purple-100 text-purple-700',
  approved_restricted: 'bg-green-100 text-green-700 border border-green-300',
  deprecated: 'bg-orange-100 text-orange-700',
  banned: 'bg-red-100 text-red-700',
  
  // Review recommendations
  continue: 'bg-blue-100 text-blue-700',
  expand: 'bg-green-100 text-green-700',
  modify: 'bg-amber-100 text-amber-700',
  pause: 'bg-orange-100 text-orange-700',
  discontinue: 'bg-red-100 text-red-700',
  
  // Priorities
  low: 'bg-surface-100 text-surface-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
}

export function StatusBadge({ status, type, size = 'md' }: StatusBadgeProps) {
  const colorClass = statusColors[status] || 'bg-surface-100 text-surface-600'
  const displayText = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  
  const sizeClass = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-2.5 py-1 text-xs'
  
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeClass}`}>
      {displayText}
    </span>
  )
}

export default StatusBadge

