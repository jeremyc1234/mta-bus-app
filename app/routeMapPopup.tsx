"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Dynamically import Leaflet components for SSR compatibility
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });

interface RouteMapPopupProps {
  routeId: string;
  onClose: () => void;
}

const RouteMapPopup: React.FC<RouteMapPopupProps> = ({ routeId, onClose }) => {
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [busLocations, setBusLocations] = useState<{ lat: number; lon: number; id: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  /** Fetch route path from the API */
  const fetchRoutePath = async () => {
    try {
      const response = await fetch(`/api/routepath?routeId=${routeId}`);
      if (!response.ok) throw new Error(`Route Path API Error: ${response.status}`);
      const data = await response.json();
      setRoutePath(data.path || []);
    } catch (error) {
      console.error('Failed to fetch route path:', error);
      setError('Failed to load route path. Please try again later.');
    }
  };

  /** Fetch bus locations from the API */
  const fetchBusLocations = async () => {
    try {
      const response = await fetch(`/api/buslocations?routeId=${routeId}`);
      if (!response.ok) throw new Error(`Bus API Error: ${response.status}`);
      const data = await response.json();
      setBusLocations(data.buses || []);
    } catch (error) {
      console.error('Failed to fetch bus locations:', error);
      setError('Failed to load bus locations. Please try again later.');
    }
  };

  /** Fetch route and bus data on mount */
  useEffect(() => {
    const fetchRouteData = async () => {
      await Promise.all([fetchRoutePath(), fetchBusLocations()]);
    };
    fetchRouteData();
  }, [routeId]);

  /** Custom Marker Icon */
  const busIcon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background: yellow; border-radius: 50%; width: 12px; height: 12px;"></div>`,
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 3000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          width: '90%',
          maxWidth: '800px',
          height: '80vh',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 3001,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 3002,
            backgroundColor: '#ff4d4f',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            padding: '5px 10px',
          }}
        >
          Close
        </button>
        {error ? (
          <div style={{ textAlign: 'center', marginTop: '20px', color: 'red' }}>{error}</div>
        ) : (
          <MapContainer
            key={routeId} // Use routeId for unique map instance
            center={[40.7128, -74.006]}
            zoom={13}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {routePath.length > 0 && (
              <Polyline positions={routePath} color="blue" />
            )}
            {busLocations.map((bus) => (
              <Marker
                key={bus.id}
                position={[bus.lat, bus.lon]}
                icon={busIcon}
              />
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default RouteMapPopup;
