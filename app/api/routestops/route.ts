import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MTA_API_KEY = process.env.MTA_API_KEY;
interface StopGroup {
  stopIds: string[];
}
interface ApiError extends Error {
  message: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    const tileStopName = searchParams.get('tileStopName') || 'None';

    console.log('🛠️ [API START] Processing routeId:', routeId);
    console.log('🛠️ [API START] Processing tileStopName:', tileStopName);

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

    const encodedRouteId = encodeURIComponent(routeId);
    let routePrefix = 'MTA NYCT'; // Default to NYCT

      if (/^(BM|QM|BXM)/.test(routeId.toUpperCase())) {
        routePrefix = 'MTABC';
      } else if (/^X\d+/.test(routeId.toUpperCase())) {
        // Explicitly check for X routes and default to NYCT
        routePrefix = 'MTA NYCT';
      }
    const apiUrl = `http://bustime.mta.info/api/where/stops-for-route/${routePrefix}_${encodedRouteId}.json?key=${MTA_API_KEY}&includePolylines=false`;


    console.log('🚀 [API CALL] Fetching stops from URL:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MTABusTracker/1.0'
      }
    });

    console.log('🛠️ [API RESPONSE] Status Code:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [API ERROR] Status ${response.status}: ${errorText}`);
      throw new Error(`MTA API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json() as {
      data: {
        stops: Array<{ id: string; name: string }>;
        stopGroupings?: Array<{ stopGroups: StopGroup[] }>;
      };
    };
    
    console.log('🛠️ [API RESPONSE] Data:', JSON.stringify(data, null, 2));

    if (!data?.data?.stops) {
      console.error('❌ [RESPONSE ERROR] Invalid response structure from MTA API.');
      throw new Error('Invalid response structure from MTA API.');
    }

    // Map stops to their names
    const stopsMap = new Map(
      data.data.stops.map((stop: any) => [stop.id, stop.name])
    );
    console.log('🗺️ [STOP MAP] Generated Stops Map:', stopsMap);

    const stopGroupings = data.data.stopGroupings?.[0];
    const stopGroups = stopGroupings?.stopGroups || [];

    console.log('🛠️ [STOP GROUPS] Total Groups:', stopGroups.length);

    const stopsByDirection: Record<string, string[]> = {};

    // Group stops by direction
    if (stopGroups.length > 0) {
      stopGroups.forEach((group: StopGroup, index: number) => {
        const direction = index.toString(); // Use index (0 or 1) as direction
        stopsByDirection[direction] = group.stopIds
          .map((id: string) => stopsMap.get(id) ?? 'Unnamed Stop')
          .filter((stop: string) => typeof stop === 'string');
      });
    }

    console.log('🛠️ [STOPS BY DIRECTION] Processed Stops:', stopsByDirection);

    // Find the direction of tileStopName
    const matchedDirection = Object.entries(stopsByDirection).find(([_dir, stops]) =>
      stops.includes(tileStopName)
    )?.[0];

    console.log('🧭 [DIRECTION MATCH] Matched Direction:', matchedDirection);

    let stopsForMatchedDirection = matchedDirection
      ? stopsByDirection[matchedDirection] || []
      : [];

    // Reverse the stops if the direction is '0'
    if (matchedDirection === '0') {
      console.log('🔄 [REVERSE] Reversing stops for direction 0');
      stopsForMatchedDirection = stopsForMatchedDirection.reverse();
    }

    console.log('✅ [FINAL RESPONSE] Stops for Matched Direction:', stopsForMatchedDirection);

    return NextResponse.json({
      stops: stopsForMatchedDirection,
      tileStopFound: Boolean(matchedDirection),
      clickedStop: tileStopName
    });
  } catch (error: any) {
    console.error('❌ [FATAL ERROR] Failed to fetch route stops:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch route stops from MTA.', details: error.message },
      { status: 500 }
    );
  }
}
