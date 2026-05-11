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
          boxShadow: "0 2px 18px rgba(26,82,160,0.13)",
          border: "0.5px solid rgba(26,82,160,0.1)",
        }}
      >
        {/* ── HEADER BAND ── */}
        <div style={{
          backgroundColor: "#F0F5FF",
          padding: "12px 13px",
          borderBottom: "0.5px solid rgba(26,82,160,0.07)",
          display: "flex", alignItems: "center", gap: 9,
        }}>
          {/* Avatar */}
          <button
            type="button"
            onClick={(e) => { stop(e); openProfile(); }}
            aria-label={`View ${fullName}'s profile`}
            style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: avatarColor,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              boxShadow: `0 2px 6px ${avatarColor}38`,
              border: "2px solid rgba(255,255,255,0.6)",
              padding: 0, cursor: "pointer", overflow: "hidden",
            }}
          >
            {pupilProfileImage ? (
              <img
                src={pupilProfileImage}
                alt=""
                style={{ width: 38, height: 38, borderRadius: 19, objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: 12, fontWeight: 700, color: "#FFF" }}>{initials}</span>
            )}
          </button>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 700, color: "#1A1A1A", letterSpacing: -0.3,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {fullName}
            </div>
            <div style={{ fontSize: 9, color: "#8E8E93", marginTop: 2, fontWeight: 500 }}>
              {dayText}{dayText && relativeDay ? " · " : ""}{relativeDay}
            </div>
          </div>

          {/* Time + countdown */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1A52A0", letterSpacing: -0.6, lineHeight: "22px" }}>
              {startLabel}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 3 }}>
              <span style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#CC2229" }} />
              <span style={{ fontSize: 9, color: "#8E8E93", fontWeight: 500 }}>{countdown}</span>
            </div>
          </div>
        </div>

        {/* ── MAP STRIP (72px) ── */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`Open full map for lesson at ${pickupLocation || pickupPostcode || "pickup"}`}
          onClick={openMap}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openMap(); } }}
          style={{ position: "relative", height: 72, overflow: "hidden", cursor: "pointer" }}
        >
          <div style={{ position: "absolute", inset: 0 }}>
            <StaticMapPreview hasDestination={hasDestination} height={72} />
          </div>

          {/* ETA pill — top left */}
          <button
            type="button"
            onClick={(e) => { stop(e); handleNavigate(); }}
            disabled={!pickupPostcode}
            style={{
              position: "absolute", top: 8, left: 10,
              backgroundColor: "rgba(255,255,255,0.96)",
              borderRadius: 16, padding: "4px 10px",
              display: "inline-flex", alignItems: "center", gap: 5,
              boxShadow: "0 1px 5px rgba(0,0,0,0.1)",
              border: "none", cursor: pickupPostcode ? "pointer" : "default",
            }}
          >
            <MapPin style={{ width: 9, height: 9, color: "#1A52A0" }} strokeWidth={2} />
            <span style={{ fontSize: 9.5, fontWeight: 700, color: "#1A1A1A" }}>
              {etaMinutes > 0 ? `ETA ${etaMinutes}m` : "Tap for ETA"}
            </span>
          </button>

          {/* Navigate button — bottom right */}
          <button
            type="button"
            onClick={(e) => { stop(e); handleNavigate(); }}
            disabled={!pickupPostcode}
            style={{
              position: "absolute", bottom: 7, right: 10,
              backgroundColor: "rgba(26,82,160,0.9)",
              borderRadius: 12, padding: "3px 8px",
              border: "none", cursor: pickupPostcode ? "pointer" : "default",
            }}
          >
            <span style={{ fontSize: 8.5, fontWeight: 600, color: "#FFF" }}>Navigate →</span>
          </button>
        </div>

        {/* ── DETAILS ── */}
        <div style={{ padding: "10px 12px 9px" }}>
          {/* Lesson type row */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
            <div style={{
              width: 23, height: 23, borderRadius: 6, backgroundColor: "#EEF3FF",
              display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Clock style={{ width: 11, height: 11, color: "#1A52A0" }} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1A1A1A" }}>
                Standard lesson · {formatHoursLong(durationMinutes)}
              </div>
            </div>
          </div>

          {/* Pick-up address row */}
          {(pickupPostcode || pickupLocation) && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 7 }}>
              <div style={{
                width: 23, height: 23, borderRadius: 6, backgroundColor: "#EEF3FF",
                display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
              }}>
                <MapPin style={{ width: 11, height: 11, color: "#1A52A0" }} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 11.5, fontWeight: 700, color: "#1A1A1A",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {pickupPostcode}
                  {pickupPostcode && pickupLocation ? " · " : ""}
                  {pickupLocation || (!pickupPostcode ? "Location TBC" : "")}
                </div>
                <div style={{ fontSize: 9, color: "#1A52A0", marginTop: 1, fontWeight: 500 }}>Pick-up</div>
              </div>
            </div>
          )}

          {/* AI divert pill */}
          {aiDivertTime && (
            <div style={{
              alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 4,
              backgroundColor: "#F0EEFF", borderRadius: 7,
              padding: "3px 8px", marginBottom: 7,
            }}>
              <Sparkles style={{ width: 9, height: 9, color: "#6B21A8" }} strokeWidth={1.9} />
              <span style={{ fontSize: 9, fontWeight: 600, color: "#6B21A8" }}>
                Call divert starts at {aiDivertTime}
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
                flex: 1.3, padding: "8px 0", borderRadius: 10,
                backgroundColor: pupilPhone ? "#CC2229" : "#E8B5B7",
                color: "#FFF", border: "none",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
                fontSize: 10.5, fontWeight: 700,
                boxShadow: pupilPhone ? "0 2px 6px rgba(204,34,41,0.28)" : "none",
                cursor: pupilPhone ? "pointer" : "not-allowed",
              }}
            >
              <Phone style={{ width: 11, height: 11 }} strokeWidth={1.8} /> Call
            </button>
            <button
              type="button"
              onClick={(e) => { stop(e); handleText(); }}
              aria-label={`Send text to ${fullName}`}
              disabled={!pupilPhone}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 10,
                backgroundColor: "#EEF3FF", color: "#1A52A0", border: "none",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3,
                fontSize: 10.5, fontWeight: 600,
                cursor: pupilPhone ? "pointer" : "not-allowed",
                opacity: pupilPhone ? 1 : 0.5,
              }}
            >
              <MessageSquare style={{ width: 11, height: 11 }} strokeWidth={1.7} /> Text
            </button>
            <button
              type="button"
              onClick={(e) => { stop(e); handleNavigate(); }}
              aria-label={`Navigate to ${pickupLocation || pickupPostcode || "pickup"}`}
              disabled={!pickupPostcode}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 10,
                backgroundColor: "#EEF3FF", color: "#1A52A0", border: "none",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3,
                fontSize: 10.5, fontWeight: 600,
                cursor: pickupPostcode ? "pointer" : "not-allowed",
                opacity: pickupPostcode ? 1 : 0.5,
              }}
            >
              <Navigation style={{ width: 11, height: 11 }} strokeWidth={1.7} /> Go
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
            padding: "7px 0", backgroundColor: "#FAFBFD",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3,
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 9.5, fontWeight: 600, color: "#8E8E93" }}>
            {expanded ? "Hide details" : "Details"}
          </span>
          {expanded
            ? <ChevronUp style={{ width: 9, height: 9, color: "#C7C7CC" }} strokeWidth={2.5} />
            : <ChevronDown style={{ width: 9, height: 9, color: "#C7C7CC" }} strokeWidth={2.5} />}
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
