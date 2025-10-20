'use client'

import React from 'react'
import Modal from './Modal'
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'success' | 'info'
  isLoading?: boolean
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  isLoading = false
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    if (!isLoading) {
      onClose()
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <XCircle className="text-[var(--error)]" size={24} />
      case 'warning':
        return <AlertTriangle className="text-[var(--warning)]" size={24} />
      case 'success':
        return <CheckCircle className="text-[var(--success)]" size={24} />
      case 'info':
        return <Info className="text-[var(--info)]" size={24} />
      default:
        return <AlertTriangle className="text-[var(--warning)]" size={24} />
    }
  }

  const getConfirmButtonStyle = () => {
    switch (type) {
      case 'danger':
        return 'bg-[var(--error)] hover:bg-red-600 text-white'
      case 'warning':
        return 'bg-[var(--warning)] hover:bg-orange-600 text-white'
      case 'success':
        return 'bg-[var(--success)] hover:bg-green-600 text-white'
      case 'info':
        return 'bg-[var(--info)] hover:bg-blue-600 text-white'
      default:
        return 'bg-[var(--warning)] hover:bg-orange-600 text-white'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={!isLoading}
      showCloseButton={!isLoading}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--bg-main)]">
          {getIcon()}
        </div>

        {/* Message */}
        <p className="text-[var(--text-main)] text-base leading-relaxed">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex space-x-3 w-full pt-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-[var(--border-color)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-main)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getConfirmButtonStyle()}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Procesando...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}