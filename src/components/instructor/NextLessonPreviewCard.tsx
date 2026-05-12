import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, OverlayViewF, OVERLAY_MOUSE_TARGET, PolylineF } from "@react-google-maps/api";
import { format, parse, parseISO, isToday, isTomorrow, differenceInCalendarDays } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  Navigation,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { pupilAvatarColor } from "@/lib/pupilAvatarColor";
import { supabase } from "@/integrations/supabase/client";
import { fetchGoogleMapsKey, loadGoogleMaps } from "@/lib/googleMapsLoader";
import { useInstructorLastPosition } from "@/hooks/useInstructorLastPosition";
import { usePupilLessonHistory } from "@/hooks/usePupilLessonHistory";
import { usePupilPaymentStatus } from "@/hooks/usePupilPaymentStatus";

/* -------------------------------------------------------------------------- */
/*  Spec tokens                                                                */
/* -------------------------------------------------------------------------- */

const C = {
  red: "#C8242C",
  blue: "#1E6FB8",
  blueTint: "#E8F2FA",
  text: "#3A3A3A",
  text2: "#6B6B6B",
  text3: "#9A9A9A",
  card: "#FFFFFF",
  divider: "#EDE9E0",
  green: "#1D9E75",
  greenTint: "#E1F5EE",
  greenText: "#0F6E56",
  amberTint: "#FAEEDA",
  amberText: "#BA7517",
  redTint: "#FCEBEB",
};

const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", sans-serif';

const COLLAPSED_MAP_H = 170;
const EXPANDED_MAP_H = 280;

/* -------------------------------------------------------------------------- */
/*  Caches & SDK                                                               */
/* -------------------------------------------------------------------------- */

const coordCache = new Map<string, { lat: number; lng: number } | null>();
const inflight = new Map<string, Promise<{ lat: number; lng: number } | null>>();
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

async function geocodePostcode(postcode: string) {
  if (coordCache.has(postcode)) return coordCache.get(postcode)!;
  if (inflight.has(postcode)) return inflight.get(postcode)!;
  const p = (async () => {
    try {
      const { data } = await supabase.functions.invoke("geocode-postcode", {
        body: { postcodes: [postcode] },
      });
      const r = data?.results?.[0];
      const coords =
        r?.latitude && r?.longitude ? { lat: r.latitude, lng: r.longitude } : null;
      coordCache.set(postcode, coords);
      return coords;
    } catch {
      coordCache.set(postcode, null);
      return null;
    } finally {
      inflight.delete(postcode);
    }
  })();
  inflight.set(postcode, p);
  return p;
}

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#F5F4F1" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9A9A9A" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#EDE9E0" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#FCE9C9" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#D6E6F2" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#E6EFD9" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ visibility: "off" }] },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function toSentenceName(name: string) {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function fmtTime(t: string) {
  try {
    return format(parse(t, "HH:mm:ss", new Date()), "HH:mm");
  } catch {
    return t.slice(0, 5);
  }
}

function fmtHours(min: number) {
  const h = min / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

function relativeWhen(dateStr: string) {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    const days = differenceInCalendarDays(d, new Date());
    if (days > 1) return `In ${days} days`;
    return format(d, "EEE d MMM");
  } catch {
    return dateStr;
  }
}

function dateChip(dateStr: string, time: string) {
  try {
    const d = parseISO(dateStr);
    return `${format(d, "EEE d MMM").toUpperCase()} · ${fmtTime(time)}`;
  } catch {
    return `${dateStr} · ${fmtTime(time)}`;
  }
}

