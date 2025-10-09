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
    detectSessionInUrl: true
  },
  // Configuración adicional para mejor rendimiento
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Tipos de base de datos basados en el schema proporcionado
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          preferred_position: 'left' | 'right' | 'both'
          bio: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          preferred_position?: 'left' | 'right' | 'both'
          bio?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          preferred_position?: 'left' | 'right' | 'both'
          bio?: string | null
          location?: string | null
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          creator_id: string
          max_members: number
          is_private: boolean
          location: string | null
          skill_level_required: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          creator_id: string
          max_members?: number
          is_private?: boolean
          location?: string | null
          skill_level_required?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          creator_id?: string
          max_members?: number
          is_private?: boolean
          location?: string | null
          skill_level_required?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'admin' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'admin' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'admin' | 'member'
          joined_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          group_id: string
          organizer_id: string
          title: string
          description: string | null
          scheduled_date: string
          duration_minutes: number
          max_participants: number
          court_location: string | null
          cost_per_person: number | null
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          organizer_id: string
          title: string
          description?: string | null
          scheduled_date: string
          duration_minutes?: number
          max_participants?: number
          court_location?: string | null
          cost_per_person?: number | null
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          organizer_id?: string
          title?: string
          description?: string | null
          scheduled_date?: string
          duration_minutes?: number
          max_participants?: number
          court_location?: string | null
          cost_per_person?: number | null
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          updated_at?: string
        }
      }
      match_participants: {
        Row: {
          id: string
          match_id: string
          user_id: string
          status: 'confirmed' | 'pending' | 'declined'
          joined_at: string
        }
        Insert: {
          id?: string
          match_id: string
          user_id: string
          status?: 'confirmed' | 'pending' | 'declined'
          joined_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          user_id?: string
          status?: 'confirmed' | 'pending' | 'declined'
          joined_at?: string
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
      skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
      preferred_position: 'left' | 'right' | 'both'
      group_role: 'admin' | 'member'
      match_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
      participant_status: 'confirmed' | 'pending' | 'declined'
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