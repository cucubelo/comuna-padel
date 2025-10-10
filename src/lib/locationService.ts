import { supabase } from "./supabase";

export interface Location {
  id?: string;
  name: string;
  display_name: string;
  city?: string;
  state?: string;
  country: string;
  country_code: string;
  latitude?: number;
  longitude?: number;
  search_count?: number;
}

interface NominatimResult {
  place_id?: string | number;
  name: string;
  display_name: string;
  lat: string;
  lon: string;
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
      console.log("🔍 Búsqueda local:", {
        query,
        normalizedQuery,
        countryCode,
      });

      // Búsqueda más flexible usando ILIKE para coincidencias parciales
      let queryBuilder = supabase
        .from("popular_locations")
        .select("*")
        .or(`name.ilike.%${query}%,display_name.ilike.%${query}%,city.ilike.%${query}%`)
        .order("search_count", { ascending: false })
        .limit(limit);

      if (countryCode) {
        console.log("🌍 Filtrando por país:", countryCode.toUpperCase());
        queryBuilder = queryBuilder.eq(
          "country_code",
          countryCode.toUpperCase()
        );
      }

      console.log("🔍 Ejecutando consulta optimizada...");
      const { data, error } = await queryBuilder;

      if (error) {
        console.warn("⚠️ Error with query:", error);
        return [];
      }

      console.log(
        "📊 Resultados obtenidos:",
        data?.length || 0,
        "registros"
      );
      
      // Mostrar algunos resultados para debug
      if (data && data.length > 0) {
        console.log("🔍 Primeros resultados:", data.slice(0, 3).map(item => ({
          name: item.name,
          display_name: item.display_name,
          country: item.country
        })));
      }

