'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import MatchCard from '@/components/dashboard/MatchCard'
import CreateMatchModal, { MatchFormData } from '@/components/dashboard/CreateMatchModal'

interface Match {
  id: string
  group_id: string
  creator_id: string | null
  scheduled_at: string
  location_name: string
  latitude: number | null
  longitude: number | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  is_public: boolean
  required_skill_level: number | null
  team1_score: number | null
  team2_score: number | null
  created_at: string
  groups: {
    name: string
  } | null
  profiles: {
    full_name: string
  } | null
  match_participants: Array<{
    user_id: string
    team_number: number | null
    status: string | null
    profiles: {
      full_name: string
    } | null
  }>
}

type FilterType = 'all' | 'my_matches' | 'available' | 'upcoming' | 'past'
type ViewType = 'list' | 'calendar'

export default function MatchesPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [view, setView] = useState<ViewType>('list')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true)
      
      if (!user?.id) {
        setMatches([])
        return
      }

      // Primero obtener los grupos donde el usuario es miembro
      const { data: userGroups, error: groupsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

      if (groupsError) {
        console.warn('Error fetching user groups:', groupsError)
        setMatches([])
        return
      }

      // Si el usuario no pertenece a ningún grupo, no mostrar partidos
      if (!userGroups || userGroups.length === 0) {
        setMatches([])
        return
      }

      const groupIds = userGroups.map(g => g.group_id)

      // Obtener solo los partidos de los grupos donde el usuario es miembro
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          groups (name),
          profiles!matches_creator_id_fkey (full_name)
        `)
        .in('group_id', groupIds)
        .order('scheduled_at', { ascending: true })

      if (error) {
        console.warn('Error fetching matches:', error)
        setMatches([])
        return
      }

      // Si hay partidos, obtener los participantes
      let matchesWithParticipants = data || []
      
      if (matchesWithParticipants.length > 0) {
        const matchIds = matchesWithParticipants.map(m => m.id)
        
        const { data: participants, error: participantsError } = await supabase
          .from('match_participants')
          .select(`
            match_id,
            user_id,
            team_number,
            status,
            profiles (full_name)
          `)
          .in('match_id', matchIds)

        if (participantsError) {
          console.warn('Error fetching match participants:', participantsError)
        }

        // Agrupar participantes por match_id
        const participantsByMatch = participants?.reduce((acc, participant) => {
          if (!acc[participant.match_id]) {
            acc[participant.match_id] = []
          }
          // Transformar el participante para que coincida con la estructura esperada
          const transformedParticipant = {
            ...participant,
            profiles: Array.isArray(participant.profiles) ? participant.profiles[0] : participant.profiles
          }
          acc[participant.match_id].push(transformedParticipant)
          return acc
        }, {} as Record<string, Array<{
          user_id: string
          match_id: string
          team_number: number | null
          status: string | null
          profiles: {
            full_name: string
          } | null
        }>>) || {}

        // Agregar participantes a los partidos
        matchesWithParticipants = matchesWithParticipants.map(match => ({
          ...match,
          match_participants: participantsByMatch[match.id] || []
        }))
      }

      setMatches(matchesWithParticipants)
    } catch (error) {
      console.error('Error fetching matches:', error)
      setMatches([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const applyFilters = useCallback(() => {
    let filtered = matches

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(match =>
        match.groups?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.location_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    const now = new Date()
    switch (filter) {
      case 'my_matches':
        filtered = filtered.filter(match =>
          match.creator_id === user?.id ||
          match.match_participants.some(p => p.user_id === user?.id && p.status === 'confirmed')
        )
        break
      case 'available':
        filtered = filtered.filter(match => {
          const isNotParticipant = !match.match_participants.some(p => p.user_id === user?.id)
          const isFuture = new Date(match.scheduled_at) > now
          return isNotParticipant && isFuture && match.status === 'scheduled'
        })
        break
      case 'upcoming':
        filtered = filtered.filter(match => new Date(match.scheduled_at) > now)
        break
      case 'past':
        filtered = filtered.filter(match => new Date(match.scheduled_at) <= now)
        break
      default:
        // 'all' - no additional filtering
        break
    }

    setFilteredMatches(filtered)
  }, [matches, filter, searchTerm, user])

  useEffect(() => {
    if (user) {
      fetchMatches()
    }
  }, [user, fetchMatches])

  useEffect(() => {
    applyFilters()
  }, [matches, filter, searchTerm, applyFilters])

  const handleCreateMatch = async (matchData: MatchFormData) => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .insert([{
          ...matchData,
          creator_id: user?.id,
          status: 'scheduled'
        }])
        .select()

      if (error) throw error

      // Add creator as participant
      if (data && data[0]) {
        await supabase
          .from('match_participants')
          .insert([{
            match_id: data[0].id,
            user_id: user?.id,
            team_number: 1,
            status: 'confirmed'
          }])
      }

      // Refresh matches
      await fetchMatches()
    } catch (error) {
      console.error('Error creating match:', error)
      throw error
    }
  }

  const handleJoinMatch = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from('match_participants')
        .insert([{
          match_id: matchId,
          user_id: user?.id,
          team_number: null,
          status: 'confirmed'
        }])

      if (error) throw error

      await fetchMatches()
    } catch (error) {
      console.error('Error joining match:', error)
    }
  }

  const handleLeaveMatch = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from('match_participants')
        .delete()
        .eq('match_id', matchId)
        .eq('user_id', user?.id)

      if (error) throw error

      await fetchMatches()
    } catch (error) {
      console.error('Error leaving match:', error)
    }
  }

  const handleCancelMatch = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: 'cancelled' })
        .eq('id', matchId)

      if (error) throw error

      await fetchMatches()
    } catch (error) {
      console.error('Error cancelling match:', error)
    }
  }

  const getUserStatus = (match: Match): 'creator' | 'participant' | 'not_participant' => {
    if (match.creator_id === user?.id) return 'creator'
    if (match.match_participants.some(p => p.user_id === user?.id && p.status === 'confirmed')) {
      return 'participant'
    }
    return 'not_participant'
  }

  const getFilterCounts = () => {
    const now = new Date()
    return {
      all: matches.length,
      my_matches: matches.filter(match =>
        match.creator_id === user?.id ||
        match.match_participants.some(p => p.user_id === user?.id && p.status === 'confirmed')
      ).length,
      available: matches.filter(match => {
        const isNotParticipant = !match.match_participants.some(p => p.user_id === user?.id)
        const isFuture = new Date(match.scheduled_at) > now
        return isNotParticipant && isFuture && match.status === 'scheduled'
      }).length,
      upcoming: matches.filter(match => new Date(match.scheduled_at) > now).length,
      past: matches.filter(match => new Date(match.scheduled_at) <= now).length
    }
  }

  const counts = getFilterCounts()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-bg-secondary rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-bg-secondary rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-main p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-main font-montserrat mb-2">
              Gestión de Partidos
            </h1>
            <p className="text-text-secondary font-open-sans">
              Organiza y participa en partidos de pádel
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 sm:mt-0 bg-accent-primary text-bg-main px-6 py-3 rounded-lg hover:bg-accent-primary/90 transition-colors font-open-sans font-medium shadow-lg"
          >
            + Crear Partido
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-bg-secondary border border-border rounded-lg p-6 mb-8">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar partidos por título, descripción, grupo o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-bg-main text-text-main font-open-sans"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'all', label: 'Todos', count: counts.all },
              { key: 'my_matches', label: 'Mis Partidos', count: counts.my_matches },
              { key: 'available', label: 'Disponibles', count: counts.available },
              { key: 'upcoming', label: 'Próximos', count: counts.upcoming },
              { key: 'past', label: 'Pasados', count: counts.past }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as FilterType)}
                className={`px-4 py-2 rounded-lg font-open-sans font-medium transition-colors ${
                  filter === key
                    ? 'bg-accent-primary text-bg-main'
                    : 'bg-bg-main text-text-secondary hover:text-text-main border border-border'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg font-open-sans font-medium transition-colors ${
                view === 'list'
                  ? 'bg-accent-primary text-bg-main'
                  : 'bg-bg-main text-text-secondary hover:text-text-main border border-border'
              }`}
            >
              <svg className="h-5 w-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Lista
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-lg font-open-sans font-medium transition-colors ${
                view === 'calendar'
                  ? 'bg-accent-primary text-bg-main'
                  : 'bg-bg-main text-text-secondary hover:text-text-main border border-border'
              }`}
            >
              <svg className="h-5 w-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendario
            </button>
          </div>
        </div>

        {/* Content */}
        {view === 'list' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMatches.length > 0 ? (
              filteredMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={{
                    id: match.id,
                    scheduled_at: match.scheduled_at,
                    location_name: match.location_name,
                    latitude: match.latitude,
                    longitude: match.longitude,
                    is_public: match.is_public,
                    required_skill_level: match.required_skill_level?.toString() || null,
                    team1_score: match.team1_score,
                    team2_score: match.team2_score,
                    status: match.status,
                    current_participants: match.match_participants.filter(p => p.status === 'confirmed').length,
                    group_name: match.groups?.name || 'Sin grupo',
                    creator_name: match.profiles?.full_name || 'Creador desconocido',
                    user_status: getUserStatus(match)
                  }}
                  onJoin={() => handleJoinMatch(match.id)}
                  onLeave={() => handleLeaveMatch(match.id)}
                  onCancel={() => handleCancelMatch(match.id)}
                  isCreator={match.creator_id === user?.id}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <svg className="h-16 w-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-medium text-text-main font-montserrat mb-2">
                  No hay partidos
                </h3>
                <p className="text-text-secondary font-open-sans mb-4">
                  {filter === 'available' 
                    ? 'No hay partidos disponibles para unirse en este momento.'
                    : filter === 'my_matches'
                    ? 'No tienes partidos organizados o confirmados.'
                    : 'No se encontraron partidos con los filtros seleccionados.'
                  }
                </p>
                {filter !== 'my_matches' && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-accent-primary text-bg-main px-6 py-2 rounded-lg hover:bg-accent-primary/90 transition-colors font-open-sans"
                  >
                    Crear Primer Partido
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-bg-secondary border border-border rounded-lg p-8 text-center">
            <svg className="h-16 w-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-text-main font-montserrat mb-2">
              Vista de Calendario
            </h3>
            <p className="text-text-secondary font-open-sans">
              La vista de calendario estará disponible próximamente.
            </p>
          </div>
        )}
      </div>

      {/* Create Match Modal */}
      <CreateMatchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateMatch}
        userId={user?.id || ''}
      />
    </div>
  )
}