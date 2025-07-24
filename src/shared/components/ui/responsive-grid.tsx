import React from 'react'
import { cn } from '@shared/lib/cn'

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

export function ResponsiveGrid({
  children,
  className,
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
  gap = { xs: 2, sm: 3, md: 4, lg: 4, xl: 4 },
}: ResponsiveGridProps) {
  // Map number values to Tailwind classes
  const colsClasses = {
    xs: `grid-cols-${cols.xs || 1}`,
    sm: `sm:grid-cols-${cols.sm || 2}`,
    md: `md:grid-cols-${cols.md || 3}`,
    lg: `lg:grid-cols-${cols.lg || 4}`,
    xl: `xl:grid-cols-${cols.xl || 4}`,
  }

  const gapClasses = {
    xs: `gap-${gap.xs || 2}`,
    sm: `sm:gap-${gap.sm || 3}`,
    md: `md:gap-${gap.md || 4}`,
    lg: `lg:gap-${gap.lg || 4}`,
    xl: `xl:gap-${gap.xl || 4}`,
  }

  return (
    <div
      className={cn(
        'grid w-full',
        colsClasses.xs,
        colsClasses.sm,
        colsClasses.md,
        colsClasses.lg,
        colsClasses.xl,
        gapClasses.xs,
        gapClasses.sm,
        gapClasses.md,
        gapClasses.lg,
        gapClasses.xl,
        className
      )}
    >
      {children}
    </div>
  )
}