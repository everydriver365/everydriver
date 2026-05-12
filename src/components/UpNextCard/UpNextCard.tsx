import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, parse, isToday, isTomorrow, differenceInCalendarDays } from "date-fns";
import {
  Phone, MessageSquare, Navigation, Clock, MapPin,
  Sparkles, ChevronDown, ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTrafficETA } from "@/hooks/useTrafficETA";
import { NextUpTile } from "@/components/instructor/NextUpTile";
import { pupilAvatarColor } from "@/lib/pupilAvatarColor";
import { StaticMapPreview } from "./StaticMapPreview";
import { FullscreenMapModal } from "./FullscreenMapModal";

export interface UpNextCardProps {
  lessonId: string;
  pupilId: string;
  pupilName: string;
  pupilProfileImage: string | null;
  pupilPhone: string | null;
  lessonDate: string;
  pickupPostcode: string | null;
  pickupLocation: string | null;
  startTime: string;
  minutesUntil: number;
  accountBalance: number;
  prepaidHours: number;
  durationMinutes?: number;
  instructorId?: string;
  checkInStatus?: string | null;
  lessonStatus?: string | null;
  lastLessonPlan?: string | null;
  /** Optional pre-computed AI-divert start time. When null/undefined the pill is hidden. */
  aiDivertTime?: string | null;
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}
function toSentenceName(name: string): string {
  return name.toLowerCase().split(/\s+/).map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(" ");
}
function formatTime24(time: string): string {
  try { return format(parse(time, "HH:mm:ss", new Date()), "HH:mm"); }
  catch { return (time || "").slice(0, 5); }
}
function formatHoursLong(minutes: number): string {
  const h = minutes / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}
function dayLabel(lessonDate: string): string {
  try { return format(parseISO(lessonDate), "EEE d MMM"); } catch { return ""; }
}
function relativeDayLabel(lessonDate: string): string {
  try {
    const d = parseISO(lessonDate);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    const diff = differenceInCalendarDays(d, new Date());
    if (diff > 0) return `In ${diff} days`;
    return format(d, "EEE d MMM");
  } catch { return ""; }
}
function countdownText(minutesUntil: number, lessonDate: string): string {
  if (minutesUntil <= 0) return "Now";
  if (minutesUntil < 60) return `In ${Math.max(1, Math.round(minutesUntil))} min`;
  try {
    const d = parseISO(lessonDate);
    if (isToday(d)) {
      const hours = Math.round(minutesUntil / 60);
      return hours === 1 ? "In 1 hour" : `In ${hours} hours`;
    }
    if (isTomorrow(d)) return "Tomorrow";
    const days = differenceInCalendarDays(d, new Date());
    return days === 1 ? "Tomorrow" : `In ${days} days`;
  } catch {
    const hours = Math.round(minutesUntil / 60);
    return hours === 1 ? "In 1 hour" : `In ${hours} hours`;
  }
}

