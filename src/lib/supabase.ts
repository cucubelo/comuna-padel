import { createClient } from '@supabase/supabase-js'

// Validación de variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno de Supabase. ' +
    'Asegúrate de configurar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu archivo .env.local'
  )
}

// Cliente de Supabase para uso en el frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configuración de autenticación
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Configurar tiempo de expiración de sesión (24 horas)
    flowType: 'pkce'
  },
  // Configuración adicional para mejor rendimiento
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Tipos de base de datos basados en la estructura real de Supabase
export type Database = {
  public: {
    Tables: {
      countries: {
        Row: {
          id: string
          country_code: string
          country_name: string
          flag_emoji: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          country_code: string
          country_name: string
          flag_emoji?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          country_code?: string
          country_name?: string
          flag_emoji?: string | null
          updated_at?: string | null
        }
      }
      postal_codes: {
        Row: {
          id: string
          postal_code: string
          country_code: string
          place_name: string
          admin_name1: string | null
          admin_name2: string | null
          admin_name3: string | null
          admin_code1: string | null
          admin_code2: string | null
          admin_code3: string | null
          latitude: number | null
          longitude: number | null
          search_count: number | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          postal_code: string
          country_code: string
          place_name: string
          admin_name1?: string | null
          admin_name2?: string | null
          admin_name3?: string | null
          admin_code1?: string | null
          admin_code2?: string | null
          admin_code3?: string | null
          latitude?: number | null
          longitude?: number | null
          search_count?: number | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          postal_code?: string
          country_code?: string
          place_name?: string
          admin_name1?: string | null
          admin_name2?: string | null
          admin_name3?: string | null
          admin_code1?: string | null
          admin_code2?: string | null
          admin_code3?: string | null
          latitude?: number | null
          longitude?: number | null
          search_count?: number | null
          updated_at?: string | null
        }
      }
       profiles: {
          Row: {
            id: string
            username: string | null
            email: string
            full_name: string | null
            avatar_url: string | null
            phone: string | null
            location: string | null
            postal_code: string | null
            place_name: string | null
            admin_name1: string | null
            admin_name2: string | null
            admin_name3: string | null
            admin_code1: string | null
            admin_code2: string | null
            admin_code3: string | null
            city: string | null
            country: string | null
            country_code: string | null
            latitude: number | null
            longitude: number | null
            bio: string | null
            skill_level: number | null
            preferred_position: 'left' | 'right' | 'both' | null
            subscription_status: 'free' | 'premium' | 'pro'
            created_at: string
            updated_at: string | null
            matches_played: number
            matches_won: number
            matches_lost: number
          }
          Insert: {
            id: string
            username?: string | null
            email: string
            full_name?: string | null
            avatar_url?: string | null
            phone?: string | null
            location?: string | null
            postal_code?: string | null
            place_name?: string | null
            admin_name1?: string | null
            admin_name2?: string | null
            admin_name3?: string | null
            admin_code1?: string | null
            admin_code2?: string | null
            admin_code3?: string | null
            city?: string | null
            country?: string | null
            country_code?: string | null
            latitude?: number | null
            longitude?: number | null
            bio?: string | null
            skill_level?: number | null
            preferred_position?: 'left' | 'right' | 'both' | null
            subscription_status?: 'free' | 'premium' | 'pro'
            created_at?: string
            updated_at?: string | null
            matches_played?: number
            matches_won?: number
            matches_lost?: number
        }
        Update: {
          id?: string
          username?: string | null
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          location?: string | null
          postal_code?: string | null
          place_name?: string | null
          admin_name1?: string | null
          admin_name2?: string | null
          admin_name3?: string | null
          admin_code1?: string | null
          admin_code2?: string | null
          admin_code3?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          latitude?: number | null
          longitude?: number | null
          bio?: string | null
          skill_level?: number | null
          preferred_position?: 'left' | 'right' | 'both' | null
          subscription_status?: 'free' | 'premium' | 'pro'
          updated_at?: string | null
          matches_played?: number
          matches_won?: number
          matches_lost?: number
        }
      }
      groups: {
        Row: {
          id: string
          creator_id: string
          name: string
          description: string | null
          group_type: 'private' | 'public'
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          name: string
          description?: string | null
          group_type?: 'private' | 'public'
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          name?: string
          description?: string | null
          group_type?: 'private' | 'public'
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
        }
      }
      group_members: {
        Row: {
          group_id: string
          user_id: string
          role: 'admin' | 'member'
          joined_at: string
          points: number
        }
        Insert: {
          group_id: string
          user_id: string
          role?: 'admin' | 'member'
          joined_at?: string
          points?: number
        }
        Update: {
          group_id?: string
          user_id?: string
          role?: 'admin' | 'member'
          joined_at?: string
          points?: number
        }
      }
      matches: {
        Row: {
          id: string
          group_id: string
          creator_id: string | null
          scheduled_at: string
          location_name: string
          latitude: number | null
          longitude: number | null
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          is_public: boolean
          required_skill_level: number | null
          team1_score: number | null
          team2_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          creator_id?: string | null
          scheduled_at: string
          location_name: string
          latitude?: number | null
          longitude?: number | null
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          is_public?: boolean
          required_skill_level?: number | null
          team1_score?: number | null
          team2_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          creator_id?: string | null
          scheduled_at?: string
          location_name?: string
          latitude?: number | null
          longitude?: number | null
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          is_public?: boolean
          required_skill_level?: number | null
          team1_score?: number | null
          team2_score?: number | null
        }
      }
      match_participants: {
        Row: {
          match_id: string
          user_id: string
          team_number: number | null
          joined_at: string
          status: string | null
        }
        Insert: {
          match_id: string
          user_id: string
          team_number?: number | null
          joined_at?: string
          status?: string | null
        }
        Update: {
          match_id?: string
          user_id?: string
          team_number?: number | null
          joined_at?: string
          status?: string | null
        }
      }
      chat_messages: {
        Row: {
          id: number
          sender_id: string
          group_id: string | null
          match_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: number
          sender_id: string
          group_id?: string | null
          match_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: number
          sender_id?: string
          group_id?: string | null
          match_id?: string | null
          content?: string
        }
      }
      payments: {
        Row: {
          id: string
          match_id: string
          user_id: string
          amount: number
          status: string
          payment_provider_tx_id: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          match_id: string
          user_id: string
          amount: number
          status?: string
          payment_provider_tx_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          match_id?: string
          user_id?: string
          amount?: number
          status?: string
          payment_provider_tx_id?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      group_type: 'private' | 'public'
      user_role: 'admin' | 'member'
      match_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
      subscription_status: 'free' | 'premium' | 'pro'
      skill_level: 'beginner' | 'intermediate' | 'advanced' | 'professional'
      preferred_position: 'left' | 'right' | 'both'
    }
  }
}

// Cliente tipado para mejor experiencia de desarrollo
export type SupabaseClient = typeof supabase

// Funciones de utilidad para manejo de errores
export const handleSupabaseError = (error: { code?: string; message?: string }) => {
  console.error('Error de Supabase:', error)
  
  // Manejo específico de errores comunes
  if (error?.code === 'PGRST301') {
    return 'No se encontraron datos'
  }
  
  if (error?.code === '23505') {
    return 'Este registro ya existe'
  }
  
  if (error?.message?.includes('JWT')) {
    return 'Sesión expirada. Por favor, inicia sesión nuevamente'
  }
  
  return error?.message || 'Ha ocurrido un error inesperado'
}

// Función para verificar si el usuario está autenticado
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error al obtener usuario:', error)
    return null
  }
  
  return user
}

// Función para cerrar sesión
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Error al cerrar sesión:', error)
    throw error
  }
}