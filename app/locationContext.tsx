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

  const setLocationWithStorage = useCallback((newLocation: Location) => {
    setLocation(newLocation);
    localStorage.setItem("savedLat", newLocation.lat.toString());
    localStorage.setItem("savedLon", newLocation.lon.toString());
  }, []);
  
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