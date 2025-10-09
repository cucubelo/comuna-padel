'use client'

import React, { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  requireProfile?: boolean
  fallback?: React.ReactNode
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/auth',
  requireProfile = false,
  fallback 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Usuario no autenticado, redirigir al login
        router.push(redirectTo)
        return
      }

      if (requireProfile && !profile) {
        // Usuario autenticado pero sin perfil completo
        router.push('/profile/setup')
        return
      }
    }
  }, [user, profile, loading, router, redirectTo, requireProfile])

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-bg-main">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-text-main bg-bg-secondary border border-border transition ease-in-out duration-150">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-accent-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verificando autenticación...
            </div>
            <p className="mt-4 text-text-secondary font-open-sans">
              Por favor espera mientras verificamos tu sesión
            </p>
          </div>
        </div>
      )
    )
  }

  // Si no hay usuario, no mostrar nada (se está redirigiendo)
  if (!user) {
    return null
  }

  // Si se requiere perfil y no existe, no mostrar nada (se está redirigiendo)
  if (requireProfile && !profile) {
    return null
  }

  // Usuario autenticado y con perfil (si se requiere), mostrar contenido
  return <>{children}</>
}

// Hook personalizado para verificar autenticación en componentes
export function useProtectedRoute(redirectTo: string = '/auth') {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  return {
    user,
    loading,
    isAuthenticated: !!user && !loading
  }
}

// Componente para rutas que requieren que el usuario NO esté autenticado (como login/register)
export function PublicOnlyRoute({ 
  children, 
  redirectTo = '/dashboard' 
}: { 
  children: React.ReactNode
  redirectTo?: string 
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // Usuario ya autenticado, redirigir al dashboard
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-text-main bg-bg-secondary border border-border transition ease-in-out duration-150">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-accent-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verificando autenticación...
          </div>
        </div>
      </div>
    )
  }

  // Si hay usuario autenticado, no mostrar nada (se está redirigiendo)
  if (user) {
    return null
  }

  // No hay usuario autenticado, mostrar contenido público
  return <>{children}</>
}