'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Database } from '@/lib/supabase'

type SkillLevel = Database['public']['Enums']['skill_level']
type PreferredPosition = Database['public']['Enums']['preferred_position']

interface RegisterFormProps {
  onToggleMode?: () => void
}

export default function RegisterForm({ onToggleMode }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    skillLevel: 'beginner' as SkillLevel,
    preferredPosition: 'both' as PreferredPosition,
    bio: '',
    location: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { signUp } = useAuth()
  const router = useRouter()



  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      return 'Por favor, completa todos los campos obligatorios'
    }

    if (!formData.email.includes('@')) {
      return 'Por favor, ingresa un email válido'
    }

    if (formData.password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres'
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Las contraseñas no coinciden'
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      return 'Por favor, ingresa un número de teléfono válido'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      setLoading(false)
      return
    }

    try {
      const { error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        phone: formData.phone || null,
        skill_level: formData.skillLevel,
        preferred_position: formData.preferredPosition,
        bio: formData.bio || null,
        location: formData.location || null
      })

      if (error) {
        if (error.message.includes('User already registered')) {
          setError('Este email ya está registrado. Intenta iniciar sesión.')
        } else if (error.message.includes('Password should be at least')) {
          setError('La contraseña debe tener al menos 6 caracteres')
        } else {
          setError(error.message || 'Error al crear la cuenta')
        }
      } else {
        // Mostrar mensaje de éxito
        alert('¡Cuenta creada exitosamente! Serás redirigido al dashboard.')
        // No redirigir manualmente - dejar que el AuthContext maneje la redirección automática
        // cuando el usuario esté autenticado
      }
    } catch (err) {
      setError('Error inesperado. Inténtalo de nuevo.')
      console.error('Error en registro:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-bg-secondary rounded-lg shadow-lg p-8 border border-border">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-text-main font-montserrat">
            Crear Cuenta
          </h2>
          <p className="text-text-secondary mt-2 font-open-sans">
            Conecta con jugadores y únete a múltiples grupos de padel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-error/10 border border-error/20 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-error font-open-sans">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Información Personal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
                Email *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors font-open-sans bg-bg-main text-text-main placeholder-text-secondary"
                placeholder="tu@email.com"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
                Nombre Completo *
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors font-open-sans bg-bg-main text-text-main placeholder-text-secondary"
                placeholder="Juan Pérez"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Contraseñas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
                Contraseña *
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors font-open-sans pr-12 bg-bg-main text-text-main placeholder-text-secondary"
                  placeholder="••••••••"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
                Confirmar Contraseña *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors font-open-sans pr-12 bg-bg-main text-text-main placeholder-text-secondary"
                  placeholder="••••••••"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
                Teléfono
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors font-open-sans bg-bg-main text-text-main placeholder-text-secondary"
                placeholder="+34 600 123 456"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
                Ubicación
              </label>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors font-open-sans bg-bg-main text-text-main placeholder-text-secondary"
                placeholder="Madrid, España"
                disabled={loading}
              />
            </div>
          </div>

          {/* Información de Padel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="skillLevel" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
                Nivel de Juego *
              </label>
              <select
                id="skillLevel"
                value={formData.skillLevel}
                onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value as SkillLevel })}
                className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors font-open-sans bg-bg-main text-text-main"
                disabled={loading}
                required
              >
                <option value="">Selecciona tu nivel</option>
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
                <option value="profesional">Profesional</option>
              </select>
            </div>

            <div>
              <label htmlFor="preferredPosition" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
                Posición Preferida
              </label>
              <select
                id="preferredPosition"
                value={formData.preferredPosition}
                onChange={(e) => setFormData({ ...formData, preferredPosition: e.target.value as PreferredPosition })}
                className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors font-open-sans bg-bg-main text-text-main"
                disabled={loading}
              >
                <option value="">Selecciona tu posición</option>
                <option value="derecha">Derecha</option>
                <option value="izquierda">Izquierda</option>
                <option value="ambas">Ambas</option>
              </select>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
              Biografía
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors font-open-sans resize-none bg-bg-main text-text-main placeholder-text-secondary"
              placeholder="Cuéntanos un poco sobre ti y tu experiencia en el padel..."
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-primary text-bg-main py-3 px-4 rounded-md hover:bg-accent-primary/90 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold font-open-sans"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-bg-main" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creando cuenta...
              </div>
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </form>

        {onToggleMode && (
          <div className="mt-6 text-center">
            <p className="text-text-secondary font-open-sans">
              ¿Ya tienes una cuenta?{' '}
              <button
                onClick={onToggleMode}
                className="text-accent-primary hover:text-accent-primary/80 font-semibold transition-colors"
                disabled={loading}
              >
                Inicia sesión aquí
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}