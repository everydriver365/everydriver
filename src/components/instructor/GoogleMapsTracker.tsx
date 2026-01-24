import React, { useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';

interface GPSPoint {
  lat: number;
  lng: number;
  speedKmh: number;
  roadName: string;
  speedLimit: number;
  timestamp: number;
  harshBrake?: boolean;
  speeding?: boolean;
}

interface GoogleMapsTrackerProps {
  currentPos: [number, number] | null;
  gpsPoints: GPSPoint[];
  isTracking: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 51.5074,
  lng: -0.1278,
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

export default function GoogleMapsTracker({ currentPos, gpsPoints, isTracking }: GoogleMapsTrackerProps) {
  // Use the existing GOOGLE_PLACES_API_KEY - ensure Maps JavaScript API is enabled in Google Console
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '',
    libraries: ['places'],
  });

  const center = useMemo(() => {
    if (currentPos) {
      return { lat: currentPos[0], lng: currentPos[1] };
    }
    return defaultCenter;
  }, [currentPos]);

  const polylinePath = useMemo(() => {
    return gpsPoints.map(p => ({ lat: p.lat, lng: p.lng }));
  }, [gpsPoints]);

  const onLoad = useCallback((map: google.maps.Map) => {
    // Auto-fit bounds if we have GPS points
    if (gpsPoints.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      gpsPoints.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds);
    }
  }, [gpsPoints]);

  if (loadError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted">
        <p className="text-destructive">Failed to load Google Maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={17}
      options={mapOptions}
      onLoad={onLoad}
    >
      {/* Current position marker */}
      {currentPos && (
        <Marker
          position={{ lat: currentPos[0], lng: currentPos[1] }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          }}
        />
      )}

      {/* Route polyline */}
      {gpsPoints.length > 1 && (
        <Polyline
          path={polylinePath}
          options={{
            strokeColor: '#3b82f6',
            strokeOpacity: 1,
            strokeWeight: 4,
          }}
        />
      )}

      {/* Speeding/brake markers */}
      {gpsPoints
        .filter(p => p.speeding || p.harshBrake)
        .map((p, i) => (
          <Marker
            key={`alert-${i}`}
            position={{ lat: p.lat, lng: p.lng }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: p.speeding ? '#ef4444' : '#f97316',
              fillOpacity: 0.8,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
            title={p.speeding ? 'Speeding' : 'Harsh Brake'}
          />
        ))}
    </GoogleMap>
  );
}
