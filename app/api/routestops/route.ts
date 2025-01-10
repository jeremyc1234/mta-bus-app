// route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MTA_API_KEY = process.env.MTA_API_KEY;

interface StopGroup {
  stopIds: string[];
  id: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let routeId = searchParams.get('routeId');
    const tileStopName = searchParams.get('tileStopName') || 'None';
    const destination = searchParams.get('destination') || '';

    console.log('🛠️ [API START] Processing routeId:', routeId);
    console.log('🛠️ [API START] Processing tileStopName:', tileStopName);
    console.log('🛠️ [API START] Processing destination:', destination);

    if (!MTA_API_KEY) {
      console.error('❌ [CONFIG ERROR] MTA_API_KEY is not configured.');
      return NextResponse.json(
        { error: 'MTA_API_KEY is not configured in environment.' },
        { status: 500 }
      );
    }

    if (!routeId) {
      console.warn('⚠️ [VALIDATION ERROR] Missing routeId parameter.');
      return NextResponse.json(
        { error: 'Missing routeId parameter.' },
        { status: 400 }
      );
    }

    // Clean the routeId
    routeId = routeId.replace(/^(MTA NYCT_|MTABC_)/, '');
    
    // Determine the correct route prefix
    let routePrefix = 'MTA NYCT';
    if (/^(BM|QM|BXM)/.test(routeId.toUpperCase())) {
      routePrefix = 'MTABC';
    } else if (/^X\d+/.test(routeId.toUpperCase())) {
      routePrefix = 'MTA NYCT';
    } else if (/^Q\d+/.test(routeId.toUpperCase())) {
      // Q buses are MTA NYCT unless they're QM (which is handled above)
      routePrefix = 'MTA NYCT';
    }

    const apiUrl = `http://bustime.mta.info/api/where/stops-for-route/${routePrefix}_${routeId}.json?key=${MTA_API_KEY}&includePolylines=false`;
    
    console.log('🔗 [API URL]', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MTABusTracker/1.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [API ERROR] Status ${response.status}: ${errorText}`);
      throw new Error(`MTA API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json() as {
      data: {
        stops: Array<{ id: string; name: string }>;
        stopGroupings?: Array<{ stopGroups: StopGroup[] }>;
        directions?: Array<{ id: string; name: string }>;
      };
    };

    if (!data?.data?.stops) {
      console.error('❌ [RESPONSE ERROR] Invalid response structure from MTA API.');
      throw new Error('Invalid response structure from MTA API.');
    }

    const stopsMap = new Map(
      data.data.stops.map((stop: any) => [stop.id, stop.name])
    );

    const stopGroupings = data.data.stopGroupings?.[0];
    const stopGroups = stopGroupings?.stopGroups || [];
    const directions = data.data.directions || [];

    const stopsByDirection: Record<string, string[]> = {};

    // Group stops by direction
    stopGroups.forEach((group: StopGroup) => {
      const directionId = group.id;
      stopsByDirection[directionId] = group.stopIds
        .map((id: string) => stopsMap.get(id) ?? 'Unnamed Stop')
        .filter((stop: string) => typeof stop === 'string');
    });

    // Find matching direction based on destination
    let matchedDirection = null;
    
    if (destination) {
      // Strip out "via" parts and clean the destination
      const destParts = destination.toLowerCase().split(' via ');
      const cleanDestination = destParts[0].trim();

      // Look at each direction's stops
      matchedDirection = Object.entries(stopsByDirection).find(([dirId, stops]) => {
        // Clean and normalize the last stop name
        const lastStop = stops[stops.length - 1].toLowerCase().split('/')[0].trim();
        const firstStop = stops[0].toLowerCase().split('/')[0].trim();
        
        return cleanDestination.includes(lastStop) || 
               cleanDestination.includes(firstStop) ||
               lastStop.includes(cleanDestination) ||
               firstStop.includes(cleanDestination);
      })?.[0];

      // If no match found by destination, use provided direction param
      const directionParam = searchParams.get('direction');
      if (!matchedDirection && directionParam) {
        matchedDirection = directionParam;
      }
    }

    // If still no match found, fall back to stop matching
    if (!matchedDirection) {
      matchedDirection = Object.entries(stopsByDirection).find(([_dir, stops]) =>
        stops.some(stop => stop.includes(tileStopName))
      )?.[0];
    }

    const stopsForMatchedDirection = matchedDirection
      ? stopsByDirection[matchedDirection] || []
      : [];

    // Get the direction name for reference
    const directionName = directions.find(dir => dir.id === matchedDirection)?.name || 'Unknown';

    return NextResponse.json({
      stops: stopsForMatchedDirection,
      direction: directionName,
      tileStopFound: Boolean(matchedDirection),
      clickedStop: tileStopName,
    });
  } catch (error: any) {
    console.error('❌ [FATAL ERROR] Failed to fetch route stops:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch route stops from MTA.', details: error.message },
      { status: 500 }
    );
  }
}