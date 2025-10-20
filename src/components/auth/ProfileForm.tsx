'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Database } from '@/lib/supabase'
import PostalCodeAutocomplete from '@/components/ui/PostalCodeAutocomplete'
import { PostalCode } from '@/lib/postalCodeService'
import { getCountryByCode, getAllCountries, Country } from '@/lib/countryService'
import { useToast } from '@/contexts/ToastContext'

type SkillLevel = Database['public']['Enums']['skill_level']
type PreferredPosition = Database['public']['Enums']['preferred_position']

interface ProfileFormProps {
  onSave?: () => void
  className?: string
  showHeader?: boolean
}

export default function ProfileForm({ onSave, className = '', showHeader = true }: ProfileFormProps) {
  const { user, profile, updateProfile, loading: authLoading } = useAuth()
  const { showSuccess, showError } = useToast()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    skillLevel: 1,
    preferredPosition: '' as PreferredPosition | '',
    bio: '',
    birthDate: '',
    postalCode: '',
    placeName: '',
    adminName1: '',
    adminName2: '',
    adminName3: '',
    adminCode1: '',
    adminCode2: '',
    adminCode3: '',
    latitude: null as number | null,
    longitude: null as number | null,
    city: '',
    country: '',
    countryCode: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])

  // Cargar países disponibles
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const countriesData = await getAllCountries()
        setCountries(countriesData)
      } catch (error) {
        console.error('Error cargando países:', error)
      }
    }
    
    loadCountries()
  }, [])

  // Cargar datos del perfil cuando esté disponible
  useEffect(() => {
    const loadProfileData = async () => {
      if (profile) {
        let countryName = profile.country || '';
        
        // Si tenemos country_code pero no country, buscar el nombre del país
        if (profile.country_code && !profile.country) {
          try {
            const countryData = await getCountryByCode(profile.country_code);
            countryName = countryData?.country_name || '';
          } catch (error) {
            console.error('Error obteniendo nombre del país:', error);
          }
        }
        
        setFormData({
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          phone: profile.phone || '',
          skillLevel: profile.skill_level || 1,
          preferredPosition: profile.preferred_position || '',
          bio: profile.bio || '',
          birthDate: profile.birth_date || '',
          postalCode: profile.postal_code || '',
          placeName: profile.place_name || '',
          adminName1: profile.admin_name1 || '',
          adminName2: profile.admin_name2 || '',
          adminName3: profile.admin_name3 || '',
          adminCode1: profile.admin_code1 || '',
          adminCode2: profile.admin_code2 || '',
          adminCode3: profile.admin_code3 || '',
          latitude: profile.latitude || null,
          longitude: profile.longitude || null,
          city: profile.city || '',
          country: countryName,
          countryCode: profile.country_code || ''
        })
        
        // Resetear estados de cambios cuando se cargan los datos
         setHasChanges(false)
      }
    }
    
    loadProfileData()
  }, [profile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === 'skillLevel') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    setHasChanges(true)
  }

  const handlePostalCodeSelect = async (postalCode: PostalCode | null) => {
    let countryName = '';
    
    if (postalCode && postalCode.country_code) {
      try {
        const countryData = await getCountryByCode(postalCode.country_code);
        countryName = countryData?.country_name || '';
      } catch (error) {
        console.error('Error obteniendo nombre del país:', error);
        // Fallback: usar admin_name1 como antes
        countryName = postalCode.admin_name1 ?? postalCode.admin_name2 ?? '';
      }
    }
    
    setFormData(prev => ({
      ...prev,
      postalCode: postalCode ? postalCode.postal_code : '',
      placeName: postalCode ? postalCode.place_name : '',
      adminName1: postalCode ? postalCode.admin_name1 || '' : '',
      adminName2: postalCode ? postalCode.admin_name2 || '' : '',
      adminName3: postalCode ? postalCode.admin_name3 || '' : '',
      adminCode1: postalCode ? postalCode.admin_code1 || '' : '',
      adminCode2: postalCode ? postalCode.admin_code2 || '' : '',
      adminCode3: postalCode ? postalCode.admin_code3 || '' : '',
      latitude: postalCode ? postalCode.latitude || null : null,
      longitude: postalCode ? postalCode.longitude || null : null,
      city: postalCode ? postalCode.place_name : '',
      country: countryName,
      countryCode: postalCode ? postalCode.country_code : ''
    }))
    setHasChanges(true)
  }



  const validateForm = () => {
    if (!formData.fullName.trim()) {
      return 'El nombre completo es obligatorio'
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      return 'Por favor, ingresa un número de teléfono válido'
    }

    // Validación cruzada: si hay código postal, debe coincidir con el país seleccionado
    if (formData.postalCode && formData.countryCode) {
      // Verificar que el código postal pertenece al país seleccionado
      // Esta validación se basa en que cuando se selecciona un código postal,
      // automáticamente se actualiza el país correspondiente
      if (formData.postalCode && !formData.placeName) {
        return 'El código postal ingresado no es válido o no se encontró información de ubicación'
      }
    }

    // Si hay país seleccionado pero no hay código postal, es válido
    // Si hay código postal, debe tener datos de ubicación asociados
    if (formData.postalCode && (!formData.city && !formData.placeName)) {
      return 'Por favor, selecciona un código postal válido de la lista de sugerencias'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const validationError = validateForm()
    if (validationError) {
      showError(validationError)
      setLoading(false)
      return
    }

    try {
      console.log('Enviando datos del perfil:', {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone: formData.phone.trim() || null,
        skill_level: formData.skillLevel,
        preferred_position: formData.preferredPosition === '' ? null : formData.preferredPosition,
        bio: formData.bio.trim() || null,
        birth_date: formData.birthDate || null,
        postal_code: formData.postalCode.trim() || null,
        place_name: formData.placeName.trim() || null,
        admin_name1: formData.adminName1.trim() || null,
        admin_name2: formData.adminName2.trim() || null,
        admin_name3: formData.adminName3.trim() || null,
        admin_code1: formData.adminCode1.trim() || null,
        admin_code2: formData.adminCode2.trim() || null,
        admin_code3: formData.adminCode3.trim() || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        city: formData.city.trim() || null,
        country: formData.country.trim() || null,
        country_code: formData.countryCode.trim() || null
      })

      const { error } = await updateProfile({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone: formData.phone.trim() || null,
        skill_level: formData.skillLevel,
        preferred_position: formData.preferredPosition === '' ? null : formData.preferredPosition,
        bio: formData.bio.trim() || null,
        birth_date: formData.birthDate || null,
        postal_code: formData.postalCode.trim() || null,
        place_name: formData.placeName.trim() || null,
        admin_name1: formData.adminName1.trim() || null,
        admin_name2: formData.adminName2.trim() || null,
        admin_name3: formData.adminName3.trim() || null,
        admin_code1: formData.adminCode1.trim() || null,
        admin_code2: formData.adminCode2.trim() || null,
        admin_code3: formData.adminCode3.trim() || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        city: formData.city.trim() || null,
        country: formData.country.trim() || null,
        country_code: formData.countryCode.trim() || null
      })

      console.log('Resultado de updateProfile:', { error })

      if (error) {
        console.error('Error detallado:', error)
        showError(error.message || 'Error al actualizar el perfil')
      } else {
        showSuccess('Perfil actualizado exitosamente')
        setHasChanges(false)
        if (onSave) {
          onSave()
        }
      }
    } catch (err) {
      console.error('Error inesperado:', err)
      showError('Error inesperado. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (profile) {
      let countryName = profile.country || '';
      
      // Si tenemos country_code pero no country, buscar el nombre del país
      if (profile.country_code && !profile.country) {
        try {
          const countryData = await getCountryByCode(profile.country_code)
          countryName = countryData?.country_name || ''
        } catch (error) {
          console.error('Error obteniendo nombre del país:', error)
        }
      }

      setFormData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        phone: profile.phone || '',
        skillLevel: profile.skill_level || 1,
        preferredPosition: profile.preferred_position || '',
        bio: profile.bio || '',
        birthDate: profile.birth_date || '',
        postalCode: profile.postal_code || '',
        placeName: profile.place_name || '',
        adminName1: profile.admin_name1 || '',
        adminName2: profile.admin_name2 || '',
        adminName3: profile.admin_name3 || '',
        adminCode1: profile.admin_code1 || '',
        adminCode2: profile.admin_code2 || '',
        adminCode3: profile.admin_code3 || '',
        latitude: profile.latitude || null,
        longitude: profile.longitude || null,
        city: profile.city || '',
        country: countryName,
        countryCode: profile.country_code || ''
      })
      setHasChanges(false)
    }
  }

  if (authLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-accent-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-text-secondary font-open-sans">Cargando perfil...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <p className="text-gray-600 font-open-sans">Debes iniciar sesión para ver tu perfil.</p>
      </div>
    )
  }

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <div className="bg-bg-secondary rounded-lg border border-border p-6">
        {showHeader && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-text-main font-montserrat">
              Mi Perfil
            </h2>
            <p className="text-text-secondary mt-2 font-open-sans">
              Actualiza tu información personal y preferencias de juego
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email (solo lectura) */}
          <div>
            <label className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
              Email
            </label>
            <input
              type="email"
              value={user.email || ''}
              className="w-full px-4 py-3 border border-border rounded-md bg-bg-secondary text-text-secondary font-open-sans"
              disabled
              readOnly
            />
            <p className="text-xs text-text-secondary mt-1 font-open-sans">El email no se puede modificar</p>
          </div>

          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
                Nombre *
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors font-open-sans bg-bg-main text-text-main"
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
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors font-open-sans bg-bg-main text-text-main"
                placeholder="Pérez"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors font-open-sans bg-bg-main text-text-main"
                placeholder="Ej: +00 000 000 0000"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="birthDate" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
                Fecha de Nacimiento
              </label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors font-open-sans bg-bg-main text-text-main"
                disabled={loading}
              />
            </div>
          </div>

          {/* Ubicación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="country" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
                País
              </label>
              <select
                id="country"
                name="countryCode"
                value={formData.countryCode}
                onChange={(e) => {
                  const selectedCountry = countries.find(c => c.country_code === e.target.value)
                  setFormData(prev => ({
                    ...prev,
                    countryCode: e.target.value,
                    country: selectedCountry?.country_name || '',
                    // Limpiar datos de ubicación cuando se cambia el país manualmente
                    postalCode: '',
                    placeName: '',
                    city: '',
                    adminName1: '',
                    adminName2: '',
                    adminName3: '',
                    adminCode1: '',
                    adminCode2: '',
                    adminCode3: '',
                    latitude: null,
                    longitude: null
                  }))
                  setHasChanges(true)
                }}
                className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors font-open-sans bg-bg-main text-text-main"
                disabled={loading}
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
            
              <PostalCodeAutocomplete
                value={formData.postalCode}
                countryCode={formData.countryCode}
                onChange={handlePostalCodeSelect}
                placeholder="Ingresa tu código postal..."
                className="w-full"
                disabled={loading}
                showCountrySelector={false}
              />
              
              {/* Indicador de ubicación seleccionada */}
              {formData.postalCode && formData.placeName && (
                <div className="mt-2 p-3 bg-bg-secondary border border-accent-primary/20 rounded-md">
                  <div className="flex items-center text-sm text-accent-primary">
                    <svg className="w-4 h-4 mr-2 text-accent-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold font-montserrat">Ubicación confirmada</span>
                  </div>
                  <div className="text-sm text-text-secondary mt-1 font-open-sans">
                    {formData.postalCode} - {formData.placeName || formData.city}
                    {formData.adminName1 && `, ${formData.adminName1}`}
                    {formData.country && `, ${formData.country}`}
                  </div>
                </div>
              )}
              
              {/* Indicador cuando solo hay código postal sin ubicación */}
              {formData.postalCode && !formData.placeName && (
                <div className="mt-2 p-3 bg-bg-secondary border border-accent-secondary/20 rounded-md">
                  <div className="flex items-center text-sm text-accent-secondary">
                    <svg className="w-4 h-4 mr-2 text-accent-secondary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold font-montserrat">Código postal no válido</span>
                  </div>
                  <div className="text-sm text-text-secondary mt-1 font-open-sans">
                    Por favor, selecciona un código postal de la lista de sugerencias
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información de padel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="skillLevel" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
                Nivel de Juego
              </label>
              <select
                id="skillLevel"
                name="skillLevel"
                value={formData.skillLevel}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors font-open-sans bg-bg-main text-text-main"
                disabled={loading}
              >
                <option value={1}>Principiante</option>
                <option value={2}>Intermedio</option>
                <option value={3}>Avanzado</option>
                <option value={4}>Profesional</option>
              </select>
            </div>

            <div>
              <label htmlFor="preferredPosition" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
                Posición Preferida
              </label>
              <select
                id="preferredPosition"
                name="preferredPosition"
                value={formData.preferredPosition}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors font-open-sans bg-bg-main text-text-main"
                disabled={loading}
              >
                <option value="">Selecciona tu posición preferida</option>
                <option value="left">Izquierda (Drive)</option>
                <option value="right">Derecha (Revés)</option>
                <option value="both">Ambas</option>
              </select>
            </div>
          </div>

          {/* Biografía */}
          <div>
            <label htmlFor="bio" className="block text-sm font-semibold text-text-main mb-2 font-open-sans">
              Biografía
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors font-open-sans resize-none bg-bg-main text-text-main"
              placeholder="Cuéntanos un poco sobre ti y tu experiencia en el padel..."
              disabled={loading}
            />
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading || !hasChanges}
              className="flex-1 bg-accent-primary text-bg-main py-3 px-4 rounded-md hover:bg-accent-primary/90 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold font-open-sans"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-bg-main" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </div>
              ) : (
                'Guardar Cambios'
              )}
            </button>

            {hasChanges && (
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="flex-1 sm:flex-none bg-bg-secondary text-text-main py-3 px-6 rounded-md border border-border hover:bg-bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-border focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold font-open-sans"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Información adicional */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="text-sm text-text-secondary font-open-sans">
            <p><strong>Fecha de registro:</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-ES') : 'No disponible'}</p>
            <p><strong>Última actualización:</strong> {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('es-ES') : 'No disponible'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}