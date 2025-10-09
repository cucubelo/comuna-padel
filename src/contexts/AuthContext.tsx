/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, Database } from '@/lib/supabase'

// Tipos para el contexto de autenticación
type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, userData?: Record<string, unknown>) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Función para cargar el perfil del usuario
  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // PGRST116 significa que no se encontraron filas (0 rows)
        // Para usuarios nuevos, intentamos crear un perfil básico automáticamente
        if (error.code === 'PGRST116') {
          console.log('No se encontró perfil para el usuario, creando perfil básico...')
          
          // Obtener información del usuario autenticado
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user && user.id === userId) {
            // Crear perfil básico automáticamente
            const username = (user.user_metadata?.username as string | undefined)
              ?? (user.email ? user.email.split('@')[0] : `user_${user.id.slice(0, 8)}`)
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                username,
                full_name: user.user_metadata?.full_name || null,
                skill_level: typeof user.user_metadata?.skill_level === 'number' ? user.user_metadata?.skill_level : 1
              })
              .select()
              .single()

            if (createError) {
              console.error('Error creando perfil automáticamente:', createError)
              return null
            }

            console.log('Perfil creado automáticamente:', newProfile)
            return newProfile
          }
          
          return null
        }
        
        console.error('Error cargando perfil:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error inesperado cargando perfil:', error)
      return null
    }
  }

  // Función para refrescar el perfil
  const refreshProfile = async () => {
    if (user) {
      const profileData = await loadProfile(user.id)
      setProfile(profileData)
    }
  }

  // Función para registrarse
  const signUp = async (email: string, password: string, userData?: Record<string, unknown>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: (userData as any)?.full_name || '',
            phone: (userData as any)?.phone || '',
            skill_level: typeof (userData as any)?.skill_level === 'number' ? (userData as any).skill_level : 1,
            preferred_position: (userData as any)?.preferred_position || 'both',
            bio: (userData as any)?.bio || '',
            location: (userData as any)?.location || ''
          }
        }
      })

      if (error) {
        console.error('Error en registro:', error)
        return { error }
      }

      // Si el registro es exitoso y hay un usuario, crear el perfil
      if (data.user) {
        const username = ((userData as any)?.username as string | undefined)
          ?? (data.user.email ? data.user.email.split('@')[0] : `user_${data.user.id.slice(0, 8)}`)
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username,
            full_name: (userData as any)?.full_name || null,
            skill_level: typeof (userData as any)?.skill_level === 'number' ? (userData as any).skill_level : 1
          })
 
         if (profileError) {
           console.error('Error creando perfil:', profileError)
         }
      }

      return { error: null }
    } catch (error) {
      console.error('Error inesperado en registro:', error)
      return { error: error as AuthError }
    }
  }

  // Función para iniciar sesión
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Error en inicio de sesión:', error)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('Error inesperado en inicio de sesión:', error)
      return { error: error as AuthError }
    }
  }

  // Función para cerrar sesión
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Error cerrando sesión:', error)
        return { error }
      }

      // Limpiar estado local
      setUser(null)
      setProfile(null)
      setSession(null)

      return { error: null }
    } catch (error) {
      console.error('Error inesperado cerrando sesión:', error)
      return { error: error as AuthError }
    }
  }

  // Función para actualizar perfil
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('No hay usuario autenticado') }
    }

    try {
      const { bio: _omitBio, email: _omitEmail, phone: _omitPhone, location: _omitLocation, preferred_position: _omitPreferredPosition, ...safeUpdates } = updates as any
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...safeUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        // Si el perfil no existe (PGRST116), intentar crearlo primero
        if (error.code === 'PGRST116') {
          console.log('Perfil no existe, creando uno nuevo...')
          
          // Crear perfil básico
          const username = (updates.username as string | undefined)
            ?? (user.email ? user.email.split('@')[0] : `user_${user.id.slice(0, 8)}`)
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username,
              full_name: updates.full_name || null,
              skill_level: typeof updates.skill_level === 'number' ? updates.skill_level : 1
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creando perfil:', createError)
            return { error: createError as Error }
          }

          // Actualizar estado local con el nuevo perfil
          setProfile(newProfile)
          return { error: null }
        }
        
        console.error('Error actualizando perfil:', error)
        return { error: error as Error }
      }

      // Actualizar estado local
      setProfile(data)
      return { error: null }
    } catch (error) {
      console.error('Error inesperado actualizando perfil:', error)
      return { error: error as Error }
    }
  }

  // Efecto para manejar cambios de autenticación
  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error obteniendo sesión inicial:', error)
      }

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const profileData = await loadProfile(session.user.id)
        setProfile(profileData)
      }

      setLoading(false)
    }

    getInitialSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Evento de autenticación:', event)
        
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const profileData = await loadProfile(session.user.id)
          setProfile(profileData)
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado para usar el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  
  return context
}

// Hook para verificar si el usuario está autenticado
export function useRequireAuth() {
  const { user, loading } = useAuth()
  
  return {
    user,
    loading,
    isAuthenticated: !!user && !loading
  }
}