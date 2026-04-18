import { format, parse } from "date-fns";
import { Navigation, Phone, MessageSquare, MapPin, Clock, Calendar } from "lucide-react";

interface NextLessonHeroCardProps {
  pupilName: string;
  pupilProfileImage?: string | null;
  pupilPhone?: string | null;
  startTime: string; // "HH:mm:ss"
  lessonDate: string; // "yyyy-MM-dd"
  durationMinutes: number;
  daysUntil?: number;
  accountBalance: number;
  pickupLocation?: string | null;
  pickupPostcode?: string | null;
  etaMinutes?: number;
  etaMiles?: number;
  onNavigate?: () => void;
  onCall?: () => void;
  onSms?: () => void;
  onArrived?: () => void;
}

export function NextLessonHeroCard({
  pupilName,
  pupilProfileImage,
  pupilPhone,
  startTime,
  lessonDate,
  durationMinutes,
  daysUntil,
  accountBalance,
  pickupLocation,
  pickupPostcode,
  etaMinutes = 2,
  etaMiles = 0.8,
  onNavigate,
  onCall,
  onSms,
  onArrived,
}: NextLessonHeroCardProps) {
  const timeFormatted = (() => {
    try {
      return format(parse(startTime, "HH:mm:ss", new Date()), "HH:mm");
    } catch {
      return startTime?.slice(0, 5) ?? "--:--";
    }
  })();

  const dateFormatted = (() => {
    try {
      return format(new Date(lessonDate), "EEE d MMM");
    } catch {
      return lessonDate;
    }
  })();

  const lessonHours = durationMinutes / 60;
  const lessonHoursLabel = Number.isInteger(lessonHours)
    ? `${lessonHours}h lesson`
    : `${lessonHours.toFixed(1)}h lesson`;

  const fullAddress = [pickupLocation, pickupPostcode].filter(Boolean).join(", ");

  const handleCall = () => {
    if (onCall) return onCall();
    if (pupilPhone) window.location.href = `tel:${pupilPhone}`;
  };
  const handleSms = () => {
    if (onSms) return onSms();
    if (pupilPhone) window.location.href = `sms:${pupilPhone}`;
  };

  return (
    <div
      className="w-full max-w-[400px] mx-auto bg-white overflow-hidden font-sans"
      style={{
        borderRadius: 20,
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 16px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
      }}
    >
      {/* 1. MAP PREVIEW */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: 120,
          background: "#eef4fb",
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.18) 1px, transparent 1px), repeating-linear-gradient(45deg, rgba(148,163,184,0.06) 0 2px, transparent 2px 8px)",
          backgroundSize: "20px 20px, 20px 20px, auto",
        }}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M -20 95 Q 80 80 160 90 T 420 70" stroke="#ffffff" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M 50 -10 Q 70 40 90 70 T 130 130" stroke="#ffffff" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M 250 -10 Q 240 40 270 70 T 320 130" stroke="#ffffff" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M -20 40 Q 100 30 200 45 T 420 30" stroke="#ffffff" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M 180 -10 Q 200 50 220 120" stroke="#ffffff" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path
            d="M 30 100 Q 120 90 200 70 T 370 25"
            stroke="#3b82f6"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 30 100 Q 120 90 200 70 T 370 25"
            stroke="#93c5fd"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="4 6"
            opacity="0.9"
          />
        </svg>

        {/* Start marker */}
        <div
          className="absolute"
          style={{
            left: "calc(7.5% - 7px)",
            top: "calc(83.3% - 7px)",
            width: 14,
            height: 14,
            background: "#ffffff",
            border: "2px solid #3b82f6",
            borderRadius: "50%",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        >
          <div style={{ position: "absolute", inset: 3, background: "#3b82f6", borderRadius: "50%" }} />
        </div>

        {/* End marker */}
        <div className="absolute" style={{ left: "calc(92.5% - 10px)", top: "calc(20.8% - 22px)" }}>
          <svg width="20" height="26" viewBox="0 0 20 26" fill="none" aria-hidden="true">
            <path
              d="M10 0C4.477 0 0 4.477 0 10c0 7 10 16 10 16s10-9 10-16c0-5.523-4.477-10-10-10z"
              fill="#ef4444"
              style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.25))" }}
            />
            <circle cx="10" cy="10" r="3.5" fill="#ffffff" />
          </svg>
        </div>

        {/* ETA pill */}
        <div
          className="absolute"
          style={{
            left: "50%",
            top: "55%",
            transform: "translate(-50%, -50%)",
            background: "#ffffff",
            border: "1px solid rgba(15,23,42,0.06)",
            boxShadow: "0 2px 6px rgba(15,23,42,0.12)",
            borderRadius: 999,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 700,
            color: "#2563eb",
            whiteSpace: "nowrap",
          }}
        >
          {etaMinutes} min · {etaMiles}mi
        </div>

        {/* Top-left chip */}
        <div
          className="absolute flex items-center gap-2"
          style={{
            top: 8,
            left: 8,
            background: "rgba(30, 42, 61, 0.92)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: 999,
            padding: "5px 10px",
          }}
        >
          <span
            className="nlhc-pulse-green"
            style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }}
          />
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#9ca3af",
            }}
          >
            Next Lesson
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", lineHeight: 1 }}>{timeFormatted}</span>
        </div>

        {/* Top-right chip */}
        <div
          className="absolute flex items-center gap-1.5"
          style={{
            top: 8,
            right: 8,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            borderRadius: 999,
            padding: "4px 9px",
          }}
        >
          <span
            className="nlhc-blink-red"
            style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", display: "inline-block" }}
          />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#1e2a3d" }}>Tracking</span>
        </div>
      </div>

      {/* 2. PUPIL HERO ROW */}
      <div style={{ padding: "20px 16px 12px", marginTop: -10 }} className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div
            style={{
              position: "absolute",
              inset: -5,
              borderRadius: "50%",
              border: "2px solid #10b981",
              opacity: 0.8,
            }}
          />
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              border: "3px solid #ffffff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              overflow: "hidden",
              background: "#fde7d3",
            }}
          >
            {pupilProfileImage ? (
              <img src={pupilProfileImage} alt={pupilName} className="w-full h-full object-cover" />
            ) : (
              <svg viewBox="0 0 52 52" width="52" height="52" aria-hidden="true">
                <rect width="52" height="52" fill="#fde7d3" />
                <path d="M10 22c0-9 7-16 16-16s16 7 16 16v6H10v-6z" fill="#3b2417" />
                <ellipse cx="26" cy="28" rx="13" ry="14" fill="#f5c9a3" />
                <path d="M13 22c2-6 7-10 13-10s11 4 13 10c-3-2-6-3-9-3-3 2-9 4-17 3z" fill="#2a1810" />
                <ellipse cx="21" cy="27" rx="1.4" ry="1.6" fill="#1a1a1a" />
                <ellipse cx="31" cy="27" rx="1.4" ry="1.6" fill="#1a1a1a" />
                <path d="M26 30 Q25 33 26.5 34" stroke="#c89678" strokeWidth="1" fill="none" strokeLinecap="round" />
                <path d="M22 36 Q26 39 30 36" stroke="#8b4a3a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                <path d="M8 52 Q8 44 18 42 L26 48 L34 42 Q44 44 44 52 Z" fill="#2563eb" />
                <path d="M22 42 L26 48 L30 42 L26 46 Z" fill="#ffffff" />
              </svg>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className="truncate"
            style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.2px", lineHeight: 1.2 }}
          >
            {pupilName}
          </h3>
          <div className="flex flex-wrap items-center mt-1.5" style={{ gap: 5 }}>
            <span
              className="inline-flex items-center"
              style={{
                gap: 3,
                background: "#f3f4f6",
                color: "#4b5563",
                fontSize: 10,
                fontWeight: 600,
                borderRadius: 10,
                padding: "3px 8px",
              }}
            >
              <Clock size={11} />
              {lessonHoursLabel}
            </span>
            <span
              className="inline-flex items-center"
              style={{
                gap: 3,
                background: "#f3f4f6",
                color: "#4b5563",
                fontSize: 10,
                fontWeight: 600,
                borderRadius: 10,
                padding: "3px 8px",
              }}
            >
              <Calendar size={11} />
              {dateFormatted}
            </span>
            {typeof daysUntil === "number" && (
              <span
                style={{
                  background: "#fef3c7",
                  color: "#92400e",
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 10,
                  padding: "3px 8px",
                }}
              >
                {daysUntil} days
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. BALANCE STRIP */}
      <div
        className="flex items-center justify-between"
        style={{
          margin: "0 16px 10px",
          padding: "7px 12px",
          borderRadius: 10,
          background: "linear-gradient(90deg, #ecfdf5, #f0fdf4)",
          border: "1px solid #d1fae5",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#065f46",
            }}
          >
            Account Balance
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#047857", lineHeight: 1.2 }}>
            £{accountBalance.toFixed(2)}
          </div>
        </div>
        <svg width="48" height="20" viewBox="0 0 48 20" aria-hidden="true">
          <defs>
            <linearGradient id="nlhc-spark-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 16 L8 14 L16 15 L24 10 L32 11 L40 6 L48 3 L48 20 L0 20 Z" fill="url(#nlhc-spark-fill)" />
          <path
            d="M0 16 L8 14 L16 15 L24 10 L32 11 L40 6 L48 3"
            stroke="#10b981"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* 4. PICK-UP ADDRESS */}
      <div
        className="flex items-center gap-3"
        style={{ margin: "0 16px 14px", padding: 12, background: "#f8fafc", borderRadius: 12 }}
      >
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#ef4444",
            boxShadow: "0 2px 6px rgba(239,68,68,0.35)",
          }}
        >
          <MapPin size={18} color="#ffffff" strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#9ca3af",
            }}
          >
            Pick-up Address
          </div>
          <div
            className="truncate"
            style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", lineHeight: 1.3 }}
          >
            {fullAddress || "Address not set"}
          </div>
        </div>
      </div>

      {/* 5. ACTION BUTTONS */}
      <div className="grid grid-cols-4" style={{ gap: 8, padding: "0 16px 16px" }}>
        <NlhcActionButton variant="primary" icon={<Navigation size={18} />} label="Navigate" onClick={onNavigate} />
        <NlhcActionButton variant="white" icon={<Phone size={18} />} label="Call" onClick={handleCall} />
        <NlhcActionButton variant="white" icon={<MessageSquare size={18} />} label="SMS" onClick={handleSms} />
        <NlhcActionButton variant="dark" icon={<MapPin size={18} />} label="I'm Here" onClick={onArrived} />
      </div>

      <style>{`
        @keyframes nlhc-pulse-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.7); transform: scale(1); }
          70% { box-shadow: 0 0 0 6px rgba(16,185,129,0); transform: scale(1.05); }
        }
        .nlhc-pulse-green { animation: nlhc-pulse-green 1.6s ease-out infinite; }
        @keyframes nlhc-blink-red {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .nlhc-blink-red { animation: nlhc-blink-red 1.2s ease-in-out infinite; }
        .nlhc-btn { transition: filter 0.15s ease, transform 0.1s ease; }
        .nlhc-btn:hover { filter: brightness(1.06); }
        .nlhc-btn:active { transform: scale(0.97); }
      `}</style>
    </div>
  );
}

function NlhcActionButton({
  variant,
  icon,
  label,
  onClick,
}: {
  variant: "primary" | "white" | "dark";
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
      color: "#ffffff",
      boxShadow: "0 4px 10px rgba(37,99,235,0.35)",
      border: "none",
    },
    white: {
      background: "#ffffff",
      color: "#1e2a3d",
      border: "1px solid #e5e7eb",
    },
    dark: {
      background: "#1e2a3d",
      color: "#ffffff",
      border: "none",
    },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="nlhc-btn flex flex-col items-center justify-center"
      style={{ minHeight: 60, borderRadius: 12, gap: 4, ...styles[variant] }}
    >
      {icon}
      <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
    </button>
  );
}
