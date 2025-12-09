/**
 * Export utility functions for CSV generation and file downloads
 */

/**
 * Convert array of objects to CSV string
 */
export function toCSV(data: Record<string, any>[], columns?: { key: string; header: string }[]): string {
  if (data.length === 0) return ''

  // Determine columns
  const cols = columns || Object.keys(data[0]).map(key => ({ key, header: key }))
  
  // Header row
  const header = cols.map(c => `"${c.header}"`).join(',')
  
  // Data rows
  const rows = data.map(row => {
    return cols.map(col => {
      const value = row[col.key]
      if (value === null || value === undefined) return '""'
      if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`
      return `"${String(value).replace(/"/g, '""')}"`
    }).join(',')
  })

  return [header, ...rows].join('\n')
}

/**
 * Download string content as file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Format date for export
 */
export function formatExportDate(date: string | null): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Format currency for export
 */
export function formatExportCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return ''
  return amount.toFixed(2)
}

/**
 * Generate filename with date
 */
export function generateFilename(base: string, extension: string = 'csv'): string {
  const date = new Date().toISOString().split('T')[0]
  return `${base}-${date}.${extension}`
}

