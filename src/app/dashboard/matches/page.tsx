'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Tables, Enums } from '@/lib/types/supabase'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import MatchCard from '@/components/dashboard/MatchCard'
import InvitationNotifications from '@/components/dashboard/InvitationNotifications'

type MatchStatus = Enums<'match_status'>
type ParticipantStatus = Enums<'participant_status'>

interface MatchParticipant extends Tables<'match_participants'> {
  profiles: Tables<'profiles'> | null
}

interface Match extends Tables<'matches'> {
  groups: Tables<'groups'> | null
  profiles: Tables<'profiles'> | null
  match_participants: MatchParticipant[]
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
  const [searchTerm, setSearchTerm] = useState('')
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalMatches, setTotalMatches] = useState(0)
  const [paginatedMatches, setPaginatedMatches] = useState<Match[]>([])
  const matchesPerPage = 10

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true)
      
      if (!user?.id) {
        setMatches([])
        setTotalMatches(0)
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
        setTotalMatches(0)
        return
      }

      // Si el usuario no pertenece a ningún grupo, no mostrar partidos
      if (!userGroups || userGroups.length === 0) {
        setMatches([])
        setTotalMatches(0)
        return
      }

      const groupIds = userGroups.map(g => g.group_id)

      // Calcular offset para la paginación
      const offset = (currentPage - 1) * matchesPerPage

      // Obtener los partidos de la página actual y el conteo total en una sola consulta
      const { data, error, count } = await supabase
        .from('matches')
        .select(`
          *,
          groups (*),
          profiles!matches_creator_id_fkey (
            first_name,
            last_name
          ),
          match_participants (
            *,
            profiles (*)
          )
        `, { count: 'exact' })
        .in('group_id', groupIds)
        .neq('status', 'canceled')
        .order('scheduled_at', { ascending: false })
        .range(offset, offset + matchesPerPage - 1)

      if (error) {
        console.warn('Error fetching matches:', error)
        setMatches([])
        setTotalMatches(0)
        return
      }

      // Establecer el conteo total
      setTotalMatches(count || 0)

      // Cambiar automáticamente el estado de partidos pasados
      const now = new Date()
      const matchesToUpdate = data?.filter(match => 
        match.status === 'scheduled' && 
        new Date(match.scheduled_at) < now
      ) || []

      if (matchesToUpdate.length > 0) {
        const updatePromises = matchesToUpdate.map(match =>
          supabase
            .from('matches')
            .update({ status: 'completed' })
            .eq('id', match.id)
        )

        try {
          await Promise.all(updatePromises)
          // Actualizar los datos localmente
          data?.forEach(match => {
            if (match.status === 'scheduled' && new Date(match.scheduled_at) < now) {
              match.status = 'completed'
            }
          })
        } catch (updateError) {
          console.warn('Error updating match statuses:', updateError)
        }
      }

      // Si hay partidos, obtener los participantes
      let matchesWithParticipants: Match[] = data || []
      
      if (matchesWithParticipants.length > 0) {
        const matchIds = matchesWithParticipants.map(m => m.id)
        
        const { data: participants, error: participantsError } = await supabase
          .from('match_participants')
          .select(`
            *,
            profiles (*)
          `)
          .in('match_id', matchIds);

        if (participantsError) {
          console.warn('Error fetching match participants:', participantsError)
        }

        // Agrupar participantes por match_id
        const participantsByMatch = participants?.reduce((acc, p) => {
          if (!p.match_id) return acc;
          if (!acc[p.match_id]) {
            acc[p.match_id] = [];
          }
          acc[p.match_id].push(p as MatchParticipant);
          return acc;
        }, {} as Record<string, MatchParticipant[]>) || {};

        // Agregar participantes a los partidos
        matchesWithParticipants = data.map(match => ({
          ...match,
          match_participants: participantsByMatch[match.id] || []
        }));

        // Cambiar automáticamente el estado de partidos con 4+ participantes confirmados
        const matchesToConfirm = matchesWithParticipants.filter(match => {
          const confirmedParticipants = match.match_participants.filter(p => p.status === 'confirmed').length
          return match.status === 'scheduled' && confirmedParticipants >= 4 && new Date(match.scheduled_at) > now
        })

        if (matchesToConfirm.length > 0) {
          const confirmPromises = matchesToConfirm.map(match =>
            supabase
              .from('matches')
              .update({ status: 'confirmed' })
              .eq('id', match.id)
          )

          try {
            await Promise.all(confirmPromises)
            // Actualizar los datos localmente
            matchesWithParticipants.forEach(match => {
              const confirmedParticipants = match.match_participants.filter(p => p.status === 'confirmed').length
              if (match.status === 'scheduled' && confirmedParticipants >= 4 && new Date(match.scheduled_at) > now) {
                match.status = 'confirmed'
              }
            })
          } catch (confirmError) {
            console.warn('Error confirming matches:', confirmError)
          }
        }
      }

      // Filtrar partidos privados: solo mostrar si el usuario es creador o está invitado
      const filteredMatches = matchesWithParticipants.filter(match => {
        // Si es público, siempre mostrar
        if (match.is_public) return true;
        
        // Si es privado, solo mostrar si:
        // 1. El usuario es el creador
        if (match.creator_id === user?.id) return true;
        
        // 2. El usuario está invitado (tiene un registro en match_participants)
        const isInvited = match.match_participants.some(p => p.user_id === user?.id);
        return isInvited;
      });

      setMatches(filteredMatches as Match[])
    } catch (error) {
      console.error('Error fetching matches:', error)
      setMatches([])
      setTotalMatches(0)
    } finally {
      setLoading(false)
    }
  }, [user?.id, currentPage])

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
          const hasSpace = match.match_participants.filter(p => p.status === 'confirmed').length < 4
          return isNotParticipant && isFuture && match.status === 'scheduled' && hasSpace
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
    setPaginatedMatches(filtered)
  }, [matches, filter, searchTerm, user])

  // Función para cambiar de página
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Calcular información de paginación
  const totalPages = Math.ceil(totalMatches / matchesPerPage)
  const startItem = (currentPage - 1) * matchesPerPage + 1
  const endItem = Math.min(currentPage * matchesPerPage, totalMatches)

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchTerm])

  useEffect(() => {
    if (user) {
      fetchMatches()
    }
  }, [user, fetchMatches])

  // Suscripción en tiempo real para cambios en invitaciones de partidos
  useEffect(() => {
    if (!user?.id) return

    const invitationsSubscription = supabase
      .channel(`match_invitations_user_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "match_invitations",
        },
        (payload) => {
          console.log("Cambio en invitaciones:", payload);
          // Recargar los partidos cuando hay cambios en invitaciones
          fetchMatches();
        }
      )
      .subscribe();

    // Suscripción en tiempo real para cambios en participantes de partidos
    const participantsSubscription = supabase
      .channel(`match_participants_user_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "match_participants",
        },
        (payload) => {
          console.log("Cambio en participantes:", payload);
          // Recargar los partidos cuando hay cambios en participantes
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      invitationsSubscription.unsubscribe();
      participantsSubscription.unsubscribe();
    };
  }, [user?.id, fetchMatches])

  useEffect(() => {
    applyFilters()
  }, [matches, filter, searchTerm, applyFilters])

  const handleJoinMatch = async (matchId: string) => {
    try {
      // Buscar el partido para verificar si es privado
      const match = matches.find(m => m.id === matchId);
      if (!match) {
        console.error('Match not found');
        return;
      }

      // Verificar si el partido es privado y el usuario no está invitado
      if (!match.is_public) {
        // Para partidos privados, verificar si el usuario ya tiene una invitación pendiente
        const existingParticipant = match.match_participants.find(p => p.user_id === user?.id);
        if (!existingParticipant || existingParticipant.status !== 'pending') {
          console.error("Este es un partido privado. Solo puedes unirte si has sido invitado.");
          return;
        }
      }

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
        .update({ status: 'canceled' })
        .eq('id', matchId)

      if (error) throw error

      await fetchMatches()
    } catch (error) {
      console.error('Error canceling match:', error)
    }
  }

  const getUserStatus = (match: Match): 'confirmed' | 'pending' | 'declined' | 'creator' | 'participant' | 'not_participant' | null => {
    if (match.creator_id === user?.id) return 'creator'
    const participant = match.match_participants.find(p => p.user_id === user?.id)
    if (participant) {
      // Devolver el estado específico del participante
      return participant.status as 'confirmed' | 'pending' | 'declined'
    }
    return null // Para usuarios que no participan, no mostrar estado
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
        const hasSpace = match.match_participants.filter(p => p.status === 'confirmed').length < 4
        return isNotParticipant && isFuture && match.status === 'scheduled' && hasSpace
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
    <div className="min-h-screen bg-bg-main p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-main font-montserrat mb-2">
              Gestión de Partidos
            </h1>
            <p className="text-text-secondary font-open-sans text-sm sm:text-base">
              Organiza y participa en partidos de pádel
            </p>
          </div>
          <Link 
            href="/dashboard/matches/create"
            className="w-full sm:w-auto text-center bg-accent-primary text-bg-main px-4 sm:px-6 py-3 rounded-lg hover:bg-accent-primary/90 transition-colors font-open-sans font-medium shadow-lg inline-block"
          >
            + Crear Partido
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-bg-secondary border border-border rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          {/* Search */}
          <div className="mb-4 sm:mb-6">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar partidos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-bg-main text-text-main font-open-sans text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 overflow-x-auto pb-2">
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
                className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg font-open-sans font-medium transition-colors text-xs sm:text-sm ${
                  filter === key
                    ? 'bg-accent-primary text-bg-main'
                    : 'bg-bg-main text-text-secondary hover:text-text-main border border-border'
                }`}
              >
                <span className="hidden sm:inline">{label} ({count})</span>
                <span className="sm:hidden">{label.split(' ')[0]} ({count})</span>
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setView('list')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-open-sans font-medium transition-colors text-xs sm:text-sm ${
                view === 'list'
                  ? 'bg-accent-primary text-bg-main'
                  : 'bg-bg-main text-text-secondary hover:text-text-main border border-border'
              }`}
            >
              <svg className="h-4 w-4 inline mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Lista
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-open-sans font-medium transition-colors text-xs sm:text-sm ${
                view === 'calendar'
                  ? 'bg-accent-primary text-bg-main'
                  : 'bg-bg-main text-text-secondary hover:text-text-main border border-border'
              }`}
            >
              <svg className="h-4 w-4 inline mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendario
            </button>
          </div>
        </div>

        {/* Invitation Notifications */}
        <InvitationNotifications />

        {/* Content */}
        {view === 'list' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {paginatedMatches.length > 0 ? (
                paginatedMatches.map((match) => (
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
                      creator_name: match.profiles 
            ? [match.profiles.first_name, match.profiles.last_name].filter(Boolean).join(' ') || 'Creador desconocido'
            : 'Creador desconocido',
                      user_status: getUserStatus(match)
                    }}
                    onJoin={() => handleJoinMatch(match.id)}
                    onLeave={() => handleLeaveMatch(match.id)}
                    onCancel={() => handleCancelMatch(match.id)}
                    isCreator={match.creator_id === user?.id}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8 sm:py-12">
                  <svg className="h-12 w-12 sm:h-16 sm:w-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="text-base sm:text-lg font-medium text-text-main font-montserrat mb-2">
                    No hay partidos
                  </h3>
                  <p className="text-text-secondary font-open-sans mb-4 text-sm sm:text-base px-4">
                    {filter === 'available' 
                      ? 'No hay partidos disponibles para unirse en este momento.'
                      : filter === 'my_matches'
                      ? 'No tienes partidos organizados o confirmados.'
                      : 'No se encontraron partidos con los filtros seleccionados.'
                    }
                  </p>
                  {filter !== 'my_matches' && (
                    <Link
                      href="/dashboard/matches/create"
                      className="bg-accent-primary text-bg-main px-4 sm:px-6 py-2 rounded-lg hover:bg-accent-primary/90 transition-colors font-open-sans inline-block text-sm sm:text-base"
                    >
                      Crear Primer Partido
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Controles de Paginación */}
            {totalMatches > matchesPerPage && (
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-bg-main border border-border rounded-lg p-3 sm:p-4">
                {/* Información de página */}
                <div className="text-xs sm:text-sm text-text-secondary font-open-sans order-2 sm:order-1">
                  Mostrando {startItem} - {endItem} de {totalMatches} partidos
                </div>

                {/* Controles de navegación */}
                <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                  {/* Botón Anterior */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-2 sm:px-3 py-2 rounded-lg font-open-sans font-medium transition-colors text-xs sm:text-sm ${
                      currentPage === 1
                        ? 'bg-bg-secondary text-text-secondary cursor-not-allowed'
                        : 'bg-bg-secondary text-text-main hover:bg-accent-primary hover:text-bg-main border border-border'
                    }`}
                  >
                    <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Números de página */}
                  <div className="flex gap-0.5 sm:gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-3 py-2 rounded-lg font-open-sans font-medium transition-colors ${
                            currentPage === pageNumber
                              ? 'bg-accent-primary text-bg-main'
                              : 'bg-bg-secondary text-text-main hover:bg-accent-primary hover:text-bg-main border border-border'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  {/* Botón Siguiente */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg font-open-sans font-medium transition-colors ${
                      currentPage === totalPages
                        ? 'bg-bg-secondary text-text-secondary cursor-not-allowed'
                        : 'bg-bg-secondary text-text-main hover:bg-accent-primary hover:text-bg-main border border-border'
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Información adicional */}
                <div className="text-sm text-text-secondary font-open-sans">
                  Página {currentPage} de {totalPages}
                </div>
              </div>
            )}
          </>
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
    </div>
  )
}