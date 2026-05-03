import { memo, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, OverlayViewF, OVERLAY_MOUSE_TARGET, PolylineF } from "@react-google-maps/api";
import { ChevronDown, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchGoogleMapsKey, loadGoogleMaps } from "@/lib/googleMapsLoader";
import { useTrafficETA } from "@/hooks/useTrafficETA";
import { useInstructorLastPosition } from "@/hooks/useInstructorLastPosition";
import { DSMPin } from "./DSMPin";

interface Props {
  lessonId: string;
  pickupPostcode: string | null;
  pickupLocation?: string | null;
  /** e.g. "12 mins" — already formatted upstream */
  countdown: string;
  minutesUntil: number;
  /** Formatted start time, e.g. "14:30" */
  startTime: string;
  /** "Today" / "Tomorrow" / weekday */
  whenLabel: string;
  expanded: boolean;
  onToggleExpanded: () => void;
  pupilName?: string | null;
  pupilPhone?: string | null;
  pupilProfileImage?: string | null;
}

function avatarInitials(name?: string | null) {
  if (!name) return "";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const HEIGHT = 140;

// Module-level caches so revisits are instant.
const coordCache = new Map<string, { lat: number; lng: number } | null>();
const inflightCoords = new Map<string, Promise<{ lat: number; lng: number } | null>>();
let sdkReady: Promise<boolean> | null = null;

function ensureSdk(): Promise<boolean> {
  if (sdkReady) return sdkReady;
  sdkReady = (async () => {
    try {
      const key = await fetchGoogleMapsKey();
      if (!key) return false;
      await loadGoogleMaps(key);
      return true;
    } catch {
      return false;
    }
  })();
  return sdkReady;
}

async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  if (coordCache.has(postcode)) return coordCache.get(postcode)!;
  if (inflightCoords.has(postcode)) return inflightCoords.get(postcode)!;
  const p = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke("geocode-postcode", {
        body: { postcodes: [postcode] },
      });
      if (error) throw error;
      const r = data?.results?.[0];
      const coords =
        r?.latitude && r?.longitude ? { lat: r.latitude, lng: r.longitude } : null;
      coordCache.set(postcode, coords);
      return coords;
    } catch {
      coordCache.set(postcode, null);
      return null;
    } finally {
      inflightCoords.delete(postcode);
    }
  })();
  inflightCoords.set(postcode, p);
  return p;
}

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  gestureHandling: "none",
  clickableIcons: false,
  keyboardShortcuts: false,
  draggable: false,
  scrollwheel: false,
  disableDoubleClickZoom: true,
  zoomControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  rotateControl: false,
  scaleControl: false,
  styles: dsmMapStyle,
};