export function UpNextCard(props: UpNextCardProps) {
  const {
    pupilId, pupilName, pupilProfileImage, pupilPhone, lessonDate, pickupPostcode, pickupLocation,
    startTime, minutesUntil, durationMinutes = 60, aiDivertTime,
  } = props;

  const [expanded, setExpanded] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const navigate = useNavigate();

  const { durationMinutes: etaMinutes } = useTrafficETA(pickupPostcode);

  const fullName = toSentenceName(pupilName || "");
  const initials = getInitials(pupilName || "");
  const avatarColor = pupilAvatarColor(pupilId || pupilName) || "#CC2229";
  const startLabel = formatTime24(startTime);
  const dayText = dayLabel(lessonDate);
  const relativeDay = relativeDayLabel(lessonDate);
  const countdown = countdownText(minutesUntil, lessonDate);
  const hasDestination = !!pickupPostcode;

  const handleCall = () => { if (pupilPhone) { const a = document.createElement("a"); a.href = `tel:${pupilPhone}`; a.click(); } };
  const handleText = () => { if (pupilPhone) { const a = document.createElement("a"); a.href = `sms:${pupilPhone}`; a.click(); } };
  const handleNavigate = () => {
    if (!pickupPostcode) return;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const dest = encodeURIComponent([pickupLocation, pickupPostcode].filter(Boolean).join(", "));
    if (isIOS) window.open(`maps://maps.apple.com/?daddr=${dest}&dirflg=d`, "_blank");
    else window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`, "_blank");
  };
  const openProfile = () => navigate(`/instructor/pupils/${pupilId}`);
  const openMap = () => setMapOpen(true);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      {/* Section label */}
      <div style={{
        fontSize: 10, fontWeight: 700, color: "#8E8E93",
        letterSpacing: 1.2, textTransform: "uppercase",
        marginBottom: 8, paddingLeft: 2,
      }}>
        Up next
      </div>

      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 20,
          overflow: "hidden",
          width: "100%",
          boxShadow: "0 2px 16px rgba(26,82,160,0.11)",
          border: "0.5px solid rgba(26,82,160,0.09)",
        }}
      >
        {/* ── HEADER BAND — TIME HERO ── */}
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
                  {countdown}{dayText ? ` · ${dayText}` : ""}
                </span>
              </div>
            </div>

            {/* Avatar — right */}
            <button
              type="button"
              onClick={(e) => { stop(e); openProfile(); }}
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
                <img
                  src={pupilProfileImage}
                  alt=""
                  style={{ width: 40, height: 40, objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, color: "#FFF" }}>{initials}</span>
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

        {/* ── MAP STRIP (60px) ── */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`Open full map for lesson at ${pickupLocation || pickupPostcode || "pickup"}`}
          onClick={openMap}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openMap(); } }}
          style={{ position: "relative", height: 60, overflow: "hidden", cursor: "pointer" }}
        >
          <div style={{ position: "absolute", inset: 0 }}>
            <StaticMapPreview hasDestination={hasDestination} height={60} />
          </div>

          {/* ETA pill — top left */}
          <button
            type="button"
            onClick={(e) => { stop(e); handleNavigate(); }}
            disabled={!pickupPostcode}
            style={{
              position: "absolute", top: 7, left: 8,
              backgroundColor: "rgba(255,255,255,0.96)",
              borderRadius: 13, padding: "3px 8px",
              display: "inline-flex", alignItems: "center", gap: 4,
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              border: "none", cursor: pickupPostcode ? "pointer" : "default",
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#1A7A3C" }} />
            <span style={{ fontSize: 8.5, fontWeight: 700, color: "#1A1A1A" }}>
              {etaMinutes > 0 ? `ETA ${etaMinutes}m` : "Tap for ETA"}
            </span>
          </button>

          {/* Navigate button — bottom right */}
          <button
            type="button"
            onClick={(e) => { stop(e); handleNavigate(); }}
            disabled={!pickupPostcode}
            style={{
              position: "absolute", bottom: 5, right: 8,
              backgroundColor: "rgba(26,82,160,0.88)",
              borderRadius: 10, padding: "3px 8px",
              border: "none", cursor: pickupPostcode ? "pointer" : "default",
            }}
          >
            <span style={{ fontSize: 8.5, fontWeight: 700, color: "#FFF" }}>Navigate →</span>
          </button>
        </div>

        {/* ── DETAILS ── */}
        <div style={{ padding: "9px 12px 8px" }}>
          {/* Lesson type row */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6, backgroundColor: "#EEF3FF",
              display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Clock style={{ width: 10, height: 10, color: "#1A52A0" }} strokeWidth={1.8} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#1A1A1A" }}>
              Standard lesson · {formatHoursLong(durationMinutes)}
            </div>
          </div>

          {/* Pick-up address row */}
          {(pickupPostcode || pickupLocation) && (
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
          )}

          {/* AI divert pill */}
          {aiDivertTime && (
            <div style={{
              alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 4,
              backgroundColor: "#F0EEFF", borderRadius: 7,
              padding: "3px 7px", marginBottom: 8,
            }}>
              <Sparkles style={{ width: 8, height: 8, color: "#6B21A8" }} strokeWidth={1.9} />
              <span style={{ fontSize: 8.5, fontWeight: 600, color: "#6B21A8" }}>
                AI divert at {aiDivertTime}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 5 }}>
            <button
              type="button"
              onClick={(e) => { stop(e); handleCall(); }}
              aria-label={pupilPhone ? `Call ${fullName}` : "Call disabled, no phone on file"}
              disabled={!pupilPhone}
              style={{
                flex: 1.3, borderRadius: 9,
                padding: "8px 0",
                backgroundColor: pupilPhone ? "#CC2229" : "#E8B5B7",
                color: "#FFF", border: "none",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3,
                fontSize: 10, fontWeight: 700,
                boxShadow: pupilPhone ? "0 2px 6px rgba(204,34,41,0.28)" : "none",
                cursor: pupilPhone ? "pointer" : "not-allowed",
              }}
            >
              <Phone style={{ width: 10, height: 10 }} strokeWidth={1.8} /> Call
            </button>
            <button
              type="button"
              onClick={(e) => { stop(e); handleText(); }}
              aria-label={`Send text to ${fullName}`}
              disabled={!pupilPhone}
              style={{
                flex: 1, borderRadius: 9,
                padding: "8px 0",
                backgroundColor: "#EEF3FF", color: "#1A52A0", border: "none",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3,
                fontSize: 10, fontWeight: 600,
                cursor: pupilPhone ? "pointer" : "not-allowed",
                opacity: pupilPhone ? 1 : 0.5,
              }}
            >
              <MessageSquare style={{ width: 10, height: 10 }} strokeWidth={1.7} /> Text
            </button>
            <button
              type="button"
              onClick={(e) => { stop(e); handleNavigate(); }}
              aria-label={`Navigate to ${pickupLocation || pickupPostcode || "pickup"}`}
              disabled={!pickupPostcode}
              style={{
                flex: 1, borderRadius: 9,
                padding: "8px 0",
                backgroundColor: "#EEF3FF", color: "#1A52A0", border: "none",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3,
                fontSize: 10, fontWeight: 600,
                cursor: pickupPostcode ? "pointer" : "not-allowed",
                opacity: pickupPostcode ? 1 : 0.5,
              }}
            >
              <Navigation style={{ width: 10, height: 10 }} strokeWidth={1.7} /> Go
            </button>
          </div>
        </div>

        {/* ── EXPAND HANDLE ── */}
        <button
          type="button"
          onClick={(e) => { stop(e); setExpanded(v => !v); }}
          aria-expanded={expanded}
          aria-controls="upnext-detail-panel"
          style={{
            width: "100%", border: "none",
            borderTop: "0.5px solid rgba(0,0,0,0.05)",
            padding: "6px 0", backgroundColor: "#FAFBFD",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3,
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 9, fontWeight: 600, color: "#8E8E93" }}>
            {expanded ? "Hide details" : "Details"}
          </span>
          {expanded
            ? <ChevronUp style={{ width: 8, height: 8, color: "#C7C7CC" }} strokeWidth={2.5} />
            : <ChevronDown style={{ width: 8, height: 8, color: "#C7C7CC" }} strokeWidth={2.5} />}
        </button>

        {/* ── EXPANDED DETAILS — delegate to NextUpTile (preserves all wired logic) ── */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              id="upnext-detail-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ padding: "0 14px 14px", borderTop: "0.5px solid #EEF0F4" }}>
                <NextUpTile {...props} hideHeader forceExpanded />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fullscreen live map */}
      <FullscreenMapModal
        open={mapOpen}
        onOpenChange={setMapOpen}
        postcode={pickupPostcode}
        address={pickupLocation}
        pupilName={fullName}
        whenLabel={countdown}
        onNavigate={handleNavigate}
      />
    </>
  );
}
