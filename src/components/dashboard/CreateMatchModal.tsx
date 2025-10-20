'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import LocationAutocomplete from '@/components/ui/LocationAutocomplete'
import LocationInfoCard from '@/components/ui/LocationInfoCard'
import { Location, locationService } from '@/lib/locationService'
import { SportsLocationResult } from '@/lib/sportsLocationService'
import { 
  getUserTimezone, 
  validateMatchDateTime, 
  prepareMatchDataForStorage,
  getCurrentDateTimeInTimezone,
  getTimezoneName 
} from '@/lib/utils/timezoneUtils'

interface CreateMatchModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (matchData: MatchFormData) => Promise<void>
  userId: string
}

export interface MatchFormData {
  group_id: string
  date: string
  time: string
  location_name: string
  latitude?: number | null
  longitude?: number | null
  sports_location_id?: string | null
  is_public: boolean
  required_skill_level?: number | null
}

interface MatchFormErrors {
  group_id?: string
  date?: string
  time?: string
  location_name?: string
  required_skill_level?: string
}

interface Group {
  id: string
  name: string
  city?: string | null
  country_code?: string | null
  postal_code?: string | null
  place_name?: string | null
  admin_name1?: string | null
  admin_name2?: string | null
  admin_name3?: string | null
  latitude?: number | null
  longitude?: number | null
}

interface GroupMemberWithGroups {
  groups: Group[] | null
}

