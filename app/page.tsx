"use client";

import React, { useEffect, useState, useRef } from "react";

export default function Home() {
  // Union Square lat/lon
  const FIXED_LAT = 40.7359;
  const FIXED_LON = -73.9906;

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Refresh every 30s
  const refreshInterval = 30000;
  // Countdown for next refresh
  const [timeRemaining, setTimeRemaining] = useState<number>(refreshInterval / 1000);

  // Detect if device is coarse pointer => mobile
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Keep track of last update for countdown
  const lastUpdateRef = useRef<number>(Date.now());

  // On mount, detect pointer type
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    }
  }, []);

  // Fetch /api/busdata
  const fetchBusData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/busdata?lat=${FIXED_LAT}&lon=${FIXED_LON}`);
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

  // Initial & periodic refresh
  useEffect(() => {
    fetchBusData();
    const interval = setInterval(() => {
      fetchBusData();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, []);

  // Countdown ticker
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

  // Sort stops by distance
  let stopsSorted = [...(data.stops || [])].sort((a, b) => {
    const distA = a.distance ?? 99999;
    const distB = b.distance ?? 99999;
    return distA - distB;
  });

  // Only 5 closest
  stopsSorted = stopsSorted.slice(0, 5);

  // Separate stops with/without arrivals
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
  // Combine them
  const finalStops = [...stopsWithArrivals, ...stopsNoArrivals];

  // Group arrivals by route => direction => visits
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
      routeDirectionMap[route][directionKey].push(visit);
    });

    return routeDirectionMap;
  }

  // Format time
  const updatedDate = new Date(data.timestamp);
  const updatedTimeString = updatedDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Function to compute how many minutes from now, or >1 hr
  function getMinutesAway(dateString: string) {
    const arrivalDate = new Date(dateString);
    const now = new Date();
    const diffMs = arrivalDate.getTime() - now.getTime();
    if (diffMs <= 0) return null; // already passed or immediate
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin >= 60) return ">1 hr";
    return diffMin + " min away";
  }

  return (
    <div style={{ 
      padding: 20, 
      textAlign: "center", 
      fontFamily: "Helvetica, sans-serif",
      maxWidth: "100vw",
      overflow: "hidden" 
    }}>
      <h1>Nearby Bus Stops (Union Square)</h1>
      <p style={{ marginBottom: 20 }}>
        <strong>Updated: {updatedTimeString}</strong> (next refresh in {timeRemaining}s)
      </p>

      <div style={{
        display: "flex",
        overflowX: "auto",
        gap: "16px",
        scrollSnapType: isMobile ? "x mandatory" : "none",
        margin: "0 -20px",
        padding: "0 20px",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        msOverflowStyle: "none"
      }}>
        {finalStops.map((stop: any) => {
          const arrivalsArray = data.arrivals?.[stop.stopId] || [];
          const hasBuses = arrivalsArray.length > 0;
          const tileWidth = isMobile ? "calc(100vw - 40px)" : "360px";

          return (
            <div
              key={stop.stopId}
              style={{
                scrollSnapAlign: isMobile ? "center" : "none",
                width: tileWidth,
                minWidth: tileWidth,
                maxWidth: tileWidth,
                height: isMobile ? "calc(100vh - 140px)" : "100vh",
                backgroundColor: "#D3D3D3",
                borderRadius: "8px",
                padding: "16px",
                boxSizing: "border-box",
                overflowY: "auto",
                marginBottom: isMobile ? "20px" : "0"
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
                <>
                  {(() => {
                    const routeMap = getStopArrivals(stop.stopId);
                    const routeEntries = Object.entries(routeMap).sort(
                      ([aName], [bName]) => aName.localeCompare(bName)
                    );

                    return routeEntries.map(([routeName, directions]) => (
                      <div
                        key={routeName}
                        style={{
                          margin: "16px auto",
                          backgroundColor: "#000080",
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
                                {visitsArr.map((visit: any, i: number) => {
                                  const mvj = visit.MonitoredVehicleJourney;
                                  let stopsAway = -1;
                                  const distances =
                                    mvj?.MonitoredCall?.Extensions?.Distances;
                                  if (
                                    distances &&
                                    typeof distances.StopsFromCall === "number"
                                  ) {
                                    stopsAway = distances.StopsFromCall;
                                  }

                                  // arrival time
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

                                  // occupancy
                                  const occupancy = mvj?.Occupancy || null;

                                  // Calculate minutes away
                                  let minutesAwayString: string | null = null;
                                  if (expectedTime) {
                                    minutesAwayString = getMinutesAway(
                                      expectedTime
                                    );
                                  }

                                  return (
                                    <li key={i} style={{ margin: "8px 0" }}>
                                      {stopsAway === 0 ? (
                                        <span>
                                          <strong>&lt;1</strong> Stop Away
                                        </span>
                                      ) : stopsAway > 0 ? (
                                        <>
                                          <strong>{stopsAway}</strong> stops away
                                        </>
                                      ) : (
                                        <>?? stops away</>
                                      )}
                                      <br />
                                      {arrivalTime ? (
                                        <>
                                          Arriving at approx{" "}
                                          <strong>{arrivalTime}</strong>
                                          {minutesAwayString && (
                                            <> ({minutesAwayString})</>
                                          )}
                                        </>
                                      ) : (
                                        <>Arrival time unknown</>
                                      )}

                                      {/* If Occupancy is present */}
                                      {occupancy && (
                                        <>
                                          <br />
                                          Occupancy: <strong>{occupancy}</strong>
                                        </>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )
                        )}
                      </div>
                    ));
                  })()}

                  {(() => {
                    const routeMap = getStopArrivals(stop.stopId);
                    const routeEntries = Object.keys(routeMap);
                    if (routeEntries.length === 1) {
                      return (
                        <p style={{ marginTop: 16, fontStyle: "italic" }}>
                          Other bus routes will appear here if available
                        </p>
                      );
                    }
                    return null;
                  })()}
                </>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: 20, fontStyle: "italic" }}>Created by Jeremy</p>
    </div>
  );
}