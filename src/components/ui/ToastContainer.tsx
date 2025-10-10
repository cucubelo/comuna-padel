'use client'

import React from 'react'
import Toast from './Toast'
import { useToast } from '@/contexts/ToastContext'

const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToast()

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="flex flex-col gap-2 p-4">
        {toasts.map((toast, index) => (
          <div key={toast.id} style={{ zIndex: 1000 + index }} className="pointer-events-auto">
            <Toast
              message={toast.message}
              type={toast.type}
              isVisible={toast.isVisible}
              onClose={() => hideToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ToastContainer