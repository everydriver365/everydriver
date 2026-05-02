import { motion, AnimatePresence } from "framer-motion";
import { Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface FloatingSessionTimerProps {
  elapsedSeconds: number;
  distanceMiles: number;
  pupilName: string | null;
  isTestRoute: boolean;
  onStop: () => void;
  isStopping: boolean;
  /** Live speed in mph (rounded). Null if no recent fix. */
  speedMph?: number | null;
  /** Posted limit in mph (rounded). Null if unknown. */
  speedLimitMph?: number | null;
  /** Current road name (or null while geocoder resolves). */
  roadName?: string | null;
  /** True when no movement detected for the configured idle window. */
  paused?: boolean;
  /** Called when instructor taps Resume — clears the paused-overlay (no backend change). */
  onResume?: () => void;
  /** Optional alert count badge inside the panel. */
  alertCount?: number;
}

export function FloatingSessionTimer({
  elapsedSeconds,
  distanceMiles,
  pupilName,
  isTestRoute,
  onStop,
  isStopping,
  speedMph = null,
  speedLimitMph = null,
  roadName = null,
  paused = false,
  onResume,
  alertCount = 0,
}: FloatingSessionTimerProps) {
  const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isOver = !paused && speedMph != null && speedLimitMph != null && speedMph > speedLimitMph;
  const speedColor = paused ? "#71717A" : isOver ? "#FF3B30" : "#1C1C1E";
  const headlineName = pupilName || (isTestRoute ? "Test route" : "Lesson");

  return (
    <motion.div
      className="fixed left-3 right-3 z-40"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)" }}
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 120, opacity: 0 }}
      transition={{ type: "spring", damping: 26, stiffness: 320 }}
    >
      <div
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(245,245,247,0.82) 100%)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: 22,
          boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 18px 40px rgba(0,0,0,0.12)",
          padding: "14px 18px",
        }}
      >
        {/* ── Row 1: HEADLINE — speed cluster · roundel · session block ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* a) Speed cluster */}
          <div style={{ minWidth: 0, flex: "0 0 auto", maxWidth: "55%" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <motion.span
                key={speedMph ?? "—"}
                initial={{ opacity: 0.4, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  fontSize: 56,
                  fontWeight: 800,
                  color: speedColor,
                  lineHeight: 0.95,
                  letterSpacing: -1.5,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {paused ? 0 : speedMph != null ? speedMph : "—"}
              </motion.span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "rgba(60,60,67,0.55)",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                mph
              </span>
            </div>
            {/* Road name — sits directly under speed, like CarPlay */}
            <div
              title={roadName || undefined}
              style={{
                marginTop: 4,
                fontSize: 12,
                fontWeight: roadName ? 600 : 500,
                color: roadName ? "rgba(60,60,67,0.7)" : "rgba(60,60,67,0.4)",
                fontStyle: roadName ? "normal" : "italic",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.2,
                letterSpacing: -0.05,
              }}
            >
              {roadName || "Locating road…"}
            </div>
          </div>

          {/* b) Speed-limit roundel (no label) */}
          {speedLimitMph != null && (
            <div
              style={{
                width: 56,
                height: 56,
                flex: "0 0 auto",
                borderRadius: "50%",
                border: "5px solid #E11D2A",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: isOver
                  ? "0 0 0 2px rgba(220,38,38,0.35), 0 4px 14px rgba(0,0,0,0.12)"
                  : "0 4px 14px rgba(0,0,0,0.12)",
              }}
              aria-label={`Speed limit ${speedLimitMph} mph`}
              role="img"
            >
              <span
                style={{
                  fontSize: speedLimitMph >= 100 ? 17 : 22,
                  fontWeight: 800,
                  color: "#1C1C1E",
                  letterSpacing: -0.5,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}
              >
                {speedLimitMph}
              </span>
            </div>
          )}

          {/* c) Student / session block — fills remaining space, right aligned */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 4,
            }}
          >
            <div
              style={{
                width: "100%",
                fontSize: 17,
                fontWeight: 700,
                color: "#1C1C1E",
                textAlign: "right",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                letterSpacing: -0.2,
                lineHeight: 1.15,
              }}
              title={headlineName}
            >
              {headlineName}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "rgba(60,60,67,0.7)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {paused && (
                <>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#F59E0B",
                      display: "inline-block",
                    }}
                  />
                  <span style={{ color: "#B45309", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, fontSize: 11 }}>Paused</span>
                  <span style={{ color: "rgba(60,60,67,0.35)" }}>·</span>
                </>
              )}
              <span>{formatElapsedTime(elapsedSeconds)}</span>
              <span style={{ color: "rgba(60,60,67,0.35)" }}>·</span>
              <span>
                {distanceMiles.toFixed(1)}
                <span style={{ fontWeight: 500, color: "rgba(60,60,67,0.55)", marginLeft: 2 }}>mi</span>
              </span>
              {alertCount > 0 && (
                <>
                  <span style={{ color: "rgba(60,60,67,0.35)" }}>·</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#DC2626" }}>
                    <AlertTriangle className="h-3 w-3" />
                    {alertCount}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Row 2: ACTION BAR ─────────────────────────────────────────── */}
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: "1px solid rgba(0,0,0,0.06)",
            minHeight: 36,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ flex: 1 }} />

          <AnimatePresence mode="popLayout" initial={false}>
            {paused && onResume && (
              <motion.div
                key="resume"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
              >
                <Button
                  size="sm"
                  className="h-9 px-4 rounded-full font-semibold text-xs bg-[#1c1c1e] hover:bg-[#1c1c1e]/90 text-white"
                  onClick={onResume}
                >
                  <Play className="h-3.5 w-3.5 mr-1" />
                  Resume
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* End — pill, gradient red, no icon */}
          <button
            type="button"
            onClick={onStop}
            disabled={isStopping}
            style={{
              height: 36,
              minWidth: 96,
              padding: "0 18px",
              borderRadius: 999,
              border: 0,
              background: "linear-gradient(180deg, #FF453A 0%, #E11D2A 100%)",
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 0.2,
              cursor: isStopping ? "default" : "pointer",
              boxShadow: "0 4px 12px rgba(225,29,42,0.32)",
              opacity: isStopping ? 0.7 : 1,
              transition: "transform 120ms ease, box-shadow 120ms ease",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.96)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(225,29,42,0.32)";
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(225,29,42,0.32)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(225,29,42,0.32)";
            }}
          >
            {isStopping ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "End"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
