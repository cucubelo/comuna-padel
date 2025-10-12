"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase, Database } from "@/lib/supabase";

// Tipos para el contexto de autenticación
interface UserData {
  full_name?: string;
  phone?: string;
  skill_level?: number;
  preferred_position?: string;
  bio?: string;
  location?: string;
  username?: string;
}

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
// type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    userData?: UserData
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string,
    remember30Days?: boolean
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  updateProfile: (
    updates: Partial<Profile>
  ) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para cargar el perfil del usuario
  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // PGRST116 significa que no se encontraron filas (0 rows)
        // Para usuarios nuevos, intentamos crear un perfil básico automáticamente
        if (error.code === "PGRST116") {
          // Obtener información del usuario autenticado
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user && user.id === userId) {
            // Crear perfil básico automáticamente
            const username =
              (user.user_metadata?.username as string | undefined) ??
              (user.email
                ? user.email.split("@")[0]
                : `user_${user.id.slice(0, 8)}`);
            
            const profileData: ProfileInsert = {
              id: userId,
              username,
              full_name: user.user_metadata?.full_name || null,
              skill_level:
                typeof user.user_metadata?.skill_level === "number"
                  ? user.user_metadata?.skill_level
                  : 1,
            };

            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .upsert([profileData])
              .select()
              .single();

            if (createError) {
              console.error(
                "Error creando perfil automáticamente:",
                createError
              );
              return null;
            }

            return newProfile;
          }

          return null;
        }

        console.error("Error cargando perfil:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error inesperado cargando perfil:", error);
      return null;
    }
  };

  // Función para refrescar el perfil
  const refreshProfile = async () => {
    if (user) {
      const profileData = await loadProfile(user.id);
      setProfile(profileData);
    }
  };

  // Función para registrarse
  const signUp = async (
    email: string,
    password: string,
    userData?: UserData
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData?.full_name || "",
            phone: userData?.phone || "",
            skill_level:
              typeof userData?.skill_level === "number"
                ? userData.skill_level
                : 1,
            preferred_position: userData?.preferred_position || "both",
            bio: userData?.bio || "",
            location: userData?.location || "",
          },
        },
      });

      if (error) {
        console.error("Error en registro:", error);
        return { error };
      }

      // Si el registro es exitoso y hay un usuario, crear el perfil
      if (data.user) {
        const username =
          userData?.username ??
          (data.user.email
            ? data.user.email.split("@")[0]
            : `user_${data.user.id.slice(0, 8)}`);
        
        const newProfileData: ProfileInsert = {
          id: data.user.id,
          username,
          full_name: userData?.full_name || null,
          skill_level:
            typeof userData?.skill_level === "number"
              ? userData.skill_level
              : 1,
        };

        const { error: profileError } = await supabase
          .from("profiles")
          .insert([newProfileData]);

        if (profileError) {
          console.error("Error creando perfil:", profileError);
        }
      }

      return { error: null };
    } catch (error) {
      console.error("Error inesperado en registro:", error);
      return { error: error as AuthError };
    }
  };

  // Función para iniciar sesión
  const signIn = async (
    email: string,
    password: string,
    remember30Days: boolean = false
  ) => {
    try {
      setLoading(true);

      // Usar el endpoint del servidor para que las cookies HTTP-only de Supabase se establezcan correctamente
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // aseguramos el envío/recepción de cookies
        credentials: 'include',
        body: JSON.stringify({ email, password, remember30Days })
      })

      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({} as { error?: string }))
        setLoading(false)
        return { error: new AuthError(data?.error || 'Error al iniciar sesión') }
      }

      const data: { user?: User | null } = await res.json()
      const loggedUser: User | null = data?.user ?? null

      if (!loggedUser) {
        setLoading(false)
        return { error: new AuthError('No se obtuvo usuario tras el login') }
      }

      // Carga de perfil y actualización de estado
      const profileData = await loadProfile(loggedUser.id)
      setProfile(profileData)
      setUser(loggedUser)
      setSession(null)
      setLoading(false)

      return { error: null }
    } catch (error) {
      console.error('Error inesperado en inicio de sesión:', error)
      setLoading(false)
      return { error: error as AuthError }
    }
  };

  // Función para cerrar sesión
  const signOut = async () => {
    try {
      console.log("Iniciando proceso de cierre de sesión...");
      
      // Usar el endpoint del servidor para limpiar cookies HTTP-only
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({} as { error?: string }))
        const msg: string = data?.error || 'Error cerrando sesión'
        console.error("Error cerrando sesión (server):", msg)
        return { error: { message: msg } as AuthError }
      }

      // Limpiar estado local inmediatamente
      setUser(null);
      setProfile(null);
      setSession(null);
      setLoading(false);

      console.log("Sesión cerrada exitosamente");
      return { error: null };
    } catch (error) {
      console.error("Error inesperado cerrando sesión:", error);
      return { error: error as AuthError };
    }
  };

  // Función para actualizar perfil
  const updateProfile = async (
    profileData: Partial<Profile>
  ): Promise<{ error: Error | null }> => {
    if (!user) {
      console.error("No hay usuario autenticado");
      return { error: new Error("No hay usuario autenticado") };
    }

    try {
      console.log("Iniciando updateProfile con datos:", profileData);
      console.log("Usuario actual:", user.id);

      // Usar upsert para manejar tanto insert como update
      const profileToUpsert: ProfileInsert = {
        id: user.id,
        username: profileData.username ||
          (profileData.full_name?.toLowerCase().replace(/\s+/g, "_") + "_" + Math.random().toString(36).substr(2, 9)),
        ...profileData,
        updated_at: new Date().toISOString(),
      };

      console.log("Datos para upsert:", profileToUpsert);

      const { data, error } = await supabase
        .from("profiles")
        .upsert([profileToUpsert])
        .select();

      console.log("Resultado del upsert:", { data, error });

      if (error) {
        console.error("Error en el upsert:", error);
        return { error: new Error(error.message) };
      }

      if (data && data.length > 0) {
        setProfile(data[0]);
        console.log("Perfil guardado exitosamente:", data[0]);
      }

      return { error: null };
    } catch (error) {
      console.error("Error inesperado en updateProfile:", error);
      return {
        error: new Error(
          error instanceof Error ? error.message : "Error desconocido"
        ),
      };
    }
  };

  // Efecto para manejar cambios de autenticación
  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        console.log('Obteniendo sesión inicial (cookies clásico)...')

        // Comprobación de expiración suave basada en preferencia del usuario
        try {
          const getCookie = (name: string): string | null => {
            const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'))
            return match ? decodeURIComponent(match[2]) : null
          }
          const loginAtStr = typeof document !== 'undefined' ? getCookie('cp_login_at') : null
          const rememberFlag = typeof document !== 'undefined' ? getCookie('cp_remember_30') : null

          console.log('🔍 Verificando expiración de sesión:', {
            loginAtStr,
            rememberFlag,
            remember30Days: rememberFlag === '1'
          })

          if (loginAtStr) {
            const loginAt = new Date(loginAtStr).getTime()
            const now = Date.now()
            const diffMs = now - loginAt
            const diffDays = diffMs / (1000 * 60 * 60 * 24)
            const maxDays = rememberFlag === '1' ? 30 : 7

            console.log('⏰ Análisis de tiempo:', {
              loginAt: new Date(loginAt).toISOString(),
              now: new Date(now).toISOString(),
              diffDays: diffDays.toFixed(2),
              maxDays,
              expired: diffDays > maxDays
            })

            if (diffDays > maxDays) {
              console.log(`❌ Sesión expirada por política de ${maxDays} días. Cerrando sesión...`)
              // Cerrar sesión en el servidor para limpiar cookies
              await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
              setUser(null)
              setSession(null)
              setProfile(null)
              setLoading(false)
              return
            } else {
              console.log(`✅ Sesión válida (${diffDays.toFixed(2)}/${maxDays} días)`)
            }
          } else {
            console.log('ℹ️ No hay cookie de login, sesión nueva o limpia')
          }
        } catch (softErr) {
          console.warn('Error comprobando expiración suave:', softErr)
        }

        const res = await fetch('/api/auth/me', { method: 'GET' })
        if (!res.ok) {
          console.log('Sin sesión')
          setUser(null)
          setSession(null)
          setLoading(false)
          return
        }

        const data: { user?: User | null } = await res.json()
        const currentUser: User | null = data?.user ?? null

        console.log('Sesión inicial obtenida:', currentUser ? 'Sesión activa' : 'Sin sesión')

        setUser(currentUser)
        setSession(null)
        setLoading(false)

        if (currentUser?.id) {
          console.log('Cargando perfil para usuario:', currentUser.id)
          loadProfile(currentUser.id).then((profileData) => {
            setProfile(profileData)
          })
        }
      } catch (error) {
        console.error('Error inesperado obteniendo sesión inicial:', error)
        setLoading(false)
      }
    }

    getInitialSession()
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
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook personalizado para usar el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }

  return context;
}

// Hook para verificar si el usuario está autenticado
export function useRequireAuth() {
  const { user, loading } = useAuth();

  return {
    user,
    loading,
    isAuthenticated: !!user && !loading,
  };
}
