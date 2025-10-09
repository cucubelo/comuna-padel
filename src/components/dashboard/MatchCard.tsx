'use client'

import React from 'react'
import Link from 'next/link'

interface MatchCardProps {
  match: {
    id: string
    scheduled_at: string
    location_name?: string
    latitude?: number | null
    longitude?: number | null
    is_public: boolean
    required_skill_level?: string | null
    team1_score?: number | null
    team2_score?: number | null
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
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
      case 'scheduled': return 'text-accent-primary bg-accent-primary/10 border-accent-primary/20'
      case 'in_progress': return 'text-warning bg-warning/10 border-warning/20'
      case 'completed': return 'text-success bg-success/10 border-success/20'
      case 'cancelled': return 'text-error bg-error/10 border-error/20'
      default: return 'text-text-secondary bg-bg-secondary border-border'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programado'
      case 'in_progress': return 'En Curso'
      case 'completed': return 'Completado'
      case 'cancelled': return 'Cancelado'
      default: return 'Desconocido'
    }
  }

  const getUserStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed': return 'text-success bg-success/10 border-success/20'
      case 'pending': return 'text-warning bg-warning/10 border-warning/20'
      case 'declined': return 'text-error bg-error/10 border-error/20'
      default: return ''
    }
  }

  const getUserStatusText = (status?: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado'
      case 'pending': return 'Pendiente'
      case 'declined': return 'Rechazado'
      default: return ''
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = new Date(match.scheduled_at) < new Date()
  const canJoin = match.status === 'scheduled' && !isExpired

  return (
    <div className="bg-bg-main rounded-lg p-6 border border-border hover:border-accent-primary/40 transition-all duration-200 shadow-sm hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-text-main font-montserrat">
              Partido {match.is_public ? 'Público' : 'Privado'}
            </h3>
            {isCreator && (
              <span className="px-2 py-1 text-xs font-medium bg-accent-primary/10 text-accent-primary rounded-full border border-accent-primary/20">
                Creador
              </span>
            )}
          </div>
          {/* Eliminar descripción ya que no existe en la DB */}
        </div>

        <div className="flex flex-col gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(match.status)}`}>
            {getStatusText(match.status)}
          </span>
          
          {match.user_status && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUserStatusColor(match.user_status)}`}>
              {getUserStatusText(match.user_status)}
            </span>
          )}
        </div>
      </div>

      {/* Date and Time */}
      <div className="mb-4">
        <div className="flex items-center text-sm text-text-main font-open-sans mb-1">
          <svg className="h-4 w-4 text-accent-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="capitalize">{formatDate(match.scheduled_at)}</span>
        </div>
        <div className="flex items-center text-sm text-text-secondary font-open-sans">
          <svg className="h-4 w-4 text-accent-secondary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatTime(match.scheduled_at)}</span>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Participants */}
        <div className="flex items-center text-sm">
          <svg className="h-4 w-4 text-accent-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-text-secondary font-open-sans">
            {match.current_participants || 0} participantes
          </span>
        </div>

        {/* Skill Level */}
        {match.required_skill_level && (
          <div className="flex items-center text-sm">
            <svg className="h-4 w-4 text-warning mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-text-secondary font-open-sans">
              {match.required_skill_level}
            </span>
          </div>
        )}
      </div>

      {/* Location */}
      {match.location_name && (
        <div className="flex items-center text-sm text-text-secondary font-open-sans mb-4">
          <svg className="h-4 w-4 text-accent-secondary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{match.location_name}</span>
        </div>
      )}

      {/* Group and Creator */}
      <div className="text-xs text-text-secondary font-open-sans mb-4 space-y-1">
        {match.group_name && (
          <div>Grupo: {match.group_name}</div>
        )}
        {match.creator_name && (
          <div>Creador: {match.creator_name}</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link 
          href={`/dashboard/matches/${match.id}`}
          className="flex-1 bg-accent-primary/10 text-accent-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-primary/20 transition-colors text-center border border-accent-primary/20"
        >
          Ver Detalles
        </Link>
        
        {showJoinButton && canJoin && onJoin && !match.user_status && (
          <button
            onClick={() => onJoin(match.id)}
            className="bg-success text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
          >
            Unirse
          </button>
        )}
        
        {match.user_status === 'confirmed' && onLeave && match.status === 'scheduled' && (
          <button
            onClick={() => onLeave(match.id)}
            className="bg-error/10 text-error px-4 py-2 rounded-lg text-sm font-medium hover:bg-error/20 transition-colors border border-error/20"
          >
            Salir
          </button>
        )}
        
        {isCreator && onCancel && match.status === 'scheduled' && (
          <button
            onClick={() => onCancel(match.id)}
            className="bg-error text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-error/90 transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  )
}