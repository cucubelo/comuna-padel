'use client'

import React, { useState, useEffect } from 'react'
import LoginForm from '@/components/auth/LoginForm'
import RegisterForm from '@/components/auth/RegisterForm'
import { PublicOnlyRoute } from '@/components/auth/ProtectedRoute'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1) // Remove the '#'
      if (hash === 'login') {
        setIsLogin(true)
      } else if (hash === 'register') {
        setIsLogin(false)
      }
    }

    // Check initial hash on component mount
    handleHashChange()

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  const toggleMode = () => {
    const newMode = !isLogin
    setIsLogin(newMode)
    
    // Update URL hash when toggling
    const hash = newMode ? 'login' : 'register'
    window.history.replaceState(null, '', `#${hash}`)
  }

  return (
    <PublicOnlyRoute>
      <div className="min-h-screen bg-gradient-to-br from-bg-main to-bg-secondary py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text-main font-montserrat mb-4">
              Comuna Padel
            </h1>
            <p className="text-xl text-text-secondary font-open-sans">
              Conecta con jugadores y únete a múltiples grupos de padel
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="flex justify-center mb-8">
            <div className="bg-bg-secondary rounded-lg p-1 shadow-md border border-border">
              <button
                onClick={() => {
                  setIsLogin(true)
                  window.history.replaceState(null, '', '#login')
                }}
                className={`px-6 py-2 rounded-md font-semibold font-open-sans transition-colors ${
                  isLogin
                    ? 'bg-accent-primary text-bg-main shadow-sm'
                    : 'text-text-secondary hover:text-text-main'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => {
                  setIsLogin(false)
                  window.history.replaceState(null, '', '#register')
                }}
                className={`px-6 py-2 rounded-md font-semibold font-open-sans transition-colors ${
                  !isLogin
                    ? 'bg-accent-primary text-bg-main shadow-sm'
                    : 'text-text-secondary hover:text-text-main'
                }`}
              >
                Registrarse
              </button>
            </div>
          </div>

          {/* Form Container */}
          <div className="flex justify-center">
            {isLogin ? (
              <LoginForm onToggleMode={toggleMode} />
            ) : (
              <RegisterForm onToggleMode={toggleMode} />
            )}
          </div>

          {/* Features Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-bg-secondary rounded-lg p-6 shadow-md border border-border">
                <div className="w-12 h-12 bg-accent-primary/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-main font-montserrat mb-2">
                  Únete a Grupos
                </h3>
                <p className="text-text-secondary font-open-sans">
                  Participa en múltiples grupos de padel y conecta con jugadores de tu nivel
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-bg-secondary rounded-lg p-6 shadow-md border border-border">
                <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-main font-montserrat mb-2">
                  Organiza Partidos
                </h3>
                <p className="text-text-secondary font-open-sans">
                  Crea y gestiona partidos con un sistema de reservas intuitivo
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-bg-secondary rounded-lg p-6 shadow-md border border-border">
                <div className="w-12 h-12 bg-accent-secondary/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-accent-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-main font-montserrat mb-2">
                  Sigue tu Progreso
                </h3>
                <p className="text-text-secondary font-open-sans">
                  Mantén un registro de tus partidos y mejora tu nivel de juego
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicOnlyRoute>
  )
}