function haversine(a: google.maps.LatLngLiteral, b: google.maps.LatLngLiteral) {
  const R = 6371000;
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(b.lat - a.lat);
  const dLng = r(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/* -------------------------------------------------------------------------- */
/*  Props                                                                      */
/* -------------------------------------------------------------------------- */

export interface NextLessonPreviewCardProps {
  lessonId: string;
  pupilId: string;
  pupilName: string;
  pupilPhone?: string | null;
  pupilProfileImage?: string | null;
  lessonDate: string;
  startTime: string;
  durationMinutes?: number;
  pickupPostcode?: string | null;
  pickupLocation?: string | null;
  minutesUntil: number;
  instructorId?: string | null;
  /** "HH:mm" — when AI call divert begins */
  aiDivertTime?: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function NextLessonPreviewCard(props: NextLessonPreviewCardProps) {
  const {
    lessonId,
    pupilId,
    pupilName,
    pupilPhone,
    pupilProfileImage,
    lessonDate,
    startTime,
    durationMinutes = 60,
    pickupPostcode,
    pickupLocation,
    minutesUntil,
    instructorId,
    aiDivertTime,
  } = props;

  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null | undefined>(
    undefined,
  );
  const [browserLoc, setBrowserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[] | null>(null);
  const [driveMin, setDriveMin] = useState<number | null>(null);

  const lastPos = useInstructorLastPosition(instructorId ?? null);

  // Load SDK
  useEffect(() => {
    let cancelled = false;
    ensureSdk().then((ok) => !cancelled && setSdkLoaded(ok));
    return () => {
      cancelled = true;
    };
  }, []);

  // Geocode destination
  useEffect(() => {
    if (!pickupPostcode) {
      setDestCoords(null);
      return;
    }
    if (coordCache.has(pickupPostcode)) {
      setDestCoords(coordCache.get(pickupPostcode)!);
      return;
    }
    let cancelled = false;
    geocodePostcode(pickupPostcode).then((c) => !cancelled && setDestCoords(c));
    return () => {
      cancelled = true;
    };
  }, [pickupPostcode]);

  // Browser geolocation (fallback to instructor last position)
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setBrowserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setBrowserLoc(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 5 * 60_000 },
    );
  }, []);

  const origin = useMemo<google.maps.LatLngLiteral | null>(() => {
    if (browserLoc) return browserLoc;
    if (lastPos.latitude != null && lastPos.longitude != null) {
      return { lat: lastPos.latitude, lng: lastPos.longitude };
    }
    return null;
  }, [browserLoc, lastPos.latitude, lastPos.longitude]);

  // Fetch driving route + duration
  useEffect(() => {
    if (!sdkLoaded || !destCoords || !origin) return;
    if (haversine(origin, destCoords) < 150) {
      setRoutePath(null);
      setDriveMin(0);
      return;
    }
    let cancelled = false;
    try {
      const ds = new google.maps.DirectionsService();
      ds.route(
        {
          origin,
          destination: destCoords,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (res, status) => {
          if (cancelled) return;
          if (status === "OK" && res?.routes?.[0]) {
            const path =
              res.routes[0].overview_path?.map((p) => ({ lat: p.lat(), lng: p.lng() })) || [];
            setRoutePath(path.length ? path : null);
            const sec = res.routes[0].legs?.[0]?.duration?.value ?? null;
            setDriveMin(sec != null ? Math.round(sec / 60) : null);
          }
        },
      );
    } catch {
      /* ignore */
    }
    return () => {
      cancelled = true;
    };
  }, [sdkLoaded, destCoords?.lat, destCoords?.lng, origin?.lat, origin?.lng]);

  // Map fit-bounds
  const mapRef = useRef<google.maps.Map | null>(null);
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    const bounds = new google.maps.LatLngBounds();
    if (routePath && routePath.length > 1) {
      routePath.forEach((p) => bounds.extend(p));
    } else if (destCoords && origin) {
      bounds.extend(destCoords);
      bounds.extend(origin);
    } else if (destCoords) {
      bounds.extend(destCoords);
    }
    if (!bounds.isEmpty()) {
      m.fitBounds(bounds, { top: 36, right: 36, bottom: 36, left: 36 });
    }
  }, [routePath, destCoords?.lat, destCoords?.lng, origin?.lat, origin?.lng, expanded]);

  /* ----- Optional sections (only fetched when expanded) ----- */
  const history = usePupilLessonHistory(expanded ? pupilId : undefined, 5);
  const pay = usePupilPaymentStatus(expanded ? pupilId : undefined);

  /* ----- Handlers ----- */
  const onCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pupilPhone) window.location.href = `tel:${pupilPhone}`;
  };
  const onText = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pupilPhone) window.location.href = `sms:${pupilPhone}`;
  };
  const onGo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!destCoords) return;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS
      ? `maps://maps.apple.com/?daddr=${destCoords.lat},${destCoords.lng}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${destCoords.lat},${destCoords.lng}&travelmode=driving`;
    window.open(url, "_blank");
  };
  const openProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/instructor/pupils/${pupilId}?lesson=${lessonId}`);
  };

  const mapH = expanded ? EXPANDED_MAP_H : COLLAPSED_MAP_H;
  const lessonsCount = history.data?.filter((h) => h.status === "completed").length ?? null;
  const lastLessonDate = history.data?.find((h) => h.status === "completed")?.lesson_date ?? null;
  const lastLessonNote = history.data?.find((h) => h.notes && h.status === "completed")?.notes ?? null;

  const paymentPill = (() => {
    if (!pay.data) return null;
    if (pay.data.balance >= 0) {
      return { label: "Paid", bg: C.greenTint, fg: C.greenText };
    }
    return { label: "Overdue", bg: C.redTint, fg: C.red };
  })();

  const fullName = toSentenceName(pupilName);
  const initialsText = initials(pupilName);
  const avatarColor = pupilAvatarColor(pupilId || pupilName) || "#CC2229";
  const dayText = (() => { try { return format(parseISO(lessonDate), "EEE d MMM"); } catch { return ""; } })();
  const relativeDay = relativeWhen(lessonDate);
  const startLabel = fmtTime(startTime);
  const countdownText = (() => {
    if (minutesUntil <= 0) return "Now";
    if (minutesUntil < 60) return `In ${Math.max(1, Math.round(minutesUntil))} min`;
    if (minutesUntil < 60 * 12 && relativeDay === "Today") {
      const h = Math.round(minutesUntil / 60);
      return h === 1 ? "In 1 hour" : `In ${h} hours`;
    }
    return relativeDay;
  })();

  return (
      <div style={{ padding: "0 16px", fontFamily: FONT, WebkitFontSmoothing: "antialiased" }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: "#8E8E93",
          letterSpacing: 1.2, textTransform: "uppercase",
          marginBottom: 8, paddingLeft: 2,
        }}>
          Up next
        </div>

        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 20,
          overflow: "hidden",
          width: "100%",
          boxShadow: "0 2px 16px rgba(26,82,160,0.11)",
          border: "0.5px solid rgba(26,82,160,0.09)",
        }}>
          {/* Header band — TIME HERO */}
          <div style={{
            backgroundColor: "#F0F5FF",
            padding: "14px 13px 12px",
            borderBottom: "0.5px solid rgba(26,82,160,0.07)",
          }}>
            <div style={{
              display: "flex", alignItems: "flex-start", justifyContent: "space-between",
              marginBottom: 8, gap: 8,
            }}>
              {/* Time block — left */}
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 38, fontWeight: 700, color: "#1A52A0",
                  letterSpacing: -2, lineHeight: "38px",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {startLabel}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                  <span style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#CC2229" }} />
                  <span style={{ fontSize: 10, color: "#8E8E93", fontWeight: 500 }}>
                    {countdownText}{dayText ? ` · ${dayText}` : ""}
                  </span>
                </div>
              </div>

              {/* Avatar — right */}
              <button
                type="button"
                onClick={openProfile}
                aria-label={`View ${fullName}'s profile`}
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: avatarColor,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, overflow: "hidden",
                  border: "2px solid rgba(255,255,255,0.5)",
                  boxShadow: `0 2px 6px ${avatarColor}38`,
                  padding: 0, cursor: "pointer",
                }}
              >
                {pupilProfileImage ? (
                  <img src={pupilProfileImage} alt="" style={{ width: 40, height: 40, objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#FFF" }}>{initialsText}</span>
                )}
              </button>
            </div>

            {/* Pupil name below time */}
            <div style={{
              fontSize: 15, fontWeight: 700, color: "#1A1A1A", letterSpacing: -0.2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {fullName}
            </div>
          </div>

          {/* Map strip — 60px */}
          <div style={{ position: "relative", height: 60, overflow: "hidden", background: "#F5F4F1" }}>
            {sdkLoaded && destCoords ? (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={destCoords}
                zoom={13}
                onLoad={(m) => { mapRef.current = m; }}
                options={{
                  styles: MAP_STYLES,
                  disableDefaultUI: true,
                  gestureHandling: "none",
                  clickableIcons: false,
                  zoomControl: false, mapTypeControl: false,
                  streetViewControl: false, fullscreenControl: false,
                  draggable: false, scrollwheel: false,
                }}
              >
                {routePath && routePath.length > 1 ? (
                  <PolylineF
                    path={routePath}
                    options={{
                      strokeColor: C.red, strokeOpacity: 0, strokeWeight: 3,
                      icons: [{
                        icon: { path: "M 0,-1 0,1", strokeOpacity: 1, strokeColor: C.red, strokeWeight: 3, scale: 3 },
                        offset: "0", repeat: "12px",
                      }],
                    }}
                  />
                ) : null}
                {origin ? (
                  <OverlayViewF position={origin} mapPaneName={OVERLAY_MOUSE_TARGET}
                    getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h / 2) })}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: C.green, border: "2px solid #FFFFFF" }} />
                  </OverlayViewF>
                ) : null}
                <OverlayViewF position={destCoords} mapPaneName={OVERLAY_MOUSE_TARGET}
                  getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -h })}>
                  <svg width={20} height={26} viewBox="0 0 26 34">
                    <path d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 21 13 21s13-11.25 13-21C26 5.82 20.18 0 13 0z" fill={C.red} />
                    <circle cx="13" cy="13" r="5" fill="#FFFFFF" />
                  </svg>
                </OverlayViewF>
              </GoogleMap>
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.text3 }}>
                {destCoords === null ? "Map unavailable" : "Loading map…"}
              </div>
            )}

            {/* ETA pill — top left */}
            <button
              type="button"
              onClick={onGo}
              disabled={!destCoords}
              style={{
                position: "absolute", top: 7, left: 8,
                backgroundColor: "rgba(255,255,255,0.96)",
                borderRadius: 13, padding: "3px 8px",
                display: "inline-flex", alignItems: "center", gap: 4,
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                border: "none", cursor: destCoords ? "pointer" : "default",
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#1A7A3C" }} />
              <span style={{ fontSize: 8.5, fontWeight: 700, color: "#1A1A1A" }}>
                {driveMin != null && driveMin > 0 ? `ETA ${driveMin}m` : "Tap for ETA"}
              </span>
            </button>

            {/* Navigate button — bottom right */}
            <button
              type="button"
              onClick={onGo}
              disabled={!destCoords}
              style={{
                position: "absolute", bottom: 5, right: 8,
                backgroundColor: "rgba(26,82,160,0.88)",
                borderRadius: 10, padding: "3px 8px",
                border: "none", cursor: destCoords ? "pointer" : "default",
              }}
            >
              <span style={{ fontSize: 8.5, fontWeight: 700, color: "#FFF" }}>Navigate →</span>
            </button>
          </div>

          {/* Details */}
          <div style={{ padding: "9px 12px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, backgroundColor: "#EEF3FF",
                display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Clock style={{ width: 10, height: 10, color: "#1A52A0" }} strokeWidth={1.8} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1A1A1A" }}>
                Standard lesson · {fmtHours(durationMinutes)}
              </div>
            </div>

            {(pickupPostcode || pickupLocation) ? (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 7 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6, backgroundColor: "#EEF3FF",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
                }}>
                  <MapPin style={{ width: 10, height: 10, color: "#1A52A0" }} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: "#1A1A1A",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {pickupPostcode}
                    {pickupPostcode && pickupLocation ? " · " : ""}
                    {pickupLocation || (!pickupPostcode ? "Location TBC" : "")}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: "#1A52A0", marginTop: 1 }}>Pick-up</div>
                </div>
              </div>
            ) : null}

            {aiDivertTime && minutesUntil <= 24 * 60 ? (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                backgroundColor: "#F0EEFF", borderRadius: 7,
                padding: "3px 7px", marginBottom: 8,
              }}>
                <Sparkles style={{ width: 8, height: 8, color: "#6B21A8" }} strokeWidth={1.9} />
                <span style={{ fontSize: 8.5, fontWeight: 600, color: "#6B21A8" }}>
                  AI divert at {aiDivertTime}
                </span>
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 5 }}>
              <button
                type="button"
                onClick={onCall}
                disabled={!pupilPhone}
                aria-label={pupilPhone ? `Call ${fullName}` : "Call disabled"}
                style={{
                  flex: 1.3, padding: "8px 0", borderRadius: 9,
                  backgroundColor: pupilPhone ? "#CC2229" : "#E8B5B7",
                  color: "#FFF", border: "none",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3,
                  fontSize: 10, fontWeight: 700,
                  boxShadow: pupilPhone ? "0 2px 6px rgba(204,34,41,0.28)" : "none",
                  cursor: pupilPhone ? "pointer" : "not-allowed",
                  fontFamily: FONT,
                }}
              >
                <Phone style={{ width: 10, height: 10 }} strokeWidth={1.8} /> Call
              </button>
              <button
                type="button"
                onClick={onText}
                disabled={!pupilPhone}
                aria-label={`Text ${fullName}`}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 9,
                  backgroundColor: "#EEF3FF", color: "#1A52A0", border: "none",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3,
                  fontSize: 10, fontWeight: 600,
                  cursor: pupilPhone ? "pointer" : "not-allowed",
                  opacity: pupilPhone ? 1 : 0.5,
                  fontFamily: FONT,
                }}
              >
                <MessageSquare style={{ width: 10, height: 10 }} strokeWidth={1.7} /> Text
              </button>
              <button
                type="button"
                onClick={onGo}
                disabled={!destCoords}
                aria-label="Navigate"
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 9,
                  backgroundColor: "#EEF3FF", color: "#1A52A0", border: "none",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3,
                  fontSize: 10, fontWeight: 600,
                  cursor: destCoords ? "pointer" : "not-allowed",
                  opacity: destCoords ? 1 : 0.5,
                  fontFamily: FONT,
                }}
              >
                <Navigation style={{ width: 10, height: 10 }} strokeWidth={1.7} /> Go
              </button>
            </div>
          </div>

          {/* Expanded extras — inline within same card */}
          <AnimatePresence initial={false}>
            {expanded ? (
              <motion.div
                key="extras"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{ overflow: "hidden" }}
              >
                <div style={{ padding: "10px 12px 12px", borderTop: `0.5px solid ${C.divider}` }}>
                  <SectionLabel>Pupil</SectionLabel>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div
                      style={{
                        width: 40, height: 40, borderRadius: "50%",
                        background: avatarColor, color: "#FFFFFF",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 600, overflow: "hidden", flexShrink: 0,
                      }}
                    >
                      {pupilProfileImage ? (
                        <img src={pupilProfileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        initialsText
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{fullName}</div>
                      <div style={{ fontSize: 11, color: C.text2 }}>Provisional</div>
                    </div>
                    <button
                      type="button"
                      onClick={openProfile}
                      style={{
                        background: "transparent", border: "none", color: C.blue,
                        fontSize: 12, fontWeight: 500, cursor: "pointer", padding: 0,
                      }}
                    >
                      View profile →
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                    <Stat label="Lessons" value={lessonsCount != null ? String(lessonsCount) : "—"} />
                    <Stat label="Last lesson" value={lastLessonDate ? format(parseISO(lastLessonDate), "d MMM") : "—"} />
                    <Stat label="Test booked" value="Not yet" />
                  </div>

                  {paymentPill ? (
                    <>
                      <SectionLabel>Payment</SectionLabel>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <span
                          style={{
                            background: paymentPill.bg, color: paymentPill.fg,
                            fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 12,
                          }}
                        >
                          {paymentPill.label}
                        </span>
                        <div style={{ fontSize: 12, color: C.text }}>
                          <span style={{ fontWeight: 500 }}>£{Math.abs(pay.data?.balance ?? 0).toFixed(2)}</span>{" "}
                          <span style={{ color: C.text2 }}>balance</span>
                        </div>
                      </div>
                    </>
                  ) : null}

                  {lastLessonNote ? (
                    <>
                      <SectionLabel>Notes from last lesson</SectionLabel>
                      <p
                        style={{
                          fontSize: 12, color: C.text, lineHeight: 1.4, margin: 0,
                          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}
                      >
                        {lastLessonNote}
                      </p>
                    </>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Expand handle */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            aria-expanded={expanded}
            style={{
              width: "100%", border: "none",
              borderTop: "0.5px solid rgba(0,0,0,0.05)",
              padding: "6px 0", backgroundColor: "#FAFBFD",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3,
              cursor: "pointer", fontFamily: FONT,
            }}
          >
            <span style={{ fontSize: 9, fontWeight: 600, color: "#8E8E93" }}>
              {expanded ? "Hide details" : "Details"}
            </span>
            {expanded
              ? <ChevronUp style={{ width: 8, height: 8, color: "#C7C7CC" }} strokeWidth={2.5} />
              : <ChevronDown style={{ width: 8, height: 8, color: "#C7C7CC" }} strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    );
  }

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function ActionBtn({
  label,
  icon,
  variant,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  variant: "primary" | "secondary";
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) {
  const primary = variant === "primary";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: 11,
        borderRadius: 22,
        border: "none",
        background: primary ? C.blue : C.blueTint,
        color: primary ? "#FFFFFF" : C.blue,
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        WebkitTapHighlightColor: "transparent",
        fontFamily: FONT,
      }}
      aria-label={label}
    >
      {icon}
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        color: C.text2,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: C.text2,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{value}</div>
    </div>
  );
}
