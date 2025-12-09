'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

interface ExportButtonProps {
  endpoint: string
  filename: string
  filters?: Record<string, string>
  children?: React.ReactNode
  className?: string
}

export function ExportButton({ endpoint, filename, filters = {}, children, className }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)

    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value)
        }
      })

      const url = params.toString() ? `${endpoint}?${params}` : endpoint
      const response = await fetch(url)
      
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      alert('Export failed. Please try again.')
      console.error('Export error:', err)
    }

    setExporting(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={className || 'btn-secondary flex items-center gap-2'}
    >
      {exporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          {children || 'Export CSV'}
        </>
      )}
    </button>
  )
}

