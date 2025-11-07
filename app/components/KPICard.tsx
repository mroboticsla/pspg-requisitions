"use client"

import { ReactNode } from 'react'
import clsx from 'clsx'

type KPICardProps = {
  title: string
  value: number | string | null
  icon?: ReactNode
  subtitle?: string | ReactNode
  loading?: boolean
  variant?: 'dark' | 'accent' | 'neutral' | 'green' | 'red' | 'warning'
  percentage?: number | null
  ariaLabel?: string
  className?: string
}

const variantClasses: Record<NonNullable<KPICardProps['variant']>, string> = {
  dark: 'from-brand-dark to-[#003d66] text-white',
  accent: 'from-brand-accent to-brand-accentDark text-white',
  neutral: 'from-neutral-500 to-neutral-600 text-white',
  green: 'from-green-600 to-green-700 text-white',
  red: 'from-red-600 to-red-700 text-white',
  warning: 'from-neutral-400 to-neutral-500 text-white'
}

export function KPICard({
  title,
  value,
  icon,
  subtitle,
  loading = false,
  variant = 'dark',
  percentage = null,
  ariaLabel,
  className
}: KPICardProps) {
  return (
    <div
      className={clsx(
        'relative rounded-xl shadow-md p-4 sm:p-5 bg-gradient-to-br transition-colors focus-within:ring-2 ring-offset-2 ring-brand-accent/40',
        variantClasses[variant],
        className
      )}
      aria-label={ariaLabel || title}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold uppercase tracking-wide opacity-90">
            {title}
          </h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums">
              {loading ? '…' : value ?? '—'}
            </span>
            {percentage !== null && !loading && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/15 backdrop-blur-sm">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        </div>
        {icon && (
          <div className="shrink-0 opacity-80">
            {icon}
          </div>
        )}
      </div>
      {subtitle && (
        <div className="mt-3 text-xs sm:text-sm leading-relaxed opacity-90">
          {subtitle}
        </div>
      )}
      {loading && (
        <div className="absolute inset-0 rounded-xl bg-white/5 animate-pulse" aria-hidden="true"></div>
      )}
    </div>
  )}
