/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import ProfileForm from '@/components/auth/ProfileForm'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

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
  preferred_court_type: 'indoor' | 'outdoor' | 'both'
  competitive_level: 'casual' | 'competitive' | 'both'
}

interface RecentMatch {
  opponent: string
  resultLabel: string
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
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'preferences' | 'notifications' | 'avatar'>('overview')
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
  const [userStats] = useState({ played: 24, wins: 16, losses: 8 })
  const [recentMatches] = useState<RecentMatch[]>([
    { opponent: 'Carlos M.', resultLabel: '6-4, 6-2', outcome: 'win' },
    { opponent: 'Ana L.', resultLabel: '4-6, 6-3, 6-4', outcome: 'win' },
    { opponent: 'Miguel R.', resultLabel: '6-7, 4-6', outcome: 'loss' },
    { opponent: 'Sofia P.', resultLabel: '6-3, 6-1', outcome: 'win' },
    { opponent: 'Diego F.', resultLabel: '5-7, 6-4, 4-6', outcome: 'loss' }
  ])
  const [myGroups] = useState<UserGroup[]>([
    { name: 'Club Norte', members: 23 },
    { name: 'Amigos Pádel', members: 12 },
    { name: 'Weekend Squad', members: 8 },
    { name: 'Mixto Padel', members: 16 }
  ])