export default function CreateMatchModal({ isOpen, onClose, onSubmit, userId }: CreateMatchModalProps) {
  // Get user timezone and initialize form with current date/time
  const userTimezone = getUserTimezone()
  const currentDateTime = getCurrentDateTimeInTimezone(userTimezone)
  
  const [formData, setFormData] = useState<MatchFormData>({
    group_id: '',
    date: currentDateTime.date,
    time: currentDateTime.time,
    location_name: '',
    latitude: null,
    longitude: null,
    sports_location_id: null,
    is_public: true,
    required_skill_level: null
  })
  const [userGroups, setUserGroups] = useState<Group[]>([])
  const [selectedGroupCountry, setSelectedGroupCountry] = useState<string>('')
  const [selectedGroupPostalCode, setSelectedGroupPostalCode] = useState<string>('')
  const [selectedLocation, setSelectedLocation] = useState<SportsLocationResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<MatchFormErrors>({})

  const fetchUserGroups = useCallback(async () => {
    try {
      const { data, error } = await supabase
          .from('group_members')
          .select(`
            groups (
              id,
              name,
              city,
              country_code,
              postal_code,
              place_name,
              admin_name1,
              admin_name2,
              admin_name3,
              latitude,
              longitude
            )
          `)
          .eq('user_id', userId)

      if (error) throw error

      const groups: Group[] = data
        ?.flatMap((item: GroupMemberWithGroups) => item.groups || [])
        .filter((group): group is Group => group !== null) || [];

      setUserGroups(groups)
    } catch (error) {
      console.error('Error fetching user groups:', error)
    }
  }, [userId])

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserGroups()
    }
  }, [isOpen, userId, fetchUserGroups])

  // Efecto para obtener el país y código postal del grupo seleccionado
  useEffect(() => {
    const getGroupInfo = async () => {
      if (!formData.group_id) {
        setSelectedGroupCountry('')
        setSelectedGroupPostalCode('')
        return
      }

      const selectedGroup = userGroups.find(group => group.id === formData.group_id)
      if (selectedGroup) {
        // Establecer país
        if (selectedGroup.country_code) {
          setSelectedGroupCountry(selectedGroup.country_code)
        } else if (selectedGroup.city) {
          // Fallback: obtener país por ciudad si no hay country_code
          try {
            const countryCode = await locationService.getCountryCodeByCity(selectedGroup.city)
            setSelectedGroupCountry(countryCode || '')
          } catch (error) {
            console.error('Error obteniendo país del grupo:', error)
            setSelectedGroupCountry('')
          }
        } else {
          setSelectedGroupCountry('')
        }

        // Establecer código postal
        setSelectedGroupPostalCode(selectedGroup.postal_code || '')

        // NUEVA FUNCIONALIDAD: Cargar automáticamente la ubicación del grupo
        if (selectedGroup.city) {
          // Usar city (comunidad autónoma) para búsquedas más específicas en Google Places API
          const communityLocation = selectedGroup.city // ej: "Comunidad Valenciana"
          
          // Construir ubicación usando la comunidad autónoma para mejor filtrado en las búsquedas
          let searchLocation = communityLocation
          
          if (selectedGroup.country_code) {
            // Agregar país para mayor especificidad en las búsquedas
            searchLocation = `${communityLocation}, ${selectedGroup.country_code === 'ES' ? 'España' : selectedGroup.country_code}`
          }

          // NO actualizar automáticamente el campo de búsqueda - dejar que el usuario busque manualmente
          // El campo informativo ya muestra la comunidad autónoma del grupo
        }
      } else {
        setSelectedGroupCountry('')
        setSelectedGroupPostalCode('')
      }
    }

    getGroupInfo()
  }, [formData.group_id, userGroups])

  const validateForm = (): boolean => {
    const newErrors: MatchFormErrors = {}

    if (!formData.group_id) {
      newErrors.group_id = 'Selecciona un grupo'
    }

    // Validate date and time using timezone utilities
    const dateTimeValidation = validateMatchDateTime(formData.date, formData.time, userTimezone)
    if (!dateTimeValidation.isValid) {
      if (dateTimeValidation.error?.includes('fecha')) {
        newErrors.date = dateTimeValidation.error
      } else {
        newErrors.time = dateTimeValidation.error
      }
    }

    if (!formData.location_name.trim()) {
      newErrors.location_name = 'Ingresa una ubicación'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      // Prepare match data with timezone conversion
      const matchDataForStorage = prepareMatchDataForStorage(
        formData.date,
        formData.time,
        userTimezone
      )

      const submitData = {
        group_id: formData.group_id,
        scheduled_at: matchDataForStorage.scheduled_at,
        timezone: matchDataForStorage.timezone,
        location_name: formData.location_name.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        sports_location_id: formData.sports_location_id,
        is_public: formData.is_public,
        required_skill_level: formData.required_skill_level
      }

      await onSubmit(submitData)
      
      // Reset form
      const newCurrentDateTime = getCurrentDateTimeInTimezone(userTimezone)
      setFormData({
        group_id: '',
        date: newCurrentDateTime.date,
        time: newCurrentDateTime.time,
        location_name: '',
        latitude: null,
        longitude: null,
        sports_location_id: null,
        is_public: true,
        required_skill_level: null
      })
      setSelectedLocation(null)
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Error creating match:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLocationSelect = (location: SportsLocationResult | null) => {
    if (location) {
      setFormData(prev => ({
        ...prev,
        location_name: location.name,
        latitude: location.latitude || null,
        longitude: location.longitude || null,
        sports_location_id: location.source === 'local' ? location.id : null
      }))
      setSelectedLocation(location)
      // Clear location error if it exists
      if (errors.location_name) {
        setErrors(prev => ({ ...prev, location_name: undefined }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        location_name: '',
        latitude: null,
        longitude: null,
        sports_location_id: null
      }))
      setSelectedLocation(null)
    }
  }

  const handleInputChange = <K extends keyof MatchFormData>(field: K, value: MatchFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (field in errors && errors[field as keyof MatchFormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const now = new Date()
    return now.toISOString().slice(0, 16)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-main rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text-main font-montserrat">
            Crear Nuevo Partido
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-main transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Timezone info header */}
          <div className="bg-accent-primary/5 border border-accent-primary/20 rounded-lg p-3 mb-4">
            <div className="flex items-center text-sm text-text-main font-open-sans">
              <Clock className="h-4 w-4 mr-2 text-accent-primary" />
              <span>Zona horaria: {getTimezoneName(userTimezone)}</span>
            </div>
          </div>

          {/* Group */}
          <div>
            <label className="block text-sm font-medium text-text-main font-open-sans mb-2">
              Grupo *
            </label>
            <select
              value={formData.group_id}
              onChange={(e) => handleInputChange('group_id', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-bg-main text-text-main font-open-sans"
            >
              <option value="">Selecciona un grupo</option>
              {userGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            {errors.group_id && (
              <p className="text-error text-sm mt-1 font-open-sans">{errors.group_id}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-text-main font-open-sans mb-2">
                Fecha *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-bg-main text-text-main font-open-sans"
              />
              {errors.date && (
                <p className="text-error text-sm mt-1 font-open-sans">{errors.date}</p>
              )}
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-text-main font-open-sans mb-2">
                Hora *
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-bg-main text-text-main font-open-sans"
              />
              {errors.time && (
                <p className="text-error text-sm mt-1 font-open-sans">{errors.time}</p>
              )}
            </div>
          </div>

          {/* Location Search */}
          <div>
            <label className="block text-sm font-medium text-text-main font-open-sans mb-2">
              Ubicación del Club/Pista *
            </label>
            
            {/* Información del grupo seleccionado */}
            {formData.group_id ? (
              <div className="mb-3 p-3 bg-accent-primary/5 border border-accent-primary/20 rounded-lg">
                <div className="flex items-center text-sm text-text-main font-open-sans">
                  <svg className="h-4 w-4 mr-2 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">Búsqueda en: </span>
                  <span className="ml-1">
                    {(() => {
                       const selectedGroup = userGroups.find(g => g.id === formData.group_id)
                       if (selectedGroup) {
                         // Mostrar la localidad real del grupo (place_name → admin_name3 → city)
                         const locality = selectedGroup.place_name || selectedGroup.admin_name3 || selectedGroup.city
                         const country = selectedGroup.country_code === 'ES' ? 'España' : selectedGroup.country_code
                         return locality ? `${locality}, ${country}` : 'Información no disponible'
                       }
                       return 'Información no disponible'
                     })()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mb-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <div className="flex items-center text-sm text-warning font-open-sans">
                  <svg className="h-4 w-4 mr-2 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>Selecciona un grupo primero para habilitar la búsqueda de ubicación</span>
                </div>
              </div>
            )}

            <LocationAutocomplete
              value={formData.location_name}
              onChange={handleLocationSelect}
              placeholder={formData.group_id ? "Buscar club, centro deportivo o dirección..." : "Selecciona un grupo primero"}
              className="w-full"
              showCountryFlags={true}
              countryFilter={selectedGroupCountry || undefined}
              groupLocationInfo={(() => {
                if (!selectedGroup) return undefined
                return {
                  city: selectedGroup.place_name || selectedGroup.admin_name3 || undefined,
                  region: selectedGroup.admin_name2 || selectedGroup.admin_name1 || undefined,
                  coordinates: selectedGroup.latitude && selectedGroup.longitude
                    ? { lat: selectedGroup.latitude, lng: selectedGroup.longitude }
                    : undefined
                }
              })()}
              disabled={!formData.group_id}
            />
            {errors.location_name && (
              <p className="text-error text-sm mt-1 font-open-sans">{errors.location_name}</p>
            )}

            {/* Mostrar información detallada de la ubicación seleccionada */}
            {selectedLocation && (
              <div className="mt-3">
                <LocationInfoCard
                  location={selectedLocation}
                  onClose={() => setSelectedLocation(null)}
                  showMap={true}
                />
              </div>
            )}
          </div>

          {/* Public/Private */}
          <div>
            <label className="block text-sm font-medium text-text-main font-open-sans mb-3">
              Visibilidad
            </label>
            <div className="flex space-x-6">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="radio"
                    name="is_public"
                    checked={formData.is_public}
                    onChange={() => handleInputChange('is_public', true)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                    formData.is_public 
                      ? 'border-accent-primary bg-accent-primary' 
                      : 'border-border bg-bg-main hover:border-accent-primary/50'
                  }`}>
                    {formData.is_public && (
                      <div className="w-2 h-2 bg-bg-main rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    )}
                  </div>
                </div>
                <span className="ml-3 text-text-main font-open-sans">Público</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="radio"
                    name="is_public"
                    checked={!formData.is_public}
                    onChange={() => handleInputChange('is_public', false)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                    !formData.is_public 
                      ? 'border-accent-primary bg-accent-primary' 
                      : 'border-border bg-bg-main hover:border-accent-primary/50'
                  }`}>
                    {!formData.is_public && (
                      <div className="w-2 h-2 bg-bg-main rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    )}
                  </div>
                </div>
                <span className="ml-3 text-text-main font-open-sans">Privado</span>
              </label>
            </div>
          </div>

          {/* Required Skill Level */}
          <div>
            <label className="block text-sm font-medium text-text-main font-open-sans mb-2">
              Nivel Requerido (1-4)
            </label>
            <input
              type="number"
              min="1"
              max="4"
              value={formData.required_skill_level || ''}
              onChange={(e) => handleInputChange('required_skill_level', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-bg-main text-text-main font-open-sans"
              placeholder="Opcional"
            />
            {errors.required_skill_level && (
              <p className="text-error text-sm mt-1 font-open-sans">{errors.required_skill_level}</p>
            )}
          </div>
          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border text-text-secondary rounded-lg hover:bg-bg-secondary transition-colors font-open-sans"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || userGroups.length === 0}
              className="flex-1 px-4 py-2 bg-accent-primary text-bg-main rounded-lg hover:bg-accent-primary/90 transition-colors font-open-sans disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creando...' : 'Crear Partido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}