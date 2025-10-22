import { supabase } from '@/lib/supabase'
import { notificationService } from '@/lib/services/notificationService'

export interface MatchInvitation {
  id: string
  match_id: string
  inviter_id: string
  invitee_id: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  created_at: string
  updated_at: string
  expires_at: string
  inviter_profile?: {
    id: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  }
  match?: {
    id: string
    scheduled_at: string
    location_name: string
    group_id: string
    groups?: {
      name: string
    }
  }
}

export interface GroupMemberForInvitation {
  user_id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  skill_level: number | null
  username: string | null
  email: string | null
}

// Obtener miembros del grupo para invitar (excluyendo al creador)
export async function getGroupMembersForInvitation(groupId: string, creatorId: string): Promise<GroupMemberForInvitation[]> {
  try {
    console.log('Fetching group members for group:', groupId, 'excluding creator:', creatorId)
    
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        user_id,
        profiles (
          first_name,
          last_name,
          avatar_url,
          skill_level,
          username
        )
      `)
      .eq('group_id', groupId)
      .neq('user_id', creatorId)

    if (error) {
      console.error('Error fetching group members for invitation:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    console.log('Raw data from query:', JSON.stringify(data, null, 2))

    // Transformar los datos al formato esperado
    const transformedData = data?.map(member => ({
      user_id: member.user_id,
      first_name: member.profiles?.first_name || null,
      last_name: member.profiles?.last_name || null,
      avatar_url: member.profiles?.avatar_url || null,
      skill_level: member.profiles?.skill_level || null,
      username: member.profiles?.username || null,
      email: null // El email está en auth.users, no en profiles
    })) || []

    console.log('Transformed data:', JSON.stringify(transformedData, null, 2))
    return transformedData
  } catch (err) {
    console.error('Unexpected error in getGroupMembersForInvitation:', err)
    throw err
  }
}

// Enviar invitaciones a múltiples usuarios
export async function sendMatchInvitations(matchId: string, inviterId: string, inviteeIds: string[]): Promise<{
  success: boolean;
  error?: string;
  invitationsSent?: number;
}> {
  try {
    // Calcular tiempo de expiración (24 horas desde ahora)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const invitations = inviteeIds.map(inviteeId => ({
      match_id: matchId,
      inviter_id: inviterId,
      invitee_id: inviteeId,
      status: 'pending' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    }))

    // Usar upsert para permitir reinvitaciones
    const { error } = await supabase
      .from('match_invitations')
      .upsert(invitations, {
        onConflict: 'match_id,invitee_id',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('Error sending match invitations:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return {
        success: false,
        error: error.message || error.details || 'Error al enviar invitaciones'
      }
    }

    // Crear notificaciones para cada invitado
    try {
      // Obtener información del partido para las notificaciones
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select(`
          id,
          scheduled_at,
          location_name,
          groups (
            name
          )
        `)
        .eq('id', matchId)
        .single()

      if (matchError) {
        console.error('Error fetching match data for notifications:', matchError)
        throw new Error(`Error fetching match data: ${matchError.message}`)
      }

      if (!matchData) {
        console.error('No match data found for matchId:', matchId)
        throw new Error('No match data found')
      }

      // Validar que tenemos los datos necesarios
      if (!matchData.scheduled_at) {
        console.error('Match data missing scheduled_at:', matchData)
        throw new Error('Match data missing scheduled_at')
      }

      // Crear notificaciones para cada invitado
      const notificationPromises = inviteeIds.map(async (inviteeId) => {
        try {
          const matchDate = new Date(matchData.scheduled_at).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })

          const location = matchData.location_name || 'Ubicación no especificada'

          console.log('Creating notification with data:', {
            inviteeId,
            inviterId,
            matchId: matchData.id,
            matchDate,
            location
          })

          return await notificationService.createMatchInvitationNotification(
            inviteeId,
            inviterId,
            {
              matchId: matchData.id,
              matchDate,
              location
            }
          )
        } catch (error) {
          console.error(`Error creating notification for invitee ${inviteeId}:`, error)
          throw error
        }
      })

      await Promise.all(notificationPromises)
      console.log(`Notificaciones creadas para ${inviteeIds.length} invitados`)
    } catch (notificationError) {
      console.error('Error creating notifications for invitations:', notificationError)
      console.error('Notification error details:', {
        matchId,
        inviterId,
        inviteeIds,
        error: notificationError
      })
      // No fallar la función principal si las notificaciones fallan
    }

    return {
      success: true,
      invitationsSent: inviteeIds.length
    }
  } catch (error) {
    console.error('Unexpected error sending match invitations:', error)
    return {
      success: false,
      error: 'Error inesperado al enviar invitaciones'
    }
  }
}

// Obtener invitaciones pendientes para un usuario
export async function getPendingInvitations(userId: string): Promise<MatchInvitation[]> {
  const { data, error } = await supabase
    .from('match_invitations')
    .select(`
      id,
      match_id,
      inviter_id,
      invitee_id,
      status,
      created_at,
      updated_at,
      expires_at,
      inviter_profile:profiles!match_invitations_inviter_id_fkey (
        id,
        first_name,
        last_name,
        avatar_url
      ),
      match:matches (
        id,
        scheduled_at,
        location_name,
        group_id,
        groups (
          name
        )
      )
    `)
    .eq('invitee_id', userId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString()) // Solo invitaciones no expiradas
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pending invitations:', error)
    throw error
  }

  return data || []
}

// Responder a una invitación (aceptar o rechazar)
export async function respondToInvitation(invitationId: string, response: 'accepted' | 'declined'): Promise<void> {
  const { error } = await supabase
    .from('match_invitations')
    .update({ 
      status: response,
      updated_at: new Date().toISOString()
    })
    .eq('id', invitationId)

  if (error) {
    console.error('Error responding to invitation:', error)
    throw error
  }

  // Si la invitación fue aceptada, agregar al usuario como participante del partido
  if (response === 'accepted') {
    const { data: invitation } = await supabase
      .from('match_invitations')
      .select('match_id, invitee_id')
      .eq('id', invitationId)
      .single()

    if (invitation) {
      const { error: participantError } = await supabase
        .from('match_participants')
        .insert({
          match_id: invitation.match_id,
          user_id: invitation.invitee_id,
          status: 'confirmed'
        })

      if (participantError) {
        console.error('Error adding participant after accepting invitation:', participantError)
        throw participantError
      }
    }
  }
}

// Verificar si un usuario ya fue invitado a un partido
export async function checkExistingInvitation(matchId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('match_invitations')
    .select('id')
    .eq('match_id', matchId)
    .eq('invitee_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error checking existing invitation:', error)
    throw error
  }

  return !!data
}

// Obtener IDs de usuarios con invitaciones pendientes para un partido específico
export async function getPendingInvitationsWithProfiles(matchId: string): Promise<GroupMemberForInvitation[]> {
  const { data, error } = await supabase
    .from('match_invitations')
    .select(`
      invitee_id,
      profiles!match_invitations_invitee_id_fkey (
        first_name,
        last_name,
        avatar_url,
        skill_level
      )
    `)
    .eq('match_id', matchId)
    .eq('status', 'pending')

  if (error) {
    console.error('Error fetching pending invitations with profiles for match:', error)
    throw error
  }

  return data?.map(invitation => ({
    user_id: invitation.invitee_id,
    first_name: invitation.profiles?.first_name || null,
    last_name: invitation.profiles?.last_name || null,
    avatar_url: invitation.profiles?.avatar_url || null,
    skill_level: invitation.profiles?.skill_level || null,
  })) || []
}

export async function getPendingInvitationsByMatch(matchId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('match_invitations')
    .select('invitee_id')
    .eq('match_id', matchId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString()) // Solo invitaciones no expiradas

  if (error) {
    console.error('Error fetching pending invitations by match:', error)
    return []
  }

  return data?.map(invitation => invitation.invitee_id) || []
}

/**
 * Limpia automáticamente las invitaciones expiradas
 * Cambia el estado de 'pending' a 'expired' para invitaciones que han pasado su fecha de expiración
 */
export async function cleanupExpiredInvitations(): Promise<{
  success: boolean;
  cleanedCount?: number;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('match_invitations')
      .update({ 
        status: 'expired' as const,
        updated_at: new Date().toISOString()
      })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())
      .select('id')

    if (error) {
      console.error('Error cleaning up expired invitations:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      cleanedCount: data?.length || 0
    }
  } catch (error) {
    console.error('Unexpected error cleaning up expired invitations:', error)
    return {
      success: false,
      error: 'Error inesperado al limpiar invitaciones expiradas'
    }
  }
}