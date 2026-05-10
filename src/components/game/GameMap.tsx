'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue in Next.js
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom amber pulsing marker
function createPulsingIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div style="position: relative; width: 32px; height: 32px;">
        <div style="
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 32px; height: 32px;
          border-radius: 50%;
          background: rgba(251,191,36,0.3);
          animation: pulse-ring 2s ease-out infinite;
        "></div>
        <div style="
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #fbbf24;
          border: 2px solid #fff;
          box-shadow: 0 0 8px rgba(251,191,36,0.8);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

interface MapViewUpdaterProps {
  lat: number;
  lng: number;
  zoom: number;
}

function MapViewUpdater({ lat, lng, zoom }: MapViewUpdaterProps) {
  const map = useMap();
  const prevRef = useRef({ lat: 0, lng: 0 });

  useEffect(() => {
    if (prevRef.current.lat !== lat || prevRef.current.lng !== lng) {
      map.flyTo([lat, lng], zoom, { duration: 1.2 });
      prevRef.current = { lat, lng };
    }
  }, [lat, lng, zoom, map]);

  return null;
}

interface GameMapProps {
  lat: number;
  lng: number;
  zoom: number;
  showResult?: boolean;
  accuracyRadius?: number; // in meters
  score?: number;
}

function getCircleColor(score: number): string {
  if (score >= 800) return '#4ade80';
  if (score >= 500) return '#fbbf24';
  return '#f87171';
}

export function GameMap({
  lat,
  lng,
  zoom,
  showResult = false,
  accuracyRadius,
  score,
}: GameMapProps) {
  const pulsingIcon = createPulsingIcon();

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
        .leaflet-container {
          background: #0d0e0f;
          border-radius: 0.75rem;
        }
        .leaflet-tile-pane {
          filter: brightness(0.85) saturate(0.9);
        }
      `}</style>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        className="w-full h-full rounded-xl"
        zoomControl={true}
        attributionControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_dark/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
          maxZoom={20}
        />
        <MapViewUpdater lat={lat} lng={lng} zoom={zoom} />
        <Marker position={[lat, lng]} icon={pulsingIcon} />
        {showResult && accuracyRadius !== undefined && score !== undefined && (
          <Circle
            center={[lat, lng]}
            radius={accuracyRadius}
            pathOptions={{
              color: getCircleColor(score),
              fillColor: getCircleColor(score),
              fillOpacity: 0.1,
              weight: 2,
            }}
          />
        )}
      </MapContainer>
    </>
  );
}
