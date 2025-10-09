'use client'

import React from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'primary' | 'success' | 'warning' | 'info' | 'error'
}

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  color = 'primary' 
}: StatsCardProps) {
  const colorClasses = {
    primary: 'bg-accent-primary/10 text-accent-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    info: 'bg-info/10 text-info',
    error: 'bg-error/10 text-error'
  }

  const trendColorClasses = {
    positive: 'text-success',
    negative: 'text-error'
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-secondary font-open-sans">
                {title}
              </h3>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-2xl font-bold text-text-main font-montserrat">
              {value}
            </div>
            
            {subtitle && (
              <p className="text-sm text-text-secondary font-open-sans">
                {subtitle}
              </p>
            )}
            
            {trend && (
              <div className="flex items-center space-x-1">
                <svg 
                  className={`h-4 w-4 ${trend.isPositive ? trendColorClasses.positive : trendColorClasses.negative} ${
                    trend.isPositive ? '' : 'rotate-180'
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
                <span className={`text-sm font-medium ${trend.isPositive ? trendColorClasses.positive : trendColorClasses.negative}`}>
                  {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-text-secondary font-open-sans">
                  vs mes anterior
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}