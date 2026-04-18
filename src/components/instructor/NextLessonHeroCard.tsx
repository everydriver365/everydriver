import { useEffect, useRef, useState } from "react";
import { format, parse } from "date-fns";
import { Navigation, Phone, MessageSquare, MapPin, Clock, Calendar } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Module-level cache for geocoded postcodes (survives re-renders)
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  const key = postcode.trim().toUpperCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(key)}`);
    if (!res.ok) {
      geocodeCache.set(key, null);
      return null;
    }
    const json = await res.json();
    const result = json?.result ? { lat: json.result.latitude, lng: json.result.longitude } : null;
    geocodeCache.set(key, result);
    return result;
  } catch {
    geocodeCache.set(key, null);
    return null;
  }
}

interface NextLessonHeroCardProps {
  pupilName: string;
  pupilProfileImage?: string | null;
  pupilPhone?: string | null;
  startTime: string; // "HH:mm:ss"
  lessonDate: string; // "yyyy-MM-dd"
  durationMinutes: number;
  daysUntil?: number;
  accountBalance: number;
  pickupLocation?: string | null;
  pickupPostcode?: string | null;
  etaMinutes?: number;
  etaMiles?: number;
  onNavigate?: () => void;
  onCall?: () => void;
  onSms?: () => void;
  onArrived?: () => void;
}

export function NextLessonHeroCard({
  pupilName,
  pupilProfileImage,
  pupilPhone,
  startTime,
  lessonDate,
  durationMinutes,
  daysUntil,
  accountBalance,
  pickupLocation,
  pickupPostcode,
  etaMinutes = 2,
  etaMiles = 0.8,
  onNavigate,
  onCall,
  onSms,
  onArrived,
}: NextLessonHeroCardProps) {
  const timeFormatted = (() => {
    try {
      return format(parse(startTime, "HH:mm:ss", new Date()), "HH:mm");
    } catch {
      return startTime?.slice(0, 5) ?? "--:--";
    }
  })();

  const dateFormatted = (() => {
    try {
      return format(new Date(lessonDate), "EEE d MMM");
    } catch {
      return lessonDate;
    }
  })();

  const lessonHours = durationMinutes / 60;
  const lessonHoursLabel = Number.isInteger(lessonHours)
    ? `${lessonHours}h lesson`
    : `${lessonHours.toFixed(1)}h lesson`;

  const fullAddress = [pickupLocation, pickupPostcode].filter(Boolean).join(", ");

  const handleCall = () => {
    if (onCall) return onCall();
    if (pupilPhone) window.location.href = `tel:${pupilPhone}`;
  };
  const handleSms = () => {
    if (onSms) return onSms();
    if (pupilPhone) window.location.href = `sms:${pupilPhone}`;
  };

  return (
    <div
      className="w-full max-w-[400px] mx-auto bg-white overflow-hidden font-sans"
      style={{
        borderRadius: 20,
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 16px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
      }}
    >
      {/* 1. MAP PREVIEW (real Leaflet mini-map) */}
      <div className="relative w-full overflow-hidden" style={{ height: 120 }}>
        <MiniMap postcode={pickupPostcode} />

        {/* ETA pill */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: "50%",
            top: "55%",
            transform: "translate(-50%, -50%)",
            background: "#ffffff",
            border: "1px solid rgba(15,23,42,0.06)",
            boxShadow: "0 2px 6px rgba(15,23,42,0.12)",
            borderRadius: 999,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 700,
            color: "#2563eb",
            whiteSpace: "nowrap",
            zIndex: 500,
          }}
        >
          {etaMinutes} min · {etaMiles}mi
        </div>

        {/* Top-left chip */}
        <div
          className="absolute flex items-center gap-2 pointer-events-none"
          style={{
            top: 8,
            left: 8,
            background: "rgba(30, 42, 61, 0.92)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: 999,
            padding: "5px 10px",
            zIndex: 500,
          }}
        >
          <span
            className="nlhc-pulse-green"
            style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }}
          />
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#9ca3af",
            }}
          >
            Next Lesson
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", lineHeight: 1 }}>{timeFormatted}</span>
        </div>

        {/* Top-right chip */}
        <div
          className="absolute flex items-center gap-1.5 pointer-events-none"
          style={{
            top: 8,
            right: 8,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            borderRadius: 999,
            padding: "4px 9px",
            zIndex: 500,
          }}
        >
          <span
            className="nlhc-blink-red"
            style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", display: "inline-block" }}
          />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#1e2a3d" }}>Tracking</span>
        </div>
      </div>

      {/* 2. PUPIL HERO ROW */}
      <div style={{ padding: "20px 16px 12px", marginTop: -10 }} className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div
            style={{
              position: "absolute",
              inset: -5,
              borderRadius: "50%",
              border: "2px solid #10b981",
              opacity: 0.8,
            }}
          />
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              border: "3px solid #ffffff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              overflow: "hidden",
              background: "#fde7d3",
            }}
          >
            {pupilProfileImage ? (
              <img src={pupilProfileImage} alt={pupilName} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  color: "#ffffff",
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "-0.5px",
                }}
              >
                {pupilName
                  .split(" ")
                  .map((n) => n[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() || "?"}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className="truncate"
            style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.2px", lineHeight: 1.2 }}
          >
            {pupilName}
          </h3>
          <div className="flex flex-wrap items-center mt-1.5" style={{ gap: 5 }}>
            <span
              className="inline-flex items-center"
              style={{
                gap: 3,
                background: "#f3f4f6",
                color: "#4b5563",
                fontSize: 10,
                fontWeight: 600,
                borderRadius: 10,
                padding: "3px 8px",
              }}
            >
              <Clock size={11} />
              {lessonHoursLabel}
            </span>
            <span
              className="inline-flex items-center"
              style={{
                gap: 3,
                background: "#f3f4f6",
                color: "#4b5563",
                fontSize: 10,
                fontWeight: 600,
                borderRadius: 10,
                padding: "3px 8px",
              }}
            >
              <Calendar size={11} />
              {dateFormatted}
            </span>
            {typeof daysUntil === "number" && (
              <span
                style={{
                  background: "#fef3c7",
                  color: "#92400e",
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 10,
                  padding: "3px 8px",
                }}
              >
                {daysUntil} days
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. BALANCE STRIP */}
      <div
        className="flex items-center justify-between"
        style={{
          margin: "0 16px 10px",
          padding: "7px 12px",
          borderRadius: 10,
          background: "linear-gradient(90deg, #ecfdf5, #f0fdf4)",
          border: "1px solid #d1fae5",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#065f46",
            }}
          >
            Account Balance
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#047857", lineHeight: 1.2 }}>
            £{accountBalance.toFixed(2)}
          </div>
        </div>
        <svg width="48" height="20" viewBox="0 0 48 20" aria-hidden="true">
          <defs>
            <linearGradient id="nlhc-spark-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 16 L8 14 L16 15 L24 10 L32 11 L40 6 L48 3 L48 20 L0 20 Z" fill="url(#nlhc-spark-fill)" />
          <path
            d="M0 16 L8 14 L16 15 L24 10 L32 11 L40 6 L48 3"
            stroke="#10b981"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* 4. PICK-UP ADDRESS */}
      <div
        className="flex items-center gap-3"
        style={{ margin: "0 16px 14px", padding: 12, background: "#f8fafc", borderRadius: 12 }}
      >
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#ef4444",
            boxShadow: "0 2px 6px rgba(239,68,68,0.35)",
          }}
        >
          <MapPin size={18} color="#ffffff" strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#9ca3af",
            }}
          >
            Pick-up Address
          </div>
          <div
            className="truncate"
            style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", lineHeight: 1.3 }}
          >
            {fullAddress || "Address not set"}
          </div>
        </div>
      </div>

      {/* 5. ACTION BUTTONS */}
      <div className="grid grid-cols-4" style={{ gap: 8, padding: "0 16px 16px" }}>
        <NlhcActionButton variant="primary" icon={<Navigation size={18} />} label="Navigate" onClick={onNavigate} />
        <NlhcActionButton variant="white" icon={<Phone size={18} />} label="Call" onClick={handleCall} />
        <NlhcActionButton variant="white" icon={<MessageSquare size={18} />} label="SMS" onClick={handleSms} />
        <NlhcActionButton variant="dark" icon={<MapPin size={18} />} label="I'm Here" onClick={onArrived} />
      </div>

      <style>{`
        @keyframes nlhc-pulse-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.7); transform: scale(1); }
          70% { box-shadow: 0 0 0 6px rgba(16,185,129,0); transform: scale(1.05); }
        }
        .nlhc-pulse-green { animation: nlhc-pulse-green 1.6s ease-out infinite; }
        @keyframes nlhc-blink-red {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .nlhc-blink-red { animation: nlhc-blink-red 1.2s ease-in-out infinite; }
        .nlhc-btn { transition: filter 0.15s ease, transform 0.1s ease; }
        .nlhc-btn:hover { filter: brightness(1.06); }
        .nlhc-btn:active { transform: scale(0.97); }
      `}</style>
    </div>
  );
}

function NlhcActionButton({
  variant,
  icon,
  label,
  onClick,
}: {
  variant: "primary" | "white" | "dark";
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
      color: "#ffffff",
      boxShadow: "0 4px 10px rgba(37,99,235,0.35)",
      border: "none",
    },
    white: {
      background: "#ffffff",
      color: "#1e2a3d",
      border: "1px solid #e5e7eb",
    },
    dark: {
      background: "#1e2a3d",
      color: "#ffffff",
      border: "none",
    },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="nlhc-btn flex flex-col items-center justify-center"
      style={{ minHeight: 60, borderRadius: 12, gap: 4, ...styles[variant] }}
    >
      {icon}
      <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
    </button>
  );
}

function MiniMap({ postcode }: { postcode?: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(!!postcode);

  // Geocode postcode
  useEffect(() => {
    let cancelled = false;
    if (!postcode) {
      setCoords(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    geocodePostcode(postcode).then((result) => {
      if (!cancelled) {
        setCoords(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [postcode]);

  // Render map when coords are available
  useEffect(() => {
    if (!containerRef.current || !coords) return;

    // Clean up previous instance
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Red teardrop pin at destination
    const pinIcon = L.divIcon({
      className: "nlhc-pin",
      html: `<svg width="20" height="26" viewBox="0 0 20 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 0C4.477 0 0 4.477 0 10c0 7 10 16 10 16s10-9 10-16c0-5.523-4.477-10-10-10z" fill="#ef4444" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.25));"/>
        <circle cx="10" cy="10" r="3.5" fill="#ffffff"/>
      </svg>`,
      iconSize: [20, 26],
      iconAnchor: [10, 26],
    });
    L.marker([coords.lat, coords.lng], { icon: pinIcon }).addTo(map);

    // Force size recalc once mounted
    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [coords]);

  // No postcode or geocode failed → fallback gradient background
  if (!coords) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #eef4fb, #e2eef9)",
        }}
      >
        {loading && (
          <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em" }}>
            LOADING MAP…
          </div>
        )}
      </div>
    );
  }

  return <div ref={containerRef} className="absolute inset-0" style={{ zIndex: 0 }} />;
}
