import { useNavigate } from "react-router-dom";
import {
  Navigation as NavIcon,
  Clock,
  CreditCard,
  FileText,
} from "lucide-react";
import { useTrafficETA } from "@/hooks/useTrafficETA";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* Brand tokens */
const RED = "#CC2229";
const BLUE = "#1A52A0";
const CHARCOAL = "#1A1A1A";
const MUTED = "#8E8E93";
const ROW_BORDER = "#F0F3F8";
const BLUE_TINT = "#EEF3FF";
const GREEN_TINT = "#E8F8ED";
const GREEN = "#1A7A3C";
const RED_TINT = "#FFF0F0";
const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';

interface Props {
  lessonId: string;
  pupilId: string;
  pupilName: string;
  pupilPhone: string | null;
  pickupLocation: string | null;
  pickupPostcode: string | null;
  pickupWhat3words?: string | null;
  pickupNotes?: string | null;
  startTime: string;
  durationMinutes: number;
  accountBalance: number;
  prepaidHours: number;
  checkInStatus: string | null;
  lessonStatus: string | null;
  lastLessonPlan: string | null;
  instructorId: string;
}

function IconTile({
  bg,
  color,
  children,
  align = "center",
}: {
  bg: string;
  color: string;
  children: React.ReactNode;
  align?: "center" | "start";
}) {
  return (
    <span
      style={{
        width: 23,
        height: 23,
        borderRadius: 6,
        background: bg,
        color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: align === "start" ? 1 : 0,
      }}
    >
      {children}
    </span>
  );
}

function Divider() {
  return <div style={{ height: 0.5, background: ROW_BORDER, marginBottom: 8 }} />;
}

export function UpNextExpanded({
  lessonId,
  pupilId,
  pupilName,
  pupilPhone,
  pickupLocation,
  pickupPostcode,
  pickupWhat3words,
  pickupNotes,
  startTime,
  durationMinutes,
  accountBalance,
  prepaidHours,
  checkInStatus,
  lessonStatus,
  lastLessonPlan,
  instructorId,
}: Props) {
  const navigate = useNavigate();
  const eta = useTrafficETA(pickupPostcode);

  const fullAddress = [pickupLocation, pickupPostcode].filter(Boolean).join(", ");
  const lessonFee = (durationMinutes / 60) * 40;
  const debt = accountBalance < 0 ? Math.abs(accountBalance) : 0;
  const isPaid = debt === 0 || prepaidHours > 0;
  const firstName = (pupilName || "").split(/\s+/)[0] || "there";
  const durationLabel =
    durationMinutes >= 60 && durationMinutes % 60 === 0
      ? `${durationMinutes / 60}h`
      : `${durationMinutes}m`;
  const lessonType = "Standard lesson";

  const navigateMap = () => {
    const q = encodeURIComponent(fullAddress);
    if (q) window.open(`https://www.google.com/maps/dir/?api=1&destination=${q}`, "_blank");
  };

  const sendSMS = (msg: string) => {
    if (!pupilPhone) return;
    const a = document.createElement("a");
    a.href = `sms:${pupilPhone}?body=${encodeURIComponent(msg)}`;
    a.click();
  };

  const chasePayment = () => {
    supabase.functions
      .invoke("notify-pupil", { body: { pupilId, type: "payment_reminder" } })
      .catch(() => {});
    sendSMS(
      `Hi ${firstName}, just a quick reminder there's £${debt.toFixed(0)} outstanding on your lesson account. Thanks!`,
    );
    toast.success("Payment reminder sent");
  };

  return (
    <div
      style={{
        padding: "11px 14px 0",
        fontFamily: FONT,
        animation: "upnext-fade 200ms ease-out",
      }}
    >
      <style>{`
        @keyframes upnext-fade { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ROW 1 — Lesson type + fee */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <IconTile bg={BLUE_TINT} color={BLUE}>
          <Clock size={11} strokeWidth={1.8} />
        </IconTile>
        <div style={{ fontSize: 11.5, flex: 1, lineHeight: 1.3 }}>
          <span style={{ fontWeight: 700, color: CHARCOAL }}>{lessonType}</span>
          <span style={{ fontWeight: 500, color: MUTED }}>
            {" · "}
            {durationLabel}
            {" · £"}
            {lessonFee.toFixed(0)}
          </span>
        </div>
      </div>

      <Divider />

      {/* ROW 2 — Address + ETA + Nav */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <IconTile bg={BLUE_TINT} color={BLUE} align="start">
          <NavIcon size={11} strokeWidth={1.8} />
        </IconTile>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: CHARCOAL,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {[pickupPostcode, pickupLocation].filter(Boolean).join(" · ") || "Pick-up not set"}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 2,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: BLUE,
                letterSpacing: 0.2,
              }}
            >
              Pick-up
            </span>
            <span
              style={{
                width: 3,
                height: 3,
                borderRadius: 2,
                background: "#D0D5DD",
              }}
            />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  background: GREEN,
                }}
              />
              <span style={{ fontSize: 9, color: MUTED }}>
                {eta.isLoading
                  ? "Checking ETA…"
                  : eta.durationMinutes
                    ? `ETA ${eta.durationMinutes}m`
                    : "ETA unavailable"}
              </span>
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={navigateMap}
          style={{
            background: BLUE_TINT,
            border: "none",
            borderRadius: 9,
            padding: "5px 9px",
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          <NavIcon size={10} color={BLUE} strokeWidth={1.8} />
          <span style={{ fontSize: 9.5, fontWeight: 600, color: BLUE }}>Nav</span>
        </button>
      </div>

      <Divider />

      {/* ROW 3 — Payment status + Remind */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <IconTile bg={isPaid ? GREEN_TINT : RED_TINT} color={isPaid ? GREEN : RED}>
          <CreditCard size={11} strokeWidth={1.8} />
        </IconTile>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: CHARCOAL }}>Payment</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              background: isPaid ? GREEN_TINT : RED_TINT,
              borderRadius: 20,
              padding: "2px 7px",
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: 3,
                background: isPaid ? GREEN : RED,
              }}
            />
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: isPaid ? GREEN : RED,
              }}
            >
              {isPaid ? "Paid" : `£${debt.toFixed(0)} not paid`}
            </span>
          </span>
        </div>
        {!isPaid && (
          <button
            type="button"
            onClick={chasePayment}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              fontSize: 9,
              fontWeight: 600,
              color: BLUE,
              cursor: "pointer",
            }}
          >
            Remind →
          </button>
        )}
      </div>

      {/* ROW 4 — Pupil notes (conditional) */}
      {pickupNotes && pickupNotes.trim() && (
        <>
          <Divider />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
            <IconTile bg={BLUE_TINT} color={BLUE} align="start">
              <FileText size={11} strokeWidth={1.8} />
            </IconTile>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: CHARCOAL,
                  marginBottom: 2,
                }}
              >
                Pupil notes
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: MUTED,
                  lineHeight: 1.4,
                  whiteSpace: "pre-wrap",
                }}
              >
                {pickupNotes}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
