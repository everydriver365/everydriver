import { useRef, useState, useEffect } from "react";

interface RealPosition {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  speedKmh: number | null;
}

interface InterpolatedPosition {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_KM = 6371;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/** Move a lat/lng by `distKm` along `bearingDeg` (degrees clockwise from north). */
function moveAlongBearing(lat: number, lng: number, bearingDeg: number, distKm: number): [number, number] {
  const lat1 = lat * DEG_TO_RAD;
  const lng1 = lng * DEG_TO_RAD;
  const brng = bearingDeg * DEG_TO_RAD;
  const d = distKm / EARTH_RADIUS_KM;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  return [lat2 * RAD_TO_DEG, lng2 * RAD_TO_DEG];
}

/**
 * Smoothly interpolates a GPS position between real updates using speed + heading.
 * Produces ~10 FPS animation so the marker appears to glide along the road.
 * Resets to the real position each time a new GPS fix arrives.
 */
export function useInterpolatedPosition(real: RealPosition): InterpolatedPosition | null {
  const [pos, setPos] = useState<InterpolatedPosition | null>(null);
  const lastRealRef = useRef<{ lat: number; lng: number; heading: number; speedKmh: number; ts: number } | null>(null);
  

  // When a new real position arrives, reset the anchor
  useEffect(() => {
    if (real.latitude == null || real.longitude == null) return;

    const heading = real.heading ?? 0;
    const speed = real.speedKmh ?? 0;

    lastRealRef.current = {
      lat: real.latitude,
      lng: real.longitude,
      heading,
      speedKmh: speed,
      ts: Date.now(),
    };

    // Snap to real position immediately
    setPos({ latitude: real.latitude, longitude: real.longitude });
  }, [real.latitude, real.longitude, real.heading, real.speedKmh]);

  // Animation loop — extrapolate from last known position using speed + heading
  // Throttled to ~5fps to avoid excessive re-renders
  useEffect(() => {
    const interval = setInterval(() => {
      const anchor = lastRealRef.current;
      if (!anchor || anchor.speedKmh < 3) return; // Not moving

      const elapsed = (Date.now() - anchor.ts) / 1000;
      const cappedElapsed = Math.min(elapsed, 15);
      const distKm = (anchor.speedKmh / 3600) * cappedElapsed;

      const [lat, lng] = moveAlongBearing(anchor.lat, anchor.lng, anchor.heading, distKm);
      setPos({ latitude: lat, longitude: lng });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return pos;
}
