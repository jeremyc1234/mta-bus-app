// locationContext.tsx
"use client";
import React, { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';

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

const DEFAULT_LOCATION = {
  lat: 40.7359,
  lon: -73.9906
};

export function LocationProvider({ children }: { children: ReactNode }) {
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(false);
  const [isOutsideNYC, setIsOutsideNYC] = useState(false);
  const previousLocation = useRef<Location | null>(null);
  const [location, setLocationState] = useState<Location>(DEFAULT_LOCATION);

  const normalizeCoordinate = (coord: number): number => {
    return Number(coord.toFixed(6));
  };
  
  const setLocation = useCallback((newLocation: Location) => {
    const normalizedLocation = {
      lat: normalizeCoordinate(newLocation.lat),
      lon: normalizeCoordinate(newLocation.lon)
    };
    
    if (previousLocation.current?.lat === normalizedLocation.lat && 
        previousLocation.current?.lon === normalizedLocation.lon) {
      console.log('📍 Skipping duplicate location update');
      return;
    }
  
    console.log('📍 Location update:', {
      previous: previousLocation.current,
      new: normalizedLocation
    });
  
    setLocationState(normalizedLocation);
    previousLocation.current = normalizedLocation;
  }, []);
  
  const value = React.useMemo(() => ({
    location,
    setLocation,
    locationServicesEnabled,
    setLocationServicesEnabled,
    isOutsideNYC,
    setIsOutsideNYC
  }), [location, locationServicesEnabled, isOutsideNYC, setLocation]);
  
  return (
    <LocationContext.Provider value={value}>
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