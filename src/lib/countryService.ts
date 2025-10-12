import { supabase } from "./supabase";
import type { Database } from "@/lib/types/supabase";

export interface Country {
  id: string;
  country_code: string;
  country_name: string;
  flag_emoji: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Obtiene todos los países disponibles ordenados por nombre
 */
export async function getAllCountries(): Promise<Country[]> {
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .order('country_name', { ascending: true });

    if (error) {
      console.error('Error fetching countries:', error);
      return [];
    }

    const rows = (data ?? []) as Database["public"]["Tables"]["countries"]["Row"][];
    return rows.map(r => ({
      id: r.id,
      country_code: r.country_code,
      country_name: r.country_name,
      flag_emoji: r.flag_emoji,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  } catch (error) {
    console.error('Error in getAllCountries:', error);
    return [];
  }
}

/**
 * Obtiene un país específico por su código
 */
export async function getCountryByCode(countryCode: string): Promise<Country | null> {
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('country_code', countryCode.toUpperCase())
      .single();

    if (error || !data) {
      console.error('Error fetching country:', error);
      return null;
    }

    const row = data as Database["public"]["Tables"]["countries"]["Row"];
    return {
      id: row.id,
      country_code: row.country_code,
      country_name: row.country_name,
      flag_emoji: row.flag_emoji,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  } catch (error) {
    console.error('Error in getCountryByCode:', error);
    return null;
  }
}

/**
 * Busca países por nombre (para autocompletado)
 */
export async function searchCountries(query: string): Promise<Country[]> {
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .ilike('country_name', `%${query}%`)
      .order('country_name', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error searching countries:', error);
      return [];
    }

    const rows = (data ?? []) as Database["public"]["Tables"]["countries"]["Row"][];
    return rows.map(r => ({
      id: r.id,
      country_code: r.country_code,
      country_name: r.country_name,
      flag_emoji: r.flag_emoji,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  } catch (error) {
    console.error('Error in searchCountries:', error);
    return [];
  }
}

/**
 * Países más populares (hispanohablantes principalmente)
 */
export function getPopularCountries(): string[] {
  return [
    'ES', // España
    'AR', // Argentina
    'MX', // México
    'CO', // Colombia
    'CL', // Chile
    'PE', // Perú
    'EC', // Ecuador
    'UY', // Uruguay
    'BR', // Brasil
    'US', // Estados Unidos
  ];
}

/**
 * Obtiene países populares con sus datos completos
 */
export async function getPopularCountriesData(): Promise<Country[]> {
  try {
    const popularCodes = getPopularCountries();
    
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .in('country_code', popularCodes)
      .order('country_name', { ascending: true });

    if (error) {
      console.error('Error fetching popular countries:', error);
      return [];
    }

    const rows = (data ?? []) as Database["public"]["Tables"]["countries"]["Row"][];

    // Ordenar según el orden de popularidad
    const orderedData = popularCodes
      .map(code => rows.find(country => country.country_code === code))
      .filter((c): c is Database["public"]["Tables"]["countries"]["Row"] => Boolean(c))
      .map(r => ({
        id: r.id,
        country_code: r.country_code,
        country_name: r.country_name,
        flag_emoji: r.flag_emoji,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));

    return orderedData;
  } catch (error) {
    console.error('Error in getPopularCountriesData:', error);
    return [];
  }
}