'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { supabase } from '@/lib/supabase'

interface RegisterFormProps {
  onToggleMode?: () => void
}

export default function RegisterForm({ onToggleMode }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    username: '',
    birthDate: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)

  const { signUp } = useAuth()
  const { showSuccess } = useToast()

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.username) {
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

    if (formData.username.length < 3 || formData.username.length > 30) {
      return 'El nombre de usuario debe tener entre 3 y 30 caracteres'
    }

    if (!/^[a-zA-Z0-9][a-zA-Z0-9_]{2,29}$/.test(formData.username)) {
      return 'El nombre de usuario solo puede contener letras, números y guiones bajos, y debe empezar con letra o número'
    }

    if (usernameAvailable === false) {
      return 'El nombre de usuario no está disponible'
    }

    return null
  }

  // Función para verificar disponibilidad del username
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setCheckingUsername(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()

      if (error && error.code === 'PGRST116') {
        // No se encontró el username, está disponible
        setUsernameAvailable(true)
      } else if (data) {
        // Se encontró el username, no está disponible
        setUsernameAvailable(false)
      } else {
        setUsernameAvailable(null)
      }
    } catch (err) {
      console.error('Error checking username:', err)
      setUsernameAvailable(null)
    } finally {
      setCheckingUsername(false)
    }
  }

  // Efecto para verificar username con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.username) {
        checkUsernameAvailability(formData.username)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [formData.username])

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
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: formData.username,
        birth_date: formData.birthDate || null,
        // Los demás campos se completarán en el dashboard
        phone: '',
        skill_level: 1, // Valor por defecto
        preferred_position: null, // Valor por defecto
        bio: ''
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
        showSuccess('¡Cuenta creada exitosamente! Completa tu perfil en el dashboard.')
        // No redirigir manualmente - dejar que el AuthContext maneje la redirección automática
      }
    } catch (err) {
      setError('Error inesperado. Inténtalo de nuevo.')
      console.error('Error en registro:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-text-main font-montserrat">
          Crear Cuenta
        </h2>
        <p className="text-text-secondary mt-2 font-open-sans text-sm">
          Únete a Comuna Padel en segundos
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-error/10 border border-error/20 rounded-xl p-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
              Nombre *
            </label>
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-4 py-4 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all duration-200 font-open-sans bg-bg-main text-text-main placeholder-text-secondary text-base"
              placeholder="Juan"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
              Apellido *
            </label>
            <input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-4 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all duration-200 font-open-sans bg-bg-main text-text-main placeholder-text-secondary text-base"
              placeholder="Pérez"
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-4 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all duration-200 font-open-sans bg-bg-main text-text-main placeholder-text-secondary text-base"
              placeholder="tu@email.com"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="birthDate" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
              Fecha de Nacimiento
            </label>
            <input
              id="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              className="w-full px-4 py-4 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all duration-200 font-open-sans bg-bg-main text-text-main placeholder-text-secondary text-base"
              disabled={loading}
            />
          </div>
        </div>

        {/* Username field */}
        <div>
          <label htmlFor="username" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
            Nombre de Usuario *
          </label>
          <div className="relative">
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
              className={`w-full px-4 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 font-open-sans bg-bg-main text-text-main placeholder-text-secondary text-base pr-12 ${
                usernameAvailable === true 
                  ? 'border-green-500 focus:ring-green-500' 
                  : usernameAvailable === false 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-border focus:ring-accent-primary'
              }`}
              placeholder="mi_usuario_123"
              disabled={loading}
              required
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              {checkingUsername ? (
                <svg className="animate-spin h-5 w-5 text-text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : usernameAvailable === true ? (
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : usernameAvailable === false ? (
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : null}
            </div>
          </div>
          {usernameAvailable === true && (
            <p className="text-xs text-green-600 mt-1 font-open-sans">✓ Nombre de usuario disponible</p>
          )}
          {usernameAvailable === false && (
            <p className="text-xs text-red-600 mt-1 font-open-sans">✗ Este nombre de usuario ya está en uso</p>
          )}
          <p className="text-xs text-text-secondary mt-1 font-open-sans">
            Solo letras, números y guiones bajos. Mínimo 3 caracteres. No se puede cambiar después.
          </p>
        </div>

        {/* Contraseñas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="w-full px-4 py-4 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all duration-200 font-open-sans pr-12 bg-bg-main text-text-main placeholder-text-secondary text-base"
                placeholder="••••••••"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center touch-manipulation"
                disabled={loading}
              >
                {showPassword ? (
                  <svg className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                className="w-full px-4 py-4 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all duration-200 font-open-sans pr-12 bg-bg-main text-text-main placeholder-text-secondary text-base"
                placeholder="••••••••"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center touch-manipulation"
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <svg className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-accent-primary/10 border border-accent-primary/20 rounded-xl p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-accent-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-accent-primary font-open-sans">
                Podrás completar tu perfil de padel (nivel, posición preferida, etc.) una vez dentro del dashboard.
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent-primary text-black py-4 px-4 rounded-xl hover:bg-accent-primary/90 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold font-open-sans text-base shadow-lg touch-manipulation"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
        <div className="mt-8 text-center">
          <p className="text-text-secondary font-open-sans text-base">
            ¿Ya tienes una cuenta?{' '}
            <button
              onClick={onToggleMode}
              className="text-accent-primary hover:text-accent-primary/80 font-semibold transition-all duration-200 touch-manipulation"
              disabled={loading}
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      )}
    </div>
  )
}