import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Clock } from "lucide-react";
import type { PhoneFix } from "@/hooks/usePhoneTrackingStreamer";

interface Props {
  active: boolean;
  fix: PhoneFix | null;
  /** Recent breadcrumb trail (newest last). */
  trail: PhoneFix[];
}

function formatRelative(ts: number, now: number): string {
  const diff = Math.max(0, Math.floor((now - ts) / 1000));
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

/**
 * Mini SVG route preview built from the in-memory phone fix trail.
 * Auto-scales to bounding box; no external map tiles required.
 */
function RouteSparkMap({ trail }: { trail: PhoneFix[] }) {
  const path = useMemo(() => {
    if (trail.length < 2) return null;
    const lats = trail.map((p) => p.latitude);
    const lons = trail.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const w = 280;
    const h = 110;
    const pad = 10;
    const rangeLat = Math.max(maxLat - minLat, 1e-6);
    const rangeLon = Math.max(maxLon - minLon, 1e-6);
    const project = (lat: number, lon: number) => {
      const x = pad + ((lon - minLon) / rangeLon) * (w - pad * 2);
      // SVG y grows downward; flip latitude so north is up.
      const y = pad + (1 - (lat - minLat) / rangeLat) * (h - pad * 2);
      return [x, y] as const;
    };
    const points = trail.map((p) => project(p.latitude, p.longitude));
    const d = points
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" ");
    const last = points[points.length - 1];
    return { d, last, w, h };
  }, [trail]);

  if (!path) {
    return (
      <div
        style={{
          height: 110,
          borderRadius: 12,
          background:
            "repeating-linear-gradient(45deg, #F1F5F9 0 8px, #FFFFFF 8px 16px)",
          border: "0.5px dashed #CBD5E1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748B",
          fontSize: 11,
        }}
      >
        Waiting for movement…
      </div>
    );
  }

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${path.w} ${path.h}`}
      style={{
        borderRadius: 12,
        background: "#F8FAFC",
        border: "0.5px solid #E2E8F0",
        display: "block",
      }}
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d={path.d}
        fill="none"
        stroke="#3D55A1"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={path.last[0]} cy={path.last[1]} r={5} fill="#34C759" stroke="#FFFFFF" strokeWidth={1.5} />
    </svg>
  );
}

export function PhoneLastLocationCard({ active, fix, trail }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    intervalRef.current = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (intervalRef.current != null) window.clearInterval(intervalRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "0.5px solid #E5E5EA",
        borderRadius: 14,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: fix ? "#34C759" : "#C7C7CC",
              boxShadow: fix ? "0 0 0 4px rgba(52,199,89,0.18)" : undefined,
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>
            Last location
          </span>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            color: "#64748B",
          }}
        >
          <Clock size={11} />
          {fix ? formatRelative(fix.timestamp, now) : "—"}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "#EDF2FE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <MapPin size={16} color="#3D55A1" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              color: "#1A1A1A",
              fontWeight: 600,
              letterSpacing: -0.2,
            }}
          >
            {fix
              ? `${fix.latitude.toFixed(5)}, ${fix.longitude.toFixed(5)}`
              : "Waiting for first GPS fix…"}
          </div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
            {fix
              ? `${Math.round(fix.speedKmh * 0.621371)} mph${
                  fix.accuracy != null ? ` · ±${Math.round(fix.accuracy)}m` : ""
                }${trail.length > 1 ? ` · ${trail.length} pts` : ""}`
              : "Make sure location is allowed and you're outdoors."}
          </div>
        </div>
      </div>

      <RouteSparkMap trail={trail} />
    </div>
  );
}
