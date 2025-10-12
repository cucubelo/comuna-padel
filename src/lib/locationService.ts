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
  public async searchNominatim(
    query: string,
    countryCode?: string
  ): Promise<Location[]> {
    console.log("🌐 Iniciando búsqueda en Nominatim API:", {
      query,
      countryCode,
    });

    try {
      // Configurar URL para buscar SOLO localidades administrativas (ciudades, pueblos, islas, provincias)
      // Excluimos calles, edificios, puntos de interés específicos
      let url = `https://nominatim.openstreetmap.org/search?format=json&limit=8&q=${encodeURIComponent(
        query
      )}&addressdetails=1`;
      
      if (countryCode) {
        url += `&countrycodes=${countryCode.toLowerCase()}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

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

      // Mapear y filtrar solo por países soportados Y nivel administrativo apropiado
      const locations = data
        .map(this.mapNominatimToLocation)
        .filter((location) => {
          const isSupported = this.supportedCountries.includes(location.country_code.toUpperCase());
          const isAppropriateLevel = this.isAppropriateAdministrativeLevel(location);
          return isSupported && isAppropriateLevel;
        });

      return locations;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.warn("Nominatim API request aborted due to timeout");
        return [];
      }

      console.error("Error searching Nominatim:", error);
      return [];
    }
  }

  /**
   * Verificar si la ubicación es del nivel administrativo apropiado
   * Solo queremos: ciudades, pueblos, islas, provincias, comunidades autónomas
   * NO queremos: calles, edificios, restaurantes, tiendas
   */
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
    countryCode?: string
  ): Promise<Location[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    console.log("🔍 Iniciando búsqueda híbrida para:", trimmedQuery);

    // Buscar en ubicaciones locales primero
    const localResults = await this.searchLocal(trimmedQuery, countryCode);

    // Evaluar si necesitamos complementar con API externa
    let nominatimResults: Location[] = [];
    const hasGoodMatch = this.hasGoodLocalMatch(trimmedQuery, localResults);

    if (!hasGoodMatch) {
      nominatimResults = await this.searchNominatim(
        trimmedQuery,
        countryCode
      );
    }

    const combinedResults = [...localResults, ...nominatimResults];

    // Eliminar duplicados, dando prioridad a los resultados locales
    const uniqueResults = Array.from(
      new Map(combinedResults.map((loc) => [loc.display_name, loc])).values()
    );

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
}

// Exportar instancia singleton
export const locationService = new LocationService();
export default locationService;
