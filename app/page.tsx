"use client";

import React, { useRef, useState, Suspense, useEffect, useMemo, useCallback, memo, useLayoutEffect } from "react";
import { BusPopupProvider, BusContent } from './busPopupProvider';
import { Inter } from 'next/font/google';
import Image from 'next/image';
import ServiceAlertPopup from './serviceAlertPopup'
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import NavigationButtons from './navigationButtons';
import { BUS_STOP_LOCATIONS } from "./data/busstops";

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

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
  const initialLat = searchParams.get('lat');
  const initialLon = searchParams.get('lon');

  const defaultLat = initialLat ? parseFloat(initialLat) : FALLBACK_LAT;
  const defaultLon = initialLon ? parseFloat(initialLon) : FALLBACK_LON;

  const [locationServicesEnabled, setLocationServicesEnabled] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState<boolean>(true);
  const [selectedStop, setSelectedStop] = useState<string | null>(null);

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [location, setLocation] = useState<{ lat: number; lon: number }>({
    lat: !isNaN(defaultLat) ? defaultLat : FALLBACK_LAT,
    lon: !isNaN(defaultLon) ? defaultLon : FALLBACK_LON,
  });
  const [userLocation, setUserLocation] = useState<string>("");

  const [isOutsideNYC, setIsOutsideNYC] = useState<boolean>(false);

  const [locationLocked, setLocationLocked] = useState(!!(initialLat && initialLon));
  const [routesWithAlerts, setRoutesWithAlerts] = useState<Record<string, boolean>>({});
  const [isLocationChanging, setIsLocationChanging] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isScrollableLeft, setIsScrollableLeft] = useState(false);
  const [isScrollableRight, setIsScrollableRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [timestamp, setTimestamp] = useState(() => String(Date.now()));
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

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

  useEffect(() => {
    if (!searchParams.has('timestamp')) {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set('timestamp', timestamp);
      router.replace(`${pathname}?${newParams.toString()}`);
    }
  }, [timestamp, searchParams, router, pathname]);

  const checkScrollable = () => {
    const el = scrollContainerRef.current;
    console.log('🛠️ checkScrollable Triggered');
    if (el) {
      console.log('🛠️ Scroll Container Found:', {
        scrollLeft: el.scrollLeft,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      });
  
      const canScrollLeft = el.scrollLeft > 0;
      const canScrollRight = el.scrollWidth > el.clientWidth + el.scrollLeft;
  
      console.log('🛠️ Scroll State:', { canScrollLeft, canScrollRight });
  
      setIsScrollableLeft(canScrollLeft);
      setIsScrollableRight(canScrollRight);
    } else {
      console.warn('⚠️ scrollContainerRef is null in checkScrollable');
    }
  };

  useEffect(() => {
    console.log('🛠️ Manual Scroll Check Trigger');
    setTimeout(() => {
      checkScrollable();
    }, 1000); // Delay by 1s to ensure DOM is ready
  }, []);

  useEffect(() => {
    console.log('🔑 GOOGLE_MAPS_API_KEY present:', !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  }, []);
  
  useLayoutEffect(() => {
    console.log('🛠️ useLayoutEffect Mounted: Adding Scroll Listeners');
  
    const setupScrollListener = () => {
      const el = scrollContainerRef.current;
      if (el) {
        console.log('✅ Scroll Container Ready');
        el.addEventListener('scroll', checkScrollable);
        window.addEventListener('resize', checkScrollable);
        checkScrollable(); // Ensure initial state is checked
      } else {
        console.warn('⚠️ scrollContainerRef is still null in useLayoutEffect');
      }
    };
  
    setupScrollListener();
  
    return () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.removeEventListener('scroll', checkScrollable);
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


  useEffect(() => {
    if (location.lat && location.lon) {
      fetchBusData(location.lat, location.lon);
    }
  }, [location]);

  useEffect(() => {
    const locationLabel = searchParams.get('location');
    const addressParam = searchParams.get('address');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
  
    // If we have location parameters in the URL, always respect them
    if (locationLabel || (lat && lon)) {
      if (locationLabel) {
        const predefinedLocation = BUS_STOP_LOCATIONS.find(
          (loc) => loc.label.toLowerCase() === locationLabel.toLowerCase()
        );
  
        if (predefinedLocation && predefinedLocation.lat && predefinedLocation.lon) {
          setLocation({
            lat: predefinedLocation.lat,
            lon: predefinedLocation.lon,
          });
          setSelectedStop(locationLabel);
          setLocationLocked(true);
          return;
        }
      } else if (lat && lon && addressParam) {
        setLocation({
          lat: parseFloat(lat),
          lon: parseFloat(lon)
        });
        setSelectedStop(addressParam);
        setLocationLocked(true);
        return;
      }
    }

    // Only check geolocation if this is the initial load (no location locked)
    if (!locationLocked && !searchParams.has('location') && !searchParams.has('lat') && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newLat = position.coords.latitude;
          const newLon = position.coords.longitude;
          
          if (isWithinNYC(newLat, newLon)) {
            const newLocation = {
              lat: newLat,
              lon: newLon
            };
            setLocation(newLocation);
            setLocationServicesEnabled(true);
            setIsOutsideNYC(false);
            
            // Update URL with geolocation
            const url = new URL(window.location.href);
            url.searchParams.set('timestamp', Date.now().toString());
            window.history.replaceState(
              { ...location, timestamp: Date.now() },
              document.title,
              url.toString()
            );
          } else {
            console.log('📍 Location outside NYC detected:', { newLat, newLon });
            const address = await getAddressFromCoords(newLat, newLon);
            console.log('📍 Geocoding result:', address);
            setUserLocation(address || "Unknown location");
            console.log('📍 UserLocation state updated to:', address || "Unknown location");
            
            setLocationServicesEnabled(true);
            setIsOutsideNYC(true);

            // Only set default location if there's no existing location
            if (!location.lat || !location.lon) {
              const defaultLocation = BUS_STOP_LOCATIONS[0];
              if (defaultLocation.lat !== null && defaultLocation.lon !== null) {
                setLocation({ 
                  lat: defaultLocation.lat, 
                  lon: defaultLocation.lon 
                });
                const url = new URL(window.location.href);
                url.searchParams.set('location', defaultLocation.label);
                url.searchParams.set('lat', defaultLocation.lat.toString());
                url.searchParams.set('lon', defaultLocation.lon.toString());
                window.history.replaceState(
                  { 
                    lat: defaultLocation.lat, 
                    lon: defaultLocation.lon,
                    type: 'location',
                    label: defaultLocation.label
                  },
                  '',
                  url.toString()
                );
              }
            }
          }
        },
        (error) => {
          setLocationServicesEnabled(false);
          // Only set default location if there's no existing location
          if (!location.lat || !location.lon) {
            const defaultLocation = BUS_STOP_LOCATIONS[0];
            if (defaultLocation.lat !== null && defaultLocation.lon !== null) {
              setLocation({ 
                lat: defaultLocation.lat, 
                lon: defaultLocation.lon 
              });
              const url = new URL(window.location.href);
              url.searchParams.set('location', defaultLocation.label);
              url.searchParams.set('lat', defaultLocation.lat.toString());
              url.searchParams.set('lon', defaultLocation.lon.toString());
              window.history.replaceState(
                { 
                  lat: defaultLocation.lat, 
                  lon: defaultLocation.lon,
                  type: 'location',
                  label: defaultLocation.label
                },
                '',
                url.toString()
              );
            }
          }
        }
      );
    } else if (!locationLocked && !location.lat && !location.lon) {
      // Only set default location if there's no existing location
      const defaultLocation = BUS_STOP_LOCATIONS[0];
      if (defaultLocation.lat !== null && defaultLocation.lon !== null) {
        setLocation({ 
          lat: defaultLocation.lat, 
          lon: defaultLocation.lon 
        });
        const url = new URL(window.location.href);
        url.searchParams.set('location', defaultLocation.label);
        url.searchParams.set('lat', defaultLocation.lat.toString());
        url.searchParams.set('lon', defaultLocation.lon.toString());
        window.history.replaceState(
          { 
            lat: defaultLocation.lat, 
            lon: defaultLocation.lon,
            type: 'location',
            label: defaultLocation.label
          },
          '',
          url.toString()
        );
      }
    }
}, [searchParams, locationLocked]);

useEffect(() => {
  const handlePopState = (event: PopStateEvent) => {
    const state = event.state;
    const url = new URL(window.location.href);
    
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');
    const locationParam = url.searchParams.get('location');
    const addressParam = url.searchParams.get('address');

    if (state && state.lat && state.lon) {
      setLocation({ lat: state.lat, lon: state.lon });
      setSelectedStop(state.label || null);
      return;
    }

    if (lat && lon) {
      setLocation({ lat: parseFloat(lat), lon: parseFloat(lon) });
      if (addressParam) {
        setSelectedStop(addressParam);
      } else if (locationParam) {
        setSelectedStop(locationParam);
      }
      return;
    }

    // Default to Union Square if no valid state is found
    const defaultLocation = BUS_STOP_LOCATIONS[0];
    setLocation({ lat: defaultLocation.lat, lon: defaultLocation.lon });
    setSelectedStop(defaultLocation.label);
  };

  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, []);

  const [isFadingOut, setIsFadingOut] = useState(false);

  const refreshInterval = 30000;
  const [timeRemaining, setTimeRemaining] = useState<number>(refreshInterval / 1000);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    setIsMobile(window.matchMedia("(pointer: coarse)").matches);
  }, []);
  const lastUpdateRef = useRef<number>(Date.now());
  const [isStopLoading, setIsStopLoading] = useState<boolean>(false);

  const [tempAddress, setTempAddress] = useState("");

  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [isInvalidAddress, setIsInvalidAddress] = useState<boolean>(false);

  const [isChangingLocation, setIsChangingLocation] = useState(false);
  const timerRef = useRef<HTMLSpanElement>(null);

  const [serviceAlert, setServiceAlert] = useState<ServiceAlert | null>(null);
  const [isAlertPopupOpen, setIsAlertPopupOpen] = useState(false);

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
      zIndex: 1000, // Ensure it's on top
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}>
      <div
        style={{
          animation: "busDrive 1s infinite cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      >
        
        <Image
          src="/icons/bus_icon.png"
          alt="Bus Icon"
          width={120} // Explicit width
          height={60} // Set an appropriate height based on your design
          priority // Optional: Preloads if it's above the fold
          style={{
            objectFit: "contain",
          }}
        />
      </div>
      <p>Loading bus data...</p>

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
  
    if (!isRefresh) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      // Only add minimum loading time for non-refresh operations
      const fetchPromise = fetch(`/api/busdata?lat=${lat}&lon=${lon}`);
      const [res] = await Promise.all([
        fetchPromise,
        !isRefresh ? new Promise(resolve => setTimeout(resolve, 1000)) : Promise.resolve()
      ]);

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      console.error('❌ Fetch error:', err);
      setError('Failed to load bus data.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setIsLocationChanging(false);
      setIsChanging(false);
    }
  };

  useEffect(() => {
    console.log("📍 Location changed:", location);
    setIsChanging(true);
    fetchBusData(location.lat, location.lon, false); // Explicitly mark as not a refresh
  }, [location]);

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
  useEffect(() => {
    console.log('📍 Banner state:', { 
      locationServicesEnabled, 
      isOutsideNYC, 
      userLocation, 
      isBannerVisible 
    });
  }, [locationServicesEnabled, isOutsideNYC, userLocation, isBannerVisible]);
  
  if (error) {
    return (
      <div style={{ padding: 20, textAlign: "center", fontFamily: "Helvetica, sans-serif" }}>
        Error: {error}
      </div>
    );
  }


  if ((loading || isLocationChanging) && !isRefreshing) {
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

  const fetchRouteStops = async (routeId: string, tileStopName: string) => {
    try {
      const encodedRouteId = encodeURIComponent(routeId);
      const encodedTileStopName = encodeURIComponent(tileStopName);

      const response = await fetch(
        `/api/routestops?routeId=${encodedRouteId}&tileStopName=${encodedTileStopName}`
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

      const destination = mvj.DestinationName || "Unknown Destination";
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
        vehicleRef
      });
    });

    return routeDirectionMap;
  }

  const updatedDate = new Date();
  const updatedTimeString = updatedDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

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
            minHeight: isMobile ? "50vh" : "100vh", // Changed from 100vh
            overflowY: "auto",
            position: "relative",
          }}>
            <div style={{
  padding: "20px 0",
  textAlign: "center", 
  width: "100%",
  maxWidth: "100vw",
  minHeight: isMobile ? "60vh" : "auto", // Reduced from auto
  height: isMobile ? "60vh" : "100vh",
  overflowY: "auto",
  overflowX: "hidden",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  gap: "8px",
}}>
  
              {isBannerVisible && windowWidth !== null && (
                <div
                  style={{
                    backgroundColor: "rgba(255, 204, 187, 0.9)",
                    color: "#FF3632",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center", 
                    gap: "8px",
                    position: "absolute",
                    top: "20px",
                    left: "50%",
                    transform: `translate(-50%, ${isFadingOut ? -20 : 0}px)`,
                    zIndex: 1500,
                    textAlign: "center",
                    width: windowWidth < 768 ? "90%" : "auto",
                    maxWidth: windowWidth < 768 ? "100%" : "90%",
                    boxSizing: "border-box",
                    transition: "opacity 1s ease-out, transform 1s ease-out",
                    opacity: isFadingOut ? 0 : 1,
                    wordWrap: "break-word",
                    whiteSpace: "normal",
                    lineHeight: "1.4",
                    fontSize: "0.95rem"
                  }}
                >
                <span
  style={{
    fontWeight: "bold",
    whiteSpace: "normal",
    wordWrap: "break-word",
    textAlign: "center",
    flex: 1,
  }}
>
{!locationServicesEnabled 
    ? "📍 Please turn on location services to get information for the closest stops to you!"
    : isOutsideNYC 
      ? `📍 You're currently in ${userLocation}. Since you're outside NYC, please select from the dropdown or type in an NYC address.`
      : "📍 Please turn on location services to get information for the closest stops to you!"}
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
                  }}
                >
                  ×
                </button>
              </div>
            )}
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
                    <strong style={{ fontSize: "1rem" }}>Updated: {updatedTimeString}</strong>
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

