'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import LocationAutocomplete from '@/components/ui/LocationAutocomplete'
import LocationInfoCard from '@/components/ui/LocationInfoCard'
import { locationService } from '@/lib/locationService'
import { SportsLocationResult } from '@/lib/sportsLocationService'
import { Clock, Users, UserPlus } from 'lucide-react'
import { 
  getUserTimezone, 
  validateMatchDateTime, 
  prepareMatchDataForStorage,
  getCurrentDateTimeInTimezone,
  getTimezoneName 
} from '@/lib/utils/timezoneUtils'
import { getGroupMembersForInvitation, sendMatchInvitations, GroupMemberForInvitation } from '@/lib/matchInvitations'

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
  invited_members?: string[]
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

export default function CreateMatchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  
  // Get user timezone
  const [userTimezone] = useState(() => getUserTimezone())
  
  // Get groupId from URL parameters
  const groupIdFromUrl = searchParams.get('groupId')
  
  // Initialize form with current date/time in user's timezone
  const [formData, setFormData] = useState<MatchFormData>(() => {
    const { date, time } = getCurrentDateTimeInTimezone(userTimezone)
    return {
      group_id: groupIdFromUrl || '',
      date,
      time,
      location_name: '',
      latitude: null,
      longitude: null,
      sports_location_id: null,
      is_public: true,
      required_skill_level: null,
      invited_members: []
    }
  })
  const [userGroups, setUserGroups] = useState<Group[]>([])
  const [selectedGroupCountry, setSelectedGroupCountry] = useState<string>('')
  const [selectedGroupPostalCode, setSelectedGroupPostalCode] = useState<string>('')
  const [selectedGroupData, setSelectedGroupData] = useState<Group | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<SportsLocationResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<MatchFormErrors>({})
  const [groupMembers, setGroupMembers] = useState<GroupMemberForInvitation[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  const fetchUserGroups = useCallback(async () => {
    if (!user?.id) return
    
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
          .eq('user_id', user.id)

      if (error) throw error

      const groups: Group[] = data
        ?.flatMap((item: GroupMemberWithGroups) => item.groups || [])
        .filter((group): group is Group => group !== null) || [];

      setUserGroups(groups)
    } catch (error) {
      console.error('Error fetching user groups:', error)
      showToast('Error al cargar los grupos', 'error')
    }
  }, [user?.id, showToast])

  useEffect(() => {
    if (user?.id) {
      fetchUserGroups()
    }
  }, [user?.id, fetchUserGroups])

  // Efecto para obtener el país y código postal del grupo seleccionado
  useEffect(() => {
    const getGroupInfo = async () => {
      if (!formData.group_id) {
        setSelectedGroupCountry('')
        setSelectedGroupPostalCode('')
        setSelectedGroupData(null)
        setGroupMembers([])
        return
      }

      const selectedGroup = userGroups.find(group => group.id === formData.group_id)
      if (selectedGroup) {
        // Guardar los datos completos del grupo seleccionado
        setSelectedGroupData(selectedGroup)
        
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

        // Cargar miembros del grupo para invitaciones
        if (user?.id) {
          setLoadingMembers(true)
          try {
            const members = await getGroupMembersForInvitation(selectedGroup.id, user.id)
            setGroupMembers(members)
          } catch (error) {
            console.error('Error loading group members:', error)
            setGroupMembers([])
          } finally {
            setLoadingMembers(false)
          }
        }
      } else {
        setSelectedGroupCountry('')
        setSelectedGroupPostalCode('')
        setSelectedGroupData(null)
        setGroupMembers([])
      }
    }

    getGroupInfo()
  }, [formData.group_id, userGroups, user?.id])

  const handleLocationSelect = (location: SportsLocationResult | null) => {
    if (location) {
      setFormData(prev => ({
        ...prev,
        location_name: location.name,
        latitude: location.latitude || null,
        longitude: location.longitude || null,
        sports_location_id: location.id || null
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

  const validateForm = (): boolean => {
    const newErrors: MatchFormErrors = {}

    if (!formData.group_id) {
      newErrors.group_id = 'Debes seleccionar un grupo'
    }

    if (!formData.date) {
      newErrors.date = 'La fecha es obligatoria'
    }

    if (!formData.time) {
      newErrors.time = 'La hora es obligatoria'
    }

    // Validate date/time is not in the past
    if (formData.date && formData.time) {
      const validation = validateMatchDateTime(formData.date, formData.time, userTimezone)
      if (!validation.isValid) {
        newErrors.date = validation.error
      }
    }

    if (!formData.location_name?.trim()) {
      newErrors.location_name = 'La ubicación es obligatoria'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Convert local date/time to UTC for storage
      const { scheduled_at, timezone } = prepareMatchDataForStorage(
        formData.date,
        formData.time,
        userTimezone
      )

      // Insert match and return inserted row to get its id
      const { data: insertedMatch, error: insertError } = await supabase
        .from('matches')
        .insert([{
          group_id: formData.group_id,
          scheduled_at: scheduled_at,
          timezone: timezone,
          location_name: formData.location_name,
          latitude: formData.latitude,
          longitude: formData.longitude,
          sports_location_id: formData.sports_location_id,
          is_public: formData.is_public,
          required_skill_level: formData.required_skill_level,
          creator_id: user?.id
        }])
        .select('*')
        .single()

      if (insertError) throw insertError

      // Auto-join creator as confirmed participant
      if (insertedMatch?.id && user?.id) {
        const { error: participantError } = await supabase
          .from('match_participants')
          .insert({
            match_id: insertedMatch.id,
            user_id: user.id,
            team_number: null,
            status: 'confirmed'
          })

        if (participantError) {
          console.warn('Warning: could not auto-join creator:', participantError)
        }

        // Send invitations if it's a private match and members were selected
        if (!formData.is_public && formData.invited_members && formData.invited_members.length > 0) {
          try {
            await sendMatchInvitations(insertedMatch.id, user.id, formData.invited_members)
            showToast(`Partido creado e invitaciones enviadas a ${formData.invited_members.length} miembro(s)`, 'success')
          } catch (invitationError) {
            console.error('Error sending invitations:', invitationError)
            showToast('Partido creado, pero hubo un error enviando las invitaciones', 'warning')
          }
        } else {
          showToast('Partido creado exitosamente', 'success')
        }
      }
      
      // Reset form with new default date/time
      const { date, time } = getCurrentDateTimeInTimezone(userTimezone)
      setFormData({
        group_id: '',
        date,
        time,
        location_name: '',
        latitude: null,
        longitude: null,
        sports_location_id: null,
        is_public: true,
        required_skill_level: null,
        invited_members: []
      })
      setSelectedLocation(null)
      
      // Redirect to matches dashboard
      router.push('/dashboard/matches')
      
    } catch (error) {
      console.error('Error creating match:', error)
      showToast('Error al crear el partido', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoBack = () => {
    router.push('/dashboard/matches')
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 text-text-secondary hover:text-text-main transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-text-main font-montserrat">
                Crear Nuevo Partido
              </h1>
              <p className="text-text-secondary font-open-sans mt-1 text-sm">
                Organiza un partido de pádel con tu grupo
              </p>
              {/* Timezone info */}
              <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                <Clock className="h-3 w-3" />
                <span className="font-open-sans">
                  Zona horaria: {getTimezoneName(userTimezone)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-bg-main rounded-lg shadow-lg p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Group Selection */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5 font-open-sans">
                Grupo *
              </label>
              <select
                value={formData.group_id}
                onChange={(e) => setFormData(prev => ({ ...prev, group_id: e.target.value }))}
                className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary hover:border-accent-primary/50 transition-colors font-open-sans"
              >
                <option value="">Selecciona un grupo</option>
                {userGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} {group.city && `- ${group.city}`}
                  </option>
                ))}
              </select>
              {errors.group_id && (
                <p className="text-red-500 text-sm mt-1 font-open-sans">
                  {errors.group_id}
                </p>
              )}
            </div>

            {/* Date and Time - Separated inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5 font-open-sans">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary hover:border-accent-primary/50 transition-colors font-open-sans"
                />
                {errors.date && (
                  <p className="text-red-500 text-sm mt-1 font-open-sans">
                    {errors.date}
                  </p>
                )}
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5 font-open-sans">
                  Hora *
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary hover:border-accent-primary/50 transition-colors font-open-sans"
                />
                {errors.time && (
                  <p className="text-red-500 text-sm mt-1 font-open-sans">
                    {errors.time}
                  </p>
                )}
              </div>
            </div>

            {/* Timezone info display */}
            {formData.date && formData.time && (
              <div className="bg-accent-primary/10 border border-accent-primary/20 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 text-accent-primary">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium font-open-sans">
                    El partido se creará en tu zona horaria local: España (Madrid)
                  </span>
                </div>
                <p className="text-text-secondary mt-1 font-open-sans">
                  Los demás jugadores verán la hora convertida a su zona horaria local.
                </p>
              </div>
            )}

            {/* Location Search */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5 font-open-sans">
                Ubicación del Club/Pista *
              </label>
              <LocationAutocomplete
                onLocationSelect={handleLocationSelect}
                placeholder={
                  !formData.group_id 
                    ? "Primero selecciona un grupo..." 
                    : "Buscar club, centro deportivo o dirección..."
                }
                countryFilter={selectedGroupCountry}
                groupLocationInfo={(() => {
                  if (!selectedGroupData) return undefined
                  
                  return {
                    city: selectedGroupData.place_name || selectedGroupData.admin_name3 || undefined,
                    region: selectedGroupData.admin_name2 || selectedGroupData.admin_name1 || undefined,
                    coordinates: selectedGroupData.latitude && selectedGroupData.longitude 
                      ? { lat: selectedGroupData.latitude, lng: selectedGroupData.longitude }
                      : undefined
                  }
                })()}
                disabled={!formData.group_id}
              />
              {errors.location_name && (
                <p className="text-red-500 text-sm mt-1 font-open-sans">
                  {errors.location_name}
                </p>
              )}
              {!formData.group_id && (
                <p className="text-text-secondary text-sm mt-1 font-open-sans">
                  Selecciona un grupo para habilitar la búsqueda de ubicaciones
                </p>
              )}
            </div>

            {/* Location Info Card */}
            {selectedLocation && (
              <LocationInfoCard location={selectedLocation} />
            )}

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5 font-open-sans">
                Visibilidad
              </label>
              <select
                value={formData.is_public ? 'public' : 'private'}
                onChange={(e) => {
                  const isPublic = e.target.value === 'public'
                  setFormData(prev => ({ 
                    ...prev, 
                    is_public: isPublic,
                    invited_members: isPublic ? [] : prev.invited_members
                  }))
                }}
                className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary hover:border-accent-primary/50 transition-colors font-open-sans"
              >
                <option value="public">Público (todos los miembros del grupo pueden unirse)</option>
                <option value="private">Privado (solo por invitación)</option>
              </select>
              <p className="text-text-secondary text-sm mt-1 font-open-sans">
                {formData.is_public 
                  ? "Todos los miembros del grupo podrán ver y unirse al partido automáticamente."
                  : "Solo los miembros invitados podrán ver y unirse al partido."
                }
              </p>
            </div>

            {/* Member Invitations - Only show for private matches */}
            {!formData.is_public && formData.group_id && (
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5 font-open-sans">
                  <UserPlus className="inline w-4 h-4 mr-1" />
                  Invitar Miembros
                </label>
                
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-4 bg-bg-secondary border border-border rounded-lg">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent-primary mr-2"></div>
                    <span className="text-text-secondary text-sm font-open-sans">Cargando miembros...</span>
                  </div>
                ) : groupMembers.length === 0 ? (
                  <div className="flex items-center justify-center py-4 bg-bg-secondary border border-border rounded-lg">
                    <Users className="w-5 h-5 text-text-secondary mr-2" />
                    <span className="text-text-secondary text-sm font-open-sans">No hay otros miembros en este grupo</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto bg-bg-secondary border border-border rounded-lg p-3">
                    {groupMembers.map((member) => {
                      const fullName = member.profiles 
                        ? [member.profiles.first_name, member.profiles.last_name].filter(Boolean).join(' ') || 'Usuario sin nombre'
                        : 'Usuario sin nombre'
                      
                      const isSelected = formData.invited_members?.includes(member.user_id) || false
                      
                      return (
                        <label key={member.user_id} className="flex items-center space-x-3 p-2 hover:bg-bg-primary rounded-lg cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const userId = member.user_id
                              setFormData(prev => ({
                                ...prev,
                                invited_members: e.target.checked
                                  ? [...(prev.invited_members || []), userId]
                                  : (prev.invited_members || []).filter(id => id !== userId)
                              }))
                            }}
                            className="w-4 h-4 text-accent-primary bg-bg-primary border-border rounded focus:ring-accent-primary focus:ring-2"
                          />
                          <div className="flex items-center space-x-2 flex-1">
                            {member.profiles?.avatar_url ? (
                              <img
                                src={member.profiles.avatar_url}
                                alt={fullName}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-accent-primary/20 flex items-center justify-center">
                                <span className="text-xs font-medium text-accent-primary">
                                  {fullName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-text-main text-sm font-open-sans">{fullName}</span>
                            {member.profiles?.skill_level && (
                              <span className="text-xs text-text-secondary">
                                {'⭐'.repeat(member.profiles.skill_level)}
                              </span>
                            )}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
                
                {formData.invited_members && formData.invited_members.length > 0 && (
                  <p className="text-text-secondary text-sm mt-1 font-open-sans">
                    {formData.invited_members.length} miembro(s) seleccionado(s) para invitar
                  </p>
                )}
              </div>
            )}

            {/* Required Skill Level */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5 font-open-sans">
                Nivel de Habilidad Requerido
              </label>
              <select
                value={formData.required_skill_level || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  required_skill_level: e.target.value ? parseInt(e.target.value) : null 
                }))}
                className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary hover:border-accent-primary/50 transition-colors font-open-sans"
              >
                <option value="">Sin restricción de nivel</option>
                <option value="1">⭐ Principiante</option>
                <option value="2">⭐⭐ Intermedio Bajo</option>
                <option value="3">⭐⭐⭐ Intermedio</option>
                <option value="4">⭐⭐⭐⭐ Intermedio Alto</option>
                <option value="5">⭐⭐⭐⭐⭐ Avanzado</option>
              </select>
              {errors.required_skill_level && (
                <p className="text-red-500 text-sm mt-1 font-open-sans">
                  {errors.required_skill_level}
                </p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2.5 bg-bg-secondary border border-border text-text-main rounded-lg hover:bg-bg-secondary/80 transition-colors font-open-sans font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-accent-primary text-black rounded-lg hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-open-sans font-medium"
              >
                {isSubmitting ? 'Creando...' : 'Crear Partido'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}