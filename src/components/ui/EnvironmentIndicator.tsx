'use client'

interface EnvironmentIndicatorProps {
  className?: string
}

export default function EnvironmentIndicator({ className = '' }: EnvironmentIndicatorProps) {
  const environment = process.env.NEXT_PUBLIC_APP_ENV || 'production'
  
  // Solo mostrar el indicador si no estamos en producción
  if (environment === 'production') {
    return null
  }

  const getEnvironmentConfig = () => {
    switch (environment) {
      case 'development':
        return {
          label: 'DEV',
          bgColor: 'bg-blue-500',
          textColor: 'text-white',
          description: 'Modo Desarrollo'
        }
      case 'staging':
        return {
          label: 'STAGING',
          bgColor: 'bg-yellow-500',
          textColor: 'text-black',
          description: 'Modo Staging'
        }
      default:
        return {
          label: 'DEV',
          bgColor: 'bg-blue-500',
          textColor: 'text-white',
          description: 'Modo Desarrollo'
        }
    }
  }

  const config = getEnvironmentConfig()

  return (
    <div 
      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${config.bgColor} ${config.textColor} ${className}`}
      title={config.description}
    >
      {config.label}
    </div>
  )
}