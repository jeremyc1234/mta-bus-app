import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MTA_API_KEY = process.env.MTA_API_KEY;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    const tileStopName = searchParams.get('tileStopName') || 'None';

    if (!MTA_API_KEY) {
      return NextResponse.json(
        { error: 'MTA_API_KEY is not configured in environment.' },
        { status: 500 }
      );
    }

    if (!routeId) {
      return NextResponse.json(
        { error: 'Missing routeId parameter.' },
        { status: 400 }
      );
    }

    const encodedRouteId = encodeURIComponent(routeId);

    const response = await fetch(
      `http://bustime.mta.info/api/where/stops-for-route/MTA%20NYCT_${encodedRouteId}.json?key=${MTA_API_KEY}&includePolylines=false`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MTABusTracker/1.0'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MTA API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data?.data?.stops) {
      throw new Error('Invalid response structure from MTA API.');
    }

    // Map stops to their names
    const stopsMap = new Map(
      data.data.stops.map((stop: any) => [stop.id, stop.name])
    );

    const stopGroupings = data.data.stopGroupings?.[0];
    const stopGroups = stopGroupings?.stopGroups || [];

    let stopsByDirection: Record<string, string[]> = {};

    // Group stops by direction
    if (stopGroups.length > 0) {
      stopGroups.forEach((group: any, index: number) => {
        const direction = index.toString(); // Use index (0 or 1) as direction
        stopsByDirection[direction] = group.stopIds
          .map((id: string) => stopsMap.get(id) ?? 'Unnamed Stop')
          .filter((stop: string) => typeof stop === 'string');
      });
    }

    // Find the direction of tileStopName
    let matchedDirection = Object.entries(stopsByDirection).find(([_, stops]) =>
      stops.includes(tileStopName)
    )?.[0];

    let stopsForMatchedDirection = matchedDirection
  ? stopsByDirection[matchedDirection] || []
  : [];

    // Reverse the stops if the direction is '0'
    if (matchedDirection === '0') {
      stopsForMatchedDirection = stopsForMatchedDirection.reverse();
    }


    return NextResponse.json({
      stops: stopsForMatchedDirection,
      tileStopFound: Boolean(matchedDirection),
      clickedStop: tileStopName
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch route stops from MTA.' },
      { status: 500 }
    );
  }
}
