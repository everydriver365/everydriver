import { useNavigate } from "react-router-dom";
import { Bell, Plus, Menu, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import dsmLogo from "@/assets/dsm-logo.png";
import { useTodayOverview } from "@/hooks/useTodayOverview";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";

interface Props {
  instructorId: string | undefined;
  firstName: string;
  profileImageUrl?: string | null;
  isOnline?: boolean;
  showBackButton?: boolean;
  showGreeting?: boolean;
  onBack?: () => void;
  onSOS: () => void;
  onPlus: () => void;
  onMenu: () => void;
}

const HEADER_GRADIENT =
  "linear-gradient(145deg, #007AFF 0%, #3395FF 50%, #66B2FF 100%)";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
};

function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const size = 56;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(completed / total, 1) : 0;
  const offset = c * (1 - pct);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {completed}
        </span>
        <span style={{ fontSize: 8, opacity: 0.85, marginTop: 1 }}>of {total || 0}</span>
      </div>
    </div>
  );
}

export function MobileBlueHeader({
  instructorId,
  firstName,
  profileImageUrl,
  isOnline = true,
  showBackButton = false,
  showGreeting = true,
  onBack,
  onSOS,
  onPlus,
  onMenu,
}: Props) {
  const navigate = useNavigate();
  const { data: overview } = useTodayOverview(instructorId);
  const { total: notifCount } = useCombinedNotificationCount(instructorId);

  const todayCompleted = overview?.completedCount ?? 0;
  const todayTotal = overview?.lessonCount ?? 0;
  const dateBadge = `TODAY · ${format(new Date(), "d MMMM yyyy")}`;

  return (
    <header className="sticky top-0 z-40">
      {/* Safe area fill (matches gradient) */}
      <div
        style={{
          paddingTop: "env(safe-area-inset-top)",
          background: "#007AFF",
        }}
      />
      <div
        className="relative overflow-hidden"
        style={{
          background: HEADER_GRADIENT,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          boxShadow: "0 12px 32px -8px rgba(0,122,255,0.45)",
        }}
      >
        {/* Decorative translucent circles */}
        <div
          aria-hidden
          className="absolute pointer-events-none rounded-full"
          style={{
            top: -60,
            right: -40,
            width: 180,
            height: 180,
            background: "rgba(255,255,255,0.12)",
          }}
        />
        <div
          aria-hidden
          className="absolute pointer-events-none rounded-full"
          style={{
            top: 18,
            right: 90,
            width: 60,
            height: 60,
            background: "rgba(255,255,255,0.10)",
          }}
        />
        <div
          aria-hidden
          className="absolute pointer-events-none rounded-full"
          style={{
            bottom: -40,
            left: -30,
            width: 140,
            height: 140,
            background: "rgba(255,255,255,0.08)",
          }}
        />

        {/* Top nav row */}
        <div className="relative flex items-center justify-between px-4 py-[10px]">
          {/* Left: bell or back */}
          <div className="flex items-center">
            {showBackButton ? (
              <button
                onClick={onBack}
                className="h-9 w-9 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "0.5px solid rgba(255,255,255,0.35)",
                }}
              >
                <ChevronLeft className="h-5 w-5 text-white" strokeWidth={2.4} />
              </button>
            ) : (
              <button
                onClick={() => navigate("/instructor/notifications")}
                className="relative h-9 px-3 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "0.5px solid rgba(255,255,255,0.35)",
                }}
                aria-label="Notifications"
              >
                <Bell className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
                {notifCount > 0 && (
                  <span
                    className="absolute flex items-center justify-center"
                    style={{
                      top: -3,
                      right: -3,
                      minWidth: 18,
                      height: 18,
                      padding: "0 5px",
                      borderRadius: 9,
                      background: "#ff3b30",
                      color: "white",
                      fontSize: 10,
                      fontWeight: 700,
                      border: "1.5px solid #1F86FF",
                    }}
                  >
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Centre: DSM logo on white pill */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <div
              className="flex items-center justify-center"
              style={{
                background: "#FFFFFF",
                borderRadius: 999,
                padding: "5px 14px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              }}
            >
              <img src={dsmLogo} alt="DSM" className="h-6 w-auto object-contain" />
            </div>
          </div>

          {/* Right: SOS, +, menu */}
          <div className="flex items-center gap-[10px]">
            <button
              onClick={onSOS}
              className="flex items-center justify-center"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "#ff3b30",
                boxShadow: "0 2px 10px rgba(255,59,48,0.5)",
                border: "1.5px solid rgba(255,255,255,0.5)",
              }}
              aria-label="SOS"
            >
              <span className="text-[10px] font-extrabold text-white leading-none">SOS</span>
            </button>
            <button
              onClick={onPlus}
              className="flex items-center justify-center"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.22)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "0.5px solid rgba(255,255,255,0.4)",
              }}
              aria-label="Quick Actions"
            >
              <Plus className="h-[18px] w-[18px] text-white" strokeWidth={2.6} />
            </button>
            <button
              onClick={onMenu}
              className="flex items-center justify-center"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "0.5px solid rgba(255,255,255,0.35)",
              }}
              aria-label="Menu"
            >
              <Menu className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* Greeting + avatar (home only) */}
        {showGreeting && (
          <div className="relative px-5 pt-2 pb-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1
                className="text-white truncate"
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                  fontFamily: "-apple-system, 'SF Pro Display', sans-serif",
                  textShadow: "0 1px 2px rgba(0,0,0,0.08)",
                }}
              >
                {getGreeting()}, {firstName}
              </h1>
              <div
                className="inline-flex items-center gap-2 mt-2"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "0.5px solid rgba(255,255,255,0.32)",
                  padding: "5px 11px",
                  borderRadius: 999,
                }}
              >
                <span
                  className="rounded-full"
                  style={{
                    width: 7,
                    height: 7,
                    background: isOnline ? "#34C759" : "#8E8E93",
                    boxShadow: isOnline ? "0 0 6px rgba(52,199,89,0.7)" : undefined,
                  }}
                />
                <span
                  className="text-white"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: 0.4,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {dateBadge}
                </span>
              </div>
            </div>

            {/* Avatar */}
            <div
              className="shrink-0 overflow-hidden"
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.85)",
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              {profileImageUrl ? (
                <img src={profileImageUrl} alt={firstName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white" style={{ fontSize: 18, fontWeight: 700 }}>
                  {firstName.charAt(0)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lessons Today frosted card (home only) */}
        {showGreeting && (
          <div className="relative px-4 pb-5">
            <button
              onClick={() => navigate("/instructor/schedule")}
              className="w-full text-left flex items-center gap-3"
              style={{
                background: "rgba(255,255,255,0.20)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: 18,
                padding: "12px 14px",
                boxShadow: "0 6px 18px -6px rgba(0,0,0,0.18)",
              }}
            >
              <ProgressRing completed={todayCompleted} total={todayTotal} />
              <div className="flex-1 min-w-0">
                <p
                  className="text-white"
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    fontFamily: "-apple-system, 'SF Pro Display', sans-serif",
                  }}
                >
                  Lessons Today
                </p>
                <p
                  className="text-white"
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    opacity: 0.92,
                    marginTop: 2,
                  }}
                >
                  {todayTotal === 0
                    ? "No lessons scheduled"
                    : todayCompleted === todayTotal
                    ? "All done — great job! 🎉"
                    : `${todayCompleted} done · ${todayTotal - todayCompleted} to go`}
                </p>
              </div>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
