import { supabase } from '@/lib/supabase'

export interface MatchInvitation {
  id: string
  match_id: string
  inviter_id: string
  invitee_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  updated_at: string
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
}

// Obtener miembros del grupo para invitar (excluyendo al creador)
export async function getGroupMembersForInvitation(groupId: string, creatorId: string): Promise<GroupMemberForInvitation[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      user_id,
      profiles!group_members_user_id_fkey (
        first_name,
        last_name,
        avatar_url,
        skill_level
      )
    `)
    .eq('group_id', groupId)
    .neq('user_id', creatorId)

  if (error) {
    console.error('Error fetching group members for invitation:', error)
    throw error
  }

  // Transformar los datos al formato esperado
  const transformedData = data?.map(member => ({
    user_id: member.user_id,
    first_name: member.profiles?.first_name || null,
    last_name: member.profiles?.last_name || null,
    avatar_url: member.profiles?.avatar_url || null,
    skill_level: member.profiles?.skill_level || null
  })) || []

  return transformedData
}

// Enviar invitaciones a múltiples usuarios
export async function sendMatchInvitations(matchId: string, inviterId: string, inviteeIds: string[]): Promise<{
  success: boolean;
  error?: string;
  invitationsSent?: number;
}> {
  try {
    const invitations = inviteeIds.map(inviteeId => ({
      match_id: matchId,
      inviter_id: inviterId,
      invitee_id: inviteeId,
      status: 'pending' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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

  if (error) {
    console.error('Error fetching pending invitations for match:', error)
    throw error
  }

  return data?.map(invitation => invitation.invitee_id) || []
}