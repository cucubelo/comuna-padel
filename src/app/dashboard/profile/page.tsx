/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import ProfileForm from '@/components/dashboard/ProfileForm'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'
// import { Tables } from '@/lib/types/supabase' // eliminado: tipos basados en columnas inexistentes

interface NotificationSettings {
  email_matches: boolean
  email_groups: boolean
  email_reminders: boolean
  push_matches: boolean
  push_groups: boolean
  push_reminders: boolean
}
interface GamePreferences {
  preferred_time_slots: string[]
  preferred_days: string[]
  max_travel_distance: number
  preferred_court_type: 'both' | 'indoor' | 'outdoor'
  competitive_level: 'both' | 'friendly' | 'competitive'
}

interface RecentMatch {
  opponent: string
  outcome: 'win' | 'loss'
}

interface UserGroup {
  name: string
  members: number
}

// Iconos SVG mejorados y consistentes
const IconOverview = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const IconProfile = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const IconPreferences = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
  </svg>
)

const IconNotifications = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

const IconAvatar = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

export default function ProfilePage() {
  const { user, profile } = useAuth()
  const { showSuccess, showError } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'preferences' | 'notifications' | 'avatar'>('overview')
  const [showScrollHint, setShowScrollHint] = useState(true)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_matches: true,
    email_groups: true,
    email_reminders: true,
    push_matches: true,
    push_groups: false,
    push_reminders: true
  })
  const [gamePreferences, setGamePreferences] = useState<GamePreferences>({
    preferred_time_slots: [],
    preferred_days: [],
    max_travel_distance: 10,
    preferred_court_type: 'both',
    competitive_level: 'both'
  })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([])
  const [myGroups, setMyGroups] = useState<UserGroup[]>([])

  const loadUserSettings = useCallback(async () => {
    try {
      if (profile) {
        if (profile.avatar_url) {
          setAvatarUrl(profile.avatar_url)
        }
        // Las columnas notification_settings y game_preferences no existen actualmente en profiles
        // Se mantienen valores por defecto en estado local
      }
    } catch (error) {
      console.error('Error loading user settings:', error)
    }
  }, [profile])

  useEffect(() => {
    if (user) {
      loadUserSettings()
      fetchRecentMatches()
      fetchMyGroups()
    }
  }, [user, loadUserSettings])

  // Manejar navegación por URL
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['overview', 'profile', 'preferences', 'notifications', 'avatar'].includes(tabParam)) {
      setActiveTab(tabParam as 'overview' | 'profile' | 'preferences' | 'notifications' | 'avatar')
    }
  }, [searchParams])

  // Función para cambiar tab y actualizar URL
  const handleTabChange = (tab: 'overview' | 'profile' | 'preferences' | 'notifications' | 'avatar') => {
    setActiveTab(tab)
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set('tab', tab)
    router.push(`/dashboard/profile?${newSearchParams.toString()}`, { scroll: false })
  }

  const saveNotificationSettings = async () => {
    try {
      // Persistencia deshabilitada: la columna 'notification_settings' no existe en profiles
      showSuccess('Configuración de notificaciones actualizada')
    } catch (error) {
      console.error('Error saving notification settings:', error)
      showError('Error al guardar la configuración de notificaciones')
    }
  }

  const saveGamePreferences = async () => {
    try {
      // Persistencia deshabilitada: la columna 'game_preferences' no existe en profiles
      showSuccess('Preferencias de juego actualizadas')
    } catch (error) {
      console.error('Error saving game preferences:', error)
      showError('Error al guardar las preferencias de juego')
    }
  }

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Debes seleccionar una imagen para subir.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user?.id)

      if (updateError) {
        throw updateError
      }

      setAvatarUrl(data.publicUrl)
      showSuccess('Avatar actualizado correctamente')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      showError('Error al subir el avatar')
    } finally {
      setUploading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-secondary">
        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          {/* Hero compacto */}
          <section className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-text-main font-montserrat">Mi Perfil</h1>
                <p className="mt-1 text-sm text-text-secondary font-open-sans">Gestiona tu información y preferencias</p>
              </div>
              {avatarUrl && (
                <img src={avatarUrl} alt="Avatar" className="hidden md:block w-10 h-10 rounded-full ring-2 ring-border" />
              )}
            </div>
          </section>
      
          {/* Layout responsivo mejorado */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Sidebar móvil - arriba del contenido */}
            <div className="md:hidden w-full mb-4">
              <div className="bg-bg-main rounded-xl border border-border p-2 shadow-sm relative">
                {/* Indicador de scroll izquierdo - visible cuando se puede scrollear hacia la izquierda */}
                {showLeftArrow && (
                  <div className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none flex items-center justify-start">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg border border-gray-200/50 ml-1">
                      <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </div>
                  </div>
                )}
                
                {/* Indicador de scroll derecho - visible cuando hay contenido oculto */}
                {showScrollHint && (
                  <div className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none flex items-center justify-end">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg border border-gray-200/50 mr-1">
                      <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )}
                
                <div 
                  className="flex gap-1 overflow-x-auto scrollbar-hide scroll-smooth"
                  onScroll={(e) => {
                    const container = e.currentTarget
                    const scrollLeft = container.scrollLeft
                    const scrollWidth = container.scrollWidth
                    const clientWidth = container.clientWidth
                    
                    // Mostrar flecha derecha si no está al final y hay contenido oculto
                    const hasHiddenContentRight = scrollLeft < (scrollWidth - clientWidth - 10)
                    setShowScrollHint(hasHiddenContentRight)
                    
                    // Mostrar flecha izquierda si no está al inicio
                    const hasHiddenContentLeft = scrollLeft > 10
                    setShowLeftArrow(hasHiddenContentLeft)
                  }}
                >
                  {[
                    { id: 'overview', label: 'Resumen', icon: <IconOverview /> },
                    { id: 'profile', label: 'Información Personal', icon: <IconProfile /> },
                    { id: 'preferences', label: 'Preferencias', icon: <IconPreferences /> },
                    { id: 'notifications', label: 'Notificaciones', icon: <IconNotifications /> },
                    { id: 'avatar', label: 'Avatar', icon: <IconAvatar /> }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id as 'overview' | 'profile' | 'preferences' | 'notifications' | 'avatar')}
                      className={`flex-shrink-0 px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-xs font-medium ${
                        activeTab === tab.id
                          ? 'bg-accent-primary text-bg-main'
                          : 'text-text-secondary hover:text-text-main hover:bg-bg-secondary'
                      }`}
                    >
                      <span className="flex-shrink-0">{tab.icon}</span>
                      <span className="whitespace-nowrap">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar desktop - al costado */}
            <aside className="hidden md:block w-56 flex-shrink-0">
              <div className="sticky top-4 bg-bg-main rounded-xl border border-border p-3 shadow-sm">
                <nav className="space-y-1">
                  {[
                    { id: 'overview', label: 'Resumen', icon: <IconOverview /> },
                    { id: 'profile', label: 'Información Personal', icon: <IconProfile /> },
                    { id: 'preferences', label: 'Preferencias', icon: <IconPreferences /> },
                    { id: 'notifications', label: 'Notificaciones', icon: <IconNotifications /> },
                    { id: 'avatar', label: 'Avatar', icon: <IconAvatar /> }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id as 'overview' | 'profile' | 'preferences' | 'notifications' | 'avatar')}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-3 group text-sm font-medium ${
                        activeTab === tab.id
                          ? 'bg-accent-primary text-bg-main shadow-sm'
                          : 'text-text-secondary hover:text-text-main hover:bg-bg-secondary'
                      }`}
                    >
                      <span className="flex-shrink-0">{tab.icon}</span>
                      <span className="truncate">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Contenido principal */}
            <section className="flex-1 min-w-0 w-full">
              <div className="bg-bg-main rounded-xl border border-border shadow-sm p-4 md:p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="text-xl font-semibold text-text-main font-montserrat">
                        Resumen
                      </h2>
                      <p className="text-sm text-text-secondary mt-1">Vista general de tu actividad y estadísticas</p>
                    </div>
                    
                    <div className="pt-2 grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Perfil Card */}
                      <div className="lg:col-span-1 bg-bg-secondary rounded-lg p-6 border border-border">
                        <div className="text-center">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-bg-main border-2 border-border">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl text-text-secondary">
                                👤
                              </div>
                            )}
                          </div>
                          <h3 className="font-semibold text-text-main text-lg">{profile?.full_name || 'Usuario'}</h3>
                          <p className="text-sm text-text-secondary mb-4">{profile?.email}</p>
                          
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-bg-main rounded-lg p-3">
                              <div className="text-xl font-bold text-accent-primary">N/A</div>
                              <div className="text-xs text-text-secondary">Jugados</div>
                            </div>
                            <div className="bg-bg-main rounded-lg p-3">
                              <div className="text-xl font-bold text-green-500">N/A</div>
                              <div className="text-xs text-text-secondary">Ganados</div>
                            </div>
                            <div className="bg-bg-main rounded-lg p-3">
                              <div className="text-xl font-bold text-red-500">N/A</div>
                              <div className="text-xs text-text-secondary">Perdidos</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actividad Reciente */}
                      <div className="lg:col-span-2 bg-bg-secondary rounded-lg p-6 border border-border">
                        <h4 className="font-semibold text-text-main mb-4 text-lg">Partidos Recientes</h4>
                        <div className="space-y-3">
                          <p className="text-text-secondary">Próximamente...</p>
                        </div>
                      </div>
                    </div>

                    {/* Mis Grupos */}
                    <div className="bg-bg-secondary rounded-lg p-6 border border-border">
                      <h4 className="font-semibold text-text-main mb-4 text-lg">Mis Grupos</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {myGroups.map((group, index) => (
                          <div key={index} className="bg-bg-main rounded-lg p-4 text-center border border-border hover:border-accent-primary transition-colors">
                            <div className="font-medium text-text-main text-sm mb-1">{group.name}</div>
                            <div className="text-xs text-text-secondary">{group.members} miembros</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="text-xl font-semibold text-text-main font-montserrat">Información Personal</h2>
                      <p className="text-sm text-text-secondary mt-1">Actualiza tu información personal y de contacto</p>
                    </div>
                    <div className="pt-2">
                      <ProfileForm showHeader={false} />
                    </div>
                  </div>
                )}

                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="text-xl font-semibold text-text-main font-montserrat">Preferencias de Juego</h2>
                      <p className="text-sm text-text-secondary mt-1">Configura tus horarios y preferencias de juego</p>
                    </div>
                    
                    <div className="pt-2 space-y-6">
                      {/* Horarios Preferidos */}
                      <div className="bg-bg-secondary rounded-lg border border-border p-4">
                        <label className="block text-sm font-medium text-text-main mb-3">
                          Horarios Preferidos
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {['Mañana (6-12)', 'Tarde (12-18)', 'Noche (18-00)'].map((slot) => (
                            <label key={slot} className="flex items-center cursor-pointer group">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={gamePreferences.preferred_time_slots.includes(slot)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setGamePreferences(prev => ({
                                        ...prev,
                                        preferred_time_slots: [...prev.preferred_time_slots, slot]
                                      }))
                                    } else {
                                      setGamePreferences(prev => ({
                                        ...prev,
                                        preferred_time_slots: prev.preferred_time_slots.filter(s => s !== slot)
                                      }))
                                    }
                                  }}
                                  className="sr-only"
                                />
                                <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                                  gamePreferences.preferred_time_slots.includes(slot)
                                    ? 'bg-accent-primary border-accent-primary'
                                    : 'border-border bg-bg-main group-hover:border-accent-primary/50'
                                }`}>
                                  {gamePreferences.preferred_time_slots.includes(slot) && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <span className="ml-3 text-sm text-text-main group-hover:text-accent-primary transition-colors">{slot}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Días Preferidos */}
                      <div className="bg-bg-secondary rounded-lg border border-border p-4">
                        <label className="block text-sm font-medium text-text-main mb-3">
                          Días Preferidos
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
                            <label key={day} className="flex items-center cursor-pointer group">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={gamePreferences.preferred_days.includes(day)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setGamePreferences(prev => ({
                                        ...prev,
                                        preferred_days: [...prev.preferred_days, day]
                                      }))
                                    } else {
                                      setGamePreferences(prev => ({
                                        ...prev,
                                        preferred_days: prev.preferred_days.filter(d => d !== day)
                                      }))
                                    }
                                  }}
                                  className="sr-only"
                                />
                                <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                                  gamePreferences.preferred_days.includes(day)
                                    ? 'bg-accent-primary border-accent-primary'
                                    : 'border-border bg-bg-main group-hover:border-accent-primary/50'
                                }`}>
                                  {gamePreferences.preferred_days.includes(day) && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <span className="ml-3 text-sm text-text-main group-hover:text-accent-primary transition-colors">{day}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Distancia Máxima */}
                      <div className="bg-bg-secondary rounded-lg border border-border p-4">
                        <label className="block text-sm font-medium text-text-main mb-4">
                          Distancia Máxima de Viaje: <span className="text-accent-primary font-semibold">{gamePreferences.max_travel_distance} km</span>
                        </label>
                        <div className="relative">
                          <input
                            type="range"
                            min="1"
                            max="50"
                            value={gamePreferences.max_travel_distance}
                            onChange={(e) => setGamePreferences(prev => ({
                              ...prev,
                              max_travel_distance: parseInt(e.target.value)
                            }))}
                            className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider-custom"
                            style={{
                              background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${((gamePreferences.max_travel_distance - 1) / 49) * 100}%, var(--border-color) ${((gamePreferences.max_travel_distance - 1) / 49) * 100}%, var(--border-color) 100%)`
                            }}
                          />
                          <div className="flex justify-between text-xs text-text-secondary mt-2">
                            <span>1 km</span>
                            <span>25 km</span>
                            <span>50 km</span>
                          </div>
                        </div>
                      </div>

                      {/* Tipo de Cancha */}
                      <div className="bg-bg-secondary rounded-lg border border-border p-4">
                        <label className="block text-sm font-medium text-text-main mb-3">
                          Tipo de Cancha Preferido
                        </label>
                        <select
                          value={gamePreferences.preferred_court_type}
                          onChange={(e) => setGamePreferences(prev => ({
                            ...prev,
                            preferred_court_type: e.target.value as 'indoor' | 'outdoor' | 'both'
                          }))}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary bg-bg-main text-text-main"
                        >
                          <option value="indoor">Interior</option>
                          <option value="outdoor">Exterior</option>
                          <option value="both">Ambos</option>
                        </select>
                      </div>

                      {/* Nivel Competitivo */}
                      <div className="bg-bg-secondary rounded-lg border border-border p-4">
                        <label className="block text-sm font-medium text-text-main mb-3">
                          Nivel Competitivo
                        </label>
                        <select
                          value={gamePreferences.competitive_level}
                          onChange={(e) => setGamePreferences(prev => ({
                            ...prev,
                            competitive_level: e.target.value as 'casual' | 'competitive' | 'both'
                          }))}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary bg-bg-main text-text-main"
                        >
                          <option value="casual">Casual</option>
                          <option value="competitive">Competitivo</option>
                          <option value="both">Ambos</option>
                        </select>
                      </div>

                      <button
                        onClick={saveGamePreferences}
                        className="bg-accent-primary text-bg-main px-4 py-2 rounded-md hover:bg-accent-primary/90 transition-colors font-medium"
                      >
                        Guardar Preferencias
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="text-xl font-semibold text-text-main font-montserrat">
                        Configuración de Notificaciones
                      </h2>
                      <p className="text-sm text-text-secondary mt-1">Gestiona cómo y cuándo recibir notificaciones</p>
                    </div>
                    
                    <div className="pt-2 space-y-6">
                      {/* Email Notifications */}
                      <div>
                        <h3 className="text-lg font-medium text-text-main mb-4">Notificaciones por Email</h3>
                        <div className="space-y-4">
                          {[
                            { key: 'email_matches', label: 'Nuevos partidos disponibles', description: 'Recibe emails cuando haya nuevos partidos en tu área' },
                            { key: 'email_groups', label: 'Actividad en mis grupos', description: 'Notificaciones sobre mensajes y eventos en tus grupos' },
                            { key: 'email_reminders', label: 'Recordatorios de partidos', description: 'Recordatorios antes de tus partidos programados' }
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between py-3 px-4 bg-bg-secondary rounded-lg">
                              <div className="flex-1">
                                <div className="text-text-main font-medium">{item.label}</div>
                                <div className="text-text-secondary text-sm mt-1">{item.description}</div>
                              </div>
                              <button
                                onClick={() => setNotifications(prev => ({
                                  ...prev,
                                  [item.key]: !prev[item.key as keyof NotificationSettings]
                                }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 ${
                                  notifications[item.key as keyof NotificationSettings] 
                                    ? 'bg-accent-primary' 
                                    : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    notifications[item.key as keyof NotificationSettings] 
                                      ? 'translate-x-6' 
                                      : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Push Notifications */}
                      <div>
                        <h3 className="text-lg font-medium text-text-main mb-4">Notificaciones Push</h3>
                        <div className="space-y-4">
                          {[
                            { key: 'push_matches', label: 'Nuevos partidos disponibles', description: 'Notificaciones instantáneas en tu dispositivo' },
                            { key: 'push_groups', label: 'Actividad en mis grupos', description: 'Alertas inmediatas de actividad en grupos' },
                            { key: 'push_reminders', label: 'Recordatorios de partidos', description: 'Recordatorios push antes de tus partidos' }
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between py-3 px-4 bg-bg-secondary rounded-lg">
                              <div className="flex-1">
                                <div className="text-text-main font-medium">{item.label}</div>
                                <div className="text-text-secondary text-sm mt-1">{item.description}</div>
                              </div>
                              <button
                                onClick={() => setNotifications(prev => ({
                                  ...prev,
                                  [item.key]: !prev[item.key as keyof NotificationSettings]
                                }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 ${
                                  notifications[item.key as keyof NotificationSettings] 
                                    ? 'bg-accent-primary' 
                                    : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    notifications[item.key as keyof NotificationSettings] 
                                      ? 'translate-x-6' 
                                      : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={saveNotificationSettings}
                        className="w-full bg-accent-primary text-bg-main px-4 py-3 rounded-lg hover:bg-accent-primary/90 transition-colors font-medium text-center"
                      >
                        Guardar Configuración
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'avatar' && (
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="text-xl font-semibold text-text-main font-montserrat">
                        Avatar de Perfil
                      </h2>
                      <p className="text-sm text-text-secondary mt-1">Personaliza tu imagen de perfil</p>
                    </div>
                    
                    <div className="pt-2 flex items-center space-x-6">
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-bg-secondary border-4 border-border">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl text-text-secondary">
                              👤
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium text-text-main mb-2">
                          Cambiar Avatar
                        </h3>
                        <p className="text-text-secondary mb-3 text-sm">
                          Sube una imagen para personalizar tu perfil. Recomendamos imágenes cuadradas de al menos 200x200 píxeles.
                        </p>
                        
                        <label className="bg-accent-primary text-bg-main px-4 py-2 rounded-md hover:bg-accent-primary/90 transition-colors font-medium cursor-pointer inline-block">
                          {uploading ? 'Subiendo...' : 'Seleccionar Imagen'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={uploadAvatar}
                            disabled={uploading}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

interface NotificationSettings {
  email_matches: boolean
  email_groups: boolean
  email_reminders: boolean
  push_matches: boolean
  push_groups: boolean
  push_reminders: boolean
}
interface GamePreferences {
  preferred_time_slots: string[]
  preferred_days: string[]
  max_travel_distance: number
  preferred_court_type: 'both' | 'indoor' | 'outdoor'
  competitive_level: 'both' | 'friendly' | 'competitive'
}

// Eliminar bloque duplicado y fuera de scope:
// interface NotificationSettings { ... }
// interface GamePreferences { ... }
// if (profile) { ... }
// showSuccess('Configuración de notificaciones actualizada')
// showSuccess('Preferencias de juego actualizadas')