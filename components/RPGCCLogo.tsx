'use client'

import { cn } from '@/lib/utils'

interface RPGCCLogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function RPGCCLogo({ className, showText = true, size = 'md' }: RPGCCLogoProps) {
  const sizeClasses = {
    sm: { text: 'text-lg', dots: 'w-2 h-2', gap: 'gap-0.5' },
    md: { text: 'text-2xl', dots: 'w-2.5 h-2.5', gap: 'gap-1' },
    lg: { text: 'text-4xl', dots: 'w-3 h-3', gap: 'gap-1' },
  }

  const { text, dots, gap } = sizeClasses[size]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showText && (
        <span className={cn('font-display font-black tracking-tight text-surface-900', text)}>
          RPGCC
        </span>
      )}
      <div className={cn('flex items-center', gap)}>
        <div className={cn('rounded-full bg-rpgcc-blue', dots)} />
        <div className={cn('rounded-full bg-rpgcc-red', dots)} />
        <div className={cn('rounded-full bg-rpgcc-amber', dots)} />
      </div>
    </div>
  )
}

export function RPGCCLogoIcon({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="w-2.5 h-2.5 rounded-full bg-rpgcc-blue" />
      <div className="w-2.5 h-2.5 rounded-full bg-rpgcc-red" />
      <div className="w-2.5 h-2.5 rounded-full bg-rpgcc-amber" />
    </div>
  )
}