  const loadUserSettings = useCallback(async () => {
    try {
      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url)
      }
    } catch (error) {
      console.error('Error loading user settings:', error)
    }
  }, [profile])

  useEffect(() => {
    if (user) {
      loadUserSettings()
    }
  }, [user, loadUserSettings])

  const saveNotificationSettings = async () => {
    try {
      alert('Configuración de notificaciones guardada')
    } catch (error) {
      console.error('Error saving notification settings:', error)
      alert('Error al guardar la configuración')
    }
  }

  const saveGamePreferences = async () => {
    try {
      alert('Preferencias de juego guardadas')
    } catch (error) {
      console.error('Error saving game preferences:', error)
      alert('Error al guardar las preferencias')
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
      alert('Avatar actualizado correctamente')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Error al subir avatar')
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
      
          {/* Layout con sidebar fijo */}
          <div className="flex gap-4">
            {/* Sidebar fijo independiente */}
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
                      onClick={() => setActiveTab(tab.id as 'overview' | 'profile' | 'preferences' | 'notifications' | 'avatar')}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-3 group text-sm font-medium ${
                        activeTab === tab.id
                          ? 'bg-accent-primary text-white shadow-sm'
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

            {/* Sidebar móvil */}
            <div className="md:hidden mb-4">
              <div className="bg-bg-main rounded-xl border border-border p-2 shadow-sm">
                <div className="flex gap-1 overflow-x-auto">
                  {[
                    { id: 'overview', label: 'Resumen', icon: <IconOverview /> },
                    { id: 'profile', label: 'Info', icon: <IconProfile /> },
                    { id: 'preferences', label: 'Pref', icon: <IconPreferences /> },
                    { id: 'notifications', label: 'Notif', icon: <IconNotifications /> },
                    { id: 'avatar', label: 'Avatar', icon: <IconAvatar /> }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as 'overview' | 'profile' | 'preferences' | 'notifications' | 'avatar')}
                      className={`flex-shrink-0 px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-xs font-medium ${
                        activeTab === tab.id
                          ? 'bg-accent-primary text-white'
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
      
            {/* Contenido principal */}
            <section className="flex-1 min-w-0">
              <div className="bg-bg-main rounded-xl border border-border shadow-sm p-4 md:p-6">
                {activeTab === 'overview' && (
                  <div>
                    <h2 className="text-xl font-semibold text-text-main font-montserrat mb-4">Resumen</h2>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                      {/* Perfil Card */}
                      <div className="lg:col-span-1 bg-bg-secondary rounded-lg p-4 border border-border">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-bg-main border-2 border-border">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl text-text-secondary">
                                👤
                              </div>
                            )}
                          </div>
                          <h3 className="font-semibold text-text-main">{profile?.full_name || 'Usuario'}</h3>
                          <p className="text-sm text-text-secondary mb-3">{profile?.email}</p>
                          
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <div className="text-lg font-bold text-accent-primary">{userStats.played}</div>
                              <div className="text-xs text-text-secondary">Jugados</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-green-500">{userStats.wins}</div>
                              <div className="text-xs text-text-secondary">Ganados</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-red-500">{userStats.losses}</div>
                              <div className="text-xs text-text-secondary">Perdidos</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actividad Reciente */}
                      <div className="lg:col-span-2 bg-bg-secondary rounded-lg p-4 border border-border">
                        <h4 className="font-semibold text-text-main mb-3">Partidos Recientes</h4>
                        <div className="space-y-2">
                          {recentMatches.slice(0, 4).map((match, index) => (
                            <div key={index} className="flex items-center justify-between py-2 px-3 bg-bg-main rounded-md">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${match.outcome === 'win' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-sm font-medium text-text-main">{match.opponent}</span>
                              </div>
                              <span className="text-xs text-text-secondary">{match.resultLabel}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Mis Grupos */}
                    <div className="bg-bg-secondary rounded-lg p-4 border border-border">
                      <h4 className="font-semibold text-text-main mb-3">Mis Grupos</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {myGroups.map((group, index) => (
                          <div key={index} className="bg-bg-main rounded-md p-3 text-center">
                            <div className="font-medium text-text-main text-sm">{group.name}</div>
                            <div className="text-xs text-text-secondary">{group.members} miembros</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div>
                    <h2 className="text-xl font-semibold text-text-main font-montserrat mb-4">Información Personal</h2>
                    <ProfileForm showHeader={false} />
                  </div>
                )}

                {activeTab === 'preferences' && (
                  <div>
                    <h2 className="text-xl font-semibold text-text-main font-montserrat mb-4">Preferencias de Juego</h2>
                    
                    <div className="space-y-4">
                      {/* Horarios Preferidos */}
                      <div>
                        <label className="block text-sm font-medium text-text-main mb-2">
                          Horarios Preferidos
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {['Mañana (6-12)', 'Tarde (12-18)', 'Noche (18-22)', 'Madrugada (22-6)'].map((slot) => (
                            <label key={slot} className="flex items-center">
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
                                className="rounded border-border text-accent-primary focus:ring-accent-primary"
                              />
                              <span className="ml-2 text-sm text-text-main">{slot}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Días Preferidos */}
                      <div>
                        <label className="block text-sm font-medium text-text-main mb-2">
                          Días Preferidos
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
                            <label key={day} className="flex items-center">
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
                                className="rounded border-border text-accent-primary focus:ring-accent-primary"
                              />
                              <span className="ml-2 text-sm text-text-main">{day}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Distancia Máxima */}
                      <div>
                        <label className="block text-sm font-medium text-text-main mb-2">
                          Distancia Máxima de Viaje: {gamePreferences.max_travel_distance} km
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={gamePreferences.max_travel_distance}
                          onChange={(e) => setGamePreferences(prev => ({
                            ...prev,
                            max_travel_distance: parseInt(e.target.value)
                          }))}
                          className="w-full h-2 bg-bg-secondary rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>

                      {/* Tipo de Cancha */}
                      <div>
                        <label className="block text-sm font-medium text-text-main mb-2">
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
                      <div>
                        <label className="block text-sm font-medium text-text-main mb-2">
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
                        className="bg-accent-primary text-white px-4 py-2 rounded-md hover:bg-accent-primary/90 transition-colors font-medium"
                      >
                        Guardar Preferencias
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div>
                    <h2 className="text-xl font-semibold text-text-main font-montserrat mb-4">
                      Configuración de Notificaciones
                    </h2>
                    
                    <div className="space-y-4">
                      {/* Email Notifications */}
                      <div>
                        <h3 className="text-lg font-medium text-text-main mb-3">Notificaciones por Email</h3>
                        <div className="space-y-2">
                          {[
                            { key: 'email_matches', label: 'Nuevos partidos disponibles' },
                            { key: 'email_groups', label: 'Actividad en mis grupos' },
                            { key: 'email_reminders', label: 'Recordatorios de partidos' }
                          ].map((item) => (
                            <label key={item.key} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={notifications[item.key as keyof NotificationSettings]}
                                onChange={(e) => setNotifications(prev => ({
                                  ...prev,
                                  [item.key]: e.target.checked
                                }))}
                                className="rounded border-border text-accent-primary focus:ring-accent-primary"
                              />
                              <span className="ml-3 text-text-main">{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Push Notifications */}
                      <div>
                        <h3 className="text-lg font-medium text-text-main mb-3">Notificaciones Push</h3>
                        <div className="space-y-2">
                          {[
                            { key: 'push_matches', label: 'Nuevos partidos disponibles' },
                            { key: 'push_groups', label: 'Actividad en mis grupos' },
                            { key: 'push_reminders', label: 'Recordatorios de partidos' }
                          ].map((item) => (
                            <label key={item.key} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={notifications[item.key as keyof NotificationSettings]}
                                onChange={(e) => setNotifications(prev => ({
                                  ...prev,
                                  [item.key]: e.target.checked
                                }))}
                                className="rounded border-border text-accent-primary focus:ring-accent-primary"
                              />
                              <span className="ml-3 text-text-main">{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={saveNotificationSettings}
                        className="bg-accent-primary text-white px-4 py-2 rounded-md hover:bg-accent-primary/90 transition-colors font-medium"
                      >
                        Guardar Configuración
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'avatar' && (
                  <div>
                    <h2 className="text-xl font-semibold text-text-main font-montserrat mb-4">
                      Avatar de Perfil
                    </h2>
                    
                    <div className="flex items-center space-x-6">
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
                        
                        <label className="bg-accent-primary text-white px-4 py-2 rounded-md hover:bg-accent-primary/90 transition-colors font-medium cursor-pointer inline-block">
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