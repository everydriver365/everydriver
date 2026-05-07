import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, parse, isToday, isTomorrow } from "date-fns";
import {
  Phone, MessageSquare, Navigation, Calendar, Clock, MapPin,
  Bot, ChevronDown, ChevronUp, ArrowUpRight, Hourglass,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTrafficETA } from "@/hooks/useTrafficETA";
import { NextUpTile } from "@/components/instructor/NextUpTile";
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
}

const BRAND_BLUE = "#1E6FB8";
const TINT_BLUE = "#E8F2FA";
const TEXT_PRIMARY = "#0B1530";
const TEXT_SECONDARY = "#5A6378";
const TEXT_TERTIARY = "#8A93A6";

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
function relativeText(minutesUntil: number, lessonDate: string, startTime: string): string {
  if (minutesUntil <= 0) return "Now";
  if (minutesUntil < 60) return `In ${Math.max(1, Math.round(minutesUntil))} min`;
  try {
    const d = parseISO(lessonDate);
    if (isToday(d) && minutesUntil < 60 * 12) {
      const hours = Math.round(minutesUntil / 60);
      return hours === 1 ? "In 1 hour" : `In ${hours} hours`;
    }
    if (isTomorrow(d)) return `Tomorrow ${formatTime24(startTime)}`;
    return `${format(d, "EEE d MMM")} ${formatTime24(startTime)}`;
  } catch {
    const hours = Math.round(minutesUntil / 60);
    return hours === 1 ? "In 1 hour" : `In ${hours} hours`;
  }
}
function dateChipText(lessonDate: string, startTime: string): string {
  try {
    const d = parseISO(lessonDate);
    const t = formatTime24(startTime);
    if (isToday(d)) return `TODAY · ${t}`;
    if (isTomorrow(d)) return `TOMORROW · ${t}`;
    return `${format(d, "EEE d MMM").toUpperCase()} · ${t}`;
  } catch { return formatTime24(startTime); }
}

