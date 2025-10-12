'use client'

import React from 'react'

interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

interface PerformanceChartProps {
  title: string
  data: ChartDataPoint[]
  type: 'bar' | 'line' | 'pie'
  height?: number
}

export default function PerformanceChart({ 
  title, 
  data, 
  type, 
  height = 300 
}: PerformanceChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))
  
  const renderBarChart = () => (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-20 text-sm text-text-secondary font-open-sans text-right">
            {item.label}
          </div>
          <div className="flex-1 bg-bg-main rounded-full h-6 relative overflow-hidden">
            <div 
              className="h-full bg-accent-primary rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color || undefined
              }}
            />
            <div className="absolute inset-0 flex items-center justify-end pr-2">
              <span className="text-xs font-medium text-text-main font-open-sans">
                {item.value}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderLineChart = () => {
    const points = data.map((item, index) => {
      const x = data.length > 1 ? (index / (data.length - 1)) * 100 : 50; // Center if only one point
      const y = 100 - (item.value / maxValue) * 80; // 80% of height for padding
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="relative">
        <svg 
          width="100%" 
          height={height} 
          viewBox="0 0 100 100" 
          className="border border-border rounded-lg bg-bg-main"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line 
              key={y}
              x1="0" 
              y1={y} 
              x2="100" 
              y2={y} 
              stroke="currentColor" 
              strokeWidth="0.2" 
              className="text-border"
            />
          ))}
          
          {/* Line */}
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            points={points}
            className="text-accent-primary"
          />
          
          {/* Points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100
            const y = 100 - (item.value / maxValue) * 80
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill="currentColor"
                className="text-accent-primary"
              />
            )
          })}
        </svg>
        
        {/* X-axis labels */}
        <div className="flex justify-between mt-2 px-2">
          {data.map((item, index) => (
            <span key={index} className="text-xs text-text-secondary font-open-sans">
              {item.label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    let currentAngle = 0
    
    const colors = [
      '#10B981', // success
      '#3B82F6', // info  
      '#F59E0B', // warning
      '#EF4444', // error
      '#8B5CF6', // purple
      '#06B6D4'  // cyan
    ]

    return (
      <div className="flex items-center space-x-6">
        <div className="relative">
          <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
            {data.map((item, index) => {
              const angle = (item.value / total) * 360
              const startAngle = currentAngle
              const endAngle = currentAngle + angle
              
              const startX = 100 + 80 * Math.cos((startAngle * Math.PI) / 180)
              const startY = 100 + 80 * Math.sin((startAngle * Math.PI) / 180)
              const endX = 100 + 80 * Math.cos((endAngle * Math.PI) / 180)
              const endY = 100 + 80 * Math.sin((endAngle * Math.PI) / 180)
              
              const largeArcFlag = angle > 180 ? 1 : 0
              
              const pathData = [
                `M 100 100`,
                `L ${startX} ${startY}`,
                `A 80 80 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                'Z'
              ].join(' ')
              
              currentAngle += angle
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={item.color || colors[index % colors.length]}
                  className="hover:opacity-80 transition-opacity"
                />
              )
            })}
          </svg>
        </div>
        
        <div className="space-y-2">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1)
            return (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color || colors[index % colors.length] }}
                />
                <span className="text-sm text-text-main font-open-sans">
                  {item.label}: {item.value} ({percentage}%)
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-text-main font-montserrat mb-6">
        {title}
      </h3>
      
      <div style={{ height: type === 'pie' ? 'auto' : height }}>
        {type === 'bar' && renderBarChart()}
        {type === 'line' && renderLineChart()}
        {type === 'pie' && renderPieChart()}
      </div>
      
      {data.length === 0 && (
        <div className="flex items-center justify-center h-32 text-text-secondary">
          <div className="text-center">
            <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm font-open-sans">No hay datos disponibles</p>
          </div>
        </div>
      )}
    </div>
  )
}