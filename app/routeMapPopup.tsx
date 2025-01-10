import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import L, { LatLngExpression, LatLngBounds, LatLngTuple } from 'leaflet';

interface Stop {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

interface RouteMapPopupProps {
  routeId: string;
  onClose: () => void;
}

const RouteMapPopup: React.FC<RouteMapPopupProps> = ({ routeId, onClose }) => {
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: L.Map | null = null;
    let markers: L.Marker[] = [];

    const initializeMap = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/buslocations/map?routeId=${encodeURIComponent(routeId)}`);
        console.log('Response status:', response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch route data: ${response.status}`);
        }

        const data = await response.json();
        
        // Process and set stops
        if (!data.stops || !Array.isArray(data.stops)) {
          throw new Error('Invalid stops data received');
        }

        setStops(data.stops);

        // Initialize map
        if (mapContainer.current && data.stops.length > 0) {
          const firstStop = data.stops[0];
          const initialBounds = new L.LatLngBounds([firstStop.lat, firstStop.lon]);

          const bounds = data.stops.reduce(
            (acc: { extend: (arg0: L.LatLngTuple) => any; }, stop: { lat: number; lon: number; }) => acc.extend([stop.lat, stop.lon] as LatLngTuple),
            initialBounds
          );

          map = L.map(mapContainer.current).fitBounds(bounds);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
          }).addTo(map);

          data.stops.forEach((stop: { lat: number; lon: number; name: any; }, index: number) => {
            const marker = L.marker([stop.lat, stop.lon] as LatLngTuple)
              .addTo(map!)
              .bindPopup(`<b>Stop ${index + 1}:</b> ${stop.name}`);
            markers.push(marker);
          });

          const routeCoords: LatLngTuple[] = data.stops.map(
            (stop: { lat: number; lon: number; }) => [stop.lat, stop.lon] as LatLngTuple
          );
          L.polyline(routeCoords, { color: 'blue', weight: 3 }).addTo(map);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
        setLoading(false);
      }
    };

    // Load Leaflet CSS and JavaScript
    const loadLeaflet = async () => {
      // Add Leaflet CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);

      // Add Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initializeMap;
      document.head.appendChild(script);
    };

    loadLeaflet();

    // Cleanup
    return () => {
      if (map) {
        map.remove();
      }
      markers.forEach(marker => {
        if (marker) {
          marker.remove();
        }
      });
    };
  }, [routeId]);

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
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '800px',
          height: '80vh',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Route {routeId} Map</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%'
            }}>
              <div style={{
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ) : error ? (
            <div style={{
              padding: '20px',
              color: '#e74c3c',
              textAlign: 'center'
            }}>
              <p>Error: {error}</p>
            </div>
          ) : (
            <div 
              ref={mapContainer} 
              style={{ 
                width: '100%', 
                height: '100%'
              }}
            />
          )}
        </div>

        {/* Stops List */}
        <div style={{
          maxHeight: '200px',
          overflowY: 'auto',
          borderTop: '1px solid #eee',
          padding: '16px'
        }}>
          <h3 style={{ marginBottom: '8px', fontWeight: 'bold' }}>Stops:</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stops.map((stop, index) => (
              <div 
                key={stop.id}
                style={{
                  padding: '8px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              >
                <strong>{index + 1}.</strong> {stop.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteMapPopup;