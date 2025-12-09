'use client'

import { cn } from '@/lib/utils'

interface RPGCCLogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'light' | 'dark' // For light/dark backgrounds
}

export function RPGCCLogo({ 
  className, 
  showText = true, 
  size = 'md',
  variant = 'dark'
}: RPGCCLogoProps) {
  const sizeClasses = {
    sm: { text: 'text-lg', dots: 'w-2 h-2', gap: 'gap-1' },
    md: { text: 'text-2xl', dots: 'w-2.5 h-2.5', gap: 'gap-1.5' },
    lg: { text: 'text-4xl', dots: 'w-3 h-3', gap: 'gap-2' },
    xl: { text: 'text-5xl', dots: 'w-4 h-4', gap: 'gap-2.5' },
  }

  const { text, dots, gap } = sizeClasses[size]
  const textColor = variant === 'light' ? 'text-white' : 'text-surface-900'

  return (
    <div className={cn('flex items-center', className)}>
      {showText && (
        <span className={cn(
          'font-display font-black tracking-tight uppercase',
          textColor,
          text
        )}>
          RPGCC
        </span>
      )}
      <div className={cn('flex items-center', gap, showText && 'ml-2')}>
        <div className={cn('rounded-full bg-[#2D9CDB]', dots)} />
        <div className={cn('rounded-full bg-[#EB5757]', dots)} />
        <div className={cn('rounded-full bg-[#F2994A]', dots)} />
      </div>
    </div>
  )
}

export function RPGCCLogoIcon({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="w-2.5 h-2.5 rounded-full bg-[#2D9CDB]" />
      <div className="w-2.5 h-2.5 rounded-full bg-[#EB5757]" />
      <div className="w-2.5 h-2.5 rounded-full bg-[#F2994A]" />
    </div>
  )
}

