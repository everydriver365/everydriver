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

/** Haversine distance in km between two points. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLng = (lng2 - lng1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Move a lat/lng by `distKm` along `bearingDeg` (fallback straight-line). */
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

/** Linear interpolation between two points. */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

interface PathData {
  /** Array of [lat, lng] waypoints along the road */
  points: [number, number][];
  /** Cumulative distances in km at each point index (starts at 0) */
  cumDist: number[];
  /** Total path length in km */
  totalKm: number;
}

/** Pre-compute cumulative distances for a path. */
function buildPathData(coords: [number, number][]): PathData {
  const cumDist = [0];
  for (let i = 1; i < coords.length; i++) {
    const d = haversineKm(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1]);
    cumDist.push(cumDist[i - 1] + d);
  }
  return { points: coords, cumDist, totalKm: cumDist[cumDist.length - 1] };
}

/** Walk a distance along the path and return interpolated position. */
function positionAlongPath(path: PathData, distKm: number): [number, number] {
  const clamped = Math.max(0, Math.min(distKm, path.totalKm));
  // Binary search for the segment
  let lo = 0;
  let hi = path.cumDist.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (path.cumDist[mid] <= clamped) lo = mid;
    else hi = mid;
  }
  const segLen = path.cumDist[hi] - path.cumDist[lo];
  const t = segLen > 0 ? (clamped - path.cumDist[lo]) / segLen : 0;
  return [
    lerp(path.points[lo][0], path.points[hi][0], t),
    lerp(path.points[lo][1], path.points[hi][1], t),
  ];
}

/** Fetch OSRM route geometry between two points. Returns [lat,lng][] or null on failure. */
async function fetchOsrmRoute(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number
): Promise<[number, number][] | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const coords = json?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return null;
    // OSRM returns [lng, lat] — convert to [lat, lng]
    return coords.map((c: number[]) => [c[1], c[0]] as [number, number]);
  } catch {
    return null;
  }
}

/**
 * Smoothly interpolates a GPS position between real updates.
 * Fetches OSRM road geometry when a new position arrives and animates
 * the marker along the actual road path. Falls back to bearing-based
 * extrapolation if OSRM fails.
 */
export function useInterpolatedPosition(real: RealPosition): InterpolatedPosition | null {
  const [pos, setPos] = useState<InterpolatedPosition | null>(null);
  const prevRealRef = useRef<{ lat: number; lng: number } | null>(null);
  const anchorRef = useRef<{
    lat: number;
    lng: number;
    heading: number;
    speedKmh: number;
    ts: number;
    path: PathData | null;
  } | null>(null);

  // When a new real position arrives, fetch OSRM route and reset anchor
  useEffect(() => {
    if (real.latitude == null || real.longitude == null) return;

    const heading = real.heading ?? 0;
    const speed = real.speedKmh ?? 0;
    const newLat = real.latitude;
    const newLng = real.longitude;

    // Snap immediately
    setPos({ latitude: newLat, longitude: newLng });

    const prev = prevRealRef.current;

    // Set anchor with no path initially (fallback mode)
    anchorRef.current = {
      lat: newLat, lng: newLng, heading, speedKmh: speed, ts: Date.now(), path: null,
    };

    // If we have a previous position and are moving, try OSRM
    if (prev && speed >= 3) {
      const dist = haversineKm(prev.lat, prev.lng, newLat, newLng);
      // Only fetch route if points are > 5m apart and < 5km (sanity)
      if (dist > 0.005 && dist < 5) {
        fetchOsrmRoute(prev.lat, prev.lng, newLat, newLng).then(route => {
          if (route && anchorRef.current && anchorRef.current.ts === anchorRef.current.ts) {
            // Build path from previous position to new position
            anchorRef.current = {
              ...anchorRef.current,
              lat: prev.lat,
              lng: prev.lng,
              path: buildPathData(route),
            };
          }
        });
      }
    }

    prevRealRef.current = { lat: newLat, lng: newLng };
  }, [real.latitude, real.longitude, real.heading, real.speedKmh]);

  // Animation loop — walk along OSRM path or fallback to bearing extrapolation
  useEffect(() => {
    const interval = setInterval(() => {
      const anchor = anchorRef.current;
      if (!anchor || anchor.speedKmh < 3) return;

      const elapsed = (Date.now() - anchor.ts) / 1000;
      const cappedElapsed = Math.min(elapsed, 15);
      const distKm = (anchor.speedKmh / 3600) * cappedElapsed;

      if (anchor.path) {
        // Walk along OSRM road geometry
        const [lat, lng] = positionAlongPath(anchor.path, distKm);
        setPos({ latitude: lat, longitude: lng });
      } else {
        // Fallback: straight-line bearing extrapolation
        const [lat, lng] = moveAlongBearing(anchor.lat, anchor.lng, anchor.heading, distKm);
        setPos({ latitude: lat, longitude: lng });
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return pos;
}

// Export utilities for use by FleetLiveMap
export { fetchOsrmRoute, buildPathData, positionAlongPath, haversineKm, moveAlongBearing };
export type { PathData };
