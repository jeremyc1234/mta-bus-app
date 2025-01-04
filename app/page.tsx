"use client";

import React, { useRef, useState, useEffect, useMemo, useCallback, memo } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useLockBodyScroll } from '@uidotdev/usehooks';
import { BusPopupProvider, BusContent } from './busPopupProvider';
import { Inter } from 'next/font/google';
import LocationDropdown from './locationDropdown';
import LocationChangeAnimation from "./locationChangeAnimation";

const inter = Inter({ subsets: ['latin'] });

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  target: React.ReactNode;
  children: React.ReactNode;
}

export default function Home() {
  // Union Square fallback lat/lon
  const FALLBACK_LAT = 40.7359;
  const FALLBACK_LON = -73.9906;

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  const [locationServicesEnabled, setLocationServicesEnabled] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState<boolean>(true);
  const [selectedStop, setSelectedStop] = useState<string | null>(null);

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [location, setLocation] = useState<{ lat: number; lon: number }>({
    lat: FALLBACK_LAT,
    lon: FALLBACK_LON
  });
  
  const [isFadingOut, setIsFadingOut] = useState(false);

  const refreshInterval = 30000;
  const [timeRemaining, setTimeRemaining] = useState<number>(refreshInterval / 1000);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const lastUpdateRef = useRef<number>(Date.now());
  const [isStopLoading, setIsStopLoading] = useState<boolean>(false);
  
  const [tempAddress, setTempAddress] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [isInvalidAddress, setIsInvalidAddress] = useState<boolean>(false);
  
  const [isChangingLocation, setIsChangingLocation] = useState(false);
  const timerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    console.log('🔄 isChangingLocation:', isChangingLocation);
  }, [isChangingLocation]);

  useEffect(() => {
    const handleResize = () => {
      // Debounce the resize event to prevent excessive re-renders
      const width = window.innerWidth;
      if (Math.abs(width - windowWidth) > 50) { // Only update if change is significant
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

  const LoadingAnimation = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        textAlign: "center",
        fontFamily: "Helvetica, sans-serif",
        fontSize: "1.2rem",
        fontWeight: "500",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
        backgroundColor: "white",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          animation: "busDrive 1s infinite cubic-bezier(0.4, 0, 0.2, 1)",
          marginBottom: "20px",
        }}
      >
        <img
          src="/icons/bus_icon.png"
          alt="Bus Icon"
          style={{
            width: "120px",
            height: "auto",
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
    console.log('BusRoutePopup render', { route, currentStop, stops: stops.length });

    const isGoingUp = useMemo(() => {
      console.log('Recalculating isGoingUp');
      return currentStop > stops.length / 2;
    }, [currentStop, stops.length]);

    const busIcon = isGoingUp ? "/icons/bus_up.png" : "/icons/bus_down.png";

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
    // Check sessionStorage to see if the user came from `/about`
    const visitedFromAbout = sessionStorage.getItem("visitedFromAbout");
    
    if (visitedFromAbout) {
      setIsBannerVisible(false);
      sessionStorage.removeItem("visitedFromAbout"); // Clear the flag
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
      }, 10000);
  
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
      console.log('🌍 useEffect Triggered — Location updated:', location.lat, location.lon);
    }, [location]);

    const fetchBusData = async (lat: number, lon: number) => {
      setLoading(true);
      try {
        console.log('🚍 Fetching bus data for:', lat, lon);
        
        // Add a minimum delay of 1 second to ensure animation is visible
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const res = await fetch(`/api/busdata?lat=${lat}&lon=${lon}`);
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
      }
    };

  useEffect(() => {
    fetchBusData(location.lat, location.lon);
  }, []);

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
      fetchBusData(location.lat, location.lon);
    } else {
      // Update DOM directly instead of state to prevent re-renders
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
  if (loading && !data) {
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
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          minHeight: "100vh",
          overflowY: "auto", // Enable vertical scrolling
          position: "relative" // Add this to ensure proper stacking
        }}>
          <div style={{ 
            padding: 20,
            textAlign: "center",
            maxWidth: "100vw",
            minHeight: "100vh",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
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
      display: "flex",
      alignItems: "center",
      gap: "8px",
      position: "absolute",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 1500,
      textAlign: "center",
      width: "90%",
      maxWidth: "100vw",
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
      📍 Please turn on location services to get information for the closest stops to you!
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
                <LocationDropdown 
  onLocationChange={(newLocation) => {
    console.log('📍 onLocationChange called with:', newLocation);
    if (newLocation.lat !== null && newLocation.lon !== null) {
      console.log('✅ Valid location:', newLocation);
      setIsChangingLocation(true); // Start animation
      
      setLocation({
        lat: newLocation.lat,
        lon: newLocation.lon
      });

      fetchBusData(newLocation.lat, newLocation.lon)
        .finally(() => {
          setTimeout(() => {
            console.log('🛑 Animation completed, setting isChangingLocation to false');
            setIsChangingLocation(false); // End animation after 2s
          }, 2000); // Match animation duration
        });

      console.log('🚦 isChangingLocation set to:', true);
    } else {
      console.warn('⚠️ Invalid location coordinates:', newLocation);
    }
  }}
/>

              </div>
            </div>

            <div style={{
              overflow: "hidden",
              maxWidth: "100vw",
              scrollSnapType: isMobile ? "x mandatory" : "none",
              margin: "0 -20px",
              padding: "0 20px"
            }}></div>

            {!isInvalidAddress && data && finalStops.length > 0 && (
              <p className="dark:text-white" style={{ marginBottom: 20 }}>
                <strong>Updated: {updatedTimeString}</strong> (next refresh in <span ref={timerRef}>{timeRemaining}</span>s)
              </p>
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
            </div>
        </div>
      )}
    </BusContent>
  </BusPopupProvider>
);
}