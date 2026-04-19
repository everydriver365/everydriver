import { useNavigate } from "react-router-dom";
import { GoogleMapPreview } from "@/components/instructor/GoogleMapPreview";

interface MapHeroProps {
  countdown: string;
  pickupLocation: string | null;
  pickupPostcode: string | null;
  startTime: string | null;
  etaMinutes: number | null;
  lessonId?: string | null;
}

export function MapHero({
  countdown,
  pickupLocation,
  pickupPostcode,
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
            {pickupLocation || pickupPostcode || "Pickup pending"}
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

      {/* Real Google Map */}
      <div className="relative" style={{ height: 180, background: "#eef1f4" }}>
        {pickupPostcode ? (
          <GoogleMapPreview
            postcode={pickupPostcode}
            address={pickupLocation || undefined}
            height={180}
          />
        ) : (
          <div className="flex items-center justify-center h-full" style={{ fontSize: 12, color: "#888" }}>
            No pickup location yet
          </div>
        )}

        {/* ETA pill overlay */}
        <div
          className="absolute pointer-events-none"
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
