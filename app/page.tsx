"use client";

import React, { useRef, useState, Suspense, useEffect, useMemo, useCallback, memo } from "react";
import { BusPopupProvider, BusContent } from './busPopupProvider';
import { Inter } from 'next/font/google';
import Image from 'next/image';
import ServiceAlertPopup from './serviceAlertPopup'
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import NavigationButtons from './navigationButtons';

const inter = Inter({ subsets: ['latin'] });

const BUS_STOP_LOCATIONS = [
  // Manhattan
  { label: "Union Square", secondaryLabel: "default", lat: 40.7359, lon: -73.9906 },
  { label: "Times Square", lat: 40.7580, lon: -73.9855 },
  { label: "Central Park", lat: 40.7851, lon: -73.9683 },
  { label: "Empire State Building", lat: 40.7488, lon: -73.9857 },
  { label: "Wall Street", lat: 40.7074, lon: -74.0113 },
  { label: "Grand Central Terminal", lat: 40.7527, lon: -73.9772 },
  { label: "Rockefeller Center", lat: 40.7587, lon: -73.9787 },
  { label: "One World Trade Center", lat: 40.7127, lon: -74.0134 },
  { label: "The High Line", lat: 40.7479, lon: -74.0048 },
  { label: "Bryant Park", lat: 40.7536, lon: -73.9832 },
  { label: "St. Patrick's Cathedral", lat: 40.7585, lon: -73.9759 },
  { label: "Fifth Avenue Shopping District", lat: 40.7603, lon: -73.9755 },
  { label: "Chrysler Building", lat: 40.7516, lon: -73.9755 },
  { label: "Metropolitan Museum of Art", lat: 40.7794, lon: -73.9632 },
  { label: "American Museum of Natural History", lat: 40.7813, lon: -73.9730 },
  { label: "Museum of Modern Art (MoMA)", lat: 40.7614, lon: -73.9776 },
  { label: "Broadway Theater District", lat: 40.7590, lon: -73.9845 },
  { label: "Madison Square Garden", lat: 40.7505, lon: -73.9934 },
  { label: "Little Italy", lat: 40.7191, lon: -73.9973 },
  { label: "Chinatown", lat: 40.7158, lon: -73.9970 },
  { label: "Battery Park", lat: 40.7033, lon: -74.0170 },
  { label: "Chelsea Market", lat: 40.7424, lon: -74.0060 },
  { label: "SoHo", lat: 40.7233, lon: -74.0020 },
  { label: "Washington Square Park", lat: 40.7308, lon: -73.9973 },

  // Brooklyn
  { label: "Brooklyn Bridge", lat: 40.7061, lon: -73.9969 },
  { label: "Prospect Park", lat: 40.6602, lon: -73.9690 },
  { label: "Brooklyn Museum", lat: 40.6712, lon: -73.9636 },
  { label: "DUMBO", lat: 40.7033, lon: -73.9894 },
  { label: "Coney Island", lat: 40.5749, lon: -73.9850 },
  { label: "Barclays Center", lat: 40.6826, lon: -73.9752 },
  { label: "Brooklyn Botanic Garden", lat: 40.6676, lon: -73.9632 },

  // Queens
  { label: "Flushing Meadows-Corona Park", lat: 40.7498, lon: -73.8408 },
  { label: "Citi Field", lat: 40.7571, lon: -73.8458 },
  { label: "Astoria Park", lat: 40.7795, lon: -73.9220 },
  { label: "Rockaway Beach", lat: 40.5795, lon: -73.8351 },
  { label: "JFK Airport", lat: 40.6413, lon: -73.7781 },
  { label: "Gantry Plaza State Park", lat: 40.7479, lon: -73.9565 },

  // The Bronx
  { label: "Yankee Stadium", lat: 40.8296, lon: -73.9262 },
  { label: "Bronx Zoo", lat: 40.8506, lon: -73.8769 },
  { label: "New York Botanical Garden", lat: 40.8623, lon: -73.8770 },
  { label: "Fordham University", lat: 40.8610, lon: -73.8857 },
  { label: "Pelham Bay Park", lat: 40.8719, lon: -73.8065 },

  // Staten Island
  { label: "Staten Island Ferry Terminal", lat: 40.6437, lon: -74.0733 },
  { label: "Staten Island Zoo", lat: 40.6257, lon: -74.1152 },
  { label: "Richmond Town", lat: 40.5706, lon: -74.1455 },

  { label: "Roosevelt Island Tramway", lat: 40.7614, lon: -73.9493 },
];

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
  
  const normalizeStopName = (name: string) => {
    return name
      .toUpperCase()         // Ensure uniform casing
      .replace(/\s*\/\s*/g, ' / ') // Standardize spacing around slashes
      .replace(/\s+/g, ' ')  // Collapse multiple spaces into one
      .trim();              // Remove leading/trailing spaces
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
    if (el) {
      const canScrollLeft = el.scrollLeft > 0;
      const canScrollRight = el.scrollWidth > el.clientWidth + el.scrollLeft;
  
      console.log("🛠️ Scroll Check:", {
        canScrollLeft,
        canScrollRight,
        scrollLeft: el.scrollLeft,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      });
  
      setIsScrollableLeft(canScrollLeft);
      setIsScrollableRight(canScrollRight);
    }
  };
  
  useEffect(() => {
    checkScrollable();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollable);
      window.addEventListener('resize', checkScrollable);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScrollable);
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
  
    // If we have location parameters in the URL
    if (locationLabel || (lat && lon)) {
      if (locationLabel) {
        // Handle predefined location
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
        // Handle custom address
        setLocation({
          lat: parseFloat(lat),
          lon: parseFloat(lon)
        });
        setSelectedStop(addressParam);
        setLocationLocked(true);
        return;
      }
    }

    // No location in URL - check for geolocation
    if (!locationLocked && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
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
            setLocationServicesEnabled(true);  // They have location services, just outside NYC
            setIsOutsideNYC(true);
            setIsBannerVisible(true);
            // Set Union Square as default with proper URL parameters
            const defaultLocation = BUS_STOP_LOCATIONS[0]; // Union Square
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
        },
        (error) => {
          setLocationServicesEnabled(false);
          // Set Union Square as default with proper URL parameters
          const defaultLocation = BUS_STOP_LOCATIONS[0]; // Union Square
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
      );
    } else if (!locationLocked) {
      // Set Union Square as default with proper URL parameters
      const defaultLocation = BUS_STOP_LOCATIONS[0]; // Union Square
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
    if (sessionStorage.getItem("visitedFromHeader")) {
      setIsBannerVisible(false);
      sessionStorage.removeItem("visitedFromHeader");
    }
  }, []);

  useEffect(() => {
    const visitedFromAbout = sessionStorage.getItem("visitedFromAbout");
    const visitedFromSchedules = sessionStorage.getItem("visitedFromSchedules");

    if (visitedFromAbout || visitedFromSchedules) {
      setIsBannerVisible(false);
      sessionStorage.removeItem("visitedFromAbout");
      sessionStorage.removeItem("visitedFromSchedules");
    } else if (isBannerVisible) {
      const timer = setTimeout(() => {
        setIsBannerVisible(false);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [isBannerVisible]);


  useEffect(() => {
    if (isBannerVisible) {
      // Start fade-out animation at 10 seconds
      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 15000);

      // Fully hide the banner at 15 seconds
      const hideTimer = setTimeout(() => {
        setIsBannerVisible(false);
        setIsFadingOut(false); // Reset fade-out state
      }, 11000);

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
            minHeight: "100vh",
            overflowY: "auto",
            position: "relative",
          }}>
            <div style={{
              padding: 20,
              textAlign: "center",
              maxWidth: "100vw",
              minHeight: "calc(100vh - 60px)", // Reduce white space
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start", // Align content to the top
              gap: "8px",
            }} className={inter.className}>
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
                    transform: "translateX(-50%)",
                    zIndex: 1500,
                    textAlign: "center",
                    width: windowWidth < 768 ? "90%" : "auto",
                    maxWidth: windowWidth < 768 ? "100%" : "90%",
                    boxSizing: "border-box",
                    transition: "opacity 1s ease-in-out",
                    opacity: isFadingOut ? 0 : 1,
                    wordWrap: "break-word",
                    whiteSpace: "normal",
                    lineHeight: "1.4",
                    fontSize: "0.95rem",
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
      ? "📍 Doesn't look like you're in NYC! Please select from the dropdown or type in an address."
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

<div
  ref={scrollContainerRef}
  style={{
    display: "flex",
    overflowX: "auto",
    overflowY: "hidden",
    gap: "16px",
    touchAction: "pan-x",
    WebkitOverflowScrolling: "touch",
    scrollSnapType: isMobile ? "x mandatory" : "none",
    margin: "0 -20px",
    padding: "0 10px",
    height: "calc(100vh - 100px)",
    boxSizing: "border-box",
    marginBottom: "20px",
    position: "relative",
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
                
                {finalStops.map((stop: any) => {
                  const arrivalsArray = data.arrivals?.[stop.stopId] || [];
                  const hasBuses = arrivalsArray.length > 0;
                  const routeMap = getStopArrivals(stop.stopId);
                  const hasMultipleRoutes = Object.keys(routeMap).length > 1;

                  return (
                    <div
                      key={stop.stopId}
                      style={{
                        scrollSnapAlign: isMobile ? "center" : "none",
                        width: isMobile ? "calc(100vw - 40px)" : "360px",
                        minWidth: isMobile ? "calc(100vw - 40px)" : "360px",
                        maxWidth: "360px",
                        height: "100%",
                        backgroundColor: "#D3D3D3",
                        borderRadius: "8px",
                        padding: "8px",
                        boxSizing: "border-box",
                        overflowY: "auto",
                        marginBottom: "20px",
                        color: "black",
                        flexShrink: 0,
                        display: "flex",
                        flexDirection: "column"
                      }}
                    >
                      <h2 style={{ fontSize: "1.3rem", fontWeight: "bold" }}>
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
                              <div style={{ marginBottom: 8 }}>
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
        )}
      </BusContent>
    </BusPopupProvider>
    </Suspense>
  );
}
const Home = () => {
  return (
    <Suspense fallback={<div>Loading Home...</div>}>
      <HomeContent />
    </Suspense>
  );
};
HomeContent.displayName = 'HomeContent';
Home.displayName = 'Home';

export default Home;