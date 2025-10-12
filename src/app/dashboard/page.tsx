'use client'

import React, { useState, useEffect, useCallback } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import ProfileCompletionBanner from '@/components/dashboard/ProfileCompletionBanner'
import StatsCard from '@/components/dashboard/StatsCard'
import CreateMatchModal, { MatchFormData } from '@/components/dashboard/CreateMatchModal'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({
    totalMatches: 0,
    upcomingMatches: 0,
    activeGroups: 0,
    winRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [isCreateMatchModalOpen, setIsCreateMatchModalOpen] = useState(false)

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true)
      
      if (!user?.id) {
        setStats({
          totalMatches: 0,
          upcomingMatches: 0,
          activeGroups: 0,
          winRate: 0
        })
        return
      }
      
      // Fetch total matches for user - with error handling
      const { data: totalMatchesData, error: matchParticipantsError } = await supabase
        .from('match_participants')
        .select('match_id')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')

      if (matchParticipantsError) {
        console.warn('Match participants table not found or empty:', matchParticipantsError)
      }

      const matchIds = totalMatchesData?.map(m => m.match_id) || []

      // Fetch upcoming matches - only if we have match IDs
      let upcomingMatchesData = null
      if (matchIds.length > 0) {
        const now = new Date().toISOString()
        const { data, error: matchesError } = await supabase
          .from('matches')
          .select('id')
          .gte('scheduled_at', now)
          .eq('status', 'scheduled')
          .in('id', matchIds)

        if (matchesError) {
          console.warn('Matches table not found or empty:', matchesError)
        } else {
          upcomingMatchesData = data
        }
      }

      // Fetch active groups - with error handling
      const { data: activeGroupsData, error: groupMembersError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

      if (groupMembersError) {
        console.warn('Group members table not found or empty:', groupMembersError)
      }

      // Calculate win rate (simulated for now)
      const totalMatches = totalMatchesData?.length || 0
      const winRate = totalMatches > 0 ? Math.round((totalMatches * 0.65)) : 0

      setStats({
        totalMatches,
        upcomingMatches: upcomingMatchesData?.length || 0,
        activeGroups: activeGroupsData?.length || 0,
        winRate: totalMatches > 0 ? Math.round((winRate / totalMatches) * 100) : 0
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      // Set default stats on error
      setStats({
        totalMatches: 0,
        upcomingMatches: 0,
        activeGroups: 0,
        winRate: 0
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchDashboardStats()
    }
  }, [user, fetchDashboardStats])



  const handleCreateMatch = async (matchData: MatchFormData) => {
    if (!user?.id) return

    try {
      const { data: match, error } = await supabase
        .from('matches')
        .insert([{
          ...matchData,
          creator_id: user.id,
          scheduled_at: new Date(matchData.scheduled_at).toISOString(),
          status: 'scheduled'
        }])
        .select()
        .single()

      if (error) throw error

      // Add creator as participant
      const { error: participantError } = await supabase
        .from('match_participants')
        .insert([{
          match_id: match.id,
          user_id: user.id,
          status: 'confirmed',
          team_number: 1
        }])

      if (participantError) throw participantError

      // Refresh stats
      fetchDashboardStats()
      
      alert('¡Partido creado exitosamente!')
    } catch (error) {
      console.error('Error creating match:', error)
      throw error
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-secondary">
        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-4 sm:py-6 sm:px-6 lg:px-8">
          <div className="px-3 sm:px-4 py-4 sm:py-6 sm:px-0">
            {/* Profile Completion Banner */}
            <ProfileCompletionBanner />

            {/* Statistics Summary */}
            <div className="bg-bg-main overflow-hidden shadow-lg rounded-lg mb-4 sm:mb-6 border border-border">
              <div className="px-3 py-4 sm:px-4 sm:py-5 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-text-main font-montserrat mb-3 sm:mb-4">
                  Resumen de Actividad
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <StatsCard
                    title="Partidos Jugados"
                    value={loading ? "..." : stats.totalMatches.toString()}
                    subtitle="Total histórico"
                    icon={
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    }
                    color="primary"
                  />
                  <StatsCard
                    title="Próximos Partidos"
                    value={loading ? "..." : stats.upcomingMatches.toString()}
                    subtitle="Programados"
                    icon={
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    }
                    color="info"
                  />
                  <StatsCard
                    title="Grupos Activos"
                    value={loading ? "..." : stats.activeGroups.toString()}
                    subtitle="Participando"
                    icon={
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    }
                    color="success"
                  />
                  <StatsCard
                    title="Tasa de Victoria"
                    value={loading ? "..." : `${stats.winRate}%`}
                    subtitle="Promedio general"
                    icon={
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    color="warning"
                  />
                </div>
              </div>
            </div>

            {/* Welcome Section */}
            <div className="bg-bg-main overflow-hidden shadow-lg rounded-lg mb-4 sm:mb-6 border border-border">
              <div className="px-3 py-4 sm:px-4 sm:py-5 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-text-main font-montserrat mb-3 sm:mb-4">
                  ¡Bienvenido a tu Dashboard!
                </h2>
                <p className="text-text-secondary font-open-sans mb-4 sm:mb-6 text-sm sm:text-base">
                  Desde aquí podrás gestionar tus partidos, grupos y perfil de jugador.
                </p>

                {/* User Info Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Profile Info */}
                  <div className="bg-accent-primary/10 rounded-lg p-4 sm:p-6 border border-accent-primary/20 hover:border-accent-primary/40 transition-colors">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent-primary/20 rounded-lg flex items-center justify-center">
                          <svg className="h-5 w-5 sm:h-6 sm:w-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <h3 className="text-base sm:text-lg font-semibold text-text-main font-montserrat">
                          Mi Perfil
                        </h3>
                        <p className="text-xs sm:text-sm text-text-secondary font-open-sans">
                          {profile?.full_name || 'Perfil incompleto'}
                        </p>
                        <p className="text-xs text-text-secondary/80 font-open-sans">
                          Nivel: {profile?.skill_level || 'No definido'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-success/10 rounded-lg p-4 sm:p-6 border border-success/20 hover:border-success/40 transition-colors">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/20 rounded-lg flex items-center justify-center">
                          <svg className="h-5 w-5 sm:h-6 sm:w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <h3 className="text-base sm:text-lg font-semibold text-text-main font-montserrat">
                          Contacto
                        </h3>
                        <p className="text-xs sm:text-sm text-text-secondary font-open-sans truncate">
                          {user?.email}
                        </p>
                        <p className="text-xs text-text-secondary/80 font-open-sans">
                          {profile?.phone || 'Sin teléfono'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="bg-accent-secondary/10 rounded-lg p-4 sm:p-6 border border-accent-secondary/20 hover:border-accent-secondary/40 transition-colors">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent-secondary/20 rounded-lg flex items-center justify-center">
                          <svg className="h-5 w-5 sm:h-6 sm:w-6 text-accent-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <h3 className="text-base sm:text-lg font-semibold text-text-main font-montserrat">
                          Ubicación
                        </h3>
                        <p className="text-xs sm:text-sm text-text-secondary font-open-sans">
                          {profile?.location || 'No definida'}
                        </p>
                        <p className="text-xs text-text-secondary/80 font-open-sans">
                          Posición: {profile?.preferred_position || 'Ambas'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-bg-main overflow-hidden shadow-lg rounded-lg mb-4 sm:mb-6 border border-border">
              <div className="px-3 py-4 sm:px-4 sm:py-5 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-text-main font-montserrat mb-3 sm:mb-4">
                  Acciones Rápidas
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                  <button 
                    onClick={() => setIsCreateMatchModalOpen(true)}
                    className="flex flex-col items-center justify-center p-3 sm:p-4 bg-accent-primary text-bg-main rounded-lg hover:bg-accent-primary/90 transition-colors"
                  >
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-center">Crear Partido</span>
                  </button>

                  <Link href="/dashboard/players" className="flex flex-col items-center justify-center p-3 sm:p-4 bg-success text-white rounded-lg hover:bg-success/90 transition-colors">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-center">Buscar Jugadores</span>
                  </Link>

                  <Link href="/dashboard/groups" className="flex flex-col items-center justify-center p-3 sm:p-4 bg-accent-secondary text-white rounded-lg hover:bg-accent-secondary/90 transition-colors">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-center">Mis Grupos</span>
                  </Link>

                  <Link href="/dashboard/matches" className="flex flex-col items-center justify-center p-3 sm:p-4 bg-info text-white rounded-lg hover:bg-info/90 transition-colors">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-center">Partidos</span>
                  </Link>

                  <Link href="/dashboard/stats" className="flex flex-col items-center justify-center p-3 sm:p-4 bg-accent-primary text-bg-main rounded-lg hover:bg-accent-primary/90 transition-colors">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-center">Estadísticas</span>
                  </Link>

                  <Link href="/dashboard/profile" className="flex flex-col items-center justify-center p-3 sm:p-4 bg-warning text-white rounded-lg hover:bg-warning/90 transition-colors">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-center">Editar Perfil</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-bg-main overflow-hidden shadow-lg rounded-lg border border-border">
              <div className="px-3 py-4 sm:px-4 sm:py-5 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-text-main font-montserrat mb-3 sm:mb-4">
                  Actividad Reciente
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center p-3 sm:p-4 bg-accent-primary/5 rounded-lg border border-accent-primary/10 hover:border-accent-primary/20 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent-primary/20 rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3 sm:ml-4 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-text-main font-open-sans">
                        Partido creado: Jueves 7:00 PM
                      </p>
                      <p className="text-xs text-text-secondary font-open-sans">
                        Hace 2 horas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center p-3 sm:p-4 bg-success/5 rounded-lg border border-success/10 hover:border-success/20 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-success/20 rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3 sm:ml-4 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-text-main font-open-sans">
                        Te uniste al grupo &quot;Padel Nocturno&quot;
                      </p>
                      <p className="text-xs text-text-secondary font-open-sans">
                        Hace 1 día
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center p-3 sm:p-4 bg-accent-secondary/5 rounded-lg border border-accent-secondary/10 hover:border-accent-secondary/20 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent-secondary/20 rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-accent-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3 sm:ml-4 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-text-main font-open-sans">
                        Partido completado vs Juan y María
                      </p>
                      <p className="text-xs text-text-secondary font-open-sans">
                        Hace 3 días
                      </p>
                    </div>
                  </div>

                  <div className="text-center pt-3 sm:pt-4">
                    <button className="text-accent-primary hover:text-accent-primary/80 font-open-sans text-xs sm:text-sm font-medium transition-colors">
                      Ver toda la actividad
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Create Match Modal */}
        <CreateMatchModal
          isOpen={isCreateMatchModalOpen}
          onClose={() => setIsCreateMatchModalOpen(false)}
          onSubmit={handleCreateMatch}
          userId={user?.id || ''}
        />
      </div>
    </ProtectedRoute>
  )
}