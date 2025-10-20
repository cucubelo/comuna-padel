import { NextRequest, NextResponse } from 'next/server';
import { sportsLocationService } from '@/lib/sportsLocationService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const countryCode = searchParams.get('countryCode') || 'ES';
    const cityFilter = searchParams.get('cityFilter');
    const regionFilter = searchParams.get('regionFilter');
    
    // Parámetros para información del grupo
    const groupCity = searchParams.get('groupCity');
    const groupRegion = searchParams.get('groupRegion');
    const groupLat = searchParams.get('groupLat');
    const groupLng = searchParams.get('groupLng');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    console.log('🚀 [API ENDPOINT] Búsqueda híbrida con query:', query, 'countryCode:', countryCode);
    if (cityFilter) console.log('🏙️ [API ENDPOINT] City filter:', cityFilter);
    if (regionFilter) console.log('🌍 [API ENDPOINT] Region filter:', regionFilter);

    // Construir información del grupo si está disponible
    const groupLocationInfo = (groupCity || groupRegion || (groupLat && groupLng)) ? {
      city: groupCity || undefined,
      region: groupRegion || undefined,
      coordinates: (groupLat && groupLng) ? { 
        lat: parseFloat(groupLat), 
        lng: parseFloat(groupLng) 
      } : undefined
    } : undefined;

    if (groupLocationInfo) {
      console.log('📍 [API ENDPOINT] Group location info:', groupLocationInfo);
    }

    // Usar el servicio híbrido que busca primero en local, luego en Google API
    const results = await sportsLocationService.searchSportsLocations(
      query, 
      countryCode, 
      8, // limit
      regionFilter,
      cityFilter,
      groupLocationInfo
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in sports locations search API:', error);
    
    // Proporcionar más detalles sobre el error
    if (error instanceof Error) {
      if (error.message.includes('403')) {
        return NextResponse.json(
          { 
            error: 'Google Places API access denied. Please check API key permissions and restrictions.',
            details: error.message,
            results: [] 
          },
          { status: 403 }
        );
      }
      
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { 
            error: 'Google Places API key configuration error',
            details: error.message,
            results: [] 
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        results: [] 
      },
      { status: 500 }
    );
  }
}