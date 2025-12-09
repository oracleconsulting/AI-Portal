'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useState } from 'react'

interface RPGCCLogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'light' | 'dark' // For light/dark backgrounds
  useImage?: boolean // Force use of image logo (default: true, falls back to text if image not found)
}

export function RPGCCLogo({ 
  className, 
  showText = true, 
  size = 'md',
  variant = 'dark',
  useImage = true
}: RPGCCLogoProps) {
  const [imageError, setImageError] = useState(false)
  const [currentLogoPath, setCurrentLogoPath] = useState<string | null>(null)
  
  const sizeClasses = {
    sm: { text: 'text-lg', dots: 'w-2 h-2', gap: 'gap-1', image: 'h-6' },
    md: { text: 'text-2xl', dots: 'w-2.5 h-2.5', gap: 'gap-1.5', image: 'h-8' },
    lg: { text: 'text-4xl', dots: 'w-3 h-3', gap: 'gap-2', image: 'h-12' },
    xl: { text: 'text-5xl', dots: 'w-4 h-4', gap: 'gap-2.5', image: 'h-16' },
  }

  const { text, dots, gap, image } = sizeClasses[size]
  const textColor = variant === 'light' ? 'text-white' : 'text-surface-900'

  // Determine logo path
  const primaryLogoPath = variant === 'light' 
    ? '/logos/rpgcc-logo-light.png' 
    : '/logos/rpgcc-logo-dark.png'
  const fallbackLogoPath = '/logos/rpgcc-logo.png'
  
  // Initialize logo path on mount
  if (currentLogoPath === null && useImage) {
    setCurrentLogoPath(primaryLogoPath)
  }

  // Try to use image logo if enabled and not errored
  const shouldUseImage = useImage && !imageError && currentLogoPath

  if (shouldUseImage) {
    return (
      <div className={cn('flex items-center', className)}>
        <Image
          src={currentLogoPath}
          alt="RPGCC Logo"
          width={size === 'sm' ? 80 : size === 'md' ? 120 : size === 'lg' ? 180 : 240}
          height={size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 48 : 64}
          className={cn('object-contain', image)}
          onError={() => {
            // Try fallback logo if primary failed
            if (currentLogoPath === primaryLogoPath) {
              setCurrentLogoPath(fallbackLogoPath)
            } else {
              // Both failed, show text version
              setImageError(true)
            }
          }}
          priority={size === 'lg' || size === 'xl'}
        />
      </div>
    )
  }

  // Fallback to text version
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

