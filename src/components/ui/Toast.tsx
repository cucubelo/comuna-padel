'use client'

import React, { useEffect, useState } from 'react'

export interface ToastProps {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  isVisible: boolean
  onClose: () => void
  duration?: number
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  isVisible, 
  onClose, 
  duration = 4000 
}) => {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(onClose, 300) // Wait for animation to complete
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible && !isAnimating) return null

  const getToastStyles = () => {
    const baseStyles = "fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 p-4 rounded-xl shadow-2xl border backdrop-blur-sm transition-all duration-300 ease-in-out"
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-bg-secondary/95 border-success/30 text-text-main shadow-success/20`
      case 'error':
        return `${baseStyles} bg-bg-secondary/95 border-error/30 text-text-main shadow-error/20`
      case 'warning':
        return `${baseStyles} bg-bg-secondary/95 border-warning/30 text-text-main shadow-warning/20`
      case 'info':
        return `${baseStyles} bg-bg-secondary/95 border-info/30 text-text-main shadow-info/20`
      default:
        return `${baseStyles} bg-bg-secondary/95 border-border text-text-main`
    }
  }

  const getIcon = () => {
    const iconClass = "w-5 h-5"
    
    switch (type) {
      case 'success':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
            <svg className={`${iconClass} text-success`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-error/20 rounded-full flex items-center justify-center">
            <svg className={`${iconClass} text-error`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        )
      case 'warning':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-warning/20 rounded-full flex items-center justify-center">
            <svg className={`${iconClass} text-warning`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )
      case 'info':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-info/20 rounded-full flex items-center justify-center">
            <svg className={`${iconClass} text-info`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div 
      className={`${getToastStyles()} ${
        isAnimating ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="flex items-start">
        {getIcon()}
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-text-main">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={() => {
              setIsAnimating(false)
              setTimeout(onClose, 300)
            }}
            className="inline-flex text-text-secondary hover:text-text-main focus:outline-none focus:text-text-main transition ease-in-out duration-150 p-1 rounded-full hover:bg-bg-main/50"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Toast