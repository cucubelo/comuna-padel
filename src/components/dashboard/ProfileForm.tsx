'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { supabase } from '@/lib/supabase'
import PostalCodeAutocomplete from '@/components/ui/PostalCodeAutocomplete'
import { PostalCode } from '@/lib/postalCodeService'
import { getAllCountries, getCountryByCode, Country } from '@/lib/countryService'

interface ProfileData {
  first_name: string
  last_name: string
  phone: string
  skill_level: number
  bio: string
  preferred_position: 'left' | 'right' | 'both' | null
  birth_date: string
  // Campos de ubicación
  country: string
  country_code: string
  postal_code: string
  place_name: string
  city: string
  latitude: number | null
  longitude: number | null
  // Campo username para preservar el existente (solo lectura)
  username?: string
}

interface ProfileFormProps {
  onSave?: () => void
  className?: string
}

export default function ProfileForm({ onSave, className = '' }: ProfileFormProps) {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    phone: '',
    skill_level: 1,
    bio: '',
    preferred_position: null,
    birth_date: '',
    // Campos de ubicación
    country: '',
    country_code: '',
    postal_code: '',
    place_name: '',
    city: '',
    latitude: null,
    longitude: null,
    // Username inicialmente vacío
    username: ''
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
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          skill_level: data.skill_level || 1,
          bio: data.bio || '',
          preferred_position: data.preferred_position || null,
          birth_date: data.birth_date || '',
          // Campos de ubicación
          country: data.country || '',
          country_code: data.country_code || '',
          postal_code: data.postal_code || '',
          place_name: data.place_name || '',
          city: data.city || '',
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          // Guardar el username existente
          username: data.username || ''
        })
        
        // Verificar si ya hay datos de ubicación cargados
        if (data.postal_code && data.place_name) {
          setIsLocationConfirmed(true)
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const allCountries = await getAllCountries()
        setCountries(allCountries)
      } catch (error) {
        console.error('Error loading countries:', error)
      }
    }

    if (user) {
      loadProfile()
      loadCountries()
    }
  }, [user, loadProfile])

  const saveProfile = async () => {
    if (!user) return

    setSaving(true)
    try {
      console.log('Datos del perfil a guardar:', profile)
      console.log('ID del usuario:', user.id)
      
      // Solo generar username si no existe uno ya
      const username = profile.username || (profile.first_name && profile.last_name
        ? `${profile.first_name}_${profile.last_name}`.toLowerCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substr(2, 6)
        : profile.first_name
        ? profile.first_name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substr(2, 6)
        : `user_${user.id.slice(0, 8)}`)
      
      const profileToSave = {
        id: user.id,
        username,
        ...profile,
        updated_at: new Date().toISOString()
      }
      
      console.log('Datos completos a guardar:', profileToSave)
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert([profileToSave])
        .select();

      console.log('Respuesta de la base de datos:', { data, error })

      if (error) {
        console.error('Error saving profile:', error)
        showError(`Error al guardar el perfil: ${error.message}`)
        return
      }

      showSuccess('Perfil guardado exitosamente')
      if (onSave) {
        onSave()
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      showError('Error al guardar el perfil')
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

  const handlePostalCodeSelect = async (postalCode: PostalCode | null) => {
    if (postalCode) {
      // Ubicación válida seleccionada
      let countryName = ''
      
      if (postalCode.country_code) {
        try {
          const countryData = await getCountryByCode(postalCode.country_code)
          countryName = countryData?.country_name || ''
        } catch (error) {
          console.error('Error obteniendo nombre del país:', error)
        }
      }
      
      setProfile(prev => ({
        ...prev,
        postal_code: postalCode.postal_code || '',
        place_name: postalCode.place_name || '',
        city: postalCode.place_name || '',
        country: countryName,
        country_code: postalCode.country_code || '',
        latitude: postalCode.latitude || null,
        longitude: postalCode.longitude || null
      }))
      setIsLocationConfirmed(true)
    } else {
      // Se está escribiendo o se limpió la selección
      setIsLocationConfirmed(false)
      setProfile(prev => ({
        ...prev,
        postal_code: '',
        place_name: '',
        city: '',
        latitude: null,
        longitude: null
      }))
    }
  }

  const handleCountryChange = (countryCode: string) => {
    const selectedCountry = countries.find(c => c.country_code === countryCode)
    setProfile(prev => ({
      ...prev,
      country_code: countryCode,
      country: selectedCountry?.country_name || '',
      // Limpiar campos de código postal cuando se cambia el país
      postal_code: '',
      place_name: '',
      city: '',
      latitude: null,
      longitude: null
    }))
    // Resetear confirmación de ubicación
    setIsLocationConfirmed(false)
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
              Nombre *
            </label>
            <input
              type="text"
              value={profile.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary bg-bg-main text-text-main"
              placeholder="Tu nombre"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              Apellido *
            </label>
            <input
              type="text"
              value={profile.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary bg-bg-main text-text-main"
              placeholder="Tu apellido"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        {/* Username (solo lectura) */}
        {profile.username && (
          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              Nombre de Usuario
            </label>
            <input
              type="text"
              value={profile.username}
              readOnly
              className="w-full px-3 py-2 border border-border rounded-md bg-bg-secondary text-text-secondary cursor-not-allowed"
              placeholder="Se genera automáticamente"
            />
            <p className="text-xs text-text-secondary mt-1">
              El nombre de usuario no se puede modificar una vez creado
            </p>
          </div>
        )}

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

          <div>
            <label className="block text-sm font-medium text-text-main mb-2">
              Posición Preferida
            </label>
            <select
              value={profile.preferred_position || ''}
              onChange={(e) => handleInputChange('preferred_position', e.target.value || null)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary bg-bg-main text-text-main"
            >
              {profile.preferred_position === null && (
                <option value="">Selecciona tu posición preferida</option>
              )}
              <option value="both">Ambas (Derecha e Izquierda)</option>
              <option value="right">Derecha</option>
              <option value="left">Izquierda</option>
            </select>
          </div>
        </div>

        {/* Información de Ubicación */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-main">Ubicación</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-main mb-2">
                País *
              </label>
              <select
                value={profile.country_code}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary bg-bg-main text-text-main"
                required
              >
                <option value="">Selecciona un país</option>
                {countries.map((country) => (
                  <option key={country.country_code} value={country.country_code}>
                    {country.flag_emoji ? `${country.flag_emoji} ` : ''}{country.country_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main mb-2">
                Código Postal
              </label>
              <PostalCodeAutocomplete
                value={profile.postal_code}
                countryCode={profile.country_code}
                onChange={handlePostalCodeSelect}
                placeholder="Ingresa tu código postal..."
                className="w-full"
                disabled={loading || !profile.country_code}
                showCountrySelector={false}
              />
              
              {/* Confirmación de ubicación */}
              {profile.city && isLocationConfirmed && (
                <div className="bg-bg-secondary border border-accent-primary/20 rounded-lg p-4 mt-3 shadow-lg">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-accent-primary/20 rounded-full flex items-center justify-center mr-3">
                      <span className="text-accent-primary text-lg">✓</span>
                    </div>
                    <h4 className="text-accent-primary font-semibold text-sm">
                      Ubicación Confirmada
                    </h4>
                  </div>
                  <div className="space-y-2 ml-11">
                    <div className="flex items-center text-sm">
                      <span className="text-accent-primary mr-2">📍</span>
                      <span className="text-text-secondary">Ciudad:</span>
                      <span className="text-text-main font-medium ml-2">{profile.city}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-accent-primary mr-2">📮</span>
                      <span className="text-text-secondary">Código Postal:</span>
                      <span className="text-text-main font-medium ml-2">{profile.postal_code}</span>
                    </div>
                    {profile.place_name && (
                      <div className="flex items-center text-sm">
                        <span className="text-accent-primary mr-2">🏷️</span>
                        <span className="text-text-secondary">Lugar:</span>
                        <span className="text-text-main font-medium ml-2">{profile.place_name}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm">
                      <span className="text-accent-primary mr-2">🌍</span>
                      <span className="text-text-secondary">País:</span>
                      <span className="text-text-main font-medium ml-2">{profile.country}</span>
                    </div>
                  </div>
                </div>
              )}

              {profile.city && !isLocationConfirmed && (
                <p className="text-sm text-yellow-600 mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  Selecciona una opción de la lista para confirmar
                </p>
              )}
            </div>
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