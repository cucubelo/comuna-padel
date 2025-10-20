'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface LoginFormProps {
  onToggleMode?: () => void
  redirectTo?: string
}

export default function LoginForm({ onToggleMode, redirectTo = '/dashboard' }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [remember30Days, setRemember30Days] = useState(false)

  const router = useRouter()
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!email || !password) {
      setError('Por favor, completa todos los campos')
      setLoading(false)
      return
    }

    if (!email.includes('@')) {
      setError('Por favor, ingresa un email válido')
      setLoading(false)
      return
    }

    try {
      const { error: signInError } = await signIn(email, password, remember30Days)

      if (signInError) {
        setError(signInError.message || 'Error al iniciar sesión')
      } else {
        router.push(redirectTo)
      }
    } catch (err) {
      setError('Error inesperado. Inténtalo de nuevo.')
      console.error('Error en login:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-text-main font-montserrat">
          Bienvenido
        </h2>
        <p className="text-text-secondary mt-2 font-open-sans text-sm">
          Accede a tu cuenta de Comuna Padel
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

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-4 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all duration-200 font-open-sans bg-bg-main text-text-main placeholder-text-secondary text-base"
              placeholder="tu@email.com"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-all duration-200 font-open-sans pr-12 bg-bg-main text-text-main placeholder-text-secondary text-base"
                placeholder="••••••••"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center touch-none"
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

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3 text-sm text-text-secondary font-open-sans cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={remember30Days}
                  onChange={(e) => setRemember30Days(e.target.checked)}
                  className="sr-only"
                  disabled={loading}
                />
                <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                  remember30Days
                    ? 'bg-accent-primary border-accent-primary'
                    : 'border-border bg-bg-main group-hover:border-accent-primary/50'
                } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  {remember30Days && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className={`transition-colors duration-200 ${loading ? 'opacity-50' : 'group-hover:text-text-main'}`}>
                Recordarme por 30 días
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-primary text-black py-4 px-4 rounded-xl hover:bg-accent-primary/90 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold font-open-sans text-base shadow-lg touch-none"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {onToggleMode && (
          <div className="mt-6 text-center">
            <p className="text-text-secondary font-open-sans text-sm">
              ¿No tienes una cuenta?{' '}
              <button
                onClick={onToggleMode}
                className="text-accent-primary hover:text-accent-primary/80 font-semibold transition-colors touch-none"
                disabled={loading}
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            className="text-sm text-text-secondary hover:text-text-main transition-colors font-open-sans touch-none py-2"
            disabled={loading}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
    </div>
  )
}