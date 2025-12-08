// ROI Calculation Utilities

interface TimeSaving {
  staff_level: string
  hours_per_week: number
}

// Default staff rates (can be overridden by fetching from database)
const DEFAULT_STAFF_RATES: Record<string, number> = {
  admin: 80,
  junior: 100,
  senior: 120,
  assistant_manager: 150,
  manager: 175,
  director: 250,
  partner: 400,
}

// Fetch rates from database (with caching)
let cachedRates: Record<string, number> | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getStaffRates(supabase: any): Promise<Record<string, number>> {
  // Return cached rates if still valid
  if (cachedRates && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedRates
  }

  try {
    const { data } = await supabase
      .from('staff_rates')
      .select('staff_level, hourly_rate')
      .eq('is_active', true)

    if (data && data.length > 0) {
      const rates = data.reduce((acc: Record<string, number>, rate: { staff_level: string; hourly_rate: number }) => {
        acc[rate.staff_level] = rate.hourly_rate
        return acc
      }, {})
      cachedRates = rates
      cacheTimestamp = Date.now()
      return rates
    }
  } catch (error) {
    console.error('Error fetching staff rates:', error)
  }

  // Return defaults if database fetch fails
  return DEFAULT_STAFF_RATES
}

export function calculateWeeklyValue(timeSavings: TimeSaving[], rates: Record<string, number>): number {
  return timeSavings.reduce((total, ts) => {
    const rate = rates[ts.staff_level] || DEFAULT_STAFF_RATES[ts.staff_level] || 100
    return total + (ts.hours_per_week * rate)
  }, 0)
}

export function calculateAnnualValue(weeklyValue: number): number {
  return weeklyValue * 52
}

export function calculateROI(annualValue: number, cost: number): number {
  if (cost <= 0) return 0
  return (annualValue / cost) * 100
}

export function calculatePaybackMonths(annualValue: number, cost: number): number {
  if (annualValue <= 0) return Infinity
  return (cost / annualValue) * 12
}

export interface ROISummary {
  weeklyValue: number
  annualValue: number
  roi: number
  paybackMonths: number
  breakdown: Array<{
    staff_level: string
    hours: number
    rate: number
    weeklyValue: number
    annualValue: number
  }>
}

export function calculateFullROI(
  timeSavings: TimeSaving[], 
  cost: number, 
  rates: Record<string, number> = DEFAULT_STAFF_RATES
): ROISummary {
  const breakdown = timeSavings.map(ts => {
    const rate = rates[ts.staff_level] || DEFAULT_STAFF_RATES[ts.staff_level] || 100
    const weeklyValue = ts.hours_per_week * rate
    return {
      staff_level: ts.staff_level,
      hours: ts.hours_per_week,
      rate,
      weeklyValue,
      annualValue: weeklyValue * 52,
    }
  })

  const weeklyValue = breakdown.reduce((sum, b) => sum + b.weeklyValue, 0)
  const annualValue = calculateAnnualValue(weeklyValue)

  return {
    weeklyValue,
    annualValue,
    roi: calculateROI(annualValue, cost),
    paybackMonths: calculatePaybackMonths(annualValue, cost),
    breakdown,
  }
}

// Format currency for display
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Format percentage for display
export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(0)}%`
}

// Calculate variance between projected and actual
export function calculateVariance(projected: number, actual: number): number {
  if (projected === 0) return 0
  return ((actual - projected) / projected) * 100
}

// Get ROI category/rating
export function getROIRating(roi: number): { label: string; color: string } {
  if (roi >= 500) return { label: 'Exceptional', color: 'text-green-600' }
  if (roi >= 200) return { label: 'Excellent', color: 'text-green-500' }
  if (roi >= 100) return { label: 'Good', color: 'text-blue-600' }
  if (roi >= 50) return { label: 'Moderate', color: 'text-amber-600' }
  if (roi > 0) return { label: 'Low', color: 'text-orange-600' }
  return { label: 'Negative', color: 'text-red-600' }
}

// Get payback period rating
export function getPaybackRating(months: number): { label: string; color: string } {
  if (months <= 3) return { label: 'Immediate', color: 'text-green-600' }
  if (months <= 6) return { label: 'Quick', color: 'text-green-500' }
  if (months <= 12) return { label: 'Standard', color: 'text-blue-600' }
  if (months <= 24) return { label: 'Long', color: 'text-amber-600' }
  return { label: 'Extended', color: 'text-red-600' }
}

