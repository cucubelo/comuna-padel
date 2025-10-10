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
    password: string
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
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert({
                id: userId,
                username,
                full_name: user.user_metadata?.full_name || null,
                skill_level:
                  typeof user.user_metadata?.skill_level === "number"
                    ? user.user_metadata?.skill_level
                    : 1,
              })
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
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          username,
          full_name: userData?.full_name || null,
          skill_level:
            typeof userData?.skill_level === "number"
              ? userData.skill_level
              : 1,
        });

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
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Error en inicio de sesión:", error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error("Error inesperado en inicio de sesión:", error);
      return { error: error as AuthError };
    }
  };

  // Función para cerrar sesión
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error cerrando sesión:", error);
        return { error };
      }

      // Limpiar estado local
      setUser(null);
      setProfile(null);
      setSession(null);

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

      // Intentar actualizar el perfil existente
      const { data, error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", user.id)
        .select();

      console.log("Resultado de la actualización:", { data, error });

      if (error) {
        console.error("Error en la actualización:", error);

        // Si el perfil no existe, intentar crearlo
        if (error.code === "PGRST116") {
          console.log("Perfil no existe, intentando crear uno nuevo");

          const newProfile = {
            id: user.id,
            username:
              profileData.full_name?.toLowerCase().replace(/\s+/g, "_") +
              "_" +
              Math.random().toString(36).substr(2, 9),
            ...profileData,
          };

          console.log("Datos para crear nuevo perfil:", newProfile);

          const { data: newData, error: createError } = await supabase
            .from("profiles")
            .insert([newProfile])
            .select();

          console.log("Resultado de la creación:", { newData, createError });

          if (createError) {
            console.error("Error creando perfil:", createError);
            return { error: new Error(createError.message) };
          }

          if (newData && newData[0]) {
            setProfile(newData[0]);
            console.log("Perfil creado exitosamente:", newData[0]);
            return { error: null };
          }
        }

        return { error: new Error(error.message) };
      }

      if (data && data[0]) {
        setProfile(data[0]);
        console.log("Perfil actualizado exitosamente:", data[0]);
        return { error: null };
      }

      console.error("No se recibieron datos después de la actualización");
      return { error: new Error("No se pudo actualizar el perfil") };
    } catch (err) {
      console.error("Error inesperado en updateProfile:", err);
      return { error: new Error("Error inesperado al actualizar el perfil") };
    }
  };

  // Efecto para manejar cambios de autenticación
  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error obteniendo sesión inicial:", error);
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profileData = await loadProfile(session.user.id);
        setProfile(profileData);
      }

      setLoading(false);
    };

    getInitialSession();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profileData = await loadProfile(session.user.id);
        setProfile(profileData);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
