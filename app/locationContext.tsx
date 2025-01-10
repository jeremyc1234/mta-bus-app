// locationContext.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface Location {
  lat: number;
  lon: number;
}

interface LocationContextType {
  location: Location;
  setLocation: (location: Location) => void;
  locationServicesEnabled: boolean;
  setLocationServicesEnabled: (enabled: boolean) => void;
  isOutsideNYC: boolean;
  setIsOutsideNYC: (outside: boolean) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location>(() => {
    if (typeof window === 'undefined') {
      return {
        lat: 40.7359,
        lon: -73.9906
      };
    }

    const savedLat = localStorage.getItem("savedLat");
    const savedLon = localStorage.getItem("savedLon");
    
    if (savedLat && savedLon) {
      const latNum = parseFloat(savedLat);
      const lonNum = parseFloat(savedLon);
      if (!isNaN(latNum) && !isNaN(lonNum)) {
        return { lat: latNum, lon: lonNum };
      }
    }
    
    return {
      lat: 40.7359,
      lon: -73.9906
    };
  });

  const [locationServicesEnabled, setLocationServicesEnabled] = useState(false);
  const [isOutsideNYC, setIsOutsideNYC] = useState(false);

  const normalizeCoordinate = (coord: number): number => {
    return Number(coord.toFixed(6));
  };
  
  const setLocationWithStorage = useCallback((newLocation: Location) => {
    const normalizedLocation = {
      lat: normalizeCoordinate(newLocation.lat),
      lon: normalizeCoordinate(newLocation.lon)
    };
    
    // Add debug logging
    console.log('🔍 Location update requested:', {
      current: { lat: location.lat, lon: location.lon },
      new: newLocation,
      normalized: normalizedLocation,
      stack: new Error().stack
    });
    
    // Only update if coordinates are actually different
    if (normalizedLocation.lat !== location.lat || normalizedLocation.lon !== location.lon) {
      setLocation(normalizedLocation);
      localStorage.setItem("savedLat", normalizedLocation.lat.toString());
      localStorage.setItem("savedLon", normalizedLocation.lon.toString());
    } else {
      console.log('📍 Skipping duplicate location update');
    }
  }, [location.lat, location.lon]);
  
  
  
  return (
    <LocationContext.Provider value={{ 
      location, 
      setLocation: setLocationWithStorage,
      locationServicesEnabled,
      setLocationServicesEnabled,
      isOutsideNYC,
      setIsOutsideNYC
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}