"use client";
import React, { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from 'react';

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
  const isInitialMount = useRef(true);

  // Initialize location state with proper type checking
  const [location, setLocationState] = useState<Location>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_LOCATION;
    }

    try {
      const savedLat = localStorage.getItem("savedLat");
      const savedLon = localStorage.getItem("savedLon");
      
      if (savedLat && savedLon) {
        const latNum = parseFloat(savedLat);
        const lonNum = parseFloat(savedLon);
        if (!isNaN(latNum) && !isNaN(lonNum)) {
          return { lat: latNum, lon: lonNum };
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    
    return DEFAULT_LOCATION;
  });

  // Sync state with localStorage on mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      try {
        const savedLat = localStorage.getItem("savedLat");
        const savedLon = localStorage.getItem("savedLon");
        
        if (savedLat && savedLon) {
          const latNum = parseFloat(savedLat);
          const lonNum = parseFloat(savedLon);
          if (!isNaN(latNum) && !isNaN(lonNum)) {
            setLocationState({ lat: latNum, lon: lonNum });
          }
        }
      } catch (error) {
        console.error('Error reading from localStorage on mount:', error);
      }
    }
  }, []);

  const normalizeCoordinate = (coord: number): number => {
    return Number(coord.toFixed(6));
  };
  
  const setLocation = useCallback((newLocation: Location) => {
    // Normalize coordinates
    const normalizedLocation = {
      lat: normalizeCoordinate(newLocation.lat),
      lon: normalizeCoordinate(newLocation.lon)
    };
    
    // Compare with previous location
    if (previousLocation.current?.lat === normalizedLocation.lat && 
        previousLocation.current?.lon === normalizedLocation.lon) {
      console.log('📍 Skipping duplicate location update');
      return;
    }
  
    console.log('📍 Location update:', {
      previous: previousLocation.current,
      new: normalizedLocation
    });
  
    // Update state, refs, and storage
    setLocationState(normalizedLocation);
    previousLocation.current = normalizedLocation;
  
    try {
      localStorage.setItem("savedLat", normalizedLocation.lat.toString());
      localStorage.setItem("savedLon", normalizedLocation.lon.toString());
      
      // Also save as JSON string for better persistence
      localStorage.setItem("lastLocation", JSON.stringify(normalizedLocation));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
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