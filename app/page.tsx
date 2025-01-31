"use client";

import React, { useRef, useState, Suspense, useEffect, useMemo, useCallback, memo, useLayoutEffect } from "react";
import { BusPopupProvider, BusContent } from './busPopupProvider';
import { Inter } from 'next/font/google';
import Image from 'next/image';
import ServiceAlertPopup from './serviceAlertPopup'
import NavigationButtons from './navigationButtons';
import { BUS_STOP_LOCATIONS } from "./data/busstops";
import { useLocation } from "./locationContext";
import ScrollableTile from "./scrollableTile";

const inter = Inter({ subsets: ['latin'] });

const isWithinNYC = (lat: number, lon: number) => {
  // NYC bounds (approximate)
  const NYC_BOUNDS = {
    north: 40.9176,  // Upper Manhattan/Bronx
    south: 40.4774,  // South Staten Island
    east: -73.7004,  // Eastern Queens
    west: -74.2591   // Western Staten Island
  };

  return lat >= NYC_BOUNDS.south &&
    lat <= NYC_BOUNDS.north &&
    lon >= NYC_BOUNDS.west &&
    lon <= NYC_BOUNDS.east;
};
const UNION_SQUARE = {
  lat: 40.7359,
  lon: -73.9906
};
interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  target: React.ReactNode;
  children: React.ReactNode;
}

interface ServiceAlert {
  route: string;
  summary: string;
  description: string;
  creationTime: string;
  updatedTime: string;
  activePeriod: Array<{ start: string; end: string }>;
  status: string;
  notice: string;
  mapLink?: string;
}

