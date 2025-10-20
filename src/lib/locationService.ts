import { supabase } from "./supabase";
import type { Database } from "@/lib/types/supabase";

export interface Location {
  id: string;
  name: string;
  display_name: string;
  city?: string | null;
  state?: string | null;
  country: string;
  country_code: string;
  latitude?: number | null;
  longitude?: number | null;
  search_count?: number | null;
  class?: string;
  type?: string;
}

interface NominatimResult {
  place_id?: string | number;
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  class?: string;
  type?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    province?: string;
    region?: string;
    country?: string;
    country_code?: string;
  };
}

// Códigos de países soportados (España + Latinoamérica)
const SUPPORTED_COUNTRIES = [
  "ES", // España
  "AR", // Argentina
  "MX", // México
  "CO", // Colombia
  "CL", // Chile
  "PE", // Perú
  "EC", // Ecuador
  "VE", // Venezuela
  "UY", // Uruguay
  "PY", // Paraguay
  "BO", // Bolivia
  "BR", // Brasil
  "CR", // Costa Rica
  "PA", // Panamá
  "GT", // Guatemala
  "HN", // Honduras
  "SV", // El Salvador
  "NI", // Nicaragua
  "CU", // Cuba
  "DO", // República Dominicana
];

class LocationService {
  /**
   * Normalizar texto removiendo acentos y caracteres especiales para búsqueda insensible
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD") // Descompone caracteres con acentos
      .replace(/[\u0300-\u036f]/g, "") // Remueve los diacríticos (acentos)
      .trim();
  }

  /**
   * Genera códigos postales vecinos basados en un código postal base
   * Por ejemplo: 46800 -> [46799, 46800, 46801, 46802, 46798]
   */
  private generateNeighborPostalCodes(basePostalCode: string, radius: number = 2): string[] {
    const postalCodes: string[] = [basePostalCode];
    
    // Extraer la parte numérica del código postal
    const numericPart = basePostalCode.match(/\d+/);
    if (!numericPart) return [basePostalCode];
    
    const baseNumber = parseInt(numericPart[0]);
    const prefix = basePostalCode.substring(0, basePostalCode.indexOf(numericPart[0]));
    const suffix = basePostalCode.substring(basePostalCode.indexOf(numericPart[0]) + numericPart[0].length);
    
    // Generar códigos vecinos
    for (let i = 1; i <= radius; i++) {
      // Códigos menores
      const lowerCode = baseNumber - i;
      if (lowerCode >= 0) {
        const paddedLower = lowerCode.toString().padStart(numericPart[0].length, '0');
        postalCodes.push(prefix + paddedLower + suffix);
      }
      
      // Códigos mayores
      const upperCode = baseNumber + i;
      const paddedUpper = upperCode.toString().padStart(numericPart[0].length, '0');
      postalCodes.push(prefix + paddedUpper + suffix);
    }
    
    return postalCodes;
  }

  /**
   * Buscar ubicaciones locales en la base de datos
   */
  private async searchLocal(
    query: string,
    countryCode?: string,
    limit = 8
  ): Promise<Location[]> {
    try {
      const normalizedQuery = this.normalizeText(query);

      // TODO: Usar un campo de full-text search en la base de datos para mejorar performance
      let queryBuilder = supabase
        .from("postal_codes")
        .select("*")
        .or(`place_name.ilike.%${normalizedQuery}%,admin_name1.ilike.%${normalizedQuery}%,admin_name2.ilike.%${normalizedQuery}%,admin_name3.ilike.%${normalizedQuery}%,postal_code.ilike.%${normalizedQuery}%`)
        .order("search_count", { ascending: false })
        .limit(limit);

      if (countryCode) {
        queryBuilder = queryBuilder.eq(
          "country_code",
          countryCode.toUpperCase()
        );
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.warn("⚠️ Error with local search query:", error);
        return [];
      }

      const rows = (data ?? []) as Database["public"]["Tables"]["postal_codes"]["Row"][];
      return rows.map((row) => ({
        id: row.id,
        name: row.place_name,
        display_name: `${row.place_name}, ${row.admin_name1 || row.admin_name2 || row.admin_name3 || ""}`.trim(),
        city: row.admin_name3 ?? undefined,
        state: row.admin_name1 ?? row.admin_name2 ?? undefined,
        country: this.getCountryInfo(row.country_code)?.name || row.country_code,
        country_code: row.country_code,
        latitude: row.latitude ?? undefined,
        longitude: row.longitude ?? undefined,
        search_count: row.search_count ?? undefined,
      }));

    } catch (error) {
      console.error("❌ Error in searchLocal:", error);
      return [];
    }
  }