export function UpNextCard(props: UpNextCardProps) {
  const {
    pupilId, pupilName, pupilPhone, lessonDate, pickupPostcode, pickupLocation,
    startTime, minutesUntil, durationMinutes = 60,
  } = props;

  const [expanded, setExpanded] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const navigate = useNavigate();

  const { durationMinutes: etaMinutes } = useTrafficETA(pickupPostcode);

  const fullName = toSentenceName(pupilName || "");
  const initials = getInitials(pupilName || "");
  const whenLabel = relativeText(minutesUntil, lessonDate, startTime);
  const driveSuffix = etaMinutes > 0
    ? ` · ${etaMinutes}min drive`
    : (!pickupPostcode ? " · location TBC" : "");
  const statusPillText = `${whenLabel}${driveSuffix}`;
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
        fontSize: 11, fontWeight: 500, letterSpacing: 1.2,
        textTransform: "uppercase", color: TEXT_SECONDARY,
        paddingBottom: 8, paddingLeft: 4,
      }}>
        Up next
      </div>

      <div
        className="bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_28px_-12px_rgba(16,24,40,0.08)]"
        style={{
          borderRadius: 12, overflow: "hidden", width: "100%",
        }}
      >
        {/* ── STATIC MAP PREVIEW (tap → fullscreen modal) ── */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`Open full map for lesson at ${pickupLocation || pickupPostcode || "pickup"}${etaMinutes > 0 ? `, ${etaMinutes} minute drive away` : ""}`}
          onClick={openMap}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openMap(); } }}
          style={{ position: "relative", cursor: "pointer" }}
        >
          <StaticMapPreview hasDestination={hasDestination} height={110} />
          {/* Status pill — top-left */}
          <div
            aria-live="polite"
            style={{
              position: "absolute", top: 8, left: 8,
              background: "#FFFFFF", padding: "4px 9px", borderRadius: 10,
              fontSize: 10, fontWeight: 500, color: TEXT_SECONDARY,
              boxShadow: "0 1px 3px rgba(16,24,40,0.08)",
              maxWidth: "60%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}
          >
            {statusPillText}
          </div>
          {/* Open map pill — bottom-right */}
          <div
            style={{
              position: "absolute", bottom: 8, right: 8,
              background: "#FFFFFF", padding: "3px 8px", borderRadius: 10,
              fontSize: 10, fontWeight: 500, color: BRAND_BLUE,
              display: "inline-flex", alignItems: "center", gap: 4,
              boxShadow: "0 1px 3px rgba(16,24,40,0.08)",
            }}
          >
            Open map <ArrowUpRight style={{ width: 11, height: 11 }} strokeWidth={2.4} />
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ padding: 14 }}>
          {/* Date chip */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: TINT_BLUE, color: BRAND_BLUE,
            padding: "5px 11px", borderRadius: 14,
            fontSize: 11, fontWeight: 500, letterSpacing: 0.5,
            textTransform: "uppercase",
            marginBottom: 10,
          }}>
            <Calendar style={{ width: 12, height: 12 }} strokeWidth={2.4} />
            {dateChipText(lessonDate, startTime)}
          </div>

          {/* Pupil row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
            <button
              type="button"
              onClick={(e) => { stop(e); openProfile(); }}
              aria-label={`View ${fullName}'s profile`}
              style={{
                display: "flex", alignItems: "center", gap: 8, minWidth: 0,
                background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left",
              }}
            >
              <span style={{
                width: 36, height: 36, borderRadius: "50%",
                background: TINT_BLUE, color: BRAND_BLUE,
                fontWeight: 500, fontSize: 12,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {initials}
              </span>
              <span style={{
                fontSize: 17, fontWeight: 500, color: TEXT_PRIMARY,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {fullName}
              </span>
            </button>
            <button
              type="button"
              onClick={(e) => { stop(e); setExpanded(v => !v); }}
              aria-label={expanded ? "Hide lesson details" : "Show more lesson details"}
              aria-expanded={expanded}
              aria-controls="upnext-detail-panel"
              style={{
                background: "transparent", border: "none", padding: 4, cursor: "pointer",
                color: TEXT_TERTIARY, flexShrink: 0,
              }}
            >
              {expanded
                ? <ChevronUp style={{ width: 18, height: 18 }} strokeWidth={2} />
                : <ChevronDown style={{ width: 18, height: 18 }} strokeWidth={2} />}
            </button>
          </div>

          {/* Detail row — duration */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Clock style={{ width: 14, height: 14, color: TEXT_SECONDARY, flexShrink: 0 }} strokeWidth={2} />
            <span style={{ fontSize: 13, color: TEXT_PRIMARY }}>
              Standard lesson · <span style={{ color: BRAND_BLUE, fontWeight: 500 }}>{formatHoursLong(durationMinutes)}</span>
            </span>
          </div>

          {/* Location row */}
          {(pickupPostcode || pickupLocation) && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, minWidth: 0 }}>
              <MapPin style={{ width: 14, height: 14, color: TEXT_SECONDARY, flexShrink: 0 }} strokeWidth={2} />
              <span style={{
                fontSize: 13, color: TEXT_PRIMARY,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0,
              }}>
                {pickupPostcode && <span style={{ fontWeight: 500 }}>{pickupPostcode}</span>}
                {pickupPostcode && pickupLocation ? " · " : ""}
                {pickupLocation || (!pickupPostcode ? "Location TBC" : "")}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={(e) => { stop(e); handleCall(); }}
              aria-label={pupilPhone ? `Call ${fullName} at ${pupilPhone}` : "Call disabled, no phone on file"}
              disabled={!pupilPhone}
              title={!pupilPhone ? "No phone number on file" : undefined}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 20,
                background: pupilPhone ? BRAND_BLUE : "#B5D4F4",
                color: pupilPhone ? "#FFFFFF" : TEXT_TERTIARY,
                border: "none",
                fontSize: 13, fontWeight: 500,
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                cursor: pupilPhone ? "pointer" : "not-allowed",
              }}
            >
              <Phone style={{ width: 13, height: 13 }} strokeWidth={2.2} /> Call
            </button>
            <button
              type="button"
              onClick={(e) => { stop(e); handleText(); }}
              aria-label={`Send text to ${fullName}`}
              disabled={!pupilPhone}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 20,
                background: TINT_BLUE, color: BRAND_BLUE, border: "none",
                fontSize: 13, fontWeight: 500,
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                cursor: pupilPhone ? "pointer" : "not-allowed",
                opacity: pupilPhone ? 1 : 0.5,
              }}
            >
              <MessageSquare style={{ width: 13, height: 13 }} strokeWidth={2.2} /> Text
            </button>
            <button
              type="button"
              onClick={(e) => { stop(e); handleNavigate(); }}
              aria-label={`Get directions to ${pickupLocation || pickupPostcode || "pickup"}`}
              disabled={!pickupPostcode}
              title={!pickupPostcode ? "No address on file" : undefined}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 20,
                background: TINT_BLUE, color: BRAND_BLUE, border: "none",
                fontSize: 13, fontWeight: 500,
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                cursor: pickupPostcode ? "pointer" : "not-allowed",
                opacity: pickupPostcode ? 1 : 0.5,
              }}
            >
              <Navigation style={{ width: 13, height: 13 }} strokeWidth={2.2} /> Go
            </button>
          </div>
        </div>

        {/* ── EXPANDED DETAILS — delegate to existing NextUpTile (hideHeader, forceExpanded)
            Preserves all existing data, deep links, AI divert, late detection, realtime, etc. */}
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
        whenLabel={whenLabel}
        onNavigate={handleNavigate}
      />
    </>
  );
}
