'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface ProfileData {
  full_name: string
  phone: string
  birth_date: string
  location: string
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  playing_style: 'aggressive' | 'defensive' | 'balanced'
  bio: string
}

interface ProfileFormProps {
  onSave?: () => void
  className?: string
}

export default function ProfileForm({ onSave, className = '' }: ProfileFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    phone: '',
    birth_date: '',
    location: '',
    skill_level: 'beginner',
    playing_style: 'balanced',
    bio: ''
  })

  const loadProfile = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error)
        return
      }

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          phone: data.phone || '',
          birth_date: data.birth_date || '',
          location: data.location || '',
          skill_level: data.skill_level || 'beginner',
          playing_style: data.playing_style || 'balanced',
          bio: data.bio || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user, loadProfile])

  const saveProfile = async () => {
    if (!user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profile,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving profile:', error)
        alert('Error al guardar el perfil')
        return
      }

      alert('Perfil guardado exitosamente')
      if (onSave) {
        onSave()
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error al guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    )
  }

  return (
    <div className={className}>
      <form onSubmit={(e) => { e.preventDefault(); saveProfile(); }} className="space-y-6">
        {/* Información Básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary bg-bg-main text-text-main"
              placeholder="Tu nombre completo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary bg-bg-main text-text-main"
              placeholder="Ej: +00 000 000 0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              value={profile.birth_date}
              onChange={(e) => handleInputChange('birth_date', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary bg-bg-main text-text-main"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              Ubicación
            </label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary bg-bg-main text-text-main"
              placeholder="Ciudad, País"
            />
          </div>
        </div>

        {/* Información de Juego */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              Nivel de Habilidad
            </label>
            <select
              value={profile.skill_level}
              onChange={(e) => handleInputChange('skill_level', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary bg-bg-main text-text-main"
            >
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
              <option value="expert">Experto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              Estilo de Juego
            </label>
            <select
              value={profile.playing_style}
              onChange={(e) => handleInputChange('playing_style', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary bg-bg-main text-text-main"
            >
              <option value="aggressive">Agresivo</option>
              <option value="defensive">Defensivo</option>
              <option value="balanced">Equilibrado</option>
            </select>
          </div>
        </div>

        {/* Biografía */}
        <div>
          <label className="block text-sm font-medium text-text-main mb-2">
            Biografía
          </label>
          <textarea
            value={profile.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary bg-bg-main text-text-main"
            placeholder="Cuéntanos sobre ti, tu experiencia en pádel, objetivos, etc."
          />
        </div>

        {/* Botón de Guardar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-accent-primary text-bg-main px-6 py-2 rounded-md hover:bg-accent-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar Perfil'}
          </button>
        </div>
      </form>
    </div>
  )
}