  private mapNominatimToLocation(result: NominatimResult): Location {
    const address = result.address;
    const country_code = address?.country_code ?? '';
    const country = this.extractCountryFromAddress(address);

    return {
      id: String(result.place_id),
      name: result.name,
      display_name: result.display_name,
      city: address ? (address.city || address.town || address.village) : undefined,
      state: address ? address.state : undefined,
      country,
      country_code,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      class: result.class,
      type: result.type,
    };
  }

  private extractCountryFromAddress(address: NominatimResult['address']): string {
    if (!address) {
      return "";
    }
    return address.country ?? "";
  }

  /**
   * Lista de países soportados
   */
  private get supportedCountries(): string[] {
    return SUPPORTED_COUNTRIES;
  }

  /**
   * Buscar ubicaciones en OpenStreetMap Nominatim
   */
  /**
   * Buscar ubicaciones usando la API de Nominatim con soporte para códigos postales múltiples
   */
  public async searchNominatim(
    query: string,
    countryCode?: string,
    searchType: 'administrative' | 'places' | 'all' = 'all',
    postalCodes?: string[]
  ): Promise<Location[]> {
    console.log(`🔍 Iniciando búsqueda Nominatim:`, {
      query,
      countryCode,
      searchType,
      postalCodes: postalCodes?.length || 0
    });

    if (postalCodes && postalCodes.length > 0) {
      console.log(`📮 Búsqueda con códigos postales: ${postalCodes.join(', ')}`);
      
      // Búsqueda con códigos postales específicos
      const allResults: Location[] = [];
      
      for (const postalCode of postalCodes) {
        console.log(`🔍 Buscando en código postal: ${postalCode}`);
        try {
          const results = await this.searchNominatimByPostalCode(
            query,
            postalCode,
            countryCode,
            searchType
          );
          console.log(`✅ Encontrados ${results.length} resultados para CP ${postalCode}`);
          allResults.push(...results);
        } catch (error) {
          console.error(`❌ Error buscando en CP ${postalCode}:`, error);
        }
      }
      
      const uniqueResults = this.removeDuplicateLocations(allResults);
      console.log(`🎯 Total de resultados únicos: ${uniqueResults.length}`);
      return uniqueResults;
    } else {
      console.log(`🌍 Búsqueda estándar sin códigos postales`);
      const results = await this.searchNominatimStandard(query, countryCode, searchType);
      console.log(`✅ Encontrados ${results.length} resultados en búsqueda estándar`);
      return results;
    }
  }

  /**
   * Búsqueda específica por código postal
   */
  private async searchNominatimByPostalCode(
    query: string,
    postalCode: string,
    countryCode?: string,
    searchType: 'administrative' | 'places' | 'all' = 'all'
  ): Promise<Location[]> {
    // Usar búsqueda estructurada de Nominatim para códigos postales
    let url = `https://nominatim.openstreetmap.org/search?format=json&limit=8&addressdetails=1&extratags=1`;
    
    // Usar múltiples enfoques para búsqueda estructurada
    const results: Location[] = [];
    
    // Enfoque 1: Buscar como amenity (instalaciones deportivas)
    const amenityUrl = `${url}&amenity=${encodeURIComponent(query)}&postalcode=${encodeURIComponent(postalCode)}${countryCode ? `&countrycodes=${countryCode.toLowerCase()}` : ''}`;
    
    // Enfoque 2: Buscar como street/lugar específico
    const streetUrl = `${url}&street=${encodeURIComponent(query)}&postalcode=${encodeURIComponent(postalCode)}${countryCode ? `&countrycodes=${countryCode.toLowerCase()}` : ''}`;
    
    // Enfoque 3: Búsqueda general con código postal en la query
    const generalUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=8&addressdetails=1&extratags=1&q=${encodeURIComponent(`${query} ${postalCode}`)}${countryCode ? `&countrycodes=${countryCode.toLowerCase()}` : ''}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      // Ejecutar las tres búsquedas en paralelo
      const [amenityResponse, streetResponse, generalResponse] = await Promise.all([
        fetch(amenityUrl, {
          signal: controller.signal,
          headers: { "User-Agent": "Comuna Padel Location Search" },
        }),
        fetch(streetUrl, {
          signal: controller.signal,
          headers: { "User-Agent": "Comuna Padel Location Search" },
        }),
        fetch(generalUrl, {
          signal: controller.signal,
          headers: { "User-Agent": "Comuna Padel Location Search" },
        })
      ]);

      clearTimeout(timeoutId);

      // Procesar resultados de amenity
      if (amenityResponse.ok) {
        const amenityData: NominatimResult[] = await amenityResponse.json();
        if (Array.isArray(amenityData)) {
          results.push(...amenityData.map(result => this.mapNominatimToLocation(result)));
        }
      }

      // Procesar resultados de street
      if (streetResponse.ok) {
        const streetData: NominatimResult[] = await streetResponse.json();
        if (Array.isArray(streetData)) {
          results.push(...streetData.map(result => this.mapNominatimToLocation(result)));
        }
      }

      // Procesar resultados generales
      if (generalResponse.ok) {
        const generalData: NominatimResult[] = await generalResponse.json();
        if (Array.isArray(generalData)) {
          results.push(...generalData.map(result => this.mapNominatimToLocation(result)));
        }
      }

    } catch (error) {
      console.error('❌ Error en búsqueda por código postal:', error);
      clearTimeout(timeoutId);
      return [];
    }

