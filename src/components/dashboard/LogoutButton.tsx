'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const { signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    if (loading) return
    
    setLoading(true)
    try {
      const { error } = await signOut()
      if (error) {
        console.error('Error cerrando sesión:', error)
        alert('Error al cerrar sesión. Por favor, intenta de nuevo.')
      } else {
        // Redirigir al login después de cerrar sesión exitosamente
        router.push('/auth')
      }
    } catch (error) {
      console.error('Error inesperado cerrando sesión:', error)
      alert('Error inesperado al cerrar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-main hover:bg-bg-secondary rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Cerrar sesión"
    >
      <svg 
        className="h-4 w-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
        />
      </svg>
      <span className="hidden sm:inline">
        {loading ? 'Cerrando...' : 'Salir'}
      </span>
    </button>
  )
}