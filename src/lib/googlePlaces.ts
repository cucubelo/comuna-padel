import { Client } from '@googlemaps/google-maps-services-js';

// Tipos permitidos para ubicaciones deportivas
const ALLOWED_PLACE_TYPES = [
  'gym',
  'sports_club', 
  'sports_complex',
  'stadium',
  'establishment'
];

// Palabras clave deportivas para filtrar resultados
const SPORTS_KEYWORDS = [
  'club', 'tenis', 'padel', 'pádel', 'gimnasio', 'gym', 'fitness',
  'deportivo', 'polideportivo', 'centro deportivo', 'campo',
  'cancha', 'pista', 'estadio', 'complejo deportivo'
];

export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  rating?: number;
  price_level?: number;
  formatted_phone_number?: string;
  website?: string;
  business_status?: string;
}

export interface SportsLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  types: string[];
  rating?: number;
  price_level?: number;
  phone?: string;
  website?: string;
  category: string;
}

class GooglePlacesService {
  private client: Client;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || '';
    this.client = new Client({});
    
    if (!this.apiKey) {
      console.warn('Google Places API key not found. Location search will be limited.');
    }
  }

  /**
   * Busca ubicaciones deportivas usando Google Places API
   * @param query - Término de búsqueda
   * @param countryCode - Código de país (ISO 2 letras) - REQUERIDO, no más hardcoding
   * @param locationBias - Información adicional de ubicación para mejorar los resultados
   */
  async searchSportsLocations(
    query: string, 
    countryCode: string, 
    locationBias?: {
      city?: string;
      region?: string;
      coordinates?: { lat: number; lng: number };
    }
  ): Promise<SportsLocation[]> {
    if (!this.apiKey) {
      console.error('Google Places API key not configured');
      return [];
    }

    if (!countryCode) {
      console.error('Country code is required for Google Places search');
      return [];
    }

    try {
      // Preparar keyword de búsqueda (preferimos el texto del usuario)
      const keyword = query;

      console.log(`🔍 [Google Places] NearbySearch keyword="${keyword}" país=${countryCode}`);

      // Usar nearbySearch si tenemos coordenadas, sino textSearch
      const response = await this.client.placesNearby({
        params: {
          keyword,
          key: this.apiKey,
          language: 'es',
          region: countryCode.toLowerCase(),
          type: 'establishment',
          radius: 60000, // 60km para cubrir provincia
          // Si tenemos coordenadas, usarlas como punto central
          ...(locationBias?.coordinates && {
            location: `${locationBias.coordinates.lat},${locationBias.coordinates.lng}`
          })
        }
      });

      const places = response.data.results || [];
      
      // Filtrar solo ubicaciones deportivas relevantes
      const filteredPlaces = places.filter(place => this.isSportsLocation(place));
      
      // Convertir a nuestro formato
      const sportsLocations: SportsLocation[] = filteredPlaces.map(place => ({
        id: place.place_id || '',
        name: place.name || '',
        address: place.vicinity || place.formatted_address || '',
        latitude: place.geometry?.location?.lat || 0,
        longitude: place.geometry?.location?.lng || 0,
        types: place.types || [],
        rating: place.rating,
        price_level: place.price_level,
        category: this.categorizeLocation(place)
      }));

      return sportsLocations.slice(0, 10); // Limitar a 10 resultados
    } catch (error) {
      console.error('Error searching Google Places:', error);
      
      // Fallback: intentar con textSearch si nearbySearch falla
      try {
        let fallbackQuery = `${query} club deportivo tenis padel`;
        
        // Agregar información de ubicación al fallback query
        if (locationBias?.city) {
          fallbackQuery += ` ${locationBias.city}`;
        }
        if (locationBias?.region) {
          fallbackQuery += ` ${locationBias.region}`;
        }

        console.log(`🔄 [Google Places] Fallback búsqueda: "${fallbackQuery}" en país: ${countryCode}`);

        const response = await this.client.textSearch({
          params: {
            query: fallbackQuery,
            key: this.apiKey,
            language: 'es',
            region: countryCode.toLowerCase(),
            type: 'establishment',
            ...(locationBias?.coordinates && {
              location: `${locationBias.coordinates.lat},${locationBias.coordinates.lng}`,
              radius: 60000
            })
          }
        });

        const places = response.data.results || [];
        const filteredPlaces = places.filter(place => this.isSportsLocation(place));
        
        const sportsLocations: SportsLocation[] = filteredPlaces.map(place => ({
          id: place.place_id || '',
          name: place.name || '',
          address: place.formatted_address || '',
          latitude: place.geometry?.location?.lat || 0,
          longitude: place.geometry?.location?.lng || 0,
          types: place.types || [],
          rating: place.rating,
          price_level: place.price_level,
          category: this.categorizeLocation(place)
        }));

        return sportsLocations.slice(0, 10);
      } catch (fallbackError) {
        console.error('Error in fallback search:', fallbackError);
        throw new Error('Error al buscar ubicaciones deportivas');
      }
    }
  }

  /**
   * Obtiene detalles completos de un lugar específico
   */
  async getPlaceDetails(placeId: string): Promise<GooglePlaceResult | null> {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          key: this.apiKey,
          language: 'es',
          fields: [
            'place_id',
            'name', 
            'formatted_address',
            'geometry',
            'types',
            'rating',
            'price_level',
            'formatted_phone_number',
            'website',
            'business_status'
          ]
        }
      });

      return response.data.result as GooglePlaceResult;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }

  /**
   * Verifica si un lugar es una ubicación deportiva válida
   */
  private isSportsLocation(place: any): boolean {
    const name = (place.name || '').toLowerCase();
    const types = place.types || [];
    
    // Verificar tipos permitidos
    const hasValidType = types.some((type: string) => 
      ALLOWED_PLACE_TYPES.includes(type)
    );
    
    // Verificar palabras clave deportivas en el nombre
    const hasValidKeyword = SPORTS_KEYWORDS.some(keyword => 
      name.includes(keyword.toLowerCase())
    );
    
    // Filtrar lugares obviamente no deportivos
    const invalidKeywords = [
      'restaurant', 'bar', 'cafe', 'hotel', 'shop', 'store',
      'hospital', 'pharmacy', 'bank', 'gas_station', 'supermarket'
    ];
    
    const hasInvalidType = types.some((type: string) => 
      invalidKeywords.includes(type)
    );
    
    return (hasValidType || hasValidKeyword) && !hasInvalidType;
  }

  /**
   * Categoriza una ubicación deportiva según sus tipos
   */
  private categorizeLocation(place: any): string {
    const name = (place.name || '').toLowerCase();
    const types = place.types || [];
    
    // Categorización basada en nombre y tipos
    if (name.includes('tenis')) return 'club_tenis';
    if (name.includes('padel') || name.includes('pádel')) return 'club_padel';
    if (name.includes('gimnasio') || name.includes('gym') || name.includes('fitness')) return 'gimnasio';
    if (name.includes('polideportivo')) return 'polideportivo';
    if (name.includes('piscina')) return 'piscina';
    if (name.includes('futbol') || name.includes('fútbol')) return 'campo_futbol';
    if (types.includes('gym')) return 'gimnasio';
    if (types.includes('sports_club')) return 'club_deportivo';
    
    return 'club_deportivo'; // Categoría por defecto
  }
}

// Instancia singleton
export const googlePlacesService = new GooglePlacesService();