import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MTA_API_KEY = process.env.MTA_API_KEY;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let routeId = searchParams.get('routeId');

    console.log('API Route - Received request for routeId:', routeId);
    console.log('API Route - MTA_API_KEY present:', !!MTA_API_KEY, 'Value:', MTA_API_KEY);

    if (!MTA_API_KEY) {
      console.error('MTA_API_KEY is undefined in environment');
      return NextResponse.json(
        { error: 'API key configuration error' },
        { status: 500 }
      );
    }

    if (!routeId) {
        return NextResponse.json(
          { error: 'Missing routeId parameter' },
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
      routePrefix = 'MTA NYCT';
    }

    const fullRouteId = `${routePrefix}_${routeId}`;
    const apiUrl = `http://bustime.mta.info/api/where/stops-for-route/${fullRouteId}.json?key=${MTA_API_KEY}&includePolylines=false`;

    console.log('Fetching from MTA API:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MTABusTracker/1.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`MTA API Error: ${response.status}`, errorText);
      throw new Error(`MTA API returned status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data?.data?.stops) {
      console.error('Invalid response structure:', data);
      throw new Error('Invalid response structure from MTA API');
    }

    const stops = data.data.stops.map((stop: any) => ({
      id: stop.id,
      name: stop.name,
      lat: stop.lat,
      lon: stop.lon
    }));

    return NextResponse.json({ stops, routeId: fullRouteId });

  } catch (error: any) {
    console.error('Failed to fetch route data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch route data from MTA.', details: error.message },
      { status: 500 }
    );
  }
}