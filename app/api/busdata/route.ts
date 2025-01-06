// app/api/busdata/route.ts

import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'nodejs';

// Initialize Redis with explicit configuration
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Add error checking
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn('⚠️ Upstash Redis credentials not found');
}

interface MTAStop {
  id: string;
  name: string;
  lat: number | string;
  lon: number | string;
  routes?: {
    shortName: string;
  }[];
}

const MTA_API_KEY = process.env.MTA_API_KEY;
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '30');

/**
 * Haversine formula helpers to compute distance in miles
 */
function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in miles
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');

    if (!MTA_API_KEY) {
      return NextResponse.json(
        { error: 'MTA_API_KEY is not configured in environment.' },
        { status: 500 }
      );
    }

    if (!latParam || !lonParam) {
      return NextResponse.json(
        { error: 'Missing latitude or longitude.' },
        { status: 400 }
      );
    }

    const userLat = parseFloat(latParam);
    const userLon = parseFloat(lonParam);
    if (isNaN(userLat) || isNaN(userLon)) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude.' },
        { status: 400 }
      );
    }

    // Try Redis cache first
    const cacheKey = `bus-data:${userLat}:${userLon}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    } catch (error) {
      // Log error but continue without cache
      console.warn('Redis cache error:', error);
    }
    
    // 1) Fetch stops from MTA
    const stopsUrl = `http://bustime.mta.info/api/where/stops-for-location.json?lat=${userLat}&lon=${userLon}&radius=500&key=${MTA_API_KEY}`;
    const stopsRes = await fetch(stopsUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MTABusTracker/1.0',
      },
    });
    if (!stopsRes.ok) {
      const errText = await stopsRes.text();
      console.error('Stops API error:', stopsRes.status, errText);
      throw new Error(`Stops API returned status ${stopsRes.status}`);
    }

    const stopsData = await stopsRes.json();
    const stops = stopsData?.data?.stops || [] as MTAStop[];

    // 2) For each stop, fetch arrivals from SIRI
    const arrivals = await Promise.all(
      stops.map(async (stop: MTAStop) => {    
        const monitoringUrl = `http://bustime.mta.info/api/siri/stop-monitoring.json?key=${MTA_API_KEY}&MonitoringRef=${stop.id}&MaximumStopVisits=3`;
        try {
          const arrivalsRes = await fetch(monitoringUrl, {
            headers: {
              Accept: 'application/json',
              'User-Agent': 'MTABusTracker/1.0',
            },
          });
          if (!arrivalsRes.ok) {
            console.error(`Stop Monitoring error for ${stop.id}:`, arrivalsRes.status);
            const text = await arrivalsRes.text();
            console.error(text);
            return { stopId: stop.id, arrivals: [] };
          }

          const arrivalsData = await arrivalsRes.json();
          const visits = arrivalsData?.Siri?.ServiceDelivery?.StopMonitoringDelivery?.[0]?.MonitoredStopVisit || [] as unknown[];

          return {
            stopId: stop.id,
            arrivals: visits,
          };
        } catch (err) {
          console.error('Error fetching arrivals for stop', stop.id, err);
          return { stopId: stop.id, arrivals: [] };
        }
      })
    );

    // 3) Compute distances
    const computedStops = stops.map((stop: MTAStop) => {
      let distanceMiles: number | null = null;

      if (typeof stop.lat === 'number' && typeof stop.lon === 'number') {
        distanceMiles = getDistanceMiles(userLat, userLon, stop.lat, stop.lon);
      } else if (typeof stop.lat === 'string' && typeof stop.lon === 'string') {
        const sLat = parseFloat(stop.lat);
        const sLon = parseFloat(stop.lon);
        if (!isNaN(sLat) && !isNaN(sLon)) {
          distanceMiles = getDistanceMiles(userLat, userLon, sLat, sLon);
        }
      }

      if (distanceMiles !== null) {
        distanceMiles = +distanceMiles.toFixed(2);
      }

      return {
        stopId: stop.id,
        stopName: stop.name,
        distance: distanceMiles,
        routes: stop.routes?.map((r: any) => r.shortName) || [],
      };
    });

    // Convert arrivals array to object
    const arrivalsObj: Record<string, any[]> = {};
    arrivals.forEach((a) => {
      arrivalsObj[a.stopId] = a.arrivals;
    });

    const result = {
      stops: computedStops,
      arrivals: arrivalsObj,
      timestamp: new Date().toISOString(),
      location: {
        lat: userLat,
        lon: userLon
      }
    };

    // Cache the result
    try {
      await redis.set(cacheKey, result, {
        ex: CACHE_TTL
      });
    } catch (error) {
      console.warn('Redis cache set error:', error);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Bus data error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch/parse bus data from MTA.' },
      { status: 500 }
    );
  }
}