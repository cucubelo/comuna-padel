'use client'

import React, { useState } from 'react'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (groupData: GroupFormData) => Promise<void>
}

export interface GroupFormData {
  name: string
  description: string
  city: string
  group_type: string
}

export default function CreateGroupModal({ isOpen, onClose, onSubmit }: CreateGroupModalProps) {
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    description: '',
    city: '',
    group_type: 'private'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<GroupFormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<GroupFormData> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida'
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      // Reset form
      setFormData({
        name: '',
        description: '',
        city: '',
        group_type: 'private'
      })
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Error creating group:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof GroupFormData, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-main rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text-main font-montserrat">
            Crear Nuevo Grupo
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-main transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-main font-open-sans mb-2">
              Nombre del Grupo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-bg-main text-text-main font-open-sans"
              placeholder="Ej: Padel Nocturno"
            />
            {errors.name && (
              <p className="text-error text-sm mt-1 font-open-sans">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-main font-open-sans mb-2">
              Descripción *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-bg-main text-text-main font-open-sans resize-none"
              placeholder="Describe tu grupo de padel..."
            />
            {errors.description && (
              <p className="text-error text-sm mt-1 font-open-sans">{errors.description}</p>
            )}
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-text-main font-open-sans mb-2">
              Ciudad *
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-bg-main text-text-main font-open-sans"
              placeholder="Ej: Madrid, Barcelona, Valencia..."
            />
            {errors.city && (
              <p className="text-error text-sm mt-1 font-open-sans">{errors.city}</p>
            )}
          </div>

          {/* Group Type */}
          <div>
            <label className="block text-sm font-medium text-text-main font-open-sans mb-2">
              Tipo de Grupo
            </label>
            <select
              value={formData.group_type}
              onChange={(e) => handleInputChange('group_type', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-bg-main text-text-main font-open-sans"
            >
              <option value="private">Privado (solo por invitación)</option>
              <option value="public">Público (cualquiera puede unirse)</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border text-text-secondary rounded-lg hover:bg-bg-secondary transition-colors font-open-sans"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-accent-primary text-bg-main rounded-lg hover:bg-accent-primary/90 transition-colors font-open-sans disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creando...' : 'Crear Grupo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}