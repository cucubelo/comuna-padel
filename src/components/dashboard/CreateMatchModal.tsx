'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import LocationAutocomplete from '@/components/ui/LocationAutocomplete'
import { Location } from '@/lib/locationService'

interface CreateMatchModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (matchData: MatchFormData) => Promise<void>
  userId: string
}

export interface MatchFormData {
  group_id: string
  scheduled_at: string
  location_name: string
  latitude?: number | null
  longitude?: number | null
  is_public: boolean
  required_skill_level?: number | null
}

interface MatchFormErrors {
  group_id?: string
  scheduled_at?: string
  location_name?: string
  required_skill_level?: string
}

interface Group {
  id: string
  name: string
}

interface GroupMemberWithGroups {
  groups: {
    id: string
    name: string
  }[]
}

export default function CreateMatchModal({ isOpen, onClose, onSubmit, userId }: CreateMatchModalProps) {
  const [formData, setFormData] = useState<MatchFormData>({
    group_id: '',
    scheduled_at: '',
    location_name: '',
    latitude: null,
    longitude: null,
    is_public: true,
    required_skill_level: null
  })
  const [userGroups, setUserGroups] = useState<Group[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<MatchFormErrors>({})

  const fetchUserGroups = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          groups (
            id,
            name
          )
        `)
        .eq('user_id', userId)

      if (error) throw error

      const groups: Group[] = data?.flatMap((item: GroupMemberWithGroups) => 
        item.groups.map(group => ({
          id: group.id,
          name: group.name
        }))
      ).filter(group => group.id) || []

      setUserGroups(groups)
    } catch (error) {
      console.error('Error fetching user groups:', error)
    }
  }, [userId])

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserGroups()
    }
  }, [isOpen, userId, fetchUserGroups])

  const validateForm = (): boolean => {
    const newErrors: MatchFormErrors = {}
    
    if (!formData.group_id) {
      newErrors.group_id = 'Debes seleccionar un grupo'
    }
    
    if (!formData.scheduled_at) {
      newErrors.scheduled_at = 'La fecha y hora son requeridas'
    } else {
      const selectedDate = new Date(formData.scheduled_at)
      const now = new Date()
      if (selectedDate <= now) {
        newErrors.scheduled_at = 'La fecha debe ser futura'
      }
    }
    
    if (!formData.location_name.trim()) {
      newErrors.location_name = 'La ubicación es requerida'
    }

    if (formData.required_skill_level !== null && formData.required_skill_level !== undefined && (formData.required_skill_level < 1 || formData.required_skill_level > 7)) {
      newErrors.required_skill_level = 'El nivel debe estar entre 1 y 7'
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
        group_id: '',
        scheduled_at: '',
        location_name: '',
        latitude: null,
        longitude: null,
        is_public: true,
        required_skill_level: null
      })
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Error creating match:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLocationSelect = (location: Location | null) => {
    if (location) {
      setFormData(prev => ({
        ...prev,
        location_name: location.display_name,
        latitude: location.latitude || null,
        longitude: location.longitude || null
      }))
      // Clear location error if it exists
      if (errors.location_name) {
        setErrors(prev => ({ ...prev, location_name: undefined }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        location_name: '',
        latitude: null,
        longitude: null
      }))
    }
  }

  const handleInputChange = (field: keyof MatchFormData, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (field in errors && errors[field as keyof MatchFormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().slice(0, 16)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-main rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text-main font-montserrat">
            Crear Nuevo Partido
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
          {/* Group */}
          <div>
            <label className="block text-sm font-medium text-text-main font-open-sans mb-2">
              Grupo *
            </label>
            <select
              value={formData.group_id}
              onChange={(e) => handleInputChange('group_id', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-bg-main text-text-main font-open-sans"
            >
              <option value="">Selecciona un grupo</option>
              {userGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            {errors.group_id && (
              <p className="text-error text-sm mt-1 font-open-sans">{errors.group_id}</p>
            )}
            {userGroups.length === 0 && (
              <p className="text-warning text-sm mt-1 font-open-sans">
                Únete a un grupo para poder crear partidos
              </p>
            )}
          </div>

          {/* Date and Time */}
          <div>
            <label className="block text-sm font-medium text-text-main font-open-sans mb-2">
              Fecha y Hora *
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => handleInputChange('scheduled_at', e.target.value)}
              min={getMinDate()}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-bg-main text-text-main font-open-sans"
            />
            {errors.scheduled_at && (
              <p className="text-error text-sm mt-1 font-open-sans">{errors.scheduled_at}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-text-main font-open-sans mb-2">
              Ubicación *
            </label>
            <LocationAutocomplete
              value={formData.location_name}
              onChange={handleLocationSelect}
              placeholder="Buscar ubicación del partido..."
              className="w-full"
              showCountryFlags={true}
            />
            {errors.location_name && (
              <p className="text-error text-sm mt-1 font-open-sans">{errors.location_name}</p>
            )}
          </div>

          {/* Public/Private */}
          <div>
            <label className="block text-sm font-medium text-text-main font-open-sans mb-2">
              Visibilidad
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="is_public"
                  checked={formData.is_public}
                  onChange={() => handleInputChange('is_public', true)}
                  className="mr-2"
                />
                <span className="text-text-main font-open-sans">Público</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="is_public"
                  checked={!formData.is_public}
                  onChange={() => handleInputChange('is_public', false)}
                  className="mr-2"
                />
                <span className="text-text-main font-open-sans">Privado</span>
              </label>
            </div>
          </div>

          {/* Required Skill Level */}
          <div>
            <label className="block text-sm font-medium text-text-main font-open-sans mb-2">
              Nivel Requerido (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.required_skill_level || ''}
              onChange={(e) => handleInputChange('required_skill_level', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-bg-main text-text-main font-open-sans"
              placeholder="Opcional"
            />
            {errors.required_skill_level && (
              <p className="text-error text-sm mt-1 font-open-sans">El nivel debe estar entre 1 y 10</p>
            )}
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
              disabled={isSubmitting || userGroups.length === 0}
              className="flex-1 px-4 py-2 bg-accent-primary text-bg-main rounded-lg hover:bg-accent-primary/90 transition-colors font-open-sans disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creando...' : 'Crear Partido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}