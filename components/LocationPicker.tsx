import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import styles from './LocationPicker.module.css';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
}

// Component to handle map clicks
const MapClickHandler: React.FC<{ onLocationChange: (lat: number, lng: number, address?: string) => void }> = ({ onLocationChange }) => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      
      try {
        // Reverse geocoding using OpenStreetMap Nominatim API
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          onLocationChange(lat, lng, address);
        } else {
          // Fallback to coordinates if geocoding fails
          onLocationChange(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
        // Fallback to coordinates if geocoding fails
        onLocationChange(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    },
  });
  return null;
};

export const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  onLocationChange,
}) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    // Small delay to ensure the map container is ready
    const timer = setTimeout(() => {
      setIsMapLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isMapLoaded) {
    return (
      <div className={styles.mapPlaceholder}>
        <MapPin size={48} />
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <div className={styles.mapContainer}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={true}
        touchZoom={true}
        className={styles.leafletMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker position={[latitude, longitude]}>
          {/* Marker will show the selected location */}
        </Marker>
        
        <MapClickHandler onLocationChange={onLocationChange} />
      </MapContainer>
      
      <div className={styles.mapInstructions}>
        <MapPin size={16} />
        Click on the map to set your business location
      </div>
    </div>
  );
};

