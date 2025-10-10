import { supabase } from "./supabase";

export interface PostalCode {
  id?: string;
  postal_code: string;
  country_code: string;
  place_name: string;
  admin_name1?: string; // Comunidad/Estado/Provincia
  admin_name2?: string; // Provincia/Condado
  admin_name3?: string; // Municipio/Ciudad
  admin_code1?: string; // Código de Comunidad/Estado
  admin_code2?: string; // Código de Provincia
  admin_code3?: string; // Código de Municipio
  latitude?: number;
  longitude?: number;
  search_count?: number;
  display_name?: string;
}

// Interfaz para la respuesta de la API de GeoNames
interface GeoNamesResponse {
  postalCodes: Array<{
    adminCode2: string;
    adminCode3: string;
    adminName3: string;
    adminCode1: string;
    adminName2: string;
    lng: number;
    countryCode: string;
    postalCode: string;
    adminName1: string;
    'ISO3166-2': string;
    placeName: string;
    lat: number;
  }>;
}

/**
 * Busca códigos postales en la base de datos local
 */
export async function searchLocalPostalCodes(
  postalCode: string,
  countryCode: string
): Promise<PostalCode[]> {
  try {
    const { data, error } = await supabase
      .from('postal_codes')
      .select('*')
      .eq('postal_code', postalCode)
      .eq('country_code', countryCode.toUpperCase())
      .order('search_count', { ascending: false });

    if (error) {
      console.error('Error searching local postal codes:', error);
      return [];
    }

    return data?.map(item => ({
      ...item,
      display_name: `${item.place_name}, ${item.admin_name1 || item.admin_name2 || item.admin_name3}`
    })) || [];
  } catch (error) {
    console.error('Error in searchLocalPostalCodes:', error);
    return [];
  }
}

/**
 * Busca códigos postales en la API de GeoNames
 */
export async function searchGeoNamesAPI(
  postalCode: string,
  countryCode: string
): Promise<PostalCode[]> {
  try {
    const username = 'cucubelo'; // Tu username de GeoNames
    const url = `http://api.geonames.org/postalCodeSearchJSON?postalcode=${postalCode}&country=${countryCode}&maxRows=10&username=${username}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: GeoNamesResponse = await response.json();
    
    if (!data.postalCodes || data.postalCodes.length === 0) {
      return [];
    }

    return data.postalCodes.map(item => ({
      postal_code: item.postalCode,
      country_code: item.countryCode,
      place_name: item.placeName,
      admin_name1: item.adminName1,
      admin_name2: item.adminName2,
      admin_name3: item.adminName3,
      admin_code1: item.adminCode1,
      admin_code2: item.adminCode2,
      admin_code3: item.adminCode3,
      latitude: item.lat,
      longitude: item.lng,
      search_count: 1,
      display_name: `${item.placeName}, ${item.adminName1 || item.adminName2 || item.adminName3}`
    }));
  } catch (error) {
    console.error('Error searching GeoNames API:', error);
    return [];
  }
}

/**
 * Guarda un código postal en la base de datos local
 */
export async function savePostalCode(postalCode: PostalCode): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('postal_codes')
      .insert({
        postal_code: postalCode.postal_code,
        country_code: postalCode.country_code,
        place_name: postalCode.place_name,
        admin_name1: postalCode.admin_name1,
        admin_name2: postalCode.admin_name2,
        admin_name3: postalCode.admin_name3,
        admin_code1: postalCode.admin_code1,
        admin_code2: postalCode.admin_code2,
        admin_code3: postalCode.admin_code3,
        latitude: postalCode.latitude,
        longitude: postalCode.longitude,
        search_count: 1
      });

    if (error) {
      console.error('Error saving postal code:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in savePostalCode:', error);
    return false;
  }
}

/**
 * Incrementa el contador de búsquedas de un código postal
 */
export async function incrementSearchCount(
  postalCode: string,
  countryCode: string,
  placeName: string
): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_postal_code_search', {
      p_postal_code: postalCode,
      p_country_code: countryCode,
      p_place_name: placeName
    });

    if (error) {
      console.error('Error incrementing search count:', error);
    }
  } catch (error) {
    console.error('Error in incrementSearchCount:', error);
  }
}

/**
 * Búsqueda híbrida: primero local, luego API externa
 */
export async function searchPostalCodes(
  postalCode: string,
  countryCode: string
): Promise<PostalCode[]> {
  if (!postalCode || !countryCode) {
    return [];
  }

  try {
    // 1. Buscar primero en la base de datos local
    const localResults = await searchLocalPostalCodes(postalCode, countryCode);
    
    if (localResults.length > 0) {
      // Incrementar contador para el primer resultado
      await incrementSearchCount(
        localResults[0].postal_code,
        localResults[0].country_code,
        localResults[0].place_name
      );
      return localResults;
    }

    // 2. Si no hay resultados locales, buscar en la API externa
    const apiResults = await searchGeoNamesAPI(postalCode, countryCode);
    
    if (apiResults.length > 0) {
      // Guardar todos los resultados en la base de datos local
      for (const result of apiResults) {
        await savePostalCode(result);
      }
    }

    return apiResults;
  } catch (error) {
    console.error('Error in searchPostalCodes:', error);
    return [];
  }
}

/**
 * Valida el formato de un código postal según el país
 */
export function validatePostalCode(postalCode: string, countryCode: string): boolean {
  const patterns: { [key: string]: RegExp } = {
    'ES': /^\d{5}$/, // España: 5 dígitos
    'AR': /^\d{4}$/, // Argentina: 4 dígitos
    'MX': /^\d{5}$/, // México: 5 dígitos
    'CO': /^\d{6}$/, // Colombia: 6 dígitos
    'CL': /^\d{7}$/, // Chile: 7 dígitos
    'PE': /^\d{5}$/, // Perú: 5 dígitos
    'EC': /^\d{6}$/, // Ecuador: 6 dígitos
    'UY': /^\d{5}$/, // Uruguay: 5 dígitos
    'BR': /^\d{5}-?\d{3}$/, // Brasil: 5 dígitos, guión opcional, 3 dígitos
    'US': /^\d{5}(-\d{4})?$/, // Estados Unidos: 5 dígitos, opcional -4 dígitos
    'CA': /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/, // Canadá: formato A1A 1A1
  };

  const pattern = patterns[countryCode.toUpperCase()];
  return pattern ? pattern.test(postalCode) : true; // Si no hay patrón, aceptar cualquier formato
}