const HomeContent = () => {
  // Union Square fallback lat/lon
  const FALLBACK_LAT = 40.7359;
  const FALLBACK_LON = -73.9906;

  const [windowWidth, setWindowWidth] = useState<number | null>(null);

  useEffect(() => {
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      const width = window.innerWidth;
      if (windowWidth === null || Math.abs(width - windowWidth) > 50) {
        setWindowWidth(width);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [windowWidth]);

  const urlLocationRef = useRef<{ lat: number | null; lon: number | null }>({ lat: null, lon: null });

  const defaultLat = FALLBACK_LAT;
  const defaultLon = FALLBACK_LON;

  const [locationServicesEnabled, setLocationServicesEnabled] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState<boolean>(true);
  const [isIssueBannerVisible, setIsIssueBannerVisible] = useState<boolean>(false);
  const [isIssueBannerFadingOut, setIsIssueBannerFadingOut] = useState(false);

  const [selectedStop, setSelectedStop] = useState<string | null>(null);

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");
  const [userLocation, setUserLocation] = useState<string>("");

  const [isOutsideNYC, setIsOutsideNYC] = useState<boolean>(false);

  const [routesWithAlerts, setRoutesWithAlerts] = useState<Record<string, boolean>>({});
  const [isLocationChanging, setIsLocationChanging] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isScrollableLeft, setIsScrollableLeft] = useState(false);
  const [isScrollableRight, setIsScrollableRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [updatedTimeString, setUpdatedTimeString] = useState("");
  const refreshInterval = 30000;
  const [timeRemaining, setTimeRemaining] = useState<number>(refreshInterval / 1000);
  const lastUpdateRef = useRef<number>(Date.now());
  const timerRef = useRef<HTMLSpanElement>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isStopLoading, setIsStopLoading] = useState<boolean>(false);

  const [tempAddress, setTempAddress] = useState("");

  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [isInvalidAddress, setIsInvalidAddress] = useState<boolean>(false);

  const [isChangingLocation, setIsChangingLocation] = useState(false);
  const lastFetchTimeRef = useRef<number>(0);
  const FETCH_THROTTLE_MS = 1000;
  const [serviceAlert, setServiceAlert] = useState<ServiceAlert | null>(null);
  const [isAlertPopupOpen, setIsAlertPopupOpen] = useState(false);
  const { location, setLocation } = useLocation();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [loadingState, setLoadingState] = useState<{
    isLoading: boolean;
    isRefreshing: boolean;
  }>({
    isLoading: false,
    isRefreshing: false
  });
  const UNION_SQUARE_LAT = 40.7359;
  const UNION_SQUARE_LON = -73.9906;

  const [isMapPopupOpen, setIsMapPopupOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isWaitingForGeolocation, setIsWaitingForGeolocation] = useState(true);

  // Open the Route Map Popup
  const openRouteMapPopup = (routeId: string) => {
    setSelectedRouteId(routeId);
    setIsMapPopupOpen(true);
    document.body.classList.add('no-scroll');
  };
  
  const closeRouteMapPopup = () => {
    setSelectedRouteId(null);
    setIsMapPopupOpen(false);
    document.body.classList.remove('no-scroll');
  };

  const getAddressFromCoords = async (lat: number, lon: number) => {
    console.log('🌍 Starting geocoding for coordinates:', { lat, lon });
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      console.log('🔑 API Key present:', !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

      const response = await fetch(url);
      console.log('📡 Geocoding API response status:', response.status);

      const data = await response.json();
      console.log('📍 Geocoding API response:', data);

      if (data.status === 'REQUEST_DENIED') {
        console.error('❌ API Request Denied:', data.error_message);
        return null;
      }

      if (data.status !== 'OK') {
        console.error('❌ API Error Status:', data.status);
        return null;
      }

      if (data.results && data.results[0]) {
        const addressComponents = data.results[0].address_components;
        let city = '', state = '';

        // Find city and state from address components
        for (const component of addressComponents) {
          if (component.types.includes('locality')) {
            city = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            state = component.short_name; // Using short name for state (e.g., CA instead of California)
          }
        }

        const formattedLocation = `${city}, ${state}`;
        console.log('✅ Found location:', formattedLocation);
        return formattedLocation;
      }

      console.log('❌ No results found in geocoding response');
      return null;
    } catch (error) {
      console.error('❌ Geocoding error:', error);
      return null;
    }
  };

  const checkScrollable = () => {
    const el = scrollContainerRef.current;
    // console.log('🛠️ checkScrollable Triggered');
    if (el) {
      console.log('🛠️ Scroll Container Found:', {
        scrollLeft: el.scrollLeft,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      });

      const canScrollLeft = el.scrollLeft > 0;
      const canScrollRight = el.scrollWidth > el.clientWidth + el.scrollLeft;

      // console.log('🛠️ Scroll State:', { canScrollLeft, canScrollRight });

      setIsScrollableLeft(canScrollLeft);
      setIsScrollableRight(canScrollRight);
    } else {
      console.warn('⚠️ scrollContainerRef is null in checkScrollable');
    }
  };

  // Add this useEffect to page.tsx
  useEffect(() => {
    console.log("🚀 Starting geolocation initialization...");
    
    const handlePositionUpdate = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      console.log("📱 Got geolocation update:", { latitude, longitude });
      setLocationServicesEnabled(true);
      setIsWaitingForGeolocation(false);
  
      if (isWithinNYC(latitude, longitude)) {
        console.log("✅ Location is within NYC, using current position");
        setLocation({ lat: latitude, lon: longitude });
        setIsOutsideNYC(false);
      } else {
        console.log("🌎 Location is outside NYC, falling back to Union Square");
        handleOutsideNYC(latitude, longitude);
      }
    };
  
    const handleError = (error: GeolocationPositionError) => {
      setIsWaitingForGeolocation(false);
      setDefaultLocation();
    };
  
    if ("geolocation" in navigator) {
      console.log("📱 Geolocation is available");
      navigator.geolocation.getCurrentPosition(
        handlePositionUpdate,
        handleError,
        {
          maximumAge: 30000,
          timeout: 27000,
          enableHighAccuracy: false,
        }
      );
    } else {
      console.log("📱 Geolocation is not available");
      setIsWaitingForGeolocation(false);
      setDefaultLocation();
    }
  }, []);
  
  useEffect(() => {
    if (selectedStop) {
      // If it's coordinates (from geolocation)
      if (selectedStop.includes(',')) {
        const [lat, lon] = selectedStop.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lon)) {
          setLocation({ lat, lon });
        }
      } else {
        // If it's a named location
        const foundLocation = BUS_STOP_LOCATIONS.find(loc => loc.label === selectedStop);
        if (foundLocation && foundLocation.lat && foundLocation.lon) {
          setLocation({
            lat: foundLocation.lat,
            lon: foundLocation.lon
          });
        }
      }
    }
  }, [selectedStop, setLocation]);

  useEffect(() => {
    // console.log('🛠️ Manual Scroll Check Trigger');
    setTimeout(() => {
      checkScrollable();
    }, 1000); // Delay by 1s to ensure DOM is ready
  }, []);

  useEffect(() => {
    // console.log('🔑 GOOGLE_MAPS_API_KEY present:', !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  }, []);

  useLayoutEffect(() => {
    // console.log('🛠️ useLayoutEffect Mounted: Adding Scroll Listeners');

    const el = scrollContainerRef.current; // Save the ref value at the beginning

    if (el) {
      // console.log('✅ Scroll Container Ready');
      el.addEventListener('scroll', checkScrollable);
      window.addEventListener('resize', checkScrollable);
      checkScrollable(); // Ensure initial state is checked
    } else {
      console.warn('⚠️ scrollContainerRef is still null in useLayoutEffect');
    }

    return () => {
      if (el) { // Use the saved ref value
        el.removeEventListener('scroll', checkScrollable);
      }
      window.removeEventListener('resize', checkScrollable);
    };
  }, []);

  const checkServiceAlert = async (routeId: string) => {
    try {
      const cleanRouteId = routeId.replace(/MTA NYCT_|MTABC_/g, '').toUpperCase();
      const isExpressRoute = /^(BM|QM|BXM|Q\d+|B\d+|S\d+|X\d+)/.test(cleanRouteId);
      const fullRouteId = isExpressRoute ? `MTABC_${cleanRouteId}` : `MTA NYCT_${cleanRouteId}`;


      const res = await fetch(`/api/servicealert?routeId=${encodeURIComponent(fullRouteId)}`);

      if (!res.ok) {
        return false;
      }

      const data = await res.json();
      return data.situations && data.situations.length > 0 &&
        data.situations[0].status !== 'GOOD_SERVICE' &&
        data.situations[0].summary !== 'No Current Service Alerts';
    } catch (error) {
      console.error('Error checking service alert:', error);
      return false;
    }
  };

  const setDefaultLocation = () => {
    // Always use Union Square coordinates
    setLocation({
      lat: UNION_SQUARE.lat,
      lon: UNION_SQUARE.lon
    });
    setSelectedStop("Union Square");
  };
  

  
const handleOutsideNYC = async (lat: number, lon: number) => {
  console.log("Outside NYC coords:", lat, lon);
  setIsOutsideNYC(true);

  const locationName = await getAddressFromCoords(lat, lon);
  if (locationName) {
    setUserLocation(locationName);
  }

  // Explicitly use Union Square coordinates
  setLocation({
    lat: UNION_SQUARE.lat,
    lon: UNION_SQUARE.lon
  });
};


  const handleLocationError = () => {
    setLocationServicesEnabled(false);
    setDefaultLocation();
  };
  const lastFetchRef = useRef<{ lat: number; lon: number } | null>(null);
  const debouncedLocation = useMemo(() => {
    return {
      lat: Number(location.lat.toFixed(6)),
      lon: Number(location.lon.toFixed(6))
    };
  }, [location.lat, location.lon]);
  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();
  
    const fetchData = async () => {
      const now = Date.now();
      if (now - lastFetchTimeRef.current < FETCH_THROTTLE_MS) {
        console.log('🛑 Throttling fetch request');
        return;
      }
      
      // Normalize coordinates
      const normalizedLocation = {
        lat: Number(location.lat.toFixed(6)),
        lon: Number(location.lon.toFixed(6))
      };
    
      // Check if we've already fetched this exact location
      if (lastFetchRef.current?.lat === normalizedLocation.lat && 
          lastFetchRef.current?.lon === normalizedLocation.lon) {
        console.log('🔄 Skipping duplicate fetch:', {
          current: lastFetchRef.current,
          requested: normalizedLocation
        });
        return;
      }
    
      console.log('🚀 Starting new fetch:', {
        previous: lastFetchRef.current,
        new: normalizedLocation,
        timestamp: now
      });
    
      lastFetchTimeRef.current = now;
      lastFetchRef.current = normalizedLocation;
    
      if (!location.lat || !location.lon) {
        console.log('⚠️ No location data available, skipping fetch');
        return;
      }
  
      // Clear any pending timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
  
      // Set loading state
      setLoadingState(prev => ({
        ...prev,
        isLoading: !isRefreshing
      }));
  
      try {
        // Clear existing data before fetching new data
        if (isActive) setData(null);
  
        console.log('📡 Fetching bus data for location:', { lat: location.lat, lon: location.lon });
        
        const response = await fetch(
          `/api/busdata?lat=${location.lat}&lon=${location.lon}`,
          { 
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
  
        const json = await response.json();
        
        // Only update state if component is still mounted
        if (isActive) {
          setData(json);
          setError(null);
          
          const now = new Date();
          const formattedTime = now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          });
          setLastUpdatedTime(formattedTime);

          // Move the location log here, after data is successfully fetched and set
          console.log("🔍 Bus tiles displaying data for location:", {
            latitude: location.lat,
            longitude: location.lon,
          });
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          if (process.env.NODE_ENV === 'development') {
            console.log('Fetch aborted due to new request');
          }
          return;
        }
        console.error('❌ Fetch error:', err);
        if (isActive) {
          setError('Failed to load bus data');
        }
      } finally {
        if (isActive) {
          setLoadingState(prev => ({
            ...prev,
            isLoading: false,
            isRefreshing: false
          }));
        }
      }
    };

    const debounceTime = process.env.NODE_ENV === 'development' ? 50 : 100;
    
    const timeoutId = setTimeout(() => {
      if (isActive) {
        fetchData();
      }
    }, debounceTime);
  
    return () => {
      isActive = false;
      if (process.env.NODE_ENV !== 'development') {
        controller.abort();
      }
      clearTimeout(timeoutId);
    };
}, [debouncedLocation.lat, debouncedLocation.lon, isRefreshing]);


  useEffect(() => {
    setIsMobile(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
  }, [isChangingLocation]);

  useEffect(() => {
    const handleResize = () => {
      // Debounce the resize event to prevent excessive re-renders
      const width = window.innerWidth;
      if (windowWidth === null || Math.abs(width - windowWidth) > 50) {
        setWindowWidth(width);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [windowWidth]);

  interface BusRoutePopupProps {
    route: string;
    stops: string[];
    currentStop: number;
    destination: string;
    onClose: () => void;
    userLocation?: string;
  }

  const fetchServiceAlert = async (routeId: string) => {
    const cleanRouteId = routeId.replace(/MTA NYCT_|MTABC_/g, '').toUpperCase();

    try {
      const isExpressRoute = /^(BM|QM|BXM|Q\d+|B\d+|S\d+|X\d+)/.test(cleanRouteId);
      const fullRouteId = isExpressRoute ? `MTABC_${cleanRouteId}` : `MTA NYCT_${cleanRouteId}`;



      const res = await fetch(`/api/servicealert?routeId=${encodeURIComponent(fullRouteId)}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch alert for route ${routeId}`);
      }

      const data = await res.json();

      if (data.situations && data.situations.length > 0) {
        const formattedAlert: ServiceAlert = {
          route: cleanRouteId,
          summary: data.situations[0].summary || '',
          description: data.situations[0].description || '',
          creationTime: data.situations[0].creationTime || '',
          updatedTime: data.situations[0].updatedTime || '',
          activePeriod: data.situations[0].activePeriod || [],
          status: data.situations[0].reasonName || '',
          notice: data.situations[0].advice || '',
          mapLink: data.situations[0]?.mapLink || ''
        };
        setServiceAlert(formattedAlert);
      } else {
        // Create a "no alerts" message
        const noAlertsMessage: ServiceAlert = {
          route: cleanRouteId,
          summary: 'No Current Service Alerts',
          description: 'There are currently no service alerts for this route.',
          creationTime: new Date().toISOString(),
          updatedTime: new Date().toISOString(),
          activePeriod: [],
          status: 'GOOD_SERVICE',
          notice: 'Service is operating normally.'
        };
        setServiceAlert(noAlertsMessage);
      }

      setIsAlertPopupOpen(true);

    } catch (error) {
      console.error('Error fetching service alert:', error);
      // Create an error message
      const errorMessage: ServiceAlert = {
        route: cleanRouteId,
        summary: 'Error Fetching Service Alerts',
        description: 'Unable to fetch service alerts at this time.',
        creationTime: new Date().toISOString(),
        updatedTime: new Date().toISOString(),
        activePeriod: [],
        status: 'ERROR',
        notice: 'Please try again later.'
      };
      setServiceAlert(errorMessage);
      setIsAlertPopupOpen(true);
    }
  };


  const LoadingAnimation = () => (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "white",
      zIndex: 1000,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "20px",
      padding: "0 20px"
    }}>
      <p style={{ 
        fontSize: "1.1rem",
        lineHeight: "1.5",
        textAlign: "right"
      }}>
        {isWaitingForGeolocation 
          ? "Trying to find bus stops near you..." 
          : "Loading bus data..."}
      </p>
      <div style={{
        animation: "busDrive 1s infinite cubic-bezier(0.4, 0, 0.2, 1)"
      }}>
        <Image
          src="/icons/bus_icon.png"
          alt="Bus Icon"
          width={120}
          height={60}
          priority
          style={{
            objectFit: "contain",
          }}
        />
      </div>

      <style>
        {`
          @keyframes busDrive {
            0% {
              transform: translateY(0);
              opacity: 1;
            }
            50% {
              transform: translateY(-15px);
              opacity: 0.9;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
  const BusRoutePopup: React.FC<BusRoutePopupProps> = memo(({
    route,
    stops,
    currentStop,
    destination,
    onClose,
    userLocation,
  }) => {

    const isGoingUp = useMemo(() => {
      return currentStop > stops.length / 2;
    }, [currentStop, stops.length]);

    const busIcon = isGoingUp ? "/icons/bus_up.png" : "/icons/bus_down.png";

    const [isScrollableRight, setIsScrollableRight] = useState(false);

    const scrollableRef = useRef<HTMLDivElement>(null);
    const [highlightedStop, setHighlightedStop] = useState<string | null>(null);

    // Store the highlighted stop in a ref to avoid recreating the scroll handler
    const highlightedStopRef = useRef(highlightedStop);
    highlightedStopRef.current = highlightedStop;
    
    // Create a stable scroll handler that uses the ref
    const handleScroll = useCallback((event: Event) => {
      const scrollEl = event.target as HTMLDivElement;
      if (!scrollEl) return;

      const scrollTop = scrollEl.scrollTop;
      let closestStop = null;
      let minDistance = Infinity;

      const children = Array.from(scrollEl.children);
      for (const child of children) {
        const stopElement = child as HTMLElement;
        const offsetTop = stopElement.offsetTop - scrollEl.offsetTop;
        const distance = Math.abs(scrollTop - offsetTop);

        if (distance < minDistance) {
          minDistance = distance;
          closestStop = stopElement.getAttribute('data-stop');
        }
      }

      if (closestStop && closestStop !== highlightedStopRef.current) {
        setHighlightedStop(closestStop);
      }
    }, [highlightedStopRef]);

    useEffect(() => {
      const scrollEl = scrollableRef.current;
      if (scrollEl) {
        scrollEl.addEventListener('scroll', handleScroll);
        return () => scrollEl.removeEventListener('scroll', handleScroll);
      }
    }, [handleScroll]);

    const checkScrollableRight = () => {
      const el = scrollableRef.current;
      if (el) {
        setIsScrollableRight(el.scrollWidth > el.clientWidth + el.scrollLeft);
      }
    };

    useEffect(() => {
      checkScrollableRight();
      const el = scrollableRef.current;
      if (el) {
        el.addEventListener('scroll', checkScrollableRight);
        window.addEventListener('resize', checkScrollableRight);
      }
      return () => {
        if (el) el.removeEventListener('scroll', checkScrollableRight);
        window.removeEventListener('resize', checkScrollableRight);
      };
    }, []);
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsAlertPopupOpen(false); // Close Service Alert Popup
          setSelectedStop(null); // Close Bus Popup (if applicable)
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, []);

    // Set up scroll listener with cleanup
    useEffect(() => {
      const scrollEl = scrollableRef.current;
      if (scrollEl) {
        scrollEl.addEventListener('scroll', handleScroll);
        // Initial highlight calculation
        handleScroll({ target: scrollEl } as unknown as Event);

        return () => {
          scrollEl.removeEventListener('scroll', handleScroll);
        };
      }
    }, []); // Empty dependency array since we're using refs

    const stopsList = useMemo(() => {
      return stops.map((stop: string, index: number) => (
        <div
          key={`${stop}-${index}`}
          data-stop={stop}
          style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor:
              stop === highlightedStop
                ? '#FFEE93'
                : stop === userLocation
                  ? '#FFE4B5'
                  : index === currentStop
                    ? '#e6f7ff'
                    : 'transparent',
            marginBottom: '8px',
            transition: 'background-color 0.3s',
          }}
        >
          {stop}
          {stop === userLocation && (
            <span
              style={{
                marginLeft: '8px',
                fontSize: '0.9em',
                color: '#666',
              }}
            >
              (Closest)
            </span>
          )}
        </div>
      ));
    }, [stops, highlightedStop, userLocation, currentStop]);

    const handleOverlayClick = useCallback((e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }, [onClose]);

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}
        onClick={handleOverlayClick}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '400px',
            height: '80vh',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            overscrollBehavior: 'contain',
          }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <div
            style={{
              padding: '20px',
              borderBottom: '1px solid #eee',
              flex: 'none',
            }}
          >
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                left: '20px',
                top: '20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '1.5rem',
              }}
            >
              ←
            </button>
            <h2 style={{ textAlign: 'center', marginTop: '10px' }}>
              Route {route}
              <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
                to {destination}
              </div>
            </h2>
          </div>

          <div
            ref={scrollableRef}
            style={{
              flex: '1',
              overflowY: 'auto',
              padding: '20px',
              minHeight: 0,
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'none',
              scrollbarWidth: 'thin',
              maxHeight: 'calc(100% - 60px)',
            }}
          >
            <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
              <div
                style={{
                  width: '2px',
                  backgroundColor: '#ccc',
                  position: 'relative',
                  minHeight: stops.length * 50,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: `${((currentStop) / (stops.length - 1)) * 100}%`,
                    left: '-11px',
                    width: '45px',
                    height: '135px',
                    transform: 'translateY(-50%)',
                  }}
                >
                  <Image
                    src={busIcon}
                    alt={isGoingUp ? 'Bus going up' : 'Bus going down'}
                    layout="fill"
                    objectFit="contain"
                  />
                </div>
              </div>

              <div style={{ flex: 1 }}>
                {stopsList}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, (prevProps, nextProps) => {
    const areEqual = prevProps.route === nextProps.route &&
      prevProps.currentStop === nextProps.currentStop &&
      prevProps.destination === nextProps.destination &&
      prevProps.userLocation === nextProps.userLocation &&
      prevProps.stops.length === nextProps.stops.length &&
      prevProps.stops.every((stop, index) => stop === nextProps.stops[index]);
    return areEqual;
  });

  BusRoutePopup.displayName = 'BusRoutePopup';

  useEffect(() => {
    const visitedFromHeader = sessionStorage.getItem('visitedFromHeader');
    const visitedFromHamburger = sessionStorage.getItem('visitedFromHamburger');
    if (visitedFromHeader === 'true' || visitedFromHamburger === 'true') {
      setIsBannerVisible(false);
      sessionStorage.removeItem('visitedFromHeader');
      sessionStorage.removeItem('visitedFromHamburger');
    }
  }, []);

  useEffect(() => {
    if (isBannerVisible) {
      // Start fade-out animation at 10 seconds
      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 10000);

      // Fully hide the banner at 15 seconds
      const hideTimer = setTimeout(() => {
        setIsBannerVisible(false);
        setIsFadingOut(false); // Reset fade-out state
      }, 12000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isBannerVisible]);

  useEffect(() => {
    let fadeTimer: NodeJS.Timeout;
    let hideTimer: NodeJS.Timeout;

    if (isIssueBannerVisible) {
      // Clear any existing timers
      setIsIssueBannerFadingOut(false);

      // Only start auto-hide timers if banner was not manually triggered
      if (isIssueBannerVisible) {
        fadeTimer = setTimeout(() => {
          setIsIssueBannerFadingOut(true);
        }, 18000);

        hideTimer = setTimeout(() => {
          setIsIssueBannerVisible(false);
          setIsIssueBannerFadingOut(false);
        }, 20000);
      }
    }

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [isIssueBannerVisible]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    }
  }, []);
  // 🛠️ Log Location State Changes
  useEffect(() => {
  }, [location]);

  useEffect(() => {
    const checkAlerts = async () => {
      if (!data) return;

      // Get unique route names
      const uniqueRoutes = new Set<string>();
      Object.values(data.arrivals || {}).forEach((arrivals: unknown) => {
        if (Array.isArray(arrivals)) {
          arrivals.forEach((arrival) => {
            const route = arrival?.MonitoredVehicleJourney?.LineRef
              ?.replace("MTA NYCT_", "")
              .replace("MTABC_", "");
            if (route) uniqueRoutes.add(route);
          });
        }
      });

      // Check alerts for each route
      const alertStatuses: Record<string, boolean> = {};
      await Promise.all([...uniqueRoutes].map(async (route) => {
        alertStatuses[route] = await checkServiceAlert(route);
      }));

      setRoutesWithAlerts(alertStatuses);
    };

    checkAlerts();
  }, [data]);

  const fetchBusData = async (lat: number, lon: number, isRefresh: boolean = false) => {
    // console.log('🚌 fetchBusData called with:', { lat, lon, isRefresh });

    if (!isRefresh) {
      setLoadingState(prev => ({ ...prev, isLoading: true }));
    } else {
      setLoadingState(prev => ({ ...prev, isRefreshing: true }));
    }

    try {
      const fetchPromise = fetch(`/api/busdata?lat=${lat}&lon=${lon}`);
      const [res] = await Promise.all([
        fetchPromise,
        !isRefresh ? new Promise(resolve => setTimeout(resolve, 1000)) : Promise.resolve()
      ]);
      const now = new Date();
      const formattedTime = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
      setLastUpdatedTime(formattedTime);
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError('Failed to load bus data.');
    } finally {
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        isRefreshing: false
      }));
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    }
  }, []);

  useEffect(() => {
    if (isMobile) {
      const hideAddressBar = () => window.scrollTo(0, 1);
      // Clean up any existing listeners
      window.removeEventListener('load', hideAddressBar);
      window.removeEventListener('scroll', hideAddressBar);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      const handleTileScroll = (e: Event) => {
        const tile = e.target as HTMLElement;
        const isAtTop = tile.scrollTop === 0;
        const isAtBottom = Math.abs(tile.scrollHeight - tile.scrollTop - tile.clientHeight) < 1;

        if (isAtBottom) {
          window.scrollBy({ top: 50, behavior: 'smooth' });
        } else if (isAtTop && window.scrollY > 0) {
          window.scrollBy({ top: -50, behavior: 'smooth' });
        }
      };

      const tiles = document.querySelectorAll('[data-bus-tile]');
      tiles.forEach(tile => {
        tile.addEventListener('scroll', handleTileScroll);
      });

      return () => {
        tiles.forEach(tile => {
          tile.removeEventListener('scroll', handleTileScroll);
        });
      };
    }
  }, [isMobile]);

  useEffect(() => {
    const getSuggestions = async () => {
      if (tempAddress.length > 3) {
        if (/\d/.test(tempAddress)) {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?` +
              new URLSearchParams({
                q: tempAddress + ' New York',
                format: 'json',
                countrycodes: 'us',
                limit: '5',
                addressdetails: '1'
              })
            );
            const data = await response.json();
            setAddressSuggestions(data.map((item: any) => item.display_name));
          } catch (error) {
            console.error('Error fetching suggestions:', error);
          }
        }
      } else {
        setAddressSuggestions([]);
      }
    };

    const timeoutId = setTimeout(getSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [tempAddress]);
  useEffect(() => {
    const ticker = setInterval(() => {
      const elapsed = (Date.now() - lastUpdateRef.current) / 1000;
      const remain = refreshInterval / 1000 - elapsed;
      if (remain <= 0) {
        lastUpdateRef.current = Date.now();
        setTimeRemaining(refreshInterval / 1000);
        fetchBusData(location.lat, location.lon, true); // Add true flag for refresh
      } else {
        if (timerRef.current) {
          timerRef.current.textContent = Math.ceil(remain).toString();
        }
      }
    }, 1000);
    return () => clearInterval(ticker);
  }, [location.lat, location.lon]);

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: "center", fontFamily: "Helvetica, sans-serif" }}>
        Error: {error}
      </div>
    );
  }


  if (isWaitingForGeolocation || (loadingState.isLoading && !loadingState.isRefreshing)) {
    return <LoadingAnimation />;
  }
  if (!data) {
    return (
      <div style={{ padding: 20, textAlign: "center", fontFamily: "Helvetica, sans-serif" }}>
      </div>
    );
  }


  let stopsSorted = [...(data.stops || [])].sort((a, b) => {
    const distA = a.distance ?? 99999;
    const distB = b.distance ?? 99999;
    return distA - distB;
  });

  stopsSorted = stopsSorted.slice(0, 5);

  const stopsWithArrivals: any[] = [];
  const stopsNoArrivals: any[] = [];
  for (const stop of stopsSorted) {
    const hasArrivals = data.arrivals?.[stop.stopId]?.length > 0;
    if (hasArrivals) {
      stopsWithArrivals.push(stop);
    } else {
      stopsNoArrivals.push(stop);
    }
  }
  const finalStops = [...stopsWithArrivals, ...stopsNoArrivals];

  const fetchRouteStops = async (routeId: string, tileStopName: string, destination: string, direction: string) => {
    try {
      const encodedRouteId = encodeURIComponent(routeId);
      const encodedTileStopName = encodeURIComponent(tileStopName);
      const encodedDestination = encodeURIComponent(destination);
      const encodedDirection = encodeURIComponent(direction);

      const response = await fetch(
        `/api/routestops?routeId=${encodedRouteId}&tileStopName=${encodedTileStopName}&destination=${encodedDestination}&direction=${encodedDirection}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.stops || [];
    } catch (error: any) {
      console.error('Error fetching route stops:', error.message || error);
      return [];
    }
  };


  function getStopArrivals(stopId: string) {
    const visits = data.arrivals?.[stopId] || [];
    const routeDirectionMap: Record<string, Record<string, any[]>> = {};

    visits.forEach((visit: any) => {
      const mvj = visit.MonitoredVehicleJourney;
      if (!mvj) return;

      let route = "Unknown Route";
      if (mvj.LineRef) {
        route = mvj.LineRef.replace("MTA NYCT_", "")
          .replace("MTABC_", "");
      }

      // Get the direction (0 or 1) from the DirectionRef
      const direction = mvj.DirectionRef;
      const destination = mvj.DestinationName || "Unknown Destination";
      // Use direction as key but show destination in UI
      const directionKey = `to ${destination}`;

      if (!routeDirectionMap[route]) {
        routeDirectionMap[route] = {};
      }
      if (!routeDirectionMap[route][directionKey]) {
        routeDirectionMap[route][directionKey] = [];
      }

      const vehicleRef = mvj?.VehicleRef?.replace(/^\D+/, '') || 'Unknown VehicleRef';
      routeDirectionMap[route][directionKey].push({
        ...visit,
        direction, // Include direction in visit data
        vehicleRef
      });
    });

    return routeDirectionMap;
  }

  function getMinutesAway(dateString: string) {
    const arrivalDate = new Date(dateString);
    const now = new Date();
    const diffMs = arrivalDate.getTime() - now.getTime();
    if (diffMs <= 0) return null;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin >= 60) return ">1 hr";
    return diffMin + " min away";
  }


  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <Image
          src="/icons/bus_icon.png"
          alt="Loading..."
          width={120}
          height={60}
          priority
          style={{
            animation: "busDrive 1s infinite cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        />
        <style jsx global>{`
          @keyframes busDrive {
            0% {
              transform: translateY(0);
              opacity: 1;
            }
            50% {
              transform: translateY(-15px);
              opacity: 0.9;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}</style>
        <p>Loading bus data...</p>
      </div>
    }>
      <div style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        margin: "0 20px"
      }}>
        {/* Location Services Banner */}
        {isBannerVisible && windowWidth !== null && (
          <div style={{
            backgroundColor: "rgba(255, 204, 187, 0.9)",
            color: "#FF3632",
            padding: "8px 12px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            position: "fixed",
            top: "10px",
            left: "50%",
            transform: `translate(-50%, ${isFadingOut ? -20 : 0}px)`,
            zIndex: 2000,
            textAlign: "center",
            width: windowWidth < 768 ? "90%" : "max-content", // Change from "auto" to "max-content"
            maxWidth: "90%", // Add this to ensure it never overflows the screen
            whiteSpace: "normal", // Remove the conditional, always allow wrapping
            lineHeight: "1.4",
            boxSizing: "border-box",
            transition: "opacity 1s ease-out, transform 1s ease-out",
            opacity: isFadingOut ? 0 : 1,
            fontSize: "0.95rem",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
            justifyContent: "center",
          }}>
            <span style={{
              fontWeight: "bold",
              textAlign: "center",
              flex: "0 1 auto",
              whiteSpace: "normal", // Remove the conditional, always allow wrapping
              wordWrap: "break-word", // Remove the conditional, always allow word breaking
              overflowWrap: "break-word", // Add this to help with wrapping
              hyphens: "auto",
            }}>
              {!locationServicesEnabled ? (
                "📍 Please turn on location services to get information for the closest stops to you!"
              ) : isOutsideNYC ? (
                userLocation ?
                  `📍 You're currently in ${userLocation}. Since you're outside NYC, please select from the dropdown or type in an NYC address.` :
                  "📍 You're currently outside NYC. Please select from the dropdown or type in an NYC address."
              ) : (
                "📍 Please turn on location services to get information for the closest stops to you!"
              )}
            </span>
            <button
              onClick={() => setIsBannerVisible(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
                marginLeft: "8px",
                color: "#FF3632",
                flexShrink: 0,
                padding: "0 8px"
              }}
            >
              ×
            </button>
          </div>
        )}
        <BusPopupProvider>
          {isAlertPopupOpen && serviceAlert && (
            <ServiceAlertPopup
              alert={serviceAlert}
              onClose={() => {
                setIsAlertPopupOpen(false);
                setServiceAlert(null);
              }}
            />
          )}
          <BusContent>
            {(showBusInfo) => (
              <div style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                width: "100%",
                position: "relative",
                flex: 1,
                overflow: "hidden"
              }}>
                <div style={{
                  padding: "20px 0",
                  textAlign: "center",
                  width: "100%",
                  maxWidth: "100vw",
                  flex: 1, // Added to ensure it takes up remaining space
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  gap: "8px",
                }}>
                  <div style={{
                    overflow: "hidden",
                    maxWidth: "100vw",
                    scrollSnapType: isMobile ? "x mandatory" : "none",
                    margin: "0 -20px",
                    padding: "0 20px"
                  }}></div>

                  {!isInvalidAddress && data && finalStops.length > 0 && (
                    <div style={{ position: "relative" }}>
                      <p
                        className="dark:text-white"
                        style={{
                          margin: "8px 0", // Reduced margin
                          marginTop: "-10px",
                          textAlign: "center",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "4px", // Tighter gap
                          fontSize: "0.9rem", // Slightly smaller font size
                          lineHeight: "1.2", // Compact line spacing
                          marginBottom: "10px",
                        }}
                      >
                        <span style={{ fontSize: "1.5rem", lineHeight: "1" }}>⏳</span>
                        <strong style={{ fontSize: "1rem" }}>Updated:{updatedTimeString}</strong>
                        {lastUpdatedTime && (
                          <strong style={{ fontSize: "1rem" }}>
                            {lastUpdatedTime}
                          </strong>
                        )}
                        <span>(next refresh in <span ref={timerRef}>{timeRemaining}</span>s)</span>
                      </p>
                    </div>
                  )}

                  {isStopLoading && (
                    <div style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "4px",
                      backgroundColor: "#ccc",
                      zIndex: 1000,
                      overflow: "hidden"
                    }}>
                      <div style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#0078D7",
                        animation: "progressBar 1s linear infinite"
                      }} />
                      <style>
                        {`
                    @keyframes progressBar {
                      0% { transform: translateX(-100%); }
                      100% { transform: translateX(100%); }
                    }
                  `}
                      </style>
                    </div>
                  )}
                    <div
                      ref={scrollContainerRef}
                      style={{
                        display: "flex",
                        overflowX: "auto",
                        overflowY: "hidden",
                        gap: "16px",
                        touchAction: "pan-x",
                        WebkitOverflowScrolling: "touch",
                        scrollSnapType: "x mandatory",
                        margin: "0 -20px",
                        padding: "0 20px",
                        height: isMobile ? "50vh" : "calc(100vh - 100px)",
                        boxSizing: "border-box",
                        position: "relative",
                        overscrollBehavior: "auto",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                    >

                      {windowWidth !== null && data && finalStops.length === 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center',
                          padding: '20px'
                        }}>
                          <p style={{ marginBottom: '10px' }}>
                            Whoops! Looks like the address you entered is invalid. Please enter a valid address.
                          </p>
                          <p style={{ color: '#666' }}>
                            ex. 20 W 34th St. New York, New York 10001
                          </p>
                        </div>
                      )}

                      {finalStops.map((stop: any, index: number) => {
                        const isFirstTile = index === 0;
                        const isLastTile = index === finalStops.length - 1;
                        const arrivalsArray = data.arrivals?.[stop.stopId] || [];
                        const hasBuses = arrivalsArray.length > 0;
                        const routeMap = getStopArrivals(stop.stopId);
                        const hasMultipleRoutes = Object.keys(routeMap).length > 1;


                        return (
                          <ScrollableTile
                            key={stop.stopId}
                            style={{
                              position: 'relative',
                              scrollSnapAlign: isMobile ? 'center' : 'none',
                              width: isMobile ? 'calc(100vw - 40px)' : '360px',
                              minWidth: isMobile ? 'calc(100vw - 40px)' : '360px',
                              maxWidth: '360px',
                              height: isMobile ? '50vh' : '100%',
                              backgroundColor: '#D3D3D3',
                              borderRadius: '8px',
                              boxSizing: 'border-box',
                              marginBottom: '20px',
                              color: 'black',
                              flexShrink: 0,
                              display: 'flex',
                              flexDirection: 'column',
                            }}
                          >
{/* Navigation Container - Only render if mobile and has arrows */}
{isMobile && (
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                height: '5px', // Fixed height for consistency
                                marginBottom: '8px',
                                padding: '0 4px'
                              }}>
                                {/* Left Arrow or Spacer */}
                                <div style={{
    position: 'absolute',
    top: '50%', // Center vertically
    left: '10px', // Adjust for desired horizontal spacing
    transform: 'translateY(-50%)', // Align with vertical midpoint
    zIndex: 10, // Ensure it's above other elements
  }}>
                                  {index > 0 && (
                                    <button
                                      onClick={() => {
                                        if (scrollContainerRef.current) {
                                          const fullWidth = window.innerWidth - 40; // Same as calc(100vw - 40px)
                                          const scrollAmount = fullWidth + 16; // Add the gap width
                                          scrollContainerRef.current.scrollBy({
                                            left: -scrollAmount,
                                            behavior: 'smooth'
                                          });
                                        }
                                      }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '20px',
                                        padding: '0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '100%',
                                        height: '100%',
                                      }}
                                    >
                                      <Image
                                        src="/icons/left_caret.png"
                                        alt="Previous"
                                        width={15}
                                        height={40}
                                        style={{
                                          filter: 'drop-shadow(0px 2px 8px rgba(0, 0, 0, 1))',
                                          transition: 'filter 0.2s ease-in-out'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.filter = 'drop-shadow(0px 3px 3px rgba(0, 0, 0, 0.35))';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.filter = 'drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.25))';
                                        }}
                                      />
                                    </button>
                                  )}
                                </div>

                                {/* Center Spacer */}
                                <div style={{ flex: 1 }} />

                                {/* Right Arrow or Spacer */}
                                <div style={{
    position: 'absolute',
    top: '50%', // Center vertically
    right: '10px', // Adjust for desired horizontal spacing
    transform: 'translateY(-50%)', // Align with vertical midpoint
    zIndex: 10, // Ensure it's above other elements
  }}>
                                  {!isLastTile && (
                                    <button
                                      onClick={() => {
                                        if (scrollContainerRef.current) {
                                          const fullWidth = window.innerWidth - 40; // Same as calc(100vw - 40px)
                                          const scrollAmount = fullWidth + 16; // Add the gap width
                                          scrollContainerRef.current.scrollBy({
                                            left: scrollAmount,
                                            behavior: 'smooth'
                                          });
                                        }
                                      }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '20px',
                                        padding: '0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '100%',
                                        height: '100%'
                                      }}
                                    >
                                      <Image
                                        src="/icons/right_caret.png"
                                        alt="Previous"
                                        width={15}
                                        height={40}
                                        style={{
                                          filter: 'drop-shadow(0px 2px 8px rgba(0, 0, 0, 1))',
                                          transition: 'filter 0.2s ease-in-out'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.filter = 'drop-shadow(0px 3px 3px rgba(0, 0, 0, 0.35))';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.filter = 'drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.25))';
                                        }}
                                      />
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                            <h2 style={{
                              fontSize: "1.3rem",
                              fontWeight: "bold",
                              margin: "0", // Reset any margin
                              padding: "8px", // Ensure padding is consistent
                            }}>
                              <span style={{ fontSize: "1.8rem" }}>🚏</span>
                              {stop.stopName}{" "}
                              {stop.distance != null
                                ? `(${stop.distance} miles away)`
                                : "(distance unknown)"}
                            </h2>

                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              // marginTop: '4px',
                            }}>
                              <span style={{
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                color: '#333',
                              }}>
                                Directions to this stop:
                              </span>
                              <NavigationButtons
                                stopName={stop.stopName}
                                lat={Number(stop.lat)}
                                lon={Number(stop.lon)}
                              />
                            </div>

                            {!hasBuses && (
                              <p style={{
                                fontStyle: "italic",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                marginTop: 50,
                              }}>
                                No buses en-route to this stop
                              </p>
                            )}

                            {hasBuses && (
                              <div style={{ flex: 1 }}
                              >
                                {Object.entries(routeMap).map(([routeName, directions]) => (
                                  <div
                                    key={routeName}
                                    style={{
                                      margin: "16px auto",
                                      backgroundColor: "#2360A5",
                                      borderRadius: "8px",
                                      color: "white",
                                      fontWeight: "bold",
                                      padding: "8px",
                                      display: "flex",
                                      width: "90%",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      position: "relative",
                                    }}
                                  >
                                    <div
                                      style={{
                                        marginBottom: 8,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Route clicked:', routeName);
                                        setSelectedRouteId(routeName);
                                        console.log('selectedRouteId set to:', routeName);
                                        setIsMapPopupOpen(true);
                                        console.log('isMapPopupOpen set to true');
                                        document.body.classList.add('no-scroll');
                                      }}
                                    >
                                      {routeName}
                                      {routesWithAlerts[routeName] && (
                                        <span
                                          onClick={() => {
                                            fetchServiceAlert(routeName);
                                          }}
                                          style={{
                                            marginLeft: "4px",
                                            cursor: "pointer",
                                            filter: 'drop-shadow(0px 0px 8px rgba(200, 0, 0, 1))'
                                          }}
                                          title="View Service Alerts"
                                        >
                                          🚨
                                        </span>
                                      )}
                                    </div>

                                    {Object.entries(directions).map(
                                      ([directionKey, visitsArr]) => (
                                        <div
                                          key={directionKey}
                                          style={{
                                            marginTop: 8,
                                            backgroundColor: "white",
                                            color: "black",
                                            fontWeight: "normal",
                                            borderRadius: 8,
                                            padding: 8,
                                            width: "100%",
                                            maxWidth: 300,
                                            textAlign: "center",
                                          }}
                                        >
                                          <strong> 📍 {directionKey}</strong>
                                          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                                            {visitsArr.sort((a: any, b: any) => {
                                              const aStops = a.MonitoredVehicleJourney?.MonitoredCall?.Extensions?.Distances?.StopsFromCall || 0;
                                              const bStops = b.MonitoredVehicleJourney?.MonitoredCall?.Extensions?.Distances?.StopsFromCall || 0;
                                              return aStops - bStops;
                                            })
                                              .map((visit: any, i: number) => {
                                                const mvj = visit.MonitoredVehicleJourney;
                                                const vehicleRef = visit.vehicleRef || 'Unknown VehicleRef';
                                                let stopsAway = -1;
                                                const distances =
                                                  mvj?.MonitoredCall?.Extensions?.Distances;
                                                if (
                                                  distances &&
                                                  typeof distances.StopsFromCall === "number"
                                                ) {
                                                  stopsAway = distances.StopsFromCall;
                                                }

                                                let arrivalTime = "";
                                                const expectedTime =
                                                  mvj?.MonitoredCall?.ExpectedArrivalTime;
                                                if (expectedTime) {
                                                  arrivalTime = new Date(
                                                    expectedTime
                                                  ).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                  });
                                                }

                                                const occupancy = mvj?.Occupancy || null;

                                                let minutesAwayString: string | null = null;
                                                if (expectedTime) {
                                                  minutesAwayString = getMinutesAway(
                                                    expectedTime
                                                  );
                                                }
                                                return (
                                                  <li
                                                    key={i}
                                                    onClick={async () => {
                                                      try {
                                                        const stopArrivals = data.arrivals?.[stop.stopId] || [];

                                                        // Attempt to match VehicleRef including prefix
                                                        const selectedArrival = stopArrivals.find((arrival: any) => {
                                                          const arrivalVehicleRef = arrival?.MonitoredVehicleJourney?.VehicleRef?.toString()?.trim();
                                                          const clickedVehicleRef = visit.vehicleRef?.toString()?.trim();
                                                          return (
                                                            arrivalVehicleRef === clickedVehicleRef ||
                                                            arrivalVehicleRef?.includes(clickedVehicleRef) ||
                                                            clickedVehicleRef?.includes(arrivalVehicleRef)
                                                          );
                                                        });

                                                        if (!selectedArrival) {
                                                          console.warn('⚠️ No matching arrival found for VehicleRef:', visit.vehicleRef);
                                                          console.warn('🚨 Available VehicleRefs in StopArrivals:', stopArrivals.map((a: any) => a?.MonitoredVehicleJourney?.VehicleRef));
                                                        }

                                                        // Get direction from selectedArrival
                                                        const direction = selectedArrival?.MonitoredVehicleJourney?.DirectionRef;

                                                        // Add these diagnostic logs

                                                        // console.log('🚌 Direction Resolution:', {
                                                        //   destination: selectedArrival?.MonitoredVehicleJourney?.DestinationName,
                                                        //   rawDirection: direction,
                                                        //   vehicleRef: visit.vehicleRef
                                                        // });

                                                        const stops = await fetchRouteStops(
                                                          routeName,
                                                          stop.stopName,
                                                          selectedArrival?.MonitoredVehicleJourney?.DestinationName || "",
                                                          direction || "0"
                                                        );

                                                        // Log after API call
                                                        // console.log('🚏 Route Stops Response:', {
                                                        //     routeName,
                                                        //     stopName: stop.stopName,
                                                        //     destination: selectedArrival?.MonitoredVehicleJourney?.DestinationName,
                                                        //     direction: direction,
                                                        //     stopsCount: stops.length,
                                                        //     firstStop: stops[0],
                                                        //     lastStop: stops[stops.length - 1]
                                                        // });

                                                        let stopsAway = 0;

                                                        if (selectedArrival) {
                                                          const distances = selectedArrival?.MonitoredVehicleJourney?.MonitoredCall?.Extensions?.Distances;
                                                          if (distances?.StopsFromCall != null) {
                                                            stopsAway = distances.StopsFromCall;
                                                          } else if (distances?.DistanceFromCall != null) {
                                                            const averageStopDistance = 500; // Average stop distance in meters
                                                            stopsAway = Math.round(distances.DistanceFromCall / averageStopDistance);
                                                          }
                                                        }

                                                        // console.log(
                                                        //     `🚍 Stops Away Calculated: ${stopsAway}, VehicleRef: ${visit.vehicleRef || 'Unknown VehicleRef'}`
                                                        // );

                                                        showBusInfo(
                                                          routeName,
                                                          stops,
                                                          stopsAway,
                                                          selectedArrival?.MonitoredVehicleJourney?.DestinationName || "Unknown Destination",
                                                          stop.stopName,
                                                          selectedStop || stop.stopName,
                                                          stopsAway,
                                                          visit.vehicleRef // Pass VehicleRef explicitly
                                                        );
                                                      } catch (error) {
                                                        console.error('🚨 Error fetching stop data:', error);
                                                      }
                                                    }}
                                                    style={{
                                                      margin: "8px 0",
                                                      // background: "linear-gradient(145deg, #ffffff 50%, #f0f0f0 100%)", // Subtle gradient from white to light gray
                                                      background: "white",
                                                      borderRadius: "8px",
                                                      boxShadow: "inset 0 2px 4px rgba(255, 255, 255, 100), 0 2px 8px rgba(0, 0, 0, 0.15)", // Combines inner highlight and outer shadow
                                                      padding: "12px",
                                                      textAlign: "center",
                                                      cursor: "pointer",
                                                      transition: "transform 0.2s, box-shadow 0.2s",
                                                      position: "relative", // For the pseudo-element
                                                      overflow: "hidden", // To contain the pseudo-element
                                                    }}
                                                    onMouseEnter={(e) => {
                                                      e.currentTarget.style.backgroundColor = "#f5f5f5";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                      e.currentTarget.style.backgroundColor = "white";
                                                    }}
                                                  >
                                                    <div style={{
                                                      position: "absolute",
                                                      top: "8px",
                                                      right: "8px",
                                                      width: "20px",
                                                      height: "20px"
                                                    }}>
                                                      <Image
                                                          src="/icons/info.svg"
                                                          alt="Info"
                                                          width={20}
                                                          height={20}
                                                          style={{
                                                            opacity: 0.6,
                                                            transition: "opacity 0.2s"
                                                          }}
                                                        onMouseEnter={(e) => {
                                                          e.currentTarget.style.opacity = "1";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                          e.currentTarget.style.opacity = "0.6";
                                                        }}
                                                      />
                                                    </div>
                                                    <div style={{
                                                      fontWeight: "bold",
                                                      color: stopsAway <= 1 ? "green" : stopsAway <= 5 ? "orange" : "inherit"
                                                    }}>
                                                      {stopsAway === 0 ? (
                                                        <span>
                                                          about <strong>&lt;1</strong> stop away
                                                        </span>
                                                      ) : stopsAway === 1 ? (
                                                        <span>
                                                          about <strong>1</strong> stop away
                                                        </span>
                                                      ) : stopsAway > 1 ? (
                                                        <span>
                                                          about <strong>{stopsAway}</strong> stops away
                                                        </span>
                                                      ) : (
                                                        <>?? stops away</>
                                                      )}
                                                    </div>
                                                    {arrivalTime ? (
                                                      <div style={{ marginTop: "4px", fontSize: "0.9em" }}>
                                                        Arriving at approx <strong>{arrivalTime}</strong>
                                                        {minutesAwayString && (
                                                          <> ({minutesAwayString})</>
                                                        )}
                                                      </div>
                                                    ) : (
                                                      <div style={{ marginTop: "4px", fontSize: "0.9em" }}>
                                                        Arrival time unknown
                                                      </div>
                                                    )}
                                                    {occupancy && (
                                                      <div style={{ marginTop: "4px", fontSize: "0.9em" }}>
                                                        Occupancy: <strong>{occupancy}</strong>
                                                      </div>
                                                    )}
                                                    {vehicleRef && (
                                                      <div style={{ marginTop: "4px", fontSize: "0.9em", color: "#757575" }}>
                                                        Bus ID: <strong>{vehicleRef}</strong>
                                                      </div>
                                                    )}
                                                  </li>
                                                );
                                              })}
                                          </ul>
                                        </div>
                                      )
                                    )}
                                  </div>
                                ))}
                                {!hasMultipleRoutes && hasBuses && (
                                  <p style={{
                                    marginTop: 8,
                                    fontStyle: "italic",
                                    color: "black",
                                    fontSize: "0.9em"
                                  }}>
                                    Additional routes will be shown here if available
                                  </p>
                                )}
                              </div>
                            )}
                          </ScrollableTile>
                        );
                      })}
                    </div>
                </div>
              </div>
            )}
          </BusContent>
          {/* {isMapPopupOpen && selectedRouteId && (
  console.log('Rendering popup with routeId:', selectedRouteId),
  <RouteMapPopup
    routeId={selectedRouteId}
    onClose={closeRouteMapPopup}
  />
)} */}
        </BusPopupProvider>
      </div>
    </Suspense>
  );
}
const Home = () => {
  return (
    // <Suspense fallback={<div></div>}>
      <HomeContent />
    // </Suspense>
  );
};
HomeContent.displayName = 'HomeContent';
Home.displayName = 'Home';

export default Home;