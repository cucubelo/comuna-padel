import { supabase } from './supabase'
import type { Database } from './types/supabase'

// Tipos explícitos para las operaciones
export type GroupAccessRequestRow =
  Database['public']['Tables']['group_access_requests']['Row']
type GroupAccessRequestInsert =
  Database['public']['Tables']['group_access_requests']['Insert']
type GroupAccessRequestUpdate =
  Database['public']['Tables']['group_access_requests']['Update']
type GroupMemberInsert = Database['public']['Tables']['group_members']['Insert']

export interface CreateAccessRequestParams {
  groupId: string
  userId: string
  message?: string
}

export interface AccessRequestWithProfile extends GroupAccessRequestRow {
  profiles: {
    full_name: string | null
    avatar_url: string | null
    skill_level: number | null
    city: string | null
    country: string | null
  } | null
}

export async function createAccessRequest({
  groupId,
  userId,
  message
}: CreateAccessRequestParams) {
  try {
    // Verificar si ya existe una solicitud pendiente
    const { data: existingRequest } = await supabase
      .from('group_access_requests')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      throw new Error('Ya tienes una solicitud pendiente para este grupo')
    }

    // Verificar si ya es miembro del grupo
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()

    if (existingMember) {
      throw new Error('Ya eres miembro de este grupo')
    }

    // Crear la solicitud de acceso
    const requestData: GroupAccessRequestInsert = {
      group_id: groupId,
      user_id: userId,
      status: 'pending',
      message: message || null,
      requested_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('group_access_requests')
      .insert(requestData)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error creating access request:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }
  }
}

export async function getGroupAccessRequests(groupId: string) {
  try {
    const { data, error } = await supabase
      .from('group_access_requests')
      .select(`
        *,
        profiles!user_id (
          full_name,
          avatar_url,
          skill_level,
          city,
          country
        )
      `)
      .eq('group_id', groupId)
      .order('requested_at', { ascending: false })

    if (error) throw error

    return { data: data as AccessRequestWithProfile[], error: null }
  } catch (error) {
    console.error('Error fetching group access requests:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }
  }
}

export async function getUserAccessRequests(userId: string) {
  try {
    const { data, error } = await supabase
      .from('group_access_requests')
      .select(`
        *,
        groups (
          name,
          description
        )
      `)
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching user access requests:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }
  }
}

export async function approveAccessRequest(
  requestId: string,
  adminId: string,
  adminResponse?: string
) {
  try {
    // Obtener la solicitud
    const { data: request, error: fetchError } = await supabase
      .from('group_access_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError) throw fetchError
    if (!request) throw new Error('Solicitud no encontrada')

    // Actualizar la solicitud
    const updateData: GroupAccessRequestUpdate = {
      status: 'approved',
      responded_at: new Date().toISOString(),
      responded_by: adminId,
      admin_response: adminResponse || null,
      updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('group_access_requests')
      .update(updateData)
      .eq('id', requestId)

    if (updateError) throw updateError

    // Agregar al usuario como miembro del grupo
    const memberData: GroupMemberInsert = {
      group_id: request.group_id,
      user_id: request.user_id,
      role: 'member',
      joined_at: new Date().toISOString(),
      points: 0
    }

    const { error: insertError } = await supabase
      .from('group_members')
      .insert(memberData)

    if (insertError) throw insertError

    return { error: null }
  } catch (error) {
    console.error('Error approving access request:', error)
    return { 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }
  }
}

export async function rejectAccessRequest(
  requestId: string,
  adminId: string,
  adminResponse?: string
) {
  try {
    // Obtener la solicitud
    const { data: request, error: fetchError } = await supabase
      .from('group_access_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError) throw fetchError
    if (!request) throw new Error('Solicitud no encontrada')

    // Actualizar la solicitud
    const updateData: GroupAccessRequestUpdate = {
      status: 'rejected',
      responded_at: new Date().toISOString(),
      responded_by: adminId,
      admin_response: adminResponse || null,
      updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('group_access_requests')
      .update(updateData)
      .eq('id', requestId)

    if (updateError) throw updateError

    return { error: null }
  } catch (error) {
    console.error('Error rejecting access request:', error)
    return { 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }
  }
}

export async function hasUserPendingRequest(groupId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('group_access_requests')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return !!data
  } catch (error) {
    console.error('Error checking pending request:', error)
    return false
  }
}