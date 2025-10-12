import type { Database } from "./types/supabase";
export type { Database };

// Cliente de Supabase para uso en el frontend (cookies vía SSR)
import { supabase } from "./supabase-client";
export { supabase };

// Cliente tipado para mejor experiencia de desarrollo
export type SupabaseClient = typeof supabase;

// Funciones de utilidad para manejo de errores
export const handleSupabaseError = (error: {
  code?: string;
  message?: string;
}) => {
  console.error("Error de Supabase:", error);

  // Manejo específico de errores comunes
  if (error?.code === "PGRST301") {
    return "No se encontraron datos";
  }

  if (error?.code === "23505") {
    return "Este registro ya existe";
  }

  if (error?.message?.includes("JWT")) {
    return "Sesión expirada. Por favor, inicia sesión nuevamente";
  }

  return error?.message || "Ha ocurrido un error inesperado";
};

// Función para verificar si el usuario está autenticado
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Error al obtener usuario:", error);
    return null;
  }

  return user;
};

// Función para cerrar sesión
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error al cerrar sesión:", error);
    throw error;
  }
};
