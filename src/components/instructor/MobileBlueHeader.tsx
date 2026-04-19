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
  "linear-gradient(145deg, #1a2744 0%, #233358 50%, #2d4170 100%)";

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
          background: HEADER_GRADIENT,
        }}
      />
      <div
        className="relative overflow-hidden"
        style={{
          background: HEADER_GRADIENT,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          boxShadow: "0 12px 32px -8px rgba(26,39,68,0.45)",
        }}
      >

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

          {/* Centre: DSM logo (transparent) */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <img src={dsmLogo} alt="DSM" className="h-7 w-auto object-contain" />
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

      </div>
    </header>
  );
}
