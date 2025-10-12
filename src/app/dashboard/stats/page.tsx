'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import StatsCard from '@/components/dashboard/StatsCard'
import PerformanceChart from '@/components/dashboard/PerformanceChart'

interface UserStats {
  totalMatches: number
  matchesWon: number
  matchesLost: number
  winRate: number
  totalGroups: number
  averageRating: number
  hoursPlayed: number
  favoritePosition: string
  monthlyMatches: Array<{ month: string; matches: number }>
  skillProgression: Array<{ date: string; rating: number }>
  positionStats: Array<{ position: string; matches: number }>
}

interface Match {
  id: string;
  status: string;
  team1_score: number | null;
  team2_score: number | null;
  scheduled_at: string;
}

export default function StatsPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '1y' | 'all'>('6m')

  const fetchUserStats = useCallback(async () => {
    try {
      setLoading(true)
      
      if (!user?.id) {
        setStats(null)
        return
      }
      
      // Calculate date range
      const now = new Date()
      let startDate: Date | null = null
      
      switch (timeRange) {
        case '3m':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
          break
        case '6m':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
          break
        case '1y':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)
          break
        default:
          startDate = null
      }

      // Fetch user's match participants first
      const participantsQuery = supabase
        .from('match_participants')
        .select('match_id, status')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')

      const { data: userParticipants, error: participantsError } = await participantsQuery

      if (participantsError) {
        console.warn('Error fetching match participants:', participantsError)
      }

      let matches: Match[] = []
      if (userParticipants && userParticipants.length > 0) {
        const matchIds = userParticipants.map(p => p.match_id)
        
        let matchQuery = supabase
          .from('matches')
          .select('*')
          .in('id', matchIds)

        if (startDate) {
          matchQuery = matchQuery.gte('scheduled_at', startDate.toISOString())
        }

        const { data: matchesData, error: matchError } = await matchQuery

        if (matchError) {
          console.warn('Error fetching matches:', matchError)
        } else {
          matches = matchesData || []
        }
      }

      // Fetch user's groups
      const { data: userGroups, error: groupError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)

      if (groupError) {
        console.warn('Error fetching user groups:', groupError)
      }

      let groups = []
      if (userGroups && userGroups.length > 0) {
        const groupIds = userGroups.map(g => g.group_id)
        
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('*')
          .in('id', groupIds)

        if (groupsError) {
          console.warn('Error fetching groups:', groupsError)
        } else {
          groups = groupsData || []
        }
      }

      // Process statistics
      const completedMatches = matches?.filter(m => m.status === 'completed') || []
      const totalMatches = completedMatches.length
      
      // For demo purposes, we'll simulate win/loss data
      // In a real app, you'd have match results stored
      const matchesWon = Math.floor(totalMatches * 0.6) // 60% win rate simulation
      const matchesLost = totalMatches - matchesWon
      const winRate = totalMatches > 0 ? (matchesWon / totalMatches) * 100 : 0

      // Generate monthly data for the last 6 months
      const monthlyMatches: Array<{ month: string; matches: number }> = []

      // Simulate skill progression data
      const skillProgression: Array<{ date: string; rating: number }> = []
      const baseRating = 1200
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const rating = baseRating + (Math.random() * 200) + (i * 10) // Simulate improvement over time
        skillProgression.push({
          date: date.toLocaleDateString('es-ES', { month: 'short' }),
          rating: Math.round(rating)
        })
      }

      // Simulate position statistics
      const positions = ['Derecha', 'Izquierda', 'Ambas']
      const positionStats = positions.map(position => ({
        position,
        matches: Math.floor(Math.random() * totalMatches)
      }))

      const userStats: UserStats = {
        totalMatches,
        matchesWon,
        matchesLost,
        winRate,
        totalGroups: groups?.length || 0,
        averageRating: skillProgression[skillProgression.length - 1]?.rating || 1200,
        hoursPlayed: 0,
        favoritePosition: positionStats.reduce((a, b) => a.matches > b.matches ? a : b)?.position || 'Derecha',
        monthlyMatches,
        skillProgression,
        positionStats
      }

      setStats(userStats)
    } catch (error) {
      console.error('Error fetching user stats:', error)
      // Set default stats on error
      setStats({
        totalMatches: 0,
        matchesWon: 0,
        matchesLost: 0,
        winRate: 0,
        totalGroups: 0,
        averageRating: 1200,
        hoursPlayed: 0,
        favoritePosition: 'Derecha',
        monthlyMatches: [],
        skillProgression: [],
        positionStats: []
      })
    } finally {
      setLoading(false)
    }
  }, [user, timeRange])

  useEffect(() => {
    if (user) {
      fetchUserStats()
    }
  }, [user, timeRange, fetchUserStats])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-bg-secondary rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-bg-secondary rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-bg-secondary rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-bg-main p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <svg className="h-16 w-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-text-main font-montserrat mb-2">
              No hay estadísticas disponibles
            </h3>
            <p className="text-text-secondary font-open-sans">
              Participa en algunos partidos para ver tus estadísticas.
            </p>
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
              Estadísticas y Progreso
            </h1>
            <p className="text-text-secondary font-open-sans">
              Analiza tu rendimiento y progreso en el pádel
            </p>
          </div>
          
          {/* Time Range Filter */}
          <div className="mt-4 sm:mt-0 flex gap-2">
            {[
              { key: '3m', label: '3M' },
              { key: '6m', label: '6M' },
              { key: '1y', label: '1A' },
              { key: 'all', label: 'Todo' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTimeRange(key as '3m' | '6m' | '1y' | 'all')}
                className={`px-3 py-2 rounded-lg font-open-sans font-medium transition-colors ${
                  timeRange === key
                    ? 'bg-accent-primary text-bg-main'
                    : 'bg-bg-secondary text-text-secondary hover:text-text-main border border-border'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Partidos Jugados"
            value={stats.totalMatches}
            subtitle="Total de partidos"
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            color="primary"
          />

          <StatsCard
            title="Tasa de Victoria"
            value={`${stats.winRate.toFixed(1)}%`}
            subtitle={`${stats.matchesWon} ganados, ${stats.matchesLost} perdidos`}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="success"
            trend={{
              value: 5.2,
              isPositive: true
            }}
          />

          <StatsCard
            title="Horas Jugadas"
            value={stats.hoursPlayed}
            subtitle="Tiempo total en cancha"
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="info"
          />

          <StatsCard
            title="Rating Promedio"
            value={stats.averageRating}
            subtitle={`Posición favorita: ${stats.favoritePosition}`}
            icon={
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            }
            color="warning"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PerformanceChart
            title="Partidos por Mes"
            type="bar"
            data={stats.monthlyMatches.map(item => ({
              label: item.month,
              value: item.matches
            }))}
          />

          <PerformanceChart
            title="Progresión de Rating"
            type="line"
            data={stats.skillProgression.map(item => ({
              label: item.date,
              value: item.rating
            }))}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceChart
            title="Estadísticas por Posición"
            type="pie"
            data={stats.positionStats.map((item, index) => ({
              label: item.position,
              value: item.matches,
              color: ['#10B981', '#3B82F6', '#F59E0B'][index]
            }))}
          />

          {/* Recent Performance */}
          <div className="bg-bg-secondary border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-text-main font-montserrat mb-6">
              Rendimiento Reciente
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-bg-main rounded-lg border border-border">
                <div className="flex items-center space-x-3">
                  <div className="bg-success/10 p-2 rounded-lg">
                    <svg className="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-text-main font-open-sans">Victoria</p>
                    <p className="text-sm text-text-secondary font-open-sans">Hace 2 días</p>
                  </div>
                </div>
                <span className="text-success font-semibold font-open-sans">+15 pts</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-bg-main rounded-lg border border-border">
                <div className="flex items-center space-x-3">
                  <div className="bg-success/10 p-2 rounded-lg">
                    <svg className="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-text-main font-open-sans">Victoria</p>
                    <p className="text-sm text-text-secondary font-open-sans">Hace 5 días</p>
                  </div>
                </div>
                <span className="text-success font-semibold font-open-sans">+12 pts</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-bg-main rounded-lg border border-border">
                <div className="flex items-center space-x-3">
                  <div className="bg-error/10 p-2 rounded-lg">
                    <svg className="h-5 w-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-text-main font-open-sans">Derrota</p>
                    <p className="text-sm text-text-secondary font-open-sans">Hace 1 semana</p>
                  </div>
                </div>
                <span className="text-error font-semibold font-open-sans">-8 pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}