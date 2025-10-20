import { getSupabaseServerClient } from "@/lib/supabase-server";
import { extractIdFromSlug } from "./slug";

export interface GroupDetails {
  id: string;
  name: string;
  description: string | null;
  group_type: 'public' | 'private' | 'premium';
  max_members: number | null;
  skill_level_min: number | null;
  skill_level_max: number | null;
  location: string | null;
  tags: string[] | null;
  created_at: string;
  created_by: string;
  slug: string | null;
  creator_name?: string | null;
}

/**
 * Busca un grupo por ID o slug
 * @param identifier - Puede ser un UUID (ID) o un slug
 * @returns Los detalles del grupo o null si no se encuentra
 */
export async function findGroupByIdOrSlug(identifier: string): Promise<GroupDetails | null> {
  const supabase = getSupabaseServerClient();
  
  try {
    // 1. Buscar por slug completo (si la columna slug existe)
    const { data: groupBySlug, error: slugError } = await supabase
      .from("groups")
      .select(`
        id,
        name,
        description,
        group_type,
        city,
        created_at,
        creator_id,
        slug
      `)
      .eq("slug", identifier)
      .single();

    if (slugError && slugError.code !== 'PGRST116') {
      console.error(`[findGroupByIdOrSlug] Error en búsqueda por slug:`, slugError);
      // Si hay un error que no sea "no encontrado", continuar con otros métodos
    }

    if (groupBySlug) {
      // Buscar el perfil del creador por separado
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", groupBySlug.creator_id)
        .single();

      if (profileError) {
        console.warn(`[findGroupByIdOrSlug] Error buscando perfil del creador:`, profileError);
      }
      
      return {
        ...groupBySlug,
        created_by: groupBySlug.creator_id,
        slug: identifier,
        max_members: null,
        skill_level_min: null,
        skill_level_max: null,
        location: groupBySlug.city,
        tags: null,
        creator_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null
      };
    }

    // 2. Intentar buscar por ID directo (si el identificador es un UUID válido)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(identifier)) {
      const { data: groupById, error: idError } = await supabase
        .from("groups")
        .select(`
          id,
          name,
          description,
          group_type,
          city,
          created_at,
          creator_id,
          slug
        `)
        .eq("id", identifier)
        .single();

      if (idError && idError.code !== 'PGRST116') {
        console.error(`[findGroupByIdOrSlug] Error en búsqueda por ID:`, idError);
      }

      if (groupById) {
        // Buscar el perfil del creador por separado
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", groupById.creator_id)
          .single();

        if (profileError) {
          console.warn(`[findGroupByIdOrSlug] Error buscando perfil del creador por ID:`, profileError);
        }
        
        return {
          ...groupById,
          created_by: groupById.creator_id,
          slug: groupById.slug,
          max_members: null,
          skill_level_min: null,
          skill_level_max: null,
          location: groupById.city,
          tags: null,
          creator_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null
        };
      }
    }

    // 3. Buscar por nombre que contenga el identificador (fallback)
    const { data: groupByName, error: nameError } = await supabase
      .from("groups")
      .select(`
        id,
        name,
        description,
        group_type,
        city,
        created_at,
        creator_id,
        slug
      `)
      .ilike("name", `%${identifier}%`)
      .single();

    if (nameError && nameError.code !== 'PGRST116') {
      console.error(`[findGroupByIdOrSlug] Error en búsqueda por nombre:`, nameError);
    }

    if (groupByName) {
      // Buscar el perfil del creador por separado
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", groupByName.creator_id)
        .single();

      if (profileError) {
        console.warn(`[findGroupByIdOrSlug] Error buscando perfil del creador por nombre:`, profileError);
      }
      
      return {
        ...groupByName,
        created_by: groupByName.creator_id,
        slug: groupByName.slug,
        max_members: null,
        skill_level_min: null,
        skill_level_max: null,
        location: groupByName.city,
        tags: null,
        creator_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null
      };
    }

    return null;

  } catch (error) {
    console.error(`[findGroupByIdOrSlug] Error inesperado buscando grupo con identificador "${identifier}":`, error);
    
    // En lugar de lanzar el error, retornar null para evitar el 500
    // Esto permite que la aplicación maneje graciosamente el caso de grupo no encontrado
    return null;
  }
}

/**
 * Obtiene el ID real de un grupo a partir de un identificador (ID o slug)
 * @param identifier - Puede ser un UUID (ID) o un slug
 * @returns El ID del grupo o null si no se encuentra
 */
export async function getGroupIdFromIdentifier(identifier: string): Promise<string | null> {
  const group = await findGroupByIdOrSlug(identifier);
  return group?.id || null;
}

/**
 * Busca un grupo por slug únicamente
 * @param slug - El slug del grupo
 * @returns Los detalles del grupo o null si no se encuentra
 */
export async function findGroupBySlug(slug: string): Promise<GroupDetails | null> {
  const supabase = getSupabaseServerClient();
  
  try {
    // Buscar solo por slug
    const { data: groupBySlug, error: slugError } = await supabase
      .from("groups")
      .select(`
        id,
        name,
        description,
        group_type,
        city,
        created_at,
        creator_id,
        slug
      `)
      .eq("slug", slug)
      .single();

    if (slugError) {
      if (slugError.code !== 'PGRST116') {
        console.error(`[findGroupBySlug] Error en búsqueda por slug:`, slugError);
      }
      return null;
    }

    if (groupBySlug) {
      // Buscar el perfil del creador por separado
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", groupBySlug.creator_id)
        .single();

      if (profileError) {
        console.warn(`[findGroupBySlug] Error buscando perfil del creador:`, profileError);
      }
      
      return {
        ...groupBySlug,
        created_by: groupBySlug.creator_id,
        slug: slug,
        max_members: null,
        skill_level_min: null,
        skill_level_max: null,
        location: groupBySlug.city,
        tags: null,
        creator_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null
      };
    }

    return null;

  } catch (error) {
    console.error(`[findGroupBySlug] Error inesperado buscando grupo con slug "${slug}":`, error);
    return null;
  }
}

/**
 * Obtiene el ID real de un grupo a partir de un slug
 * @param slug - El slug del grupo
 * @returns El ID del grupo o null si no se encuentra
 */
export async function getGroupIdFromSlug(slug: string): Promise<string | null> {
  const group = await findGroupBySlug(slug);
  return group?.id || null;
}