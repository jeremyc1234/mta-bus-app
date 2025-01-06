interface MonitoredCall {
  ExpectedArrivalTime?: string;
  Extensions?: {
    Distances?: {
      StopsFromCall?: number;
      DistanceFromCall?: number;
    };
  };
}

interface MonitoredVehicleJourney {
  VehicleRef?: string;
  LineRef?: string;
  DirectionRef?: string;
  DestinationName?: string;
  Monitored?: boolean;
  MonitoredCall?: MonitoredCall;
  Occupancy?: string;
}

interface BusArrival {
  RecordedAtTime?: string;
  MonitoredVehicleJourney?: MonitoredVehicleJourney;
  vehicleRef?: string;
}

interface BusStop {
  stopId: string;
  stopName: string;
  direction?: string;
  lat: number;
  lon: number;
  distance?: number | null;
}

interface BusData {
  stops?: BusStop[];
  arrivals?: {
    [key: string]: BusArrival[];
  };
  timestamp?: string;
}

interface StopGroup {
  stopIds: Set<string>;
  stops: BusStop[];
  minDistance: number;
}

interface MergedBusStop extends Omit<BusStop, 'distance'> {
  mergedArrivals: BusArrival[];
  distance: number | null;
}

const normalizeStopName = (name: string): string => {
  return name
    .toUpperCase()                    // Convert to uppercase
    .replace(/\s*\/\s*/g, '/')        // Normalize slashes
    .replace(/\s+/g, ' ')             // Normalize spaces
    .replace(/\./g, '')               // Remove periods
    .replace(/\band\b/gi, '&')        // Standardize 'and' to '&'
    .trim();                          // Remove leading/trailing spaces
};

/**
 * Merges nearby bus stops with similar names and combines their arrival data
 * @param stops - Array of stop objects with stopName, stopId, etc.
 * @param data - Data object containing arrivals information
 * @returns Merged and sorted array of stops
 */
const mergeStops = (stops: BusStop[], data: BusData): MergedBusStop[] => {
  // Create a map to group stops by normalized names
  const stopGroups = new Map<string, StopGroup>();

  stops.forEach(stop => {
    const normalizedName = normalizeStopName(stop.stopName);
    
    if (!stopGroups.has(normalizedName)) {
      stopGroups.set(normalizedName, {
        stopIds: new Set<string>(),
        stops: [],
        minDistance: Infinity
      });
    }
    
    const group = stopGroups.get(normalizedName)!;
    group.stopIds.add(stop.stopId);
    group.stops.push(stop);
    group.minDistance = Math.min(group.minDistance, stop.distance || Infinity);
  });

  // Convert groups back to array format with merged data
  const mergedStops = Array.from(stopGroups.values()).map(group => {
    // Use the stop info from the closest instance
    const closestStop = group.stops.reduce((closest, current) => {
      const currentDist = current.distance || Infinity;
      const closestDist = closest.distance || Infinity;
      return currentDist < closestDist ? current : closest;
    }, group.stops[0]);

    // Merge arrivals data from all stopIds in the group
    const mergedArrivals = Array.from(group.stopIds).reduce<BusArrival[]>((acc, stopId) => {
      const arrivals = data.arrivals?.[stopId] || [];
      return [...acc, ...arrivals];
    }, []);

    // Remove duplicate arrivals based on VehicleRef
    const uniqueArrivals = mergedArrivals.reduce<BusArrival[]>((acc, arrival) => {
      const vehicleRef = arrival?.MonitoredVehicleJourney?.VehicleRef;
      if (!vehicleRef) return acc;
      
      // If this vehicle isn't in our accumulator yet, or this arrival is closer, use this one
      const existingArrival = acc.find(a => 
        a?.MonitoredVehicleJourney?.VehicleRef === vehicleRef
      );
      
      if (!existingArrival) {
        acc.push(arrival);
      } else {
        const existingStops = existingArrival?.MonitoredVehicleJourney?.MonitoredCall?.Extensions?.Distances?.StopsFromCall || Infinity;
        const newStops = arrival?.MonitoredVehicleJourney?.MonitoredCall?.Extensions?.Distances?.StopsFromCall || Infinity;
        
        if (newStops < existingStops) {
          // Replace the existing arrival with this closer one
          const index = acc.indexOf(existingArrival);
          acc[index] = arrival;
        }
      }
      
      return acc;
    }, []);

    // Return merged stop data
    return {
      ...closestStop,
      stopId: Array.from(group.stopIds).join(','),
      distance: group.minDistance === Infinity ? null : group.minDistance,
      mergedArrivals: uniqueArrivals
    };
  });

  // Sort by distance
  return mergedStops.sort((a, b) => {
    const distA = a.distance ?? Infinity;
    const distB = b.distance ?? Infinity;
    return distA - distB;
  });
};

export { normalizeStopName, mergeStops };
export type { BusStop, BusData, BusArrival, MergedBusStop };