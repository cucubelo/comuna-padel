'use client'

import React from 'react'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { 
  getUserTimezone, 
  parseMatchDataForDisplay 
} from '@/lib/utils/timezoneUtils'

interface MatchCardProps {
  match: {
    id: string
    scheduled_at: string
    timezone?: string
    location_name?: string
    latitude?: number | null
    longitude?: number | null
    is_public: boolean
    required_skill_level?: string | null
    team1_score?: number | null
    team2_score?: number | null
    status: string
    current_participants?: number
    group_name?: string
    creator_name?: string
    user_status?: 'confirmed' | 'pending' | 'declined' | 'creator' | 'participant' | 'not_participant' | null
  }
  showJoinButton?: boolean
  onJoin?: (matchId: string) => void
  onLeave?: (matchId: string) => void
  onCancel?: (matchId: string) => void
  isCreator?: boolean
}

export default function MatchCard({ 
  match, 
  showJoinButton = false, 
  onJoin, 
  onLeave, 
  onCancel,
  isCreator = false
}: MatchCardProps) {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-accent-primary/10 text-accent-primary border-accent-primary/20'
      case 'completed':
        return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
      case 'canceled':
        return 'bg-error/10 text-error border-error/20'
      default:
        return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Programado'
      case 'completed':
        return 'Completado'
      case 'canceled':
        return 'Cancelado'
      default:
        return 'Desconocido'
    }
  }

  const getUserStatusColor = (userStatus: string) => {
    switch (userStatus) {
      case 'confirmed':
        return 'bg-success/10 text-success border-success/20'
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20'
      case 'declined':
        return 'bg-error/10 text-error border-error/20'
      case 'creator':
        return 'bg-accent-primary/10 text-accent-primary border-accent-primary/20'
      default:
        return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
    }
  }

  const getUserStatusText = (userStatus: string) => {
    switch (userStatus) {
      case 'confirmed':
        return 'Confirmado'
      case 'pending':
        return 'Pendiente'
      case 'declined':
        return 'Rechazado'
      case 'creator':
        return 'Creador'
      default:
        return 'Sin estado'
    }
  }

  // Parse match data for display in user's timezone
  const userTimezone = getUserTimezone()
  const { localDate, formattedDateTime, isOriginalTimezone } = parseMatchDataForDisplay(
    match.scheduled_at,
    match.timezone || 'Europe/Madrid',
    userTimezone
  )

  // Build local time text and timezone info from formattedDateTime
  const localTimeText = localDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  const tzSuffixMatch = formattedDateTime.match(/\(([^)]+)\)$/)
  const timezoneInfo = {
    isDifferent: !isOriginalTimezone,
    displayText: tzSuffixMatch ? `Hora original: ${tzSuffixMatch[1]}` : ''
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }


  const isExpired = new Date(match.scheduled_at) < new Date()
  const canJoin = match.status === 'scheduled' && !isExpired && (match.is_public || match.user_status === 'pending')

  return (
    <div className="bg-bg-main rounded-lg p-4 sm:p-6 border border-border hover:border-accent-primary/40 transition-all duration-200 shadow-sm hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base sm:text-lg font-semibold text-text-main font-montserrat truncate">
              Partido {match.is_public ? 'Público' : 'Privado'}
            </h3>
            {isCreator && (
              <span className="px-2 py-1 text-xs font-medium bg-accent-primary/10 text-accent-primary rounded-full border border-accent-primary/20 flex-shrink-0">
                Creador
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 sm:gap-2 flex-shrink-0 ml-2">
          <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(match.status)}`}>
            {getStatusText(match.status)}
          </span>
          
          {match.user_status && match.user_status !== 'creator' && (
            <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUserStatusColor(match.user_status)}`}>
              {getUserStatusText(match.user_status)}
            </span>
          )}
        </div>
      </div>

      {/* Date and Time */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center text-sm text-text-main font-open-sans mb-1">
          <svg className="h-4 w-4 text-accent-primary mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="capitalize text-xs sm:text-sm truncate">{formatDate(localDate)}</span>
        </div>
        <div className="flex items-center text-sm text-text-secondary font-open-sans mb-1">
          <svg className="h-4 w-4 text-accent-secondary mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs sm:text-sm">{localTimeText}</span>
        </div>
        {/* Timezone info */}
        {timezoneInfo.isDifferent && (
          <div className="flex items-center text-xs text-text-secondary font-open-sans">
            <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{timezoneInfo.displayText}</span>
          </div>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
        {/* Participants */}
        <div className="flex items-center text-sm">
          <svg className="h-4 w-4 text-accent-primary mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <span className="text-text-secondary font-open-sans text-xs sm:text-sm">
            {match.current_participants || 0}/4 jugadores
          </span>
        </div>

        {/* Group */}
        <div className="flex items-center text-sm min-w-0">
          <svg className="h-4 w-4 text-accent-primary mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-text-secondary font-open-sans truncate text-xs sm:text-sm">
            {match.group_name}
          </span>
        </div>
      </div>

      {/* Location */}
      {match.location_name && (
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center text-sm min-w-0">
            <svg className="h-4 w-4 text-accent-primary mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-text-secondary font-open-sans truncate text-xs sm:text-sm">
              {match.location_name}
            </span>
          </div>
        </div>
      )}

      {/* Skill Level */}
      {match.required_skill_level && (
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center text-sm">
            <svg className="h-4 w-4 text-accent-primary mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="text-text-secondary font-open-sans text-xs sm:text-sm">
              Nivel {match.required_skill_level}+
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4 border-t border-border">
        <Link
          href={`/dashboard/matches/${match.id}`}
          className="flex-1 px-3 sm:px-4 py-2 bg-bg-secondary text-text-main text-center rounded-lg hover:bg-bg-secondary/80 transition-colors font-open-sans font-medium text-xs sm:text-sm"
        >
          Ver Detalles
        </Link>
        
        {showJoinButton && canJoin && (
          <>
            {match.user_status === 'confirmed' ? (
              <button
                onClick={() => onLeave?.(match.id)}
                className="px-3 sm:px-4 py-2 bg-error/10 text-error border border-error/20 rounded-lg hover:bg-error/20 transition-colors font-open-sans font-medium text-xs sm:text-sm"
              >
                Salir
              </button>
            ) : match.user_status === 'pending' ? (
              <button
                disabled
                className="px-3 sm:px-4 py-2 bg-warning/10 text-warning border border-warning/20 rounded-lg opacity-50 cursor-not-allowed font-open-sans font-medium text-xs sm:text-sm"
              >
                Pendiente
              </button>
            ) : (
              <button
                onClick={() => onJoin?.(match.id)}
                className="px-3 sm:px-4 py-2 bg-accent-primary text-black rounded-lg hover:bg-accent-primary/90 transition-colors font-open-sans font-medium text-xs sm:text-sm"
              >
                Unirse
              </button>
            )}
          </>
        )}
        
        {isCreator && match.status === 'scheduled' && (
          <button
            onClick={() => onCancel?.(match.id)}
            className="px-3 sm:px-4 py-2 bg-error/10 text-error border border-error/20 rounded-lg hover:bg-error/20 transition-colors font-open-sans font-medium text-xs sm:text-sm"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  )
}