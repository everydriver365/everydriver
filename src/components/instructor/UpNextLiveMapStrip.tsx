import { useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, OverlayViewF, OVERLAY_MOUSE_TARGET, PolylineF } from "@react-google-maps/api";
import { fetchGoogleMapsKey, loadGoogleMaps } from "@/lib/googleMapsLoader";
import { useInstructorLastPosition } from "@/hooks/useInstructorLastPosition";
import { useTrafficETA } from "@/hooks/useTrafficETA";
import { supabase } from "@/integrations/supabase/client";

const BLUE = "#3D55A1";
const MUTED = "#5B6B8A";

interface Props {
  pickupPostcode: string | null;
  pickupLocation: string | null;
  instructorId: string;
  hasDestination: boolean;
  onNavigate?: (e: React.MouseEvent) => void;
  /** Optional pill text (e.g. "In 25 min"). Hidden when omitted. */
  countdownLine?: string;
  height?: number;
}

/**
 * Live Google Map strip used by the Up Next card (closed state previously,
 * now reused inside the expanded section). Renders origin → destination
 * polyline with countdown + ETA pills.
 */
export function UpNextLiveMapStrip({
  pickupPostcode,
  pickupLocation: _pickupLocation,
  instructorId,
  hasDestination,
  onNavigate,
  countdownLine,
  height = 110,
}: Props) {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null | undefined>(undefined);
  const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[] | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const lastPos = useInstructorLastPosition(instructorId || null);
  const eta = useTrafficETA(pickupPostcode);
  const etaMin = eta.durationMinutes || 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const key = await fetchGoogleMapsKey();
        if (!key) return;
        await loadGoogleMaps(key);
        if (!cancelled) setSdkLoaded(true);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!pickupPostcode) { setDestCoords(null); return; }
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("geocode-postcode", {
          body: { postcodes: [pickupPostcode] },
        });
        const r = data?.results?.[0];
        const coords = r?.latitude && r?.longitude ? { lat: r.latitude, lng: r.longitude } : null;
        if (!cancelled) setDestCoords(coords);
      } catch {
        if (!cancelled) setDestCoords(null);
      }
    })();
    return () => { cancelled = true; };
  }, [pickupPostcode]);

  const origin = useMemo<google.maps.LatLngLiteral | null>(() => {
    if (lastPos.latitude != null && lastPos.longitude != null) {
      return { lat: lastPos.latitude, lng: lastPos.longitude };
    }
    return null;
  }, [lastPos.latitude, lastPos.longitude]);

  useEffect(() => {
    if (!sdkLoaded || !destCoords || !origin) return;
    let cancelled = false;
    (async () => {
      try {
        const ds = new google.maps.DirectionsService();
        const res = await ds.route({
          origin, destination: destCoords,
          travelMode: google.maps.TravelMode.DRIVING,
        });
        const path = res.routes?.[0]?.overview_path?.map((p) => ({ lat: p.lat(), lng: p.lng() })) || null;
        if (!cancelled) setRoutePath(path);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [sdkLoaded, destCoords?.lat, destCoords?.lng, origin?.lat, origin?.lng]);

  useEffect(() => {
    if (!mapRef.current || !destCoords) return;
    if (routePath && routePath.length > 1) {
      const b = new google.maps.LatLngBounds();
      routePath.forEach((p) => b.extend(p));
      mapRef.current.fitBounds(b, { top: 14, right: 14, bottom: 14, left: 14 });
    } else if (origin) {
      const b = new google.maps.LatLngBounds();
      b.extend(origin); b.extend(destCoords);
      mapRef.current.fitBounds(b, { top: 14, right: 14, bottom: 14, left: 14 });
    } else {
      mapRef.current.setCenter(destCoords);
      mapRef.current.setZoom(14);
    }
  }, [routePath, destCoords?.lat, destCoords?.lng, origin?.lat, origin?.lng]);

  return (
    <div
      role={hasDestination ? "button" : undefined}
      tabIndex={hasDestination ? 0 : undefined}
      onClick={hasDestination && onNavigate ? onNavigate : undefined}
      style={{ position: "relative", height, overflow: "hidden", background: "#E9EEF5", cursor: hasDestination && onNavigate ? "pointer" : "default" }}
    >
      {sdkLoaded && destCoords ? (
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={destCoords}
          zoom={13}
          onLoad={(m) => { mapRef.current = m; }}
          options={{
            disableDefaultUI: true,
            gestureHandling: "none",
            clickableIcons: false,
            keyboardShortcuts: false,
            draggable: false,
            scrollwheel: false,
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              { featureType: "poi", stylers: [{ visibility: "off" }] },
              { featureType: "transit", stylers: [{ visibility: "off" }] },
              { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
              { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#eef1f6" }] },
              { featureType: "water", elementType: "geometry", stylers: [{ color: "#dfe7f0" }] },
              { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
              { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#f2f4f8" }] },
              { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e6ecf5" }] },
            ],
          }}
        >
          {routePath && routePath.length > 1 && (
            <PolylineF
              path={routePath}
              options={{ strokeColor: "#CC2229", strokeOpacity: 0.9, strokeWeight: 3 }}
            />
          )}
          {origin && (
            <OverlayViewF position={origin} mapPaneName={OVERLAY_MOUSE_TARGET}
              getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h / 2) })}>
              <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#1D9E75", border: "2px solid #FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
            </OverlayViewF>
          )}
          <OverlayViewF position={destCoords} mapPaneName={OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -h })}>
            <svg width={18} height={24} viewBox="0 0 26 34">
              <path d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 21 13 21s13-11.25 13-21C26 5.82 20.18 0 13 0z" fill="#CC2229" />
              <circle cx="13" cy="13" r="5" fill="#FFFFFF" />
            </svg>
          </OverlayViewF>
        </GoogleMap>
      ) : (
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: MUTED }}>
          {hasDestination ? "Loading live map…" : "No pick-up set"}
        </div>
      )}

      {countdownLine && (
        <div style={{
          position: "absolute", top: 10, left: 10,
          backgroundColor: "rgba(255,255,255,0.94)",
          borderRadius: 999, padding: "4px 9px",
          display: "inline-flex", alignItems: "center", gap: 5,
          boxShadow: "0 1px 5px rgba(0,0,0,0.12)",
          pointerEvents: "none",
        }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: BLUE, boxShadow: "0 0 0 3px rgba(61,85,161,0.25)" }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: BLUE, letterSpacing: 0.5, textTransform: "uppercase" }}>
            Live · {countdownLine}
          </span>
        </div>
      )}

      {hasDestination && (
        <div style={{
          position: "absolute", top: 10, right: 10,
          backgroundColor: "rgba(255,255,255,0.96)",
          borderRadius: 999, padding: "4px 9px",
          display: "inline-flex", alignItems: "center", gap: 5,
          boxShadow: "0 1px 5px rgba(0,0,0,0.15)",
          pointerEvents: "none",
        }}>
          <span style={{ width: 5, height: 5, borderRadius: 3, background: etaMin > 0 ? "#1D9E75" : "#C7C7CC" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A", fontVariantNumeric: "tabular-nums" }}>
            {etaMin > 0 ? `ETA ${etaMin}m` : "Live ETA…"}
          </span>
        </div>
      )}
    </div>
  );
}
