'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Database } from '@/lib/supabase'

type SkillLevel = Database['public']['Enums']['skill_level']
type PreferredPosition = Database['public']['Enums']['preferred_position']

interface ProfileFormProps {
  onSave?: () => void
  className?: string
}

export default function ProfileForm({ onSave, className = '' }: ProfileFormProps) {
  const { user, profile, updateProfile, loading: authLoading } = useAuth()
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    skillLevel: 'beginner' as SkillLevel,
    preferredPosition: 'both' as PreferredPosition,
    bio: '',
    location: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Cargar datos del perfil cuando esté disponible
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        phone: profile.phone || '',
        skillLevel: profile.skill_level || 'beginner',
        preferredPosition: profile.preferred_position || 'both',
        bio: profile.bio || '',
        location: profile.location || ''
      })
    }
  }, [profile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setHasChanges(true)
    setError(null)
    setSuccess(null)
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      return 'El nombre completo es obligatorio'
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      return 'Por favor, ingresa un número de teléfono válido'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      setLoading(false)
      return
    }

    try {
      const { error } = await updateProfile({
        full_name: formData.fullName.trim(),
        phone: formData.phone.trim() || null,
        skill_level: formData.skillLevel,
        preferred_position: formData.preferredPosition,
        bio: formData.bio.trim() || null,
        location: formData.location.trim() || null
      })

      if (error) {
        setError(error.message || 'Error al actualizar el perfil')
      } else {
        setSuccess('Perfil actualizado exitosamente')
        setHasChanges(false)
        if (onSave) {
          onSave()
        }
      }
    } catch (err) {
      setError('Error inesperado. Inténtalo de nuevo.')
      console.error('Error actualizando perfil:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        phone: profile.phone || '',
        skillLevel: profile.skill_level || 'beginner',
        preferredPosition: profile.preferred_position || 'both',
        bio: profile.bio || '',
        location: profile.location || ''
      })
      setHasChanges(false)
      setError(null)
      setSuccess(null)
    }
  }

  if (authLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-600 font-open-sans">Cargando perfil...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <p className="text-gray-600 font-open-sans">Debes iniciar sesión para ver tu perfil.</p>
      </div>
    )
  }

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 font-montserrat">
            Mi Perfil
          </h2>
          <p className="text-gray-600 mt-2 font-open-sans">
            Actualiza tu información personal y preferencias de juego
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800 font-open-sans">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800 font-open-sans">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Email (solo lectura) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-open-sans">
              Email
            </label>
            <input
              type="email"
              value={user.email || ''}
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500 font-open-sans"
              disabled
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1 font-open-sans">El email no se puede modificar</p>
          </div>

          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2 font-open-sans">
                Nombre Completo *
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-open-sans"
                placeholder="Juan Pérez"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2 font-open-sans">
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-open-sans"
                placeholder="+56 9 1234 5678"
                disabled={loading}
              />
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2 font-open-sans">
              Ubicación
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-open-sans"
              placeholder="Santiago, Chile"
              disabled={loading}
            />
          </div>

          {/* Información de padel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="skillLevel" className="block text-sm font-semibold text-gray-700 mb-2 font-open-sans">
                Nivel de Juego
              </label>
              <select
                id="skillLevel"
                name="skillLevel"
                value={formData.skillLevel}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-open-sans"
                disabled={loading}
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
                <option value="professional">Profesional</option>
              </select>
            </div>

            <div>
              <label htmlFor="preferredPosition" className="block text-sm font-semibold text-gray-700 mb-2 font-open-sans">
                Posición Preferida
              </label>
              <select
                id="preferredPosition"
                name="preferredPosition"
                value={formData.preferredPosition}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-open-sans"
                disabled={loading}
              >
                <option value="both">Ambas</option>
                <option value="left">Izquierda (Drive)</option>
                <option value="right">Derecha (Revés)</option>
              </select>
            </div>
          </div>

          {/* Biografía */}
          <div>
            <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 mb-2 font-open-sans">
              Biografía
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-open-sans resize-none"
              placeholder="Cuéntanos un poco sobre ti y tu experiencia en el padel..."
              disabled={loading}
            />
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading || !hasChanges}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold font-open-sans"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </div>
              ) : (
                'Guardar Cambios'
              )}
            </button>

            {hasChanges && (
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="flex-1 sm:flex-none bg-gray-200 text-gray-800 py-3 px-6 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold font-open-sans"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Información adicional */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500 font-open-sans">
            <p><strong>Fecha de registro:</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-ES') : 'No disponible'}</p>
            <p><strong>Última actualización:</strong> {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('es-ES') : 'No disponible'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}