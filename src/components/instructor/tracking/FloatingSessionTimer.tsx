import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  AlertTriangle,
  RefreshCw,
  Compass,
  Crosshair,
  VolumeX,
  Volume2,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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

/* ──────────────────────────────────────────────────────────────────────────
   Google-Maps-style live tracking overlay.

   Visual reskin only — same props, same data, same callbacks. We render
   four positioned overlays on top of the SatNavLiveMap:

   1. Teal status banner (top)   — LIVE pulse · timer · pupil name
   2. Control stack (right edge) — compass / recenter / mute / hazard
   3. Speed pill (bottom-left)   — limit roundel + current mph
   4. White bottom sheet         — distance · duration · End Lesson pill

   NOT a sat-nav: no turn-by-turn, no ETA, no routing, no lane arrows.
   ─────────────────────────────────────────────────────────────────────── */

const TEAL = "#0F3A3A"; // deep nav-app teal
const TEAL_2 = "#0B2E2E"; // gradient stop

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
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isOver =
    !paused &&
    speedMph != null &&
    speedLimitMph != null &&
    speedMph > speedLimitMph;
  const headlineName = pupilName || (isTestRoute ? "Test route" : "Lesson");
  const speedColor = paused ? "#71717A" : isOver ? "#E15D5A" : "#1C1C1E";

  // Local UI-only toggles for the right-edge control stack. These are
  // decorative for now (no behaviour change) — they let the instructor
  // mute alerts visually and signal a hazard state, but the underlying
  // tracking logic is untouched.
  const [muted, setMuted] = useState(false);
  const [hazardArmed, setHazardArmed] = useState(false);

  // Hold-to-confirm End button — 800ms press to commit, release cancels.
  const HOLD_DURATION_MS = 800;
  const [endHoldProgress, setEndHoldProgress] = useState(0);
  const endHoldStartRef = useRef<number | null>(null);
  const endHoldRafRef = useRef<number | null>(null);
  const endHoldFiredRef = useRef<boolean>(false);

  const cancelEndHold = useCallback(() => {
    if (endHoldRafRef.current != null) {
      cancelAnimationFrame(endHoldRafRef.current);
      endHoldRafRef.current = null;
    }
    endHoldStartRef.current = null;
    setEndHoldProgress(0);
  }, []);

  const startEndHold = useCallback(() => {
    if (isStopping) return;
    endHoldFiredRef.current = false;
    endHoldStartRef.current = performance.now();
    const tick = (now: number) => {
      const start = endHoldStartRef.current;
      if (start == null) return;
      const elapsed = now - start;
      const p = Math.min(1, elapsed / HOLD_DURATION_MS);
      setEndHoldProgress(p);
      if (p >= 1) {
        endHoldFiredRef.current = true;
        cancelEndHold();
        onStop();
        return;
      }
      endHoldRafRef.current = requestAnimationFrame(tick);
    };
    endHoldRafRef.current = requestAnimationFrame(tick);
  }, [cancelEndHold, isStopping, onStop]);

  useEffect(() => () => cancelEndHold(), [cancelEndHold]);

  return (
    <>
      {/* ────────────────────────────────────────────────────────────────
          1. TEAL STATUS BANNER — top of screen
          ──────────────────────────────────────────────────────────────── */}
      <motion.div
        className="fixed left-3 right-3 z-50"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
      >
        <div
          style={{
            background: `linear-gradient(180deg, ${TEAL} 0%, ${TEAL_2} 100%)`,
            color: "white",
            borderRadius: 16,
            padding: "12px 14px",
            boxShadow: "0 10px 30px rgba(11,46,46,0.32)",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Pulse + LIVE */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: "0 0 auto",
            }}
          >
            <motion.span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: paused ? "#F59E0B" : "#34D399",
                boxShadow: paused
                  ? "0 0 10px rgba(245,158,11,0.6)"
                  : "0 0 10px rgba(52,211,153,0.7)",
                display: "inline-block",
              }}
              animate={paused ? {} : { opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {paused ? "Paused" : "Live"}
            </span>
          </div>

          {/* Timer — centred-ish, monospaced */}
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: -0.3,
              fontVariantNumeric: "tabular-nums",
              color: "white",
              flex: "0 0 auto",
            }}
          >
            {formatElapsedTime(elapsedSeconds)}
          </div>

          {/* Pupil name + road — fills remaining space, truncates */}
          <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
            <div
              title={headlineName}
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "white",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.2,
                letterSpacing: -0.1,
              }}
            >
              {headlineName}
            </div>
            {roadName && (
              <div
                title={roadName}
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.65)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.25,
                  marginTop: 2,
                }}
              >
                {roadName}
              </div>
            )}
          </div>

          {/* Resume — only shown when paused */}
          <AnimatePresence initial={false}>
            {paused && onResume && (
              <motion.button
                key="resume"
                type="button"
                onClick={onResume}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                  height: 28,
                  padding: "0 12px",
                  borderRadius: 999,
                  background: "white",
                  color: TEAL_2,
                  fontSize: 12,
                  fontWeight: 700,
                  border: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                  flex: "0 0 auto",
                }}
              >
                <Play className="h-3 w-3" />
                Resume
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ────────────────────────────────────────────────────────────────
          2. RIGHT-EDGE CONTROL STACK — compass / recenter / mute / hazard
          ──────────────────────────────────────────────────────────────── */}
      <div
        className="fixed z-50"
        style={{
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
        }}
      >
        <motion.div
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", damping: 26, stiffness: 280 }}
        >
          {/* Compass + Re-centre removed — map is always-follow. */}

          <ControlButton
            aria-label={muted ? "Unmute alerts" : "Mute alerts"}
            onClick={() => setMuted((m) => !m)}
            active={muted}
            activeColor="#E11D2A"
          >
            {muted ? (
              <VolumeX className="h-5 w-5" style={{ color: "#E11D2A" }} />
            ) : (
              <Volume2 className="h-5 w-5" style={{ color: "#1C1C1E" }} />
            )}
          </ControlButton>
          <ControlButton
            aria-label={hazardArmed ? "Disarm hazard" : "Mark hazard"}
            onClick={() => setHazardArmed((h) => !h)}
            active={hazardArmed}
            activeColor="#F59E0B"
          >
            <TriangleAlert
              className="h-5 w-5"
              style={{ color: hazardArmed ? "#F59E0B" : "#1C1C1E" }}
            />
          </ControlButton>
        </motion.div>
      </div>


      {/* ────────────────────────────────────────────────────────────────
          3. SPEED PILL — bottom-left, limit roundel + current mph
          ──────────────────────────────────────────────────────────────── */}
      {(speedMph != null || speedLimitMph != null) && (
        <motion.div
          className="fixed z-40"
          style={{
            left: 12,
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 116px)",
          }}
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", damping: 26, stiffness: 280 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "white",
              borderRadius: 999,
              padding: "4px 14px 4px 4px",
              boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
              border: "1px solid rgba(0,0,0,0.06)",
              gap: 10,
            }}
          >
            {speedLimitMph != null ? (
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: "3.5px solid #E11D2A",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isOver
                    ? "0 0 0 3px rgba(225,29,42,0.22)"
                    : "none",
                }}
                aria-label={`Speed limit ${speedLimitMph} mph`}
                role="img"
              >
                <span
                  style={{
                    fontSize: speedLimitMph >= 100 ? 14 : 17,
                    fontWeight: 800,
                    color: "#1C1C1E",
                    letterSpacing: -0.4,
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1,
                  }}
                >
                  {speedLimitMph}
                </span>
              </div>
            ) : (
              <div style={{ width: 8 }} />
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: 28,
              }}
            >
              <motion.span
                key={speedMph ?? "—"}
                initial={{ opacity: 0.4, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: speedColor,
                  lineHeight: 1,
                  letterSpacing: -0.6,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {paused ? 0 : speedMph != null ? speedMph : "—"}
              </motion.span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "rgba(60,60,67,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginTop: 1,
                }}
              >
                mph
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ────────────────────────────────────────────────────────────────
          4. WHITE BOTTOM SHEET — distance · duration · End Lesson
          ──────────────────────────────────────────────────────────────── */}
      <motion.div
        className="fixed left-0 right-0 z-40"
        style={{ bottom: 0 }}
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
      >
        <div
          style={{
            background: "white",
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            padding: "12px 16px",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)",
            boxShadow: "0 -8px 24px rgba(0,0,0,0.10)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Grabber */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 6,
              left: "50%",
              transform: "translateX(-50%)",
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "rgba(0,0,0,0.18)",
            }}
          />

          {/* Stats block */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 6 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#1C1C1E",
                  letterSpacing: -0.6,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}
              >
                {distanceMiles.toFixed(1)}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "rgba(60,60,67,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                mi
              </span>
              <span style={{ color: "rgba(60,60,67,0.25)", margin: "0 6px" }}>
                ·
              </span>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "rgba(60,60,67,0.85)",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}
              >
                {formatElapsedTime(elapsedSeconds)}
              </span>
              {alertCount > 0 && (
                <>
                  <span
                    style={{ color: "rgba(60,60,67,0.25)", margin: "0 6px" }}
                  >
                    ·
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      color: "#DC2626",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {alertCount}
                  </span>
                </>
              )}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(60,60,67,0.55)",
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              Lesson in progress
            </div>
          </div>

          {/* End — hold-to-confirm red pill */}
          <button
            type="button"
            onPointerDown={startEndHold}
            onPointerUp={cancelEndHold}
            onPointerLeave={cancelEndHold}
            onPointerCancel={cancelEndHold}
            disabled={isStopping}
            aria-label="Hold to end session"
            style={{
              position: "relative",
              height: 46,
              minWidth: 110,
              padding: "0 22px",
              borderRadius: 999,
              border: 0,
              background: "linear-gradient(180deg, #FF453A 0%, #E11D2A 100%)",
              color: "white",
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: 0.2,
              cursor: isStopping ? "default" : "pointer",
              boxShadow: "0 6px 16px rgba(225,29,42,0.38)",
              opacity: isStopping ? 0.7 : 1,
              transform: endHoldProgress > 0 ? "scale(0.96)" : "scale(1)",
              transition: "transform 120ms ease-out",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              overflow: "hidden",
              touchAction: "none",
              flex: "0 0 auto",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(255,255,255,0.22)",
                transformOrigin: "left center",
                transform: `scaleX(${endHoldProgress})`,
                transition:
                  endHoldProgress === 0 ? "transform 200ms ease-out" : "none",
                pointerEvents: "none",
              }}
            />
            <span
              style={{
                position: "relative",
                zIndex: 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {isStopping ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : endHoldProgress > 0 && endHoldProgress < 1 ? (
                "Hold…"
              ) : (
                "End"
              )}
            </span>
          </button>
        </div>
      </motion.div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   ControlButton — circular floating button used in the right-edge stack.
   White glass with subtle shadow, mirrors Google Maps nav controls.
   ─────────────────────────────────────────────────────────────────────── */

function ControlButton({
  children,
  onClick,
  active = false,
  activeColor,
  ...rest
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  activeColor?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...rest}
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: "white",
        border: active
          ? `1.5px solid ${activeColor ?? "#1C1C1E"}`
          : "1px solid rgba(0,0,0,0.06)",
        boxShadow: active
          ? `0 4px 14px ${activeColor ?? "#1C1C1E"}33`
          : "0 4px 14px rgba(0,0,0,0.14)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        transition: "transform 120ms ease, box-shadow 120ms ease",
      }}
    >
      {children}
    </button>
  );
}
