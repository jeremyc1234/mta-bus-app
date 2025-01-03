"use client";

import React, { useRef, useState, useEffect, useMemo, useCallback, memo } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useLockBodyScroll } from '@uidotdev/usehooks';
import { BusPopupProvider, BusContent } from './busPopupProvider';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

const BUS_STOP_LOCATIONS = [
  // Manhattan
  { label: "Union Square", secondaryLabel: "default", lat: 40.7359, lon: -73.9906 },
  { label: "Times Square", lat: 40.7580, lon: -73.9855 },
  { label: "Central Park", lat: 40.7851, lon: -73.9683 },
  { label: "Statue of Liberty", lat: 40.6892, lon: -74.0445 },
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
  { label: "Staten Island Greenbelt", lat: 40.5921, lon: -74.1160 },

  // Random
  { label: "Governors Island", lat: 40.6895, lon: -74.0169 },
  { label: "Ellis Island", lat: 40.6995, lon: -74.0396 },
  { label: "Roosevelt Island Tramway", lat: 40.7614, lon: -73.9493 },

  // Other
  { label: "Other (Enter Address)", lat: null, lon: null }
];

export default function Home() {
  // Union Square fallback lat/lon
  const FALLBACK_LAT = 40.7359;
  const FALLBACK_LON = -73.9906;

  const [windowWidth, setWindowWidth] = useState(0);

  const [locationServicesEnabled, setLocationServicesEnabled] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState<boolean>(true);

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [location, setLocation] = useState<{ lat: number; lon: number }>({
    lat: FALLBACK_LAT,
    lon: FALLBACK_LON
  });
  const [usingFallback, setUsingFallback] = useState<boolean>(true);

  const refreshInterval = 30000;
  const [timeRemaining, setTimeRemaining] = useState<number>(refreshInterval / 1000);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const lastUpdateRef = useRef<number>(Date.now());

  const [selectedStop, setSelectedStop] = useState<string>("Union Square");
  const [isStopLoading, setIsStopLoading] = useState<boolean>(false);
  const [customAddress, setCustomAddress] = useState<string>("");
  const [isUsingCustomAddress, setIsUsingCustomAddress] = useState<boolean>(false);

  const [isEditing, setIsEditing] = useState(false);
  const [tempAddress, setTempAddress] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [showDropdownArrow, setShowDropdownArrow] = useState<boolean>(true);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);

  const [selectedBusInfo, setSelectedBusInfo] = useState<{
    route: string;
    stops: string[];
    currentStop: number;
    destination: string;
  } | null>(null);

  const [routeStops, setRouteStops] = useState<string[]>([]);


  const handleStopChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLabel = event.target.value;

    if (selectedLabel === "Other (Enter Address)") {
      setIsEditing(true);
      setTempAddress("");
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
      return;
    }

    setSelectedStop(selectedLabel);
    setIsEditing(false);

    const selected = BUS_STOP_LOCATIONS.find((stop) => stop.label === selectedLabel);
    if (selected && selected.lat && selected.lon) {
      setLocation({ lat: selected.lat, lon: selected.lon });
      setUsingFallback(false);

      // Fetch updated stop information without full reload
      setLoading(true);
      try {
        const res = await fetch(`/api/busdata?lat=${selected.lat}&lon=${selected.lon}`);
        if (!res.ok) {
          const text = await res.text();
          console.error("Server error:", res.status, text);
          throw new Error(`Server responded with ${res.status}`);
        }
        const json = await res.json();
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
          lastUpdateRef.current = Date.now();
          setTimeRemaining(refreshInterval / 1000);
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError("Failed to load bus data.");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const handleAddressSubmit = async () => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(tempAddress)}`
      );
      const data = await response.json();
      if (data.length > 0) {
        setLocation({
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
        });
        setSelectedStop(tempAddress);
        setIsEditing(false);
      } else {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          text-align: center;
        `;
        errorDiv.innerHTML = `
          <p>Please enter a valid address</p>
          <p style="color: #666; margin-top: 8px;">(ex. 20 W 34th St., New York, NY 10001)</p>
        `;
        document.body.appendChild(errorDiv);
        setTimeout(() => {
          document.body.removeChild(errorDiv);
        }, 3000);
      }
    } catch (error) {
      console.error("Address lookup failed:", error);
      alert("Failed to retrieve location. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddressSubmit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setSelectedStop("Nearby Bus Stops");
    }
  };

  interface BusRoutePopupProps {
    route: string;
    stops: string[];
    currentStop: number;
    destination: string;
    onClose: () => void;
    userLocation?: string;
  }

  const BusRoutePopup: React.FC<BusRoutePopupProps> = memo(({
    route,
    stops,
    currentStop,
    destination,
    onClose,
    userLocation,
  }) => {
    console.log('BusRoutePopup render', { route, currentStop, stops: stops.length });

    const isGoingUp = useMemo(() => {
      console.log('Recalculating isGoingUp');
      return currentStop > stops.length / 2;
    }, [currentStop, stops.length]);

    const busIcon = isGoingUp ? "/icons/bus_up.png" : "/icons/bus_down.png";

    useLockBodyScroll();

    const scrollableRef = useRef<HTMLDivElement>(null);
    const [highlightedStop, setHighlightedStop] = useState<string | null>(null);

    // Store the highlighted stop in a ref to avoid recreating the scroll handler
    const highlightedStopRef = useRef(highlightedStop);
    highlightedStopRef.current = highlightedStop;

    // Create a stable scroll handler that uses the ref
    const handleScroll = useRef((event: Event) => {
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
        console.log('Setting new highlighted stop:', closestStop);
        setHighlightedStop(closestStop);
      }
    }).current;

    // Set up scroll listener with cleanup
    useEffect(() => {
      console.log('Setting up scroll listener');
      const scrollEl = scrollableRef.current;
      if (scrollEl) {
        scrollEl.addEventListener('scroll', handleScroll);
        // Initial highlight calculation
        handleScroll({ target: scrollEl } as unknown as Event);

        return () => {
          console.log('Cleaning up scroll listener');
          scrollEl.removeEventListener('scroll', handleScroll);
        };
      }
    }, []); // Empty dependency array since we're using refs

    const stopsList = useMemo(() => {
      console.log('Recalculating stopsList');
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
                  <img
                    src={busIcon}
                    alt={isGoingUp ? 'Bus going up' : 'Bus going down'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
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

    if (!areEqual) {
      console.log('Props changed:', {
        routeEqual: prevProps.route === nextProps.route,
        currentStopEqual: prevProps.currentStop === nextProps.currentStop,
        destinationEqual: prevProps.destination === nextProps.destination,
        userLocationEqual: prevProps.userLocation === nextProps.userLocation,
        stopsLengthEqual: prevProps.stops.length === nextProps.stops.length,
      });
    }
    return areEqual;
  });

  // Get device location
  useEffect(() => {
    if ("geolocation" in navigator) {
      console.log("Requesting location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location received:", position.coords);
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          setLocationServicesEnabled(true);
        },
        (error) => {
          console.log("Location error:", error);
          setLocationServicesEnabled(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      console.log("Geolocation not available");
      setLocationServicesEnabled(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    }
  }, []);

  const getFilteredSuggestions = (input: string): string[] => {
    // First try to match from our predefined locations
    const locationMatches = BUS_STOP_LOCATIONS
      .filter(stop =>
        stop.label.toLowerCase().includes(input.toLowerCase()) &&
        stop.label !== "Other (Enter Address)"
      )
      .map(stop => stop.label);

    // If we're actively typing what looks like an address, fetch from API
    if (input.length > 3 && /\d/.test(input)) {
      return addressSuggestions;
    }

    return locationMatches;
  };

  const fetchBusData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/busdata?lat=${location.lat}&lon=${location.lon}`);
      if (!res.ok) {
        const text = await res.text();
        console.error("Server error:", res.status, text);
        throw new Error(`Server responded with ${res.status}`);
      }
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setData(json);
        lastUpdateRef.current = Date.now();
        setTimeRemaining(refreshInterval / 1000);
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError("Failed to load bus data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusData();
    const interval = setInterval(() => {
      fetchBusData();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [location]);

  useEffect(() => {
    if (isMobile) {
      const hideAddressBar = () => {
        window.scrollTo(0, 1);
      };
      window.addEventListener('load', hideAddressBar);
      window.addEventListener('scroll', hideAddressBar);
      return () => {
        window.removeEventListener('load', hideAddressBar);
        window.removeEventListener('scroll', hideAddressBar);
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
        } else {
          const fuzzyMatches = BUS_STOP_LOCATIONS
            .filter(stop => stop.label.toLowerCase().includes(tempAddress.toLowerCase()))
            .map(stop => stop.label);
          setAddressSuggestions(fuzzyMatches);
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
      setTimeRemaining(remain > 0 ? Math.ceil(remain) : 0);
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: "center", fontFamily: "Helvetica, sans-serif" }}>
        Error: {error}
      </div>
    );
  }
  if (loading && !data) {
    return (
      <div style={{ padding: 20, textAlign: "center", fontFamily: "Helvetica, sans-serif" }}>
        Loading bus data...
      </div>
    );
  }
  if (!data) {
    return (
      <div style={{ padding: 20, textAlign: "center", fontFamily: "Helvetica, sans-serif" }}>
        No data yet.
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
        route = mvj.LineRef.replace("MTA NYCT_", "");
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

  const updatedDate = new Date(data.timestamp);
  const updatedTimeString = updatedDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
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
    <BusPopupProvider>
    <BusContent>
      {(showBusInfo) => (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
          {/* Header with Logo */}
          <header
  style={{
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 20px",
    backgroundColor: "#fff",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    position: "sticky",
    top: 0,
    zIndex: 2000,
  }}
>
  <div style={{ display: "flex", alignItems: "center" }}>
    <img
      src="/icons/logo.png"
      alt="Logo"
      style={{
        height: "60px", // Increased from 40px
        width: "auto",
        objectFit: "contain",
      }}
    />
  </div>
</header>
          <div style={{
            padding: 20,
            textAlign: "center",
            maxWidth: "100vw",
            height: "100vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }} className={inter.className}>
            {isBannerVisible && !locationServicesEnabled && (
  <div
    style={{
      backgroundColor: "#FFCCBB",
      color: "#FF3632",
      padding: "8px 12px",
      borderRadius: "8px",
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      position: "absolute",
      top: "90px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 1500,
      textAlign: "center",
      whiteSpace: "nowrap",
      maxWidth: "fit-content",
    }}
  >
    <span
      style={{
        fontWeight: "bold",
        fontSize: "0.95rem",
        lineHeight: "1.2",
        whiteSpace: "nowrap"
      }}
    >
      📍 Please turn on location services to get information for the closest stops to you!
    </span>
    <button
      onClick={() => setIsBannerVisible(false)} // Hides the banner on click
      style={{
        background: "none",
        border: "none",
        fontSize: "1.2rem",
        cursor: "pointer",
        marginLeft: "4px",
        color: "#FF3632",
      }}
    >
      ×
    </button>
  </div>
)}

            {!locationServicesEnabled && (
              <div style={{ marginTop: isBannerVisible ? "50px" : "0" }} />
            )}

            <div style={{
              marginBottom: 0,
              textAlign: "center",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}>
              {isUsingCustomAddress && (
                <div style={{
                  margin: "10px auto",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px"
                }}>
                  <input
                    type="text"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    placeholder="Enter address"
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      fontSize: isMobile ? "0.9rem" : "1rem",
                      width: isMobile ? "calc(100vw - 40px)" : "80%",
                      maxWidth: isMobile ? "100%" : "400px"
                    }}
                  />
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(customAddress)}`
                        );
                        const data = await response.json();
                        if (data.length > 0) {
                          setLocation({
                            lat: parseFloat(data[0].lat),
                            lon: parseFloat(data[0].lon),
                          });
                          setUsingFallback(false);
                        } else {
                          alert("Unable to find location. Please check the address.");
                        }
                      } catch (error) {
                        console.error("Address lookup failed:", error);
                        alert("Failed to retrieve location. Please try again.");
                      }
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      backgroundColor: "#0078D7",
                      color: "white",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    Set Location
                  </button>
                </div>
              )}
              <div style={{
                marginBottom: 20,
                display: "flex",
                flexDirection: windowWidth < 768 ? "column" : "row",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px"
              }}>
                <span style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  marginBottom: windowWidth < 768 ? "10px" : "0"
                }}>
                  Bus routes near
                </span>

                {isEditing ? (
  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
    <input
      ref={inputRef}
      type="text"
      value={tempAddress}
      onChange={(e) => setTempAddress(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Enter location or full address"
      style={{
        padding: "8px 8px",
        borderRadius: "8px",
        border: "1px solid #ccc",
        fontSize: "0.9rem",
        fontWeight: "bold",
        width: "300px",
        maxWidth: "300px",
        boxSizing: "border-box",
      }}
    />
    <button
      onClick={() => {
        setIsEditing(false);
        setSelectedStop("Other (Enter Address)");
        setTimeout(() => {
          const dropdown = document.getElementById('busStopDropdown') as HTMLSelectElement | null;
          if (dropdown) {
            dropdown.focus();
            dropdown.click(); // Trigger native dropdown behavior
          }
        }, 0);
      }}
      style={{
        position: 'absolute',
        right: '8px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1rem',
        pointerEvents: 'auto',
      }}
    >
      ⌄
    </button>
  </div>
) : (
  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
    <select
      id="busStopDropdown"
      value={selectedStop}
      onChange={handleStopChange}
      style={{
        padding: "4px 8px",
        height: "36px",
        lineHeight: "28px",
        borderRadius: "8px",
        border: "1px solid #ccc",
        fontSize: "0.9rem",
        fontWeight: "bold",
        width: "300px",
        maxWidth: "300px",
        appearance: 'auto',
        boxSizing: "border-box",
      }}
    >
      {BUS_STOP_LOCATIONS.map((stop) => (
        <option key={stop.label} value={stop.label}>
          {stop.secondaryLabel ? `${stop.label} — ${stop.secondaryLabel}` : stop.label}
        </option>
      ))}
    </select>
  </div>
)}


              </div>
            </div>

            <div style={{
              overflow: "hidden",
              maxWidth: "100vw",
              scrollSnapType: isMobile ? "x mandatory" : "none",
              margin: "0 -20px",
              padding: "0 20px"
            }}></div>

            <p className="dark:text-white" style={{ marginBottom: 20 }}> {/* Changed from 20 to 10 */}
              <strong>Updated: {updatedTimeString}</strong> (next refresh in {timeRemaining}s)
            </p>

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

            <div style={{
              display: "flex",
              overflowX: "auto",
              overflowY: "hidden",
              gap: "16px",
              touchAction: "pan-x",
              WebkitOverflowScrolling: "touch",
              scrollSnapType: isMobile ? "x mandatory" : "none",
              margin: "0 -20px",
              padding: "0 20px",
              height: "calc(100vh - 200px)",
              boxSizing: "border-box",
              marginBottom: "20px"
            }}>
              {data && finalStops.length === 0 && (
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
                      padding: "16px",
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
                      {stop.stopName}{" "}
                      {stop.distance != null
                        ? `(${stop.distance} miles away)`
                        : "(distance unknown)"}
                    </h2>
                    {isMobile && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                        <FaArrowLeft />
                        <FaArrowRight />
                      </div>
                    )}

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
                      <div style={{ flex: 1 }}>
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
                            }}
                          >
                            <div style={{ marginBottom: 8 }}>{routeName}</div>
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
                                  <strong>{directionKey}</strong>
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
                                                console.log('🚏 Clicked Stop Name:', stop.stopName);
                                                const stopArrivals = data.arrivals?.[stop.stopId] || [];

                                                // console.log('🚍 Stop Arrivals:', stopArrivals);
                                                // console.log('🔍 Clicked VehicleRef:', visit.vehicleRef);

                                                // Attempt to match VehicleRef including prefix
                                                const selectedArrival = stopArrivals.find((arrival: any) => {
                                                  const arrivalVehicleRef = arrival?.MonitoredVehicleJourney?.VehicleRef?.toString()?.trim();
                                                  const clickedVehicleRef = visit.vehicleRef?.toString()?.trim();

                                                  // console.log(`🔄 Comparing Arrival VehicleRef: ${arrivalVehicleRef} with Clicked VehicleRef: ${clickedVehicleRef}`);

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
                                                  selectedStop,
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
                                            <div style={{ fontWeight: "bold" }}>
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

            <div style={{
              marginTop: "auto",
              marginBottom: 10,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "4px"
            }} className="dark:text-white">
              <p style={{ fontSize: "0.9em", color: "#666" }}>
                Made possible with MTA Bus Time API
              </p>
            </div>
            </div>
        </div>
      )}
    </BusContent>
  </BusPopupProvider>
);
}