    // Mapear y filtrar resultados según el tipo de búsqueda
    let locations = this.removeDuplicateLocations(results);

    if (searchType === 'places') {
      locations = locations.filter(location => this.isSpecificPlace(location));
    } else if (searchType === 'administrative') {
      locations = locations.filter(location => this.isAppropriateAdministrativeLevel(location));
    }

    return locations;
  }

  /**
   * Búsqueda estándar sin códigos postales específicos
   */
  private async searchNominatimStandard(
    query: string,
    countryCode?: string,
    searchType: 'administrative' | 'places' | 'all' = 'all'
  ): Promise<Location[]> {
    // Configurar URL base con parámetros optimizados
    let url = `https://nominatim.openstreetmap.org/search?format=json&limit=12&addressdetails=1&extratags=1`;
    
    // Usar parámetro 'q' para búsqueda general
    url += `&q=${encodeURIComponent(query)}`;
    
    if (countryCode) {
      url += `&countrycodes=${countryCode.toLowerCase()}`;
    }

    // Agregar parámetros adicionales para mejorar la precisión
    url += `&dedupe=1`; // Eliminar duplicados automáticamente
    url += `&polygon_geojson=0`; // No necesitamos geometría compleja

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Comuna Padel Location Search",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`❌ Error HTTP: ${response.status}`);
        return [];
      }

      const data: NominatimResult[] = await response.json();

      if (!Array.isArray(data)) {
        console.error("❌ Respuesta no es un array:", data);
        return [];
      }

      // Mapear y filtrar resultados según el tipo de búsqueda
      let locations = data.map((result) => this.mapNominatimToLocation(result));

      if (searchType === 'administrative') {
        // Solo localidades administrativas (ciudades, pueblos, provincias)
        locations = locations.filter((location) => {
          const isSupported = this.supportedCountries.includes(location.country_code.toUpperCase());
          const isAppropriateLevel = this.isAppropriateAdministrativeLevel(location);
          return isSupported && isAppropriateLevel;
        });
      } else if (searchType === 'places') {
        // Solo lugares específicos (clubes, centros deportivos, direcciones exactas)
        locations = locations.filter((location) => {
          const isSupported = this.supportedCountries.includes(location.country_code.toUpperCase());
          const isSpecificPlace = this.isSpecificPlace(location);
          return isSupported && isSpecificPlace;
        });
      } else {
        // Búsqueda mixta: tanto administrativas como lugares específicos
        locations = locations.filter((location) => {
          const isSupported = this.supportedCountries.includes(location.country_code.toUpperCase());
          const isAppropriateLevel = this.isAppropriateAdministrativeLevel(location);
          const isSpecificPlace = this.isSpecificPlace(location);
          return isSupported && (isAppropriateLevel || isSpecificPlace);
        });
      }

      return locations;

    } catch (error) {
      console.error('❌ Error en búsqueda estándar:', error);
      clearTimeout(timeoutId);
      return [];
    }
  }

  /**
   * Verificar si la ubicación es del nivel administrativo apropiado
   * Solo queremos: ciudades, pueblos, islas, provincias, comunidades autónomas
   * NO queremos: calles, edificios, restaurantes, tiendas
   */
  private isSpecificPlace(location: Location): boolean {
    // Verificar si es un lugar específico (club, centro deportivo, dirección exacta)
    const { class: locationClass, type: locationType } = location;
    
    // Lugares deportivos y de ocio
    if (locationClass === 'amenity') {
      return ['sports_centre', 'leisure_centre', 'fitness_centre', 'swimming_pool', 'tennis', 'football'].includes(locationType || '');
    }
    
    if (locationClass === 'leisure') {
      return ['sports_centre', 'fitness_centre', 'pitch', 'track', 'stadium'].includes(locationType || '');
    }
    
    if (locationClass === 'sport') {
      return ['tennis', 'football', 'basketball', 'volleyball', 'padel', 'squash'].includes(locationType || '');
    }
    
    // Direcciones exactas (calles con número)
    if (locationClass === 'highway' && locationType === 'residential') {
      return true;
    }
    
    // Edificios específicos
    if (locationClass === 'building') {
      return ['sports_hall', 'stadium', 'pavilion'].includes(locationType || '');
    }
    
    return false;
  }

  private isAppropriateAdministrativeLevel(location: Location): boolean {
    const type = location.type;
    const displayName = location.display_name.toLowerCase();

    const allowedTypes = [
      'city', 'town', 'village', 'hamlet', 'municipality', 'county', 
      'province', 'state', 'region', 'island', 'archipelago'
    ];

    if (type && allowedTypes.includes(type)) {
      return true;
    }

    // Fallback para casos donde el tipo no es suficiente
    const inappropriateKeywords = [
      'calle', 'street', 'avenida', 'avenue', 'carretera', 'road', 'camino', 'path',
      'restaurante', 'restaurant', 'hotel', 'bar', 'café', 'cafe',
      'tienda', 'shop', 'store', 'supermercado', 'supermarket',
      'hospital', 'clínica', 'clinic',
      'aeropuerto', 'airport', 'estación', 'station',
      'plaza', 'square', 'parque', 'park',
      'iglesia', 'church', 'museo', 'museum'
    ];

    for (const keyword of inappropriateKeywords) {
      if (displayName.includes(` ${keyword} `) || displayName.startsWith(keyword) || displayName.endsWith(keyword)) {
        return false;
      }
    }

    return true; // Ser más permisivo si no se encuentra un keyword inapropiado
  }

  /**
   * Extraer nombre de ciudad de los resultados de Nominatim
   */
  private extractCityName(item: NominatimResult): string {
    const address = item.address || {};

    // Prioridad: city > town > village > municipality > name
    return (
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      item.name ||
      "Ubicación desconocida"
    );
  }

  /**
   * Evalúa si hay una coincidencia exacta o muy buena en los resultados locales
   */
  private hasGoodLocalMatch(query: string, localResults: Location[]): boolean {
    if (localResults.length === 0) return false;

    const normalizedQuery = this.normalizeText(query.toLowerCase());

    // Buscar coincidencia exacta en nombre o ciudad
    const hasExactMatch = localResults.some((location) => {
      const normalizedName = this.normalizeText(location.name.toLowerCase());
      const normalizedCity = this.normalizeText(
        (location.city || "").toLowerCase()
      );
      const normalizedDisplayName = this.normalizeText(
        location.display_name.toLowerCase()
      );

      return (
        normalizedName === normalizedQuery ||
        normalizedCity === normalizedQuery ||
        normalizedDisplayName.includes(normalizedQuery)
      );
    });

    if (hasExactMatch) {
      console.log("✅ Coincidencia exacta encontrada en resultados locales");
      return true;
    }

    // Si hay múltiples resultados (≥2), probablemente son suficientes
    if (localResults.length >= 2) {
      console.log(
        "✅ Múltiples resultados locales encontrados, probablemente suficientes"
      );
      return true;
    }

    return false;
  }

  /**
   * Búsqueda híbrida principal: BD local primero, luego API
   */
 public async searchLocations(
    query: string,
    countryCode?: string,
    searchType: 'administrative' | 'places' | 'all' = 'all',
    postalCode?: string
  ): Promise<Location[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    console.log("🔍 Iniciando búsqueda híbrida para:", trimmedQuery);

    // Generar códigos postales vecinos si se proporciona un código postal
    let postalCodes: string[] | undefined;
    if (postalCode) {
      postalCodes = this.generateNeighborPostalCodes(postalCode);
      console.log("📮 Códigos postales generados:", postalCodes);
    }

    // Buscar en ubicaciones locales primero
    const localResults = await this.searchLocal(trimmedQuery, countryCode);

    // Evaluar si necesitamos complementar con API externa
    let nominatimResults: Location[] = [];
    const hasGoodMatch = this.hasGoodLocalMatch(trimmedQuery, localResults);

    if (!hasGoodMatch || postalCode) {
      nominatimResults = await this.searchNominatim(
        trimmedQuery,
        countryCode,
        searchType,
        postalCodes
      );
    }

    const combinedResults = [...localResults, ...nominatimResults];

    // Eliminar duplicados, dando prioridad a los resultados locales
    const uniqueResults = this.removeDuplicateLocations(combinedResults);

    return uniqueResults;
  }

  /**
   * Buscar por país específico
   */
  async searchByCountry(
    query: string,
    countryCode: string
  ): Promise<Location[]> {
    return this.searchLocations(query, countryCode);
  }

  /**
   * Obtener ubicaciones populares por país
   */
  async getPopularLocationsByCountry(
    countryCode: string,
    limit = 10
  ): Promise<Location[]> {
    try {
      const { data, error } = await supabase
        .from("postal_codes")
        .select("*")
        .eq("country_code", countryCode.toUpperCase())
        .order("search_count", { ascending: false })
        .limit(limit);

      if (error) {
        console.warn("Error fetching popular locations:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getPopularLocationsByCountry:", error);
      return [];
    }
  }

  /**
   * Obtener todas las ubicaciones populares
   */
  async getTopLocations(limit = 20): Promise<Location[]> {
    try {
      const { data, error } = await supabase
        .from("postal_codes")
        .select("*")
        .order("search_count", { ascending: false })
        .limit(limit);

      if (error) {
        console.warn("Error fetching top locations:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getTopLocations:", error);
      return [];
    }
  }

  /**
   * Incrementar contador de búsquedas para ubicaciones populares
   */
  private async incrementSearchCount(locations: Location[]): Promise<void> {
    try {
      // No-op: contador de búsquedas deshabilitado desde locationService para postal_codes
      return;
    } catch (error) {
      console.error("Error incrementing search count:", error);
    }
  }

  /**
   * Guardar nuevas ubicaciones populares en la base de datos
   */
  private async savePopularLocations(locations: Location[]): Promise<void> {
    try {
      // No-op: almacenamiento de ubicaciones populares deshabilitado (no existe tabla popular_locations)
      return;
    } catch (error) {
      console.error("Error saving popular locations:", error);
    }
  }

  /**
   * Obtener código de país de una ciudad específica
   */
  async getCountryCodeByCity(cityName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from("postal_codes")
        .select("country_code, place_name, admin_name3")
        .or(`place_name.ilike.%${cityName}%,admin_name3.ilike.%${cityName}%`)
        .limit(1)
        .single();

      if (error || !data) {
        console.warn("No se encontró código de país para la ciudad:", cityName);
        return null;
      }

      return data.country_code;
    } catch (error) {
      console.error("Error getting country code by city:", error);
      return null;
    }
  }

  /**
   * Obtener información de un país por código
   */
  getCountryInfo(countryCode: string): { name: string; flag: string } | null {
    const countries: Record<string, { name: string; flag: string }> = {
      ES: { name: "España", flag: "🇪🇸" },
      AR: { name: "Argentina", flag: "🇦🇷" },
      MX: { name: "México", flag: "🇲🇽" },
      CO: { name: "Colombia", flag: "🇨🇴" },
      CL: { name: "Chile", flag: "🇨🇱" },
      PE: { name: "Perú", flag: "🇵🇪" },
      EC: { name: "Ecuador", flag: "🇪🇨" },
      VE: { name: "Venezuela", flag: "🇻🇪" },
      UY: { name: "Uruguay", flag: "🇺🇾" },
      PY: { name: "Paraguay", flag: "🇵🇾" },
      BO: { name: "Bolivia", flag: "🇧🇴" },
      BR: { name: "Brasil", flag: "🇧🇷" },
    };

    return countries[countryCode.toUpperCase()] || null;
  }

  /**
   * Obtener lista de países soportados
   */
  getSupportedCountries(): Array<{ code: string; name: string; flag: string }> {
    return SUPPORTED_COUNTRIES.map((code) => {
      const info = this.getCountryInfo(code);
      return {
        code,
        name: info?.name || code,
        flag: info?.flag || "🌍",
      };
    }).filter((country) => country.name !== country.code);
  }

  /**
   * Elimina ubicaciones duplicadas basándose en coordenadas similares
   */
  private removeDuplicateLocations(locations: Location[]): Location[] {
    const uniqueLocations: Location[] = [];
    const tolerance = 0.001; // Tolerancia para considerar coordenadas similares (~100m)

    for (const location of locations) {
      const isDuplicate = uniqueLocations.some(existing => {
        if (!location.latitude || !location.longitude || !existing.latitude || !existing.longitude) {
          return false;
        }
        
        const latDiff = Math.abs(location.latitude - existing.latitude);
        const lonDiff = Math.abs(location.longitude - existing.longitude);
        
        return latDiff < tolerance && lonDiff < tolerance;
      });

      if (!isDuplicate) {
        uniqueLocations.push(location);
      }
    }

    return uniqueLocations;
  }
}

// Exportar instancia singleton
export const locationService = new LocationService();
export default locationService;
