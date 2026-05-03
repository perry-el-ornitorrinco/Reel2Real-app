import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

// Fix for default Leaflet icon in React
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  initialLocation?: { lat: number; lng: number };
  onLocationChange: (location: { lat: number; lng: number }) => void;
}

function LocationMarker({ position, onChange }: { position: {lat: number, lng: number} | null, onChange: (pos: {lat: number, lng: number}) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export function LocationPicker({ initialLocation, onLocationChange }: LocationPickerProps) {
  // Use Madrid as default fallback relative center
  const defaultPosition = { lat: 40.4168, lng: -3.7038 };
  const [position, setPosition] = useState<{lat: number, lng: number} | null>(initialLocation || null);

  useEffect(() => {
    if (initialLocation && !position) {
        setPosition(initialLocation);
    }
  }, [initialLocation]);

  const handlePositionChange = (newPos: { lat: number, lng: number }) => {
    setPosition(newPos);
    onLocationChange(newPos);
  };
  
  return (
    <div className="bg-surface-container-low border border-outline-variant/30 p-8 rounded-3xl shadow-xl w-full">
      <div className="flex items-center gap-3 mb-2">
        <MapPin size={22} className="text-[#FF6B00]" />
        <h3 className="text-xl font-bold font-sans text-on-surface tracking-tight">Tu Ubicación Base</h3>
      </div>
      <p className="font-sans text-sm text-on-surface-variant mb-6 leading-relaxed">Selecciona en el mapa tu ubicación de referencia para sugerirte eventos cercanos a ti.</p>
      
      <div className="h-64 w-full rounded-2xl overflow-hidden border border-outline-variant/30 relative z-0">
        <MapContainer 
          center={initialLocation || defaultPosition} 
          zoom={12} 
          scrollWheelZoom={false} 
          style={{ height: '100%', width: '100%', zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <LocationMarker position={position} onChange={handlePositionChange} />
        </MapContainer>
      </div>
    </div>
  );
}
