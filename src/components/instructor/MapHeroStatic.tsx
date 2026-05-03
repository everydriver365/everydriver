import { useEffect, useState } from "react";
import { fetchGoogleMapsKey } from "@/lib/googleMapsLoader";

const RED = "#B23A3F";
const MUTED = "#5B6B8A";
const BORDER = "rgba(26,82,160,0.10)";

let cachedKey: string | null = null;
let inflight: Promise<string> | null = null;
async function getKey(): Promise<string> {
  if (cachedKey) return cachedKey;
  if (inflight) return inflight;
  inflight = fetchGoogleMapsKey().then((k) => {
    cachedKey = k || "";
    inflight = null;
    return cachedKey;
  });
  return inflight;
}

interface Props {
  centerQuery: string | null;
  countdown: string;
  startTime: string;
  whenLabel: string;
  /** Optional: when set, tapping the map opens Google Maps directions to this destination. */
  directionsQuery?: string | null;
  /** Pupil avatar shown in the bottom-right of the map hero. */
  pupilName?: string;
  pupilProfileImage?: string | null;
}

function avatarInitials(name?: string) {
  if (!name) return "";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/**
 * Real mini-map for the "Up next" tile, using Google Static Maps API.
 * Falls back gracefully to a plain background if the key or query is missing.
 */
export function MapHeroStatic({ centerQuery, countdown, startTime, whenLabel, directionsQuery, pupilName, pupilProfileImage }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const dest = directionsQuery ?? centerQuery;
  const openDirections = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dest) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    let cancelled = false;
    if (!centerQuery) {
      setSrc(null);
      return;
    }
    getKey().then((key) => {
      if (cancelled || !key) return;
      const dpr = Math.min(2, Math.max(1, Math.round(window.devicePixelRatio || 1)));
      // Compact, low-saturation style for the brand palette
      const style = [
        "feature:poi|visibility:off",
        "feature:transit|visibility:off",
        "feature:road|element:labels|visibility:off",
        "feature:administrative|element:labels|visibility:off",
        "feature:landscape|color:0xeef1f6",
        "feature:water|color:0xdfe7f0",
        "feature:road|color:0xffffff",
        "feature:road.arterial|color:0xf2f4f8",
        "feature:road.highway|color:0xe6ecf5",
      ]
        .map((s) => `&style=${encodeURIComponent(s)}`)
        .join("");
      const center = encodeURIComponent(centerQuery);
      const marker = `color:0xCC2229|${center}`;
      const url =
        `https://maps.googleapis.com/maps/api/staticmap` +
        `?center=${center}` +
        `&zoom=15&size=400x126&scale=${dpr}` +
        `&markers=${encodeURIComponent(marker)}` +
        style +
        `&key=${encodeURIComponent(key)}`;
      setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [centerQuery]);

  return (
    <div
      onClick={dest ? openDirections : undefined}
      role={dest ? "button" : undefined}
      tabIndex={dest ? 0 : undefined}
      aria-label={dest ? "Open directions in Google Maps" : undefined}
      onKeyDown={
        dest
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openDirections(e as unknown as React.MouseEvent);
              }
            }
          : undefined
      }
      style={{
        position: "relative",
        height: 126,
        width: "100%",
        background: "#E9EEF5",
        overflow: "hidden",
        cursor: dest ? "pointer" : "default",
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <FallbackMap />
      )}

      {/* Centered pin overlay — always visible regardless of static-map cropping */}
      {src && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -100%)",
            pointerEvents: "none",
          }}
        >
          <svg width="28" height="36" viewBox="0 0 28 36">
            <ellipse cx="14" cy="33" rx="6" ry="2" fill="rgba(0,0,0,0.18)" />
            <path
              d="M14 1 C21 1 26 6 26 13 C26 22 14 33 14 33 C14 33 2 22 2 13 C2 6 7 1 14 1 Z"
              fill={RED}
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
            <circle cx="14" cy="13" r="4" fill="#FFFFFF" />
          </svg>
        </div>
      )}

      {/* Frosted countdown pill */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          padding: "5px 10px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          color: "#000000",
          border: `0.5px solid ${BORDER}`,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: RED,
            animation: "dsm-pulse 1.6s ease-out infinite",
          }}
        />
        In {countdown}
      </div>

      {/* Pupil avatar (replaces former time card) */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          right: 10,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: RED,
          color: "#FFFFFF",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 0.3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          border: "2px solid rgba(255,255,255,0.95)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        }}
        aria-label={pupilName || undefined}
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

      <style>{`
        @keyframes dsm-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(204,34,41,0.55); }
          70%  { box-shadow: 0 0 0 8px rgba(204,34,41,0); }
          100% { box-shadow: 0 0 0 0 rgba(204,34,41,0); }
        }
      `}</style>
    </div>
  );
}

function FallbackMap() {
  return (
    <svg
      viewBox="0 0 360 126"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      style={{ display: "block" }}
      aria-hidden
    >
      <rect width="360" height="126" fill="#E9EEF5" />
      <rect x="0" y="0" width="120" height="46" fill="#DCE3EE" />
      <rect x="170" y="0" width="190" height="46" fill="#DCE3EE" />
      <rect x="0" y="80" width="80" height="46" fill="#DCE3EE" />
      <rect x="130" y="80" width="100" height="46" fill="#DCE3EE" />
      <rect x="280" y="80" width="80" height="46" fill="#DCE3EE" />
      <rect x="120" y="0" width="50" height="126" fill="#F2F4F8" />
      <rect x="80" y="46" width="200" height="34" fill="#F2F4F8" />
      <line x1="145" y1="0" x2="145" y2="126" stroke="rgba(26,82,160,0.18)" strokeWidth="1.5" strokeDasharray="6 6" />
      <line x1="80" y1="63" x2="280" y2="63" stroke="rgba(26,82,160,0.18)" strokeWidth="1.5" strokeDasharray="6 6" />
      <g transform="translate(145 63)">
        <circle r="14" fill={RED} fillOpacity="0.12" />
        <path d="M0 -10 C5.5 -10 10 -5.5 10 0 C10 7 0 16 0 16 C0 16 -10 7 -10 0 C-10 -5.5 -5.5 -10 0 -10 Z" fill={RED} />
        <circle cx="0" cy="0" r="3" fill="#FFFFFF" />
      </g>
    </svg>
  );
}
