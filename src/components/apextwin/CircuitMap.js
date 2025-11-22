'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the map to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then(mod => mod.Popup),
  { ssr: false }
);

export default function CircuitMap({ lat, lng, trackName, className = '' }) {
  const [isMounted, setIsMounted] = useState(false);
  const [customIcon, setCustomIcon] = useState(null);

  useEffect(() => {
    setIsMounted(true);

    // Import leaflet CSS and create custom icon
    import('leaflet/dist/leaflet.css');
    import('leaflet').then(L => {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 24px;
          height: 24px;
          background: #00FF9A;
          border: 3px solid #0B0B0C;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(0,255,154,0.5);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      setCustomIcon(icon);
    });
  }, []);

  if (!isMounted || !lat || !lng) {
    return (
      <div className={`bg-apex-graphite rounded-lg flex items-center justify-center ${className}`}>
        <span className="text-apex-soft text-sm">
          {!lat || !lng ? 'No location data' : 'Loading map...'}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {customIcon && (
          <Marker position={[lat, lng]} icon={customIcon}>
            <Popup>
              <span className="text-sm font-medium">{trackName}</span>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
