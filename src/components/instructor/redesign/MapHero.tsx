import { useNavigate } from "react-router-dom";
import { Plus, Minus, Compass } from "lucide-react";

interface MapHeroProps {
  countdown: string;
  pickupLocation: string | null;
  startTime: string | null;
  etaMinutes: number | null;
  lessonId?: string | null;
}

export function MapHero({
  countdown,
  pickupLocation,
  startTime,
  etaMinutes,
  lessonId,
}: MapHeroProps) {
  const navigate = useNavigate();
  const etaText = etaMinutes != null && etaMinutes > 0 ? `${etaMinutes} min` : "—";
  const timeShort = startTime ? startTime.slice(0, 5) : "—";

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(10,14,39,0.06), 0 4px 16px rgba(10,14,39,0.04)",
      }}
    >
      {/* Top info strip */}
      <div className="flex items-start justify-between px-3.5 py-3.5">
        <div className="min-w-0">
          <div
            style={{
              fontSize: 11,
              color: "#888",
              letterSpacing: 0.5,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Next lesson · in {countdown}
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#0a0e27", marginTop: 2 }}>
            Next lesson
          </div>
          <div style={{ fontSize: 11, color: "#5F5E5A", marginTop: 2 }} className="truncate">
            {pickupLocation || "Pickup pending"}
          </div>
        </div>
        <div className="text-right shrink-0 ml-2">
          <div style={{ fontSize: 10, color: "#888", letterSpacing: 0.4, fontWeight: 600 }}>PICKUP</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#0a0e27", marginTop: 2 }}>{timeShort}</div>
          <div style={{ fontSize: 10, color: "#2e7d32", marginTop: 2, fontWeight: 500 }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#2e7d32", marginRight: 4 }} />
            ETA {etaText}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="relative" style={{ height: 180 }}>
        <svg viewBox="0 0 360 180" width="100%" height="180" preserveAspectRatio="xMidYMid slice">
          {/* base */}
          <rect width="360" height="180" fill="#eef1f4" />

          {/* parks */}
          <ellipse cx="320" cy="20" rx="60" ry="38" fill="#c8dcc8" opacity="0.6" />
          <ellipse cx="30" cy="170" rx="55" ry="34" fill="#c8dcc8" opacity="0.6" />

          {/* road casings (grey wider) */}
          <path d="M -10 130 Q 100 110 200 120 T 380 100" stroke="#dce3e8" strokeWidth="16" fill="none" strokeLinecap="round" />
          <path d="M -10 60 Q 120 70 220 55 T 380 40" stroke="#dce3e8" strokeWidth="14" fill="none" strokeLinecap="round" />
          <path d="M 80 -10 L 100 200" stroke="#dce3e8" strokeWidth="18" fill="none" />
          <path d="M 260 -10 L 250 200" stroke="#dce3e8" strokeWidth="16" fill="none" />
          <path d="M 160 0 L 175 180" stroke="#dce3e8" strokeWidth="10" fill="none" />

          {/* road fills (white) */}
          <path d="M -10 130 Q 100 110 200 120 T 380 100" stroke="#ffffff" strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M -10 60 Q 120 70 220 55 T 380 40" stroke="#ffffff" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M 80 -10 L 100 200" stroke="#ffffff" strokeWidth="12" fill="none" />
          <path d="M 260 -10 L 250 200" stroke="#ffffff" strokeWidth="10" fill="none" />
          <path d="M 160 0 L 175 180" stroke="#fafbfc" strokeWidth="6" fill="none" />

          {/* buildings */}
          <g fill="#d9e1d6" opacity="0.7">
            <rect x="120" y="80" width="22" height="14" rx="1" />
            <rect x="146" y="76" width="16" height="18" rx="1" />
            <rect x="190" y="135" width="20" height="14" rx="1" />
            <rect x="214" y="138" width="14" height="12" rx="1" />
            <rect x="280" y="80" width="18" height="14" rx="1" />
            <rect x="302" y="78" width="16" height="18" rx="1" />
            <rect x="40" y="100" width="16" height="14" rx="1" />
            <rect x="58" y="103" width="14" height="11" rx="1" />
          </g>

          {/* route line */}
          <path
            d="M 50 150 Q 100 130 130 110 T 200 80 Q 240 65 280 50"
            stroke="#1a6fd4"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* street labels */}
          <g fontFamily="-apple-system, sans-serif" fontSize="9" fontWeight="500" fill="#5F5E5A" opacity="0.7">
            <text x="40" y="54" transform="rotate(-6 40 54)">Moorgreen</text>
            <text x="170" y="46" transform="rotate(-4 170 46)">Maunsell Way</text>
            <text x="190" y="148" transform="rotate(-2 190 148)">Bubb Ln</text>
          </g>

          {/* destination pill */}
          <g>
            <rect x="248" y="22" width="78" height="18" rx="9" fill="#ffffff" stroke="rgba(10,14,39,0.1)" strokeWidth="0.5" />
            <text x="287" y="34" textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="10" fontWeight="600" fill="#0a0e27">
              Boorley Green
            </text>
          </g>

          {/* current location marker */}
          <g>
            <circle cx="50" cy="150" r="10" fill="#1a6fd4" opacity="0.25">
              <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.05;0.4" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="50" cy="150" r="6" fill="#ffffff" />
            <circle cx="50" cy="150" r="4" fill="#1a6fd4" />
          </g>

          {/* destination teardrop */}
          <g transform="translate(280 50)">
            <path
              d="M 0 -14 C -8 -14 -12 -8 -12 -2 C -12 6 0 14 0 14 C 0 14 12 6 12 -2 C 12 -8 8 -14 0 -14 Z"
              fill="#D12E2E"
            />
            <circle cx="0" cy="-2" r="3.5" fill="#ffffff" />
          </g>
        </svg>

        {/* Overlay: ETA pill top-left */}
        <div
          className="absolute"
          style={{
            top: 10,
            left: 10,
            background: "#ffffff",
            borderRadius: 999,
            padding: "5px 10px",
            fontSize: 11,
            fontWeight: 600,
            color: "#0a0e27",
            boxShadow: "0 2px 8px rgba(10,14,39,0.12)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2e7d32" }} />
          ETA {etaText}
        </div>

        {/* Zoom controls */}
        <div className="absolute" style={{ top: 10, right: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          <button
            className="flex items-center justify-center"
            style={{ width: 30, height: 30, borderRadius: 6, background: "#fff", boxShadow: "0 2px 6px rgba(10,14,39,0.12)" }}
            aria-label="Zoom in"
          >
            <Plus className="h-3.5 w-3.5" color="#0a0e27" strokeWidth={2.4} />
          </button>
          <button
            className="flex items-center justify-center"
            style={{ width: 30, height: 30, borderRadius: 6, background: "#fff", boxShadow: "0 2px 6px rgba(10,14,39,0.12)" }}
            aria-label="Zoom out"
          >
            <Minus className="h-3.5 w-3.5" color="#0a0e27" strokeWidth={2.4} />
          </button>
        </div>

        {/* Compass */}
        <button
          className="absolute flex items-center justify-center"
          style={{
            bottom: 10,
            right: 10,
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 2px 8px rgba(10,14,39,0.15)",
          }}
          aria-label="Recenter"
        >
          <Compass className="h-4 w-4" color="#1a6fd4" strokeWidth={2.2} />
        </button>
      </div>

      {/* Action buttons */}
      <div
        className="flex gap-2 px-2.5 py-2.5"
        style={{ borderTop: "1px solid rgba(10,14,39,0.06)" }}
      >
        <button
          onClick={() => navigate(lessonId ? `/instructor/tracking?lessonId=${lessonId}` : "/instructor/tracking")}
          style={{
            flex: 1.3,
            background: "#D12E2E",
            color: "#fff",
            borderRadius: 10,
            padding: "10px 8px",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          Start navigation
        </button>
        <button
          onClick={() => navigate("/instructor/tracking")}
          style={{
            flex: 1,
            background: "#f5f6fa",
            color: "#0a0e27",
            borderRadius: 10,
            padding: "10px 8px",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          Start track
        </button>
      </div>
    </div>
  );
}
