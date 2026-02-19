/**
 * Bearing-based geo utilities for GPS interpolation.
 * OSRM has been removed — all road-snapping uses the snap-to-road edge function (Google Roads API).
 */

const EARTH_RADIUS_KM = 6371;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/** Haversine distance in km between two points. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLng = (lng2 - lng1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Move a lat/lng by `distKm` along `bearingDeg`. */
export function moveAlongBearing(lat: number, lng: number, bearingDeg: number, distKm: number): [number, number] {
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