<div style={{ position: 'relative' }}>
{isMobile && (
  <>
    {isScrollableLeft && (
      <Image
        src="/public/icons/left_caret.png"
        alt="Scroll Left"
        style={{
          position: 'absolute',
          top: '50%',
          left: '10px',
          transform: 'translateY(-50%)',
          zIndex: 100,
          cursor: 'pointer',
          width: '24px',
          height: '24px',
          filter: 'drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.5))'
        }}
        onClick={() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
          }
        }}
      />
    )}
    {isScrollableRight && (
      <Image
        src="/public/icons/right_caret.png"
        alt="Scroll Right"
        style={{
          position: 'absolute',
          top: '50%',
          right: '10px',
          transform: 'translateY(-50%)',
          zIndex: 100,
          cursor: 'pointer',
          width: '24px',
          height: '24px',
          filter: 'drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.5))'
        }}
        onClick={() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
          }
        }}
      />
    )}
  </>
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
    padding: "0 30px",
    height: isMobile ? "50vh" : "calc(100vh - 100px)",
    boxSizing: "border-box",
    position: "relative",
    overscrollBehavior: "auto",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    boxShadow: `
      ${isScrollableLeft ? 'inset 15px 0 20px -5px rgba(0,0,0,0.4)' : ''}
      ${isScrollableRight ? 'inset -15px 0 20px -5px rgba(0,0,0,0.4)' : ''}
    `,
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
    <div
      key={stop.stopId}
      data-bus-tile="true"
      style={{
        scrollSnapAlign: isMobile ? "center" : "none",
        width: isMobile ? "calc(100vw - 40px)" : "360px",
        minWidth: isMobile ? "calc(100vw - 40px)" : "360px",
        maxWidth: "360px",
        height: isMobile ? "50vh" : "100%",
        backgroundColor: "#D3D3D3",
        borderRadius: "8px",
        padding: "8px",
        boxSizing: "border-box",
        overflowY: "auto",
        marginBottom: "20px",
        color: "black",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overscrollBehavior: "contain",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(155, 155, 155, 0.7) transparent"
      }}
    >
      {/* Navigation Container - Only render if mobile and has arrows */}
      {isMobile && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          height: '36px', // Fixed height for consistency
          marginBottom: '8px',
          padding: '0 4px'
        }}>
          {/* Left Arrow or Spacer */}
          <div style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center' }}>
            {index > 0 && (
              <button
                onClick={() => {
                  if (scrollContainerRef.current) {
                    const tileWidth = scrollContainerRef.current.querySelector('[data-bus-tile]')?.clientWidth || 360;
                    scrollContainerRef.current.scrollBy({ left: -tileWidth - 15, behavior: 'smooth' });
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
                👈
              </button>
            )}
          </div>

          {/* Center Spacer */}
          <div style={{ flex: 1 }} />

          {/* Right Arrow or Spacer */}
          <div style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center' }}>
            {!isLastTile && (
              <button
                onClick={() => {
                  if (scrollContainerRef.current) {
                    const tileWidth = scrollContainerRef.current.querySelector('[data-bus-tile]')?.clientWidth || 360;
                    scrollContainerRef.current.scrollBy({ left: tileWidth + 15, behavior: 'smooth' });
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
                👉
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
                        Directions:
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
                                  onClick={() => {
                                    console.log('🚌 Route clicked:', routeName); // Add this log
                                    setSelectedRoute(routeName);
                                    console.log('🚌 Selected route state updated to:', routeName); // Add this log
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
                                    }}
                                    title="View Service Alerts"
                                  >
                                    ⚠️
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
                                                  const direction = stop.direction || 'uptown';
                                                  const stops = await fetchRouteStops(routeName, stop.stopName);
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

                                                  console.log(
                                                    `🚍 Stops Away Calculated: ${stopsAway}, VehicleRef: ${visit.vehicleRef || 'Unknown VehicleRef'}`
                                                  );

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
                                                backgroundColor: "white",
                                                borderRadius: "8px",
                                                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
                                                padding: "12px",
                                                textAlign: "center",
                                                cursor: "pointer",
                                                transition: "transform 0.2s",
                                              }}
                                            >
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          </div>
        )}
      </BusContent>
    </BusPopupProvider>
    </Suspense>
  );
}
const Home = () => {
  return (
    <Suspense fallback={<div></div>}>
      <HomeContent />
    </Suspense>
  );
};
HomeContent.displayName = 'HomeContent';
Home.displayName = 'Home';

export default Home;