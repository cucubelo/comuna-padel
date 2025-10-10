'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

export interface ToastState {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  isVisible: boolean
}

interface ToastContextType {
  toasts: ToastState[]
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void
  hideToast: (id: string) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showWarning: (message: string) => void
  showInfo: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastState[]>([])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastState = {
      id,
      message,
      type,
      isVisible: true
    }

    setToasts(prev => [...prev, newToast])

    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 4300)
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showSuccess = useCallback((message: string) => {
    showToast(message, 'success')
  }, [showToast])

  const showError = useCallback((message: string) => {
    showToast(message, 'error')
  }, [showToast])

  const showWarning = useCallback((message: string) => {
    showToast(message, 'warning')
  }, [showToast])

  const showInfo = useCallback((message: string) => {
    showToast(message, 'info')
  }, [showToast])

  return (
    <ToastContext.Provider value={{
      toasts,
      showToast,
      hideToast,
      showSuccess,
      showError,
      showWarning,
      showInfo
    }}>
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}