      return data || [];
    } catch (error) {
      console.error("❌ Error in searchLocal:", error);
      return [];
    }
  }

  /**
   * Detectar si el navegador es Brave
   */
  private isBraveBrowser(): boolean {
    return (
      (navigator as Navigator & { brave?: { isBrave: boolean } }).brave
        ?.isBrave || false
    );
  }

  /**
   * Mapear resultado de Nominatim a Location
   */
  private mapNominatimToLocation = (item: NominatimResult): Location => ({
    id: item.place_id?.toString() || Math.random().toString(),
    name: this.extractCityName(item),
    display_name: item.display_name,
    city:
      item.address?.city || item.address?.town || item.address?.village || "",
    state:
      item.address?.state ||
      item.address?.province ||
      item.address?.region ||
      "",
    country: item.address?.country || "",
    country_code: item.address?.country_code?.toUpperCase() || "",
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
  });

  /**
   * Extraer código de país de la dirección
   */
  private extractCountryFromAddress(location: Location): string {
    // Primero intentar con country_code si existe
    if (location.country_code) {
      return location.country_code;
    }

    // Si no hay country_code, intentar extraer del display_name
    const displayName = location.display_name.toLowerCase();
    
    // Mapeo de nombres de países a códigos
    const countryMapping: { [key: string]: string } = {
      'spain': 'ES',
      'españa': 'ES',
      'argentina': 'AR',
      'ecuador': 'EC',
      'mexico': 'MX',
      'méxico': 'MX',
      'colombia': 'CO',
      'chile': 'CL',
      'peru': 'PE',
      'perú': 'PE',
      'venezuela': 'VE',
      'uruguay': 'UY',
      'paraguay': 'PY',
      'bolivia': 'BO',
      'brasil': 'BR',
      'brazil': 'BR',
      'costa rica': 'CR',
      'panama': 'PA',
      'panamá': 'PA',
      'guatemala': 'GT',
      'honduras': 'HN',
      'el salvador': 'SV',
      'nicaragua': 'NI',
      'cuba': 'CU',
      'república dominicana': 'DO',
      'dominican republic': 'DO'
    };

    // Buscar coincidencias en el display_name
    for (const [countryName, countryCode] of Object.entries(countryMapping)) {
      if (displayName.includes(countryName)) {
        return countryCode;
      }
    }

    return "";
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
  private async searchNominatim(
    query: string,
    countryFilter?: string
  ): Promise<Location[]> {
    console.log("🌐 Iniciando búsqueda en Nominatim API:", {
      query,
      countryFilter,
    });

    try {
      // Configurar URL para buscar SOLO localidades administrativas (ciudades, pueblos, islas, provincias)
      // Excluimos calles, edificios, puntos de interés específicos
      let url = `https://nominatim.openstreetmap.org/search?format=json&limit=8&q=${encodeURIComponent(
        query
      )}&class=place&type=city,town,village,municipality,island,state,province&addressdetails=1`;
      
      if (countryFilter) {
        url += `&countrycodes=${countryFilter.toLowerCase()}`;
      }

      console.log("📡 URL de la API:", url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      console.log("⏳ Realizando petición HTTP...");
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

      console.log("📥 Respuesta recibida:", response.status);

      const data: NominatimResult[] = await response.json();

      if (!Array.isArray(data)) {
        console.error("❌ Respuesta no es un array:", data);
        return [];
      }

      console.log("📊 Datos JSON recibidos:", data.length, "elementos");

      // Mapear y filtrar solo por países soportados Y nivel administrativo apropiado
      const locations = data
        .map(this.mapNominatimToLocation)
        .filter((location) => {
          const country = this.extractCountryFromAddress(location);
          const isSupported = this.supportedCountries.includes(country);
          
          // Filtrar por nivel administrativo - solo localidades, no calles ni edificios
          const isAppropriateLevel = this.isAppropriateAdministrativeLevel(location);

          console.log("🔍 Evaluando ubicación:", {
            name: location.name,
            display_name: location.display_name,
            country,
            isSupported,
            isAppropriateLevel,
          });

          return isSupported && isAppropriateLevel;
        });

      console.log("✅ Ubicaciones filtradas de Nominatim:", locations.length);
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
    const displayName = location.display_name.toLowerCase();
    
    // Palabras que indican que NO es una localidad apropiada (NEGOCIOS Y ESTABLECIMIENTOS)
    const inappropriateKeywords = [
      // Calles y vías
      'calle', 'street', 'avenida', 'avenue', 'carretera', 'road', 'camino', 'path',
      'paseo', 'boulevard', 'ronda', 'travesía', 'callejón', 'alley',
      
      // Negocios de comida y bebida
      'restaurante', 'restaurant', 'hotel', 'bar', 'café', 'cafe', 'pizzería', 'pizzeria',
      'panadería', 'bakery', 'pastelería', 'pastry', 'heladería', 'ice cream',
      'taberna', 'tavern', 'pub', 'discoteca', 'nightclub', 'club nocturno',
      
      // Tiendas y comercios
      'tienda', 'shop', 'store', 'centro comercial', 'mall', 'supermercado', 'supermarket',
      'farmacia', 'pharmacy', 'librería', 'bookstore', 'boutique', 'mercado', 'market',
      'gasolinera', 'gas station', 'taller', 'workshop', 'peluquería', 'hairdresser',
      
      // Servicios y edificios públicos
      'hospital', 'clínica', 'clinic', 'consultorio', 'office', 'oficina',
      'escuela', 'school', 'colegio', 'universidad', 'university', 'instituto', 'institute',
      'biblioteca', 'library', 'museo', 'museum', 'teatro', 'theater', 'cine', 'cinema',
      
      // Transporte e infraestructura
      'aeropuerto', 'airport', 'estación', 'station', 'puerto', 'port', 'terminal',
      'aparcamiento', 'parking', 'garaje', 'garage', 'gasolinera', 'petrol station',
      
      // Espacios y lugares específicos
      'plaza', 'square', 'parque', 'park', 'jardín', 'garden', 'cementerio', 'cemetery',
      'iglesia', 'church', 'catedral', 'cathedral', 'mezquita', 'mosque',
      'estadio', 'stadium', 'polideportivo', 'sports center', 'gimnasio', 'gym',
      
      // Otros establecimientos
      'banco', 'bank', 'cajero', 'atm', 'correos', 'post office', 'ayuntamiento', 'city hall',
      'comisaría', 'police station', 'bomberos', 'fire station', 'juzgado', 'courthouse'
    ];

    // Si contiene palabras inapropiadas, rechazar
    for (const keyword of inappropriateKeywords) {
      if (displayName.includes(keyword)) {
        return false;
      }
    }

    // Palabras que indican que SÍ es una localidad apropiada
    const appropriateKeywords = [
      'ciudad', 'city', 'pueblo', 'town', 'villa', 'village',
      'municipio', 'municipality', 'isla', 'island', 'islas', 'islands',
      'provincia', 'province', 'comunidad', 'community', 'región', 'region',
      'estado', 'state', 'departamento', 'department'
    ];

    // Si contiene palabras apropiadas, aceptar
    for (const keyword of appropriateKeywords) {
      if (displayName.includes(keyword)) {
        return true;
      }
    }

    // Si el nombre es corto y simple (probablemente una ciudad), aceptar
    if (location.name.length <= 30 && !location.name.includes(',')) {
      return true;
    }

    // Por defecto, ser conservador y rechazar
    return false;
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
  async searchLocations(
    query: string,
    countryFilter?: string
  ): Promise<Location[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    console.log("🔍 Iniciando búsqueda híbrida para:", trimmedQuery);

    // Buscar en ubicaciones locales primero
    const localResults = await this.searchLocal(trimmedQuery, countryFilter);
    console.log("📍 Resultados locales:", localResults.length);

    // Evaluar si necesitamos complementar con API externa
    let nominatimResults: Location[] = [];
    const hasGoodMatch = this.hasGoodLocalMatch(trimmedQuery, localResults);

    if (!hasGoodMatch) {
      console.log(
        "🌍 No hay coincidencias exactas locales, buscando en OpenStreetMap/Nominatim..."
      );
      nominatimResults = await this.searchNominatim(
        trimmedQuery,
        countryFilter
      );
      console.log("🗺️ Resultados de Nominatim:", nominatimResults.length);
    } else {
      console.log(
        "✅ Buenas coincidencias locales encontradas, omitiendo búsqueda en API externa"
      );
    }

    const combinedResults = [...localResults, ...nominatimResults];
    console.log("✅ Total de resultados combinados:", combinedResults.length);

    return combinedResults;
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
        .from("popular_locations")
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
        .from("popular_locations")
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
      for (const location of locations) {
        if (location.id) {
          // Usar SQL directo para incrementar el contador
          const { error } = await supabase.rpc("increment_search_count", {
            location_id: location.id,
          });

          if (error) {
            console.warn("Error incrementing search count:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error incrementing search count:", error);
    }
  }

  /**
   * Guardar nuevas ubicaciones populares en la base de datos
   */
  private async savePopularLocations(locations: Location[]): Promise<void> {
    try {
      const locationsToSave = locations
        .filter((loc) => loc.name && loc.country_code)
        .map((loc) => ({
          name: loc.name,
          display_name: loc.display_name,
          city: loc.city,
          state: loc.state,
          country: loc.country,
          country_code: loc.country_code,
          latitude: loc.latitude,
          longitude: loc.longitude,
          search_count: 1,
        }));

      if (locationsToSave.length > 0) {
        await supabase.from("popular_locations").upsert(locationsToSave, {
          onConflict: "name,country_code",
          ignoreDuplicates: true,
        });
      }
    } catch (error) {
      console.error("Error saving popular locations:", error);
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
