'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import { getPendingInvitations, respondToInvitation, MatchInvitation } from '@/lib/matchInvitations'
import { notificationService } from '@/lib/services/notificationService'
import { supabase } from '@/lib/supabase'
import { Bell, Check, X, Calendar, MapPin, Users, Clock, Eye } from 'lucide-react'
import { parseMatchDataForDisplay, getUserTimezone } from '@/lib/utils/timezoneUtils'
import { getTimeUntilExpiration } from '@/lib/utils/timeUtils'
import Link from 'next/link'

export default function InvitationNotifications() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [invitations, setInvitations] = useState<MatchInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)

  const fetchInvitations = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const pendingInvitations = await getPendingInvitations(user.id)
      setInvitations(pendingInvitations)
    } catch (error) {
      console.error('Error fetching invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [user?.id])

  const handleResponse = async (invitationId: string, response: 'accepted' | 'declined') => {
    try {
      setResponding(invitationId)
      
      // Primero obtener información de la invitación para encontrar el match_id
      const { data: invitationData } = await supabase
        .from('match_invitations')
        .select('match_id')
        .eq('id', invitationId)
        .single()
      
      await respondToInvitation(invitationId, response)
      
      // Buscar y marcar como leída la notificación relacionada con esta invitación
      if (invitationData?.match_id) {
        try {
          const { data: notifications } = await supabase
            .from('notifications')
            .select('id')
            .eq('recipient_id', user?.id)
            .eq('type', 'match_invitation')
            .eq('data->>matchId', invitationData.match_id)
            .eq('is_read', false)

          if (notifications && notifications.length > 0) {
            // Marcar todas las notificaciones relacionadas como leídas
            for (const notification of notifications) {
              await notificationService.markAsRead(notification.id)
            }
          }
        } catch (notificationError) {
          console.error('Error marking notification as read:', notificationError)
          // No lanzar error aquí para no interrumpir el flujo principal
        }
      }
      
      // Remove the invitation from the list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
      
      showToast(
        response === 'accepted' 
          ? 'Invitación aceptada. Te has unido al partido.' 
          : 'Invitación rechazada.',
        'success'
      )
    } catch (error) {
      console.error('Error responding to invitation:', error)
      showToast('Error al responder la invitación', 'error')
    } finally {
      setResponding(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-bg-secondary border border-border rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Bell className="w-5 h-5 text-accent-primary" />
          <h3 className="text-lg font-semibold text-text-main font-open-sans">Invitaciones Pendientes</h3>
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-primary"></div>
          <span className="ml-2 text-text-secondary text-sm font-open-sans">Cargando invitaciones...</span>
        </div>
      </div>
    )
  }

  if (invitations.length === 0) {
    return null // Don't show the component if there are no invitations
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-4 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Bell className="w-5 h-5 text-accent-primary" />
        <h3 className="text-lg font-semibold text-text-main font-open-sans">
          Invitaciones Pendientes ({invitations.length})
        </h3>
      </div>

      <div className="space-y-3">
        {invitations.map((invitation) => {
          const inviterName = invitation.inviter_profile
            ? [invitation.inviter_profile.first_name, invitation.inviter_profile.last_name]
                .filter(Boolean).join(' ') || 'Usuario'
            : 'Usuario'

          const groupName = invitation.match?.groups?.name || 'Grupo'
          
          // Parse match date/time for display
          const matchDateTime = invitation.match?.scheduled_at 
            ? (() => {
                const userTimezone = getUserTimezone()
                const matchTimezone = invitation.match?.timezone || 'Europe/Madrid'
                const { localDate, formattedDateTime } = parseMatchDataForDisplay(
                  invitation.match.scheduled_at,
                  matchTimezone,
                  userTimezone
                )
                
                // Extract date and time from localDate
                const displayDate = localDate.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })
                const displayTime = localDate.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
                
                return { displayDate, displayTime, localDate, formattedDateTime }
              })()
            : null

          return (
            <div key={invitation.id} className="bg-bg-primary border border-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {invitation.inviter_profile?.avatar_url ? (
                      <img
                        src={invitation.inviter_profile.avatar_url}
                        alt={inviterName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-accent-primary">
                          {inviterName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-text-main font-medium text-sm font-open-sans">
                        <span className="text-accent-primary">{inviterName}</span> te invitó a un partido
                      </p>
                      <p className="text-text-secondary text-xs font-open-sans">
                        en <span className="text-accent-primary">{groupName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-text-secondary font-open-sans ml-10">
                    {matchDateTime && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{matchDateTime.displayDate}</span>
                        <Clock className="w-4 h-4 ml-2" />
                        <span>{matchDateTime.displayTime}</span>
                      </div>
                    )}
                    {invitation.match?.location_name && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{invitation.match.location_name}</span>
                      </div>
                    )}
                    {invitation.expires_at && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="text-orange-500 font-medium">
                          {getTimeUntilExpiration(invitation.expires_at).displayText}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleResponse(invitation.id, 'accepted')}
                      disabled={responding === invitation.id}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-open-sans"
                    >
                      <Check className="w-4 h-4" />
                      <span>Aceptar</span>
                    </button>
                    <button
                      onClick={() => handleResponse(invitation.id, 'declined')}
                      disabled={responding === invitation.id}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-open-sans"
                    >
                      <X className="w-4 h-4" />
                      <span>Rechazar</span>
                    </button>
                  </div>
                  <Link
                    href={`/dashboard/matches/${invitation.match_id}`}
                    className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-bg-secondary hover:bg-bg-secondary/80 text-text-main border border-border rounded-lg text-sm font-medium transition-colors font-open-sans"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Ver detalles</span>
                  </Link>
                </div>
              </div>

              {responding === invitation.id && (
                <div className="flex items-center justify-center mt-3 pt-3 border-t border-border">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-primary mr-2"></div>
                  <span className="text-text-secondary text-sm font-open-sans">Procesando respuesta...</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}