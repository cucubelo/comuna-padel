import { supabase } from "./supabase";
import type { SportsLocation } from "./googlePlaces";
import type { Tables } from "./types/supabase";

// Tipo basado en la tabla de Supabase
export type SportsLocationRow = Tables<'sports_locations'>;

export interface SportsLocationResult {
  id: string;
  name: string;
  address: string;
  city?: string | null;
  state?: string | null;
  country: string;
  country_code: string;
  latitude?: number | null;
  longitude?: number | null;
  category: string;
  rating?: number | null;
  phone?: string | null;
  website?: string | null;
  usage_count?: number;
  source: 'local' | 'google';
  google_place_id?: string | null;
}

class SportsLocationService {
  /**
   * Búsqueda híbrida: primero local, luego Google Places si es necesario
   */
  /**
   * Busca ubicaciones deportivas usando búsqueda híbrida optimizada
   * 1. Busca primero en base de datos local (sin mínimo de caracteres)
   * 2. Solo busca en Google API si no hay resultados locales exactos o parciales relevantes
   */
  async searchSportsLocations(
    query: string, 
    countryCode: string = 'ES',
    limit: number = 8,
    regionFilter?: string, // Parámetro para filtrar por región/comunidad
    cityFilter?: string, // Nuevo parámetro para filtrar por ciudad específica
    groupLocationInfo?: { // Nueva información del grupo para mejorar búsquedas
      city?: string;
      region?: string;
      coordinates?: { lat: number; lng: number };
    }
  ): Promise<SportsLocationResult[]> {
    try {
      // Validar que la consulta no esté vacía
      if (!query.trim()) {
        return [];
      }

      console.log('DEBUG - searchSportsLocations called with:', {
        query,
        countryCode,
        regionFilter,
        cityFilter,
        groupLocationInfo
      });
      console.log(`🔍 [SEARCH] Iniciando búsqueda para: "${query}" en país: ${countryCode}`);
      if (groupLocationInfo) {
        console.log(`📍 [GROUP INFO] Información del grupo: ciudad=${groupLocationInfo.city}, región=${groupLocationInfo.region}`);
      }

      // 1. Buscar primero en la base de datos local
      const localResults = await this.searchLocalSportsLocations(query, countryCode, limit, regionFilter, cityFilter);
      console.log(`📍 [LOCAL] Encontrados ${localResults.length} resultados locales`);
      console.log('DEBUG - Local results:', localResults.length, 'found');
      
      // 2. Lógica mejorada para decidir si buscar en Google API
      const shouldSearchGoogle = this.shouldSearchInGoogleAPI(query, localResults);
      console.log('DEBUG - Should search Google:', shouldSearchGoogle);
      
      if (!shouldSearchGoogle) {
        console.log(`✅ [DECISION] No buscar en Google - suficientes resultados locales relevantes`);
        return localResults;
      }

      console.log(`🌐 [GOOGLE] Buscando en Google Places API...`);
      // 3. Buscar en Google Places solo si es necesario
      const googleResults = await this.searchGooglePlaces(query, countryCode, cityFilter, groupLocationInfo);
      console.log(`🌐 [GOOGLE] Encontrados ${googleResults.length} resultados de Google`);
      console.log('DEBUG - Google results:', googleResults.length, 'found');
      
      // 4. Combinar resultados (locales primero, luego Google)
      const combinedResults = [
        ...localResults,
        ...googleResults.slice(0, limit - localResults.length)
      ];
      
      console.log(`🔄 [COMBINED] Total de resultados combinados: ${combinedResults.length}`);
      console.log('DEBUG - Combined results:', combinedResults.length, 'total');
      
      return combinedResults.slice(0, limit);
    } catch (error) {
      console.error('Error in hybrid sports location search:', error);
      // En caso de error, intentar solo búsqueda local
      return await this.searchLocalSportsLocations(query, countryCode, limit);
    }
  }

  /**
   * Determina si se debe buscar en Google API basado en la existencia de resultados locales
   * REGLA SIMPLE: Si hay cualquier resultado local, NO buscar en Google API
   */
  private shouldSearchInGoogleAPI(query: string, localResults: SportsLocationResult[]): boolean {
    // Normalizar la consulta para comparar
    const normalizedQuery = this.normalizeSearchQuery(query);

    // Si no hay resultados locales, buscar en Google
    if (localResults.length === 0) {
      return true;
    }

    // Comprobar si algún resultado local contiene la consulta en nombre o dirección
    const hasDirectMatch = localResults.some(loc => {
      const name = (loc.name || '').toLowerCase();
      const address = (loc.address || '').toLowerCase();
      return name.includes(normalizedQuery) || address.includes(normalizedQuery);
    });

    // Si NO hay coincidencia directa, buscar también en Google
    return !hasDirectMatch;
  }

  /**
   * Busca en la base de datos local de ubicaciones deportivas
   */
  private async searchLocalSportsLocations(
    query: string,
    countryCode: string,
    limit: number,
    regionFilter?: string, // Parámetro para filtrar por región
    cityFilter?: string // Nuevo parámetro para filtrar por ciudad específica
  ): Promise<SportsLocationResult[]> {
    try {
      const normalizedQuery = this.normalizeSearchQuery(query);
      console.log(`🔍 [LOCAL SEARCH] Query original: "${query}" → normalizada: "${normalizedQuery}"`);
      console.log(`🔍 [LOCAL SEARCH] Country: ${countryCode}, City filter: ${cityFilter || 'none'}, Region filter: ${regionFilter || 'none'}`);
      
      // BÚSQUEDA LOCAL: Solo buscar por nombre/dirección, SIN filtros de ciudad
      // Los filtros de ciudad/región son SOLO para Google API
      const queryBuilder = supabase
        .from('sports_locations')
        .select('*')
        .or(`name.ilike.%${normalizedQuery}%,address.ilike.%${normalizedQuery}%`)
        .eq('country_code', countryCode)
        .eq('is_active', true);

      console.log(`📊 [SQL QUERY] Ejecutando consulta SIN filtros geográficos (solo por nombre/dirección)`);
      const { data, error } = await queryBuilder
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ [LOCAL SEARCH ERROR]:', error);
        return [];
      }

      console.log(`✅ [LOCAL RESULTS] Encontrados ${data?.length || 0} resultados en la base de datos`);
      if (data && data.length > 0) {
        console.log(`📋 [LOCAL RESULTS DETAILS]:`);
        data.forEach((location, index) => {
          console.log(`  ${index + 1}. "${location.name}" - ${location.address} (${location.city || 'sin ciudad'})`);
        });
      } else {
        console.log(`🚫 [LOCAL RESULTS] No se encontraron resultados locales para "${query}"`);
      }

      return (data || []).map(location => ({
        id: location.id,
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        country: location.country,
        country_code: location.country_code,
        latitude: location.latitude,
        longitude: location.longitude,
        category: location.category,
        rating: location.rating,
        phone: location.phone,
        website: location.website,
        usage_count: location.usage_count,
        source: 'local' as const,
        google_place_id: location.google_place_id
      }));
    } catch (error) {
      console.error('💥 [LOCAL SEARCH EXCEPTION]:', error);
      return [];
    }
  }

  /**
   * Busca en Google Places API a través de la API route (modo fallback sin Google Places)
   */
  private async searchGooglePlaces(
    query: string,
    countryCode: string,
    cityFilter?: string, // Nuevo parámetro para filtrar por ciudad
    groupLocationInfo?: { // Nueva información del grupo para mejorar búsquedas
      city?: string;
      region?: string;
      coordinates?: { lat: number; lng: number };
    }
  ): Promise<SportsLocationResult[]> {
    try {
      console.log(`🚀 [GOOGLE API] Llamando a Google Places API con query: "${query}"`);

      // Si estamos en el cliente, usar la ruta API para evitar usar Axios/Node adapters
      if (typeof window !== 'undefined') {
        // Helper: sanitize group city to avoid sending admin region names
        const sanitizeCity = (city?: string, region?: string): string | undefined => {
          if (!city) return undefined
          const c = city.trim()
          const r = region?.trim().toLowerCase()
          const lower = c.toLowerCase()
          const adminIndicators = ['comunidad', 'comunitat', 'provincia', 'región', 'region', 'autonomia', 'auton', 'estado', 'departamento']
          if (r && lower === r) return undefined
          if (adminIndicators.some(word => lower.includes(word))) return undefined
          return c
        }

        const params = new URLSearchParams()
        params.set('query', query)
        params.set('countryCode', countryCode)
        if (cityFilter) params.set('cityFilter', cityFilter)

        const safeCity = sanitizeCity(groupLocationInfo?.city, groupLocationInfo?.region)
        console.log('🧭 [CLIENT] groupLocationInfo:', groupLocationInfo)
        console.log('🧹 [CLIENT] sanitized city:', safeCity, 'region:', groupLocationInfo?.region)
        if (safeCity) params.set('groupCity', safeCity)
        if (groupLocationInfo?.region) params.set('groupRegion', groupLocationInfo.region)
        if (groupLocationInfo?.coordinates?.lat !== undefined && groupLocationInfo?.coordinates?.lng !== undefined) {
          params.set('groupLat', String(groupLocationInfo.coordinates.lat))
          params.set('groupLng', String(groupLocationInfo.coordinates.lng))
        }

        const url = `/api/sports-locations/search?${params.toString()}`
        console.log('🌐 [CLIENT → API] Fetching:', url)
        const res = await fetch(url)
        if (!res.ok) {
          console.error('❌ [CLIENT → API] Error en respuesta:', res.status, res.statusText)
          return []
        }
        const data = await res.json()
        const results: SportsLocationResult[] = data.results || []
        console.log(`✅ [CLIENT → API] Devueltos ${results.length} resultados desde API`)
        return results
      }

      // En servidor (Node), usar el cliente de Google directamente
      const { googlePlacesService } = await import('./googlePlaces');

      // Construir la query con filtro de ciudad si existe
      let searchQuery = query;
      if (cityFilter) {
        searchQuery = `${query} ${cityFilter}`;
        console.log(`🏙️ [GOOGLE API] Búsqueda limitada a ciudad: "${cityFilter}"`);
      }

      // Preparar información de ubicación para Google Places
      const locationBias = groupLocationInfo ? {
        city: groupLocationInfo.city || cityFilter,
        region: groupLocationInfo.region,
        coordinates: groupLocationInfo.coordinates
      } : (cityFilter ? { city: cityFilter } : undefined);

      if (locationBias) {
        console.log(`📍 [GOOGLE API] Usando bias de ubicación:`, locationBias);
      }

      // Llamar directamente al servicio de Google Places con información de ubicación
      const googleResults = await googlePlacesService.searchSportsLocations(searchQuery, countryCode, locationBias);

      console.log(`✅ [GOOGLE API] Respuesta exitosa con ${googleResults.length} resultados`);

      return googleResults.map((location: any) => ({
        id: `google_${location.id}`,
        name: location.name,
        address: location.address,
        city: this.extractCityFromAddress(location.address),
        state: null,
        country: this.getCountryName(countryCode),
        country_code: countryCode,
        latitude: location.latitude,
        longitude: location.longitude,
        category: location.category,
        rating: location.rating,
        phone: location.phone,
        website: location.website,
        usage_count: 0,
        source: 'google' as const,
        google_place_id: location.id
      }));
    } catch (error) {
      console.error('❌ [GOOGLE API] Error searching Google Places:', error);
      // En caso de error, devolver array vacío para que funcione solo con datos locales
      return [];
    }
  }

  /**
   * Guarda una ubicación de Google Places en la base de datos local
   */
  async saveSportsLocationFromGoogle(location: SportsLocationResult): Promise<string | null> {
    if (location.source !== 'google') {
      throw new Error('Only Google Places locations can be saved');
    }

    try {
      // Primero verificar si ya existe por google_place_id
      if (location.google_place_id) {
        const { data: byPlaceId, error: placeIdError } = await supabase
          .from('sports_locations')
          .select('id')
          .eq('google_place_id', location.google_place_id)
          .limit(1);

        if (placeIdError) {
          console.warn('⚠️ Existing check (google_place_id) warning:', placeIdError);
        }

        const existingByPlaceId = byPlaceId?.[0] || null;
        if (existingByPlaceId) {
          console.log('Location already exists with google_place_id:', location.google_place_id);
          return existingByPlaceId.id;
        }
      }

      // Verificar si ya existe por nombre, ciudad y país
      const { data: byNameCity, error: nameCityError } = await supabase
        .from('sports_locations')
        .select('id')
        .eq('name', location.name)
        .eq('city', location.city)
        .eq('country_code', location.country_code)
        .limit(1);

      if (nameCityError) {
        console.warn('⚠️ Existing check (name+city+country) warning:', nameCityError);
      }

      const existingByName = byNameCity?.[0] || null;
      if (existingByName) {
        console.log('Location already exists with same name and city:', location.name);
        return existingByName.id;
      }

      // Si no existe, insertar nueva ubicación
      const { data, error } = await supabase
        .from('sports_locations')
        .insert({
          google_place_id: location.google_place_id,
          name: location.name,
          address: location.address,
          city: location.city,
          state: location.state,
          country: location.country,
          country_code: location.country_code,
          latitude: location.latitude,
          longitude: location.longitude,
          category: location.category,
          rating: location.rating,
          phone: location.phone,
          website: location.website,
          google_types: [], // Se puede mejorar pasando los tipos de Google
          usage_count: 1,
          is_verified: false,
          is_active: true
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error saving sports location:', error);
        return null;
      }

      console.log('New sports location saved successfully:', location.name);
      return data?.id || null;
    } catch (error) {
      console.error('Error saving sports location:', error);
      return null;
    }
  }

  /**
   * Incrementa el contador de uso de una ubicación
   */
  async incrementUsageCount(locationId: string, source: 'local' | 'google'): Promise<void> {
    if (source === 'local') {
      try {
        await supabase.rpc('increment_sports_location_usage', {
          location_id: locationId
        });
      } catch (error) {
        console.error('Error incrementing usage count:', error);
      }
    }
    // Para ubicaciones de Google, no hacemos nada hasta que se guarden
  }

  /**
   * Obtiene ubicaciones deportivas populares por país
   */
  async getPopularSportsLocations(
    countryCode: string,
    limit: number = 10
  ): Promise<SportsLocationResult[]> {
    try {
      const { data, error } = await supabase
        .from('sports_locations')
        .select('*')
        .eq('country_code', countryCode)
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting popular sports locations:', error);
        return [];
      }

      return (data || []).map(location => ({
        id: location.id,
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        country: location.country,
        country_code: location.country_code,
        latitude: location.latitude,
        longitude: location.longitude,
        category: location.category,
        rating: location.rating,
        phone: location.phone,
        website: location.website,
        usage_count: location.usage_count,
        source: 'local' as const,
        google_place_id: location.google_place_id
      }));
    } catch (error) {
      console.error('Error getting popular sports locations:', error);
      return [];
    }
  }

  /**
   * Normaliza la consulta de búsqueda
   */
  private normalizeSearchQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n');
  }

  /**
   * Extrae el nombre de la ciudad de una dirección
   */
  /**
   * Extrae información de ciudad mejorada de la dirección de Google Places
   * Intenta extraer código postal + ciudad (ej: "46800 Xàtiva")
   */
  private extractCityFromAddress(address: string): string | null {
    if (!address) return null;
    
    // Dividir por comas para obtener las partes de la dirección
    const parts = address.split(',').map(part => part.trim());
    
    // Buscar patrones de código postal + ciudad
    for (const part of parts) {
      // Patrón español: 5 dígitos seguidos de nombre de ciudad
      const spanishPostalMatch = part.match(/^(\d{5})\s+(.+)$/);
      if (spanishPostalMatch) {
        const [, postalCode, cityName] = spanishPostalMatch;
        return `${postalCode} ${cityName}`;
      }
      
      // Patrón alternativo: ciudad seguida de código postal
      const alternativeMatch = part.match(/^(.+?)\s+(\d{5})$/);
      if (alternativeMatch) {
        const [, cityName, postalCode] = alternativeMatch;
        return `${postalCode} ${cityName}`;
      }
    }
    
    // Si no encuentra código postal, buscar la parte que parece una ciudad
    for (const part of parts) {
      // Evitar partes que son claramente calles (contienen números al inicio)
      if (!/^\d/.test(part) && part.length > 2) {
        // Si la parte contiene solo letras, espacios y caracteres especiales (ciudad)
        if (/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\-'\.]+$/.test(part)) {
          return part;
        }
      }
    }
    
    // Fallback: usar la penúltima parte si hay al menos 2 partes
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
    
    return null;
  }

  /**
   * Obtiene el nombre del país por código
   */
  private getCountryName(countryCode: string): string {
    const countries: Record<string, string> = {
      'ES': 'España',
      'AR': 'Argentina',
      'MX': 'México',
      'CO': 'Colombia',
      'CL': 'Chile',
      'PE': 'Perú',
      'EC': 'Ecuador',
      'VE': 'Venezuela',
      'UY': 'Uruguay',
      'PY': 'Paraguay',
      'BO': 'Bolivia',
      'BR': 'Brasil'
    };
    
    return countries[countryCode] || countryCode;
  }

  /**
   * Obtiene categorías disponibles
   */
  /**
   * Obtiene las categorías disponibles dinámicamente desde la base de datos
   */
  async getAvailableCategories(): Promise<Array<{ value: string; label: string }>> {
    try {
      const { data, error } = await supabase
        .from('sports_locations')
        .select('category')
        .not('category', 'is', null);

      if (error) {
        console.error('Error fetching categories:', error);
        // Fallback a categorías hardcodeadas en caso de error
        return this.getFallbackCategories();
      }

      // Obtener categorías únicas y crear el formato requerido
      const uniqueCategories = [...new Set(data?.map(item => item.category) || [])];
      
      return uniqueCategories.map(category => ({
        value: category,
        label: this.formatCategoryLabel(category)
      })).sort((a, b) => a.label.localeCompare(b.label));

    } catch (error) {
      console.error('Error in getAvailableCategories:', error);
      return this.getFallbackCategories();
    }
  }

  /**
   * Categorías de respaldo en caso de error
   */
  private getFallbackCategories(): Array<{ value: string; label: string }> {
    return [
      { value: 'club_tenis', label: 'Club de Tenis' },
      { value: 'club_padel', label: 'Club de Pádel' },
      { value: 'club_deportivo', label: 'Club Deportivo' },
      { value: 'gimnasio', label: 'Gimnasio' },
      { value: 'polideportivo', label: 'Polideportivo' },
      { value: 'centro_fitness', label: 'Centro de Fitness' },
      { value: 'piscina', label: 'Piscina' },
      { value: 'campo_futbol', label: 'Campo de Fútbol' }
    ];
  }

  /**
   * Formatea el label de la categoría para mostrar
   */
  private formatCategoryLabel(category: string): string {
    const categoryLabels: Record<string, string> = {
      'club_tenis': 'Club de Tenis',
      'club_padel': 'Club de Pádel',
      'club_deportivo': 'Club Deportivo',
      'gimnasio': 'Gimnasio',
      'polideportivo': 'Polideportivo',
      'centro_fitness': 'Centro de Fitness',
      'piscina': 'Piscina',
      'campo_futbol': 'Campo de Fútbol'
    };

    return categoryLabels[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}

// Instancia singleton
export const sportsLocationService = new SportsLocationService();