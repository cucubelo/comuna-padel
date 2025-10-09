'use client'

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface Player {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  skill_level: number | null
  matches_played: number
  matches_won: number
  matches_lost: number
  city?: string
}

export default function PlayersPage() {
  const { user } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [skillLevelFilter, setSkillLevelFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [availableCities, setAvailableCities] = useState<string[]>([])

  useEffect(() => {
    fetchPlayers()
    fetchAvailableCities()
  }, [searchQuery, skillLevelFilter, cityFilter])

  const fetchAvailableCities = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('city')
        .not('city', 'is', null)

      if (error) throw error

      const cities = [...new Set(data?.map(p => p.city).filter(Boolean))] as string[]
      setAvailableCities(cities.sort())
    } catch (error) {
      console.error('Error fetching cities:', error)
    }
  }

  const fetchPlayers = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id) // Exclude current user
        .limit(20)

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
      }

      // Apply skill level filter
      if (skillLevelFilter) {
        query = query.eq('skill_level', parseInt(skillLevelFilter))
      }

      // Apply city filter
      if (cityFilter) {
        query = query.eq('city', cityFilter)
      }

      const { data, error } = await query.order('matches_played', { ascending: false })

      if (error) throw error

      setPlayers(data || [])
    } catch (error) {
      console.error('Error fetching players:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSkillLevelFilter('')
    setCityFilter('')
  }

  const getSkillLevelText = (level: number | null) => {
    if (!level) return 'No definido'
    const levels = {
      1: 'Principiante',
      2: 'Básico',
      3: 'Intermedio',
      4: 'Avanzado',
      5: 'Experto'
    }
    return levels[level as keyof typeof levels] || `Nivel ${level}`
  }

  const getWinRate = (won: number, total: number) => {
    if (total === 0) return 0
    return Math.round((won / total) * 100)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-main font-montserrat">
              Buscar Jugadores
            </h1>
            <p className="text-text-secondary font-open-sans mt-2">
              Encuentra compañeros de juego en tu ciudad y nivel
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-bg-main rounded-lg shadow-sm border border-border p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-main mb-2">
                  Buscar por nombre o usuario
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar jugadores..."
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary bg-bg-main text-text-main"
                  />
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Skill Level Filter */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-2">
                  Nivel de habilidad
                </label>
                <select
                  value={skillLevelFilter}
                  onChange={(e) => setSkillLevelFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary bg-bg-main text-text-main"
                >
                  <option value="">Todos los niveles</option>
                  <option value="1">Principiante (1)</option>
                  <option value="2">Básico (2)</option>
                  <option value="3">Intermedio (3)</option>
                  <option value="4">Avanzado (4)</option>
                  <option value="5">Experto (5)</option>
                </select>
              </div>

              {/* City Filter */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-2">
                  Ciudad
                </label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary bg-bg-main text-text-main"
                >
                  <option value="">Todas las ciudades</option>
                  {availableCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {(searchQuery || skillLevelFilter || cityFilter) && (
              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-text-secondary">
                  {players.length} jugador{players.length !== 1 ? 'es' : ''} encontrado{players.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={clearFilters}
                  className="text-accent-primary hover:text-accent-primary/80 text-sm font-medium transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {/* Players Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-text-main">No se encontraron jugadores</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Intenta ajustar los filtros de búsqueda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {players.map(player => (
                <div key={player.id} className="bg-bg-main rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0">
                      {player.avatar_url ? (
                        <img
                          src={player.avatar_url}
                          alt={player.username}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-accent-primary/20 flex items-center justify-center">
                          <span className="text-accent-primary font-semibold text-lg">
                            {player.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-semibold text-text-main font-montserrat">
                        {player.full_name || player.username}
                      </h3>
                      <p className="text-sm text-text-secondary font-open-sans">
                        @{player.username}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-secondary">Nivel:</span>
                      <span className="text-sm font-medium text-text-main">
                        {getSkillLevelText(player.skill_level)}
                      </span>
                    </div>

                    {player.city && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">Ciudad:</span>
                        <span className="text-sm font-medium text-text-main">
                          {player.city}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-secondary">Partidos:</span>
                      <span className="text-sm font-medium text-text-main">
                        {player.matches_played}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-secondary">% Victorias:</span>
                      <span className="text-sm font-medium text-text-main">
                        {getWinRate(player.matches_won, player.matches_played)}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <button className="w-full bg-accent-primary text-white py-2 px-4 rounded-md hover:bg-accent-primary/90 transition-colors font-medium">
                      Enviar mensaje
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}