function PulsingDot() {
  return (
    <>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          background: "#CC2229",
          display: "inline-block",
          animation: "dsmPulse 1.2s ease-in-out infinite",
        }}
      />
      <style>{`@keyframes dsmPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </>
  );
}

function FallbackPanel({ postcode }: { postcode: string | null }) {
  return (
    <div
      style={{
        height: HEIGHT,
        background: "#F0F3F8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      }}
    >
      <span style={{ fontSize: 12, color: "#8E8E93" }}>Location unavailable</span>
      {postcode ? (
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1A52A0" }}>{postcode}</span>
      ) : null}
    </div>
  );
}

function MapHeroLiveImpl({
  lessonId,
  pickupPostcode,
  countdown,
  minutesUntil,
  startTime,
  whenLabel,
  expanded,
  onToggleExpanded,
  pupilName,
  pupilPhone,
  pupilProfileImage,
}: Props) {
  const eta = useTrafficETA(pickupPostcode);
  const etaMinutes = eta.durationMinutes || 0;
  // "Late" = travel time exceeds time remaining until lesson start
  const willBeLate = etaMinutes > 0 && minutesUntil > 0 && etaMinutes > minutesUntil;
  const lateBy = willBeLate ? etaMinutes - minutesUntil : 0;
  const [notified, setNotified] = useState(false);

  const sendLateText = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!pupilPhone) return;
    const first = (pupilName || "").split(/\s+/)[0] || "there";
    const msg = `Hi ${first}, traffic is heavier than expected — I'm running about ${lateBy} min${lateBy === 1 ? "" : "s"} late for our lesson. Sorry about that!`;
    const a = document.createElement("a");
    a.href = `sms:${pupilPhone}?body=${encodeURIComponent(msg)}`;
    a.click();
    setNotified(true);
  };

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null | undefined>(
    undefined
  );

  // Defer mount until the tile scrolls into view.
  useEffect(() => {
    if (!wrapRef.current || visible) return;
    const el = wrapRef.current;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "100px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  // Load SDK once visible.
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    ensureSdk().then((ok) => {
      if (!cancelled) setSdkLoaded(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  // Geocode pickup.
  useEffect(() => {
    if (!visible) return;
    if (!pickupPostcode) {
      setCoords(null);
      return;
    }
    let cancelled = false;
    // Hit cache synchronously to avoid loading flicker.
    if (coordCache.has(pickupPostcode)) {
      setCoords(coordCache.get(pickupPostcode)!);
      return;
    }
    geocodePostcode(pickupPostcode).then((c) => {
      if (!cancelled) setCoords(c);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, pickupPostcode]);

  // Memoised region keyed on lesson id (per spec).
  const center = useMemo(() => {
    if (!coords) return null;
    return { lat: coords.lat, lng: coords.lng };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, coords?.lat, coords?.lng]);

  const showFallback = coords === null;

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        height: HEIGHT,
        overflow: "hidden",
        background: "#F0F3F8",
      }}
    >
      {showFallback ? (
        <FallbackPanel postcode={pickupPostcode} />
      ) : visible && sdkLoaded && center ? (
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={center}
          zoom={15}
          options={MAP_OPTIONS}
        >
          <OverlayViewF
            position={center}
            mapPaneName={OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -h })}
          >
            <DSMPin />
          </OverlayViewF>
        </GoogleMap>
      ) : null}

      {/* Pulsing countdown pill */}
      {minutesUntil > 0 ? (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: "rgba(255,255,255,0.95)",
            borderRadius: 20,
            padding: "4px 10px",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          }}
        >
          <PulsingDot />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#1A1A1A" }}>
            In {countdown}
          </span>
        </div>
      ) : null}

      {/* ETA pill (top-right). Red + Notify button when running late. */}
      {etaMinutes > 0 ? (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: willBeLate ? "rgba(204,34,41,0.95)" : "rgba(255,255,255,0.95)",
            color: willBeLate ? "#FFFFFF" : "#1A1A1A",
            borderRadius: 20,
            padding: "4px 4px 4px 10px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
            maxWidth: "65%",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "-0.1px" }}>
            {willBeLate ? `${lateBy}m late` : `ETA ${etaMinutes}m`}
          </span>
          {willBeLate && pupilPhone ? (
            <button
              type="button"
              onClick={sendLateText}
              disabled={notified}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                background: notified ? "rgba(255,255,255,0.25)" : "#FFFFFF",
                color: notified ? "#FFFFFF" : "#CC2229",
                border: "none",
                borderRadius: 999,
                padding: "3px 8px",
                fontSize: 10,
                fontWeight: 700,
                cursor: notified ? "default" : "pointer",
              }}
              aria-label="Notify pupil you're running late"
            >
              <Send size={9} strokeWidth={2.4} />
              {notified ? "Sent" : "Notify"}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Pupil avatar */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          right: 10,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "#1A52A0",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.5px",
          border: "2px solid #FFFFFF",
          boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
        aria-label={pupilName || "Pupil"}
      >
        {pupilProfileImage ? (
          <img
            src={pupilProfileImage}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          avatarInitials(pupilName)
        )}
      </div>

      {/* Expand pill */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpanded();
        }}
        style={{
          position: "absolute",
          bottom: 10,
          left: 10,
          background: "rgba(255,255,255,0.92)",
          border: "none",
          borderRadius: 20,
          padding: "3px 10px",
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          cursor: "pointer",
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
        }}
        aria-label={expanded ? "Collapse details" : "Expand details"}
      >
        <span style={{ fontSize: 9, fontWeight: 600, color: "#1A52A0" }}>Details</span>
        <ChevronDown
          size={9}
          color="#1A52A0"
          style={{
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms ease",
          }}
        />
      </button>
    </div>
  );
}

export const MapHeroLive = memo(MapHeroLiveImpl);
