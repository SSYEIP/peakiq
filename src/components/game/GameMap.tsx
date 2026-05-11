'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function createPulsingIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:32px;height:32px;">
        <div style="
          position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:32px;height:32px;border-radius:50%;
          background:rgba(251,191,36,0.3);
          animation:pulse-ring 2s ease-out infinite;
        "></div>
        <div style="
          position:absolute;top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:16px;height:16px;border-radius:50%;
          background:#fbbf24;border:2px solid #fff;
          box-shadow:0 0 8px rgba(251,191,36,0.8);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function getCircleColor(score: number): string {
  if (score >= 800) return '#4ade80';
  if (score >= 500) return '#fbbf24';
  return '#f87171';
}

interface GameMapProps {
  lat: number;
  lng: number;
  zoom: number;
  showResult?: boolean;
  accuracyRadius?: number;
  score?: number;
}

export function GameMap({ lat, lng, zoom, showResult = false, accuracyRadius, score }: GameMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: Math.max(zoom, 12),
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);

    markerRef.current = L.marker([lat, lng], { icon: createPulsingIcon() }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to new location when lat/lng/zoom change
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    mapRef.current.flyTo([lat, lng], Math.max(zoom, 12), { duration: 1.2 });
    markerRef.current.setLatLng([lat, lng]);
  }, [lat, lng, zoom]);

  // Update result circle
  useEffect(() => {
    if (!mapRef.current) return;

    circleRef.current?.remove();
    circleRef.current = null;

    if (showResult && accuracyRadius !== undefined && score !== undefined) {
      const color = getCircleColor(score);
      circleRef.current = L.circle([lat, lng], {
        radius: accuracyRadius,
        color,
        fillColor: color,
        fillOpacity: 0.1,
        weight: 2,
      }).addTo(mapRef.current);
    }
  }, [showResult, accuracyRadius, score, lat, lng]);

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: translate(-50%,-50%) scale(0.5); opacity: 1; }
          100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; }
        }
        .leaflet-container { background: #e8e0d8 !important; border-radius: 0.75rem; }
      `}</style>
      <div ref={containerRef} className="w-full h-full rounded-xl" />
    </>
  );
}

