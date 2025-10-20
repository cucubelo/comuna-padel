'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

// Keys para las queries
export const authKeys = {
  user: ['auth', 'user'] as const,
  profile: (userId: string) => ['auth', 'profile', userId] as const,
}

// Función para obtener el usuario actual
const fetchCurrentUser = async (): Promise<User | null> => {
  try {
    const res = await fetch('/api/auth/me', { method: 'GET' })
    if (!res.ok) {
      return null
    }
    const data: { user?: User | null } = await res.json()
    return data?.user ?? null
  } catch (error) {
    console.error('Error fetching current user:', error)
    return null
  }
}

// Función para obtener el perfil del usuario
const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Usuario sin perfil, crear uno básico
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user && user.id === userId) {
          const username = user.email
            ? user.email.split('@')[0]
            : `user_${user.id.slice(0, 8)}`
          
          const profileData = {
            id: userId,
            username,
            first_name: user.user_metadata?.first_name || null,
            last_name: user.user_metadata?.last_name || null,
            birth_date: user.user_metadata?.birth_date || null,
            skill_level: typeof user.user_metadata?.skill_level === 'number'
              ? user.user_metadata?.skill_level
              : 1,
          }

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .upsert([profileData])
            .select()
            .single()

          if (createError) {
            console.error('Error creating profile:', createError)
            return null
          }

          return newProfile
        }
      }
      console.error('Error loading profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error loading profile:', error)
    return null
  }
}

// Hook principal para autenticación
export function useAuthQuery() {
  const queryClient = useQueryClient()

  // Query para el usuario
  const userQuery = useQuery({
    queryKey: authKeys.user,
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })

  // Query para el perfil (solo si hay usuario)
  const profileQuery = useQuery({
    queryKey: userQuery.data?.id ? authKeys.profile(userQuery.data.id) : ['auth', 'profile', 'none'],
    queryFn: () => userQuery.data?.id ? fetchUserProfile(userQuery.data.id) : Promise.resolve(null),
    enabled: !!userQuery.data?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })

  // Mutation para cerrar sesión
  const signOutMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/auth/logout', { method: 'POST' })
    },
    onSuccess: () => {
      // Limpiar todas las queries relacionadas con auth
      queryClient.removeQueries({ queryKey: ['auth'] })
      queryClient.clear()
    },
  })

  // Mutation para actualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<Profile>) => {
      if (!userQuery.data?.id) {
        throw new Error('No hay usuario autenticado')
      }

      // Verificar si el perfil ya existe
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userQuery.data.id)
        .single()

      // Preparar datos para actualizar/crear
      const profileToUpsert = {
        id: userQuery.data.id,
        ...profileData,
        updated_at: new Date().toISOString(),
      }

      // Si el perfil ya existe, NO permitir cambios en el username
      if (existingProfile) {
        // Remover username de los datos a actualizar para preservar el existente
        delete profileToUpsert.username
      } else {
        // Si es un perfil nuevo, generar username solo si no se proporciona uno
        if (!profileData.username) {
          profileToUpsert.username = profileData.first_name && profileData.last_name
            ? `${profileData.first_name}_${profileData.last_name}`.toLowerCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substr(2, 6)
            : profileData.first_name
            ? profileData.first_name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substr(2, 6)
            : `user_${userQuery.data.id.slice(0, 8)}`
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert([profileToUpsert])
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: (data) => {
      // Actualizar el cache del perfil
      if (userQuery.data?.id) {
        queryClient.setQueryData(authKeys.profile(userQuery.data.id), data)
      }
    },
  })

  // Función para refrescar el perfil
  const refreshProfile = () => {
    if (userQuery.data?.id) {
      queryClient.invalidateQueries({ queryKey: authKeys.profile(userQuery.data.id) })
    }
  }

  return {
    user: userQuery.data,
    profile: profileQuery.data,
    loading: userQuery.isLoading || (userQuery.data && profileQuery.isLoading),
    error: userQuery.error || profileQuery.error,
    signOut: signOutMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    refreshProfile,
    isSigningOut: signOutMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
  }
}