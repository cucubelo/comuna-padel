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
        // Esto es normal para usuarios nuevos que aún no tienen perfil
        if (error.code === 'PGRST116') {
          console.log('No se encontró perfil para el usuario, esto es normal para usuarios nuevos')
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
  const signUp = async (email: string, password: string, userData?: Partial<Profile>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData?.full_name || '',
            phone: userData?.phone || '',
            skill_level: userData?.skill_level || 'beginner',
            preferred_position: userData?.preferred_position || 'both',
            bio: userData?.bio || '',
            location: userData?.location || ''
          }
        }
      })

      if (error) {
        console.error('Error en registro:', error)
        return { error }
      }

      // Si el registro es exitoso y hay un usuario, crear el perfil
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: userData?.full_name || null,
            phone: userData?.phone || null,
            skill_level: userData?.skill_level || 'beginner',
            preferred_position: userData?.preferred_position || 'both',
            bio: userData?.bio || null,
            location: userData?.location || null
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
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
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
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email!,
              full_name: updates.full_name || null,
              phone: updates.phone || null,
              skill_level: updates.skill_level || 'beginner',
              preferred_position: updates.preferred_position || 'both',
              bio: updates.bio || null,
              location: updates.location || null
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