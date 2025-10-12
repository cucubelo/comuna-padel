'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface ProfileData {
  full_name: string
  phone: string
  skill_level: number
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
    skill_level: 1,
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
          skill_level: data.skill_level || 1,
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
        .upsert([{ id: user.id, ...profile }]);

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

  const handleInputChange = (field: keyof ProfileData, value: string | number) => {
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
        </div>

        {/* Información de Juego */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              Nivel de Habilidad
            </label>
            <select
              value={profile.skill_level}
              onChange={(e) => handleInputChange('skill_level', parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary bg-bg-main text-text-main"
            >
              <option value="1">Principiante</option>
              <option value="2">Intermedio</option>
              <option value="3">Avanzado</option>
              <option value="4">Experto</option>
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