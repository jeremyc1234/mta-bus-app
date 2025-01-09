// locationContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Location {
  lat: number;
  lon: number;
}

interface LocationContextType {
  location: Location;
  setLocation: (location: Location) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
    const [location, setLocation] = useState<Location>(() => {
        // Only access localStorage on the client side
        if (typeof window !== 'undefined') {
          const savedLat = localStorage.getItem("savedLat");
          const savedLon = localStorage.getItem("savedLon");
          
          if (savedLat && savedLon) {
            const latNum = parseFloat(savedLat);
            const lonNum = parseFloat(savedLon);
            if (!isNaN(latNum) && !isNaN(lonNum)) {
              console.log("🏁 LocationContext initializing with saved location:", { latNum, lonNum });
              return { lat: latNum, lon: lonNum };
            }
          }
        }
        
        console.log("🏁 LocationContext initializing with Union Square default");
        return {
          lat: 40.7359,
          lon: -73.9906
        };
      });
  
    return (
      <LocationContext.Provider value={{ location, setLocation }}>
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