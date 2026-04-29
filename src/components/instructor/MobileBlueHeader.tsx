import { useNavigate } from "react-router-dom";
import { Bell, Plus, Menu, ChevronLeft } from "lucide-react";
import dsmLogo from "@/assets/dsm-logo.png";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { DSMThemeToggle } from "@/components/instructor/DSMThemeToggle";

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

const ICON_COLOR = "hsl(var(--dsm-text-secondary))";

export function MobileBlueHeader({
  instructorId,
  firstName,
  profileImageUrl,
  showBackButton = false,
  onBack,
  onPlus,
  onMenu,
}: Props) {
  const navigate = useNavigate();
  const { total: notifCount } = useCombinedNotificationCount(instructorId);
  const initial = (firstName || "I").trim().charAt(0).toUpperCase();

  const bgStyle = { background: "hsl(var(--dsm-bg))" };

  return (
    <header className="sticky top-0 z-40" style={bgStyle}>
      <div style={{ height: "env(safe-area-inset-top)", ...bgStyle }} />
      <div
        className="flex items-center justify-between"
        style={{ padding: "14px 18px", ...bgStyle }}
      >
        {/* Left: DSM logo (or back) */}
        <div className="flex items-center gap-2">
          {showBackButton ? (
            <button
              onClick={onBack}
              className="h-8 w-8 flex items-center justify-center"
              aria-label="Back"
            >
              <ChevronLeft size={20} strokeWidth={1.8} color={ICON_COLOR} />
            </button>
          ) : null}
          <img src={dsmLogo} alt="DSM" className="h-7 w-auto object-contain" />
        </div>

        {/* Right: line icons */}
        <div className="flex items-center" style={{ gap: 14 }}>
          <button
            onClick={() => navigate("/instructor/notifications")}
            className="relative flex items-center justify-center"
            style={{ width: 32, height: 32 }}
            aria-label="Notifications"
          >
            <Bell size={18} strokeWidth={1.8} color={ICON_COLOR} />
            {notifCount > 0 && (
              <span
                className="absolute flex items-center justify-center"
                style={{
                  top: -2,
                  right: -2,
                  minWidth: 16,
                  height: 16,
                  padding: "0 4px",
                  borderRadius: 8,
                  background: "#A32D2D",
                  color: "#FFFFFF",
                  fontSize: 9,
                  fontWeight: 500,
                  lineHeight: 1,
                }}
              >
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </button>
          <button
            onClick={onPlus}
            className="flex items-center justify-center"
            style={{ width: 32, height: 32 }}
            aria-label="Quick actions"
          >
            <Plus size={18} strokeWidth={1.8} color={ICON_COLOR} />
          </button>
          <DSMThemeToggle size={18} className="!h-8 !w-8" />
          <button
            onClick={onMenu}
            className="flex items-center justify-center overflow-hidden rounded-full"
            style={{
              width: 32,
              height: 32,
              border: "1px solid hsl(var(--dsm-border))",
              background: "hsl(var(--dsm-tile-icon-bg))",
            }}
            aria-label="Menu"
          >
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={firstName || "Profile"}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "hsl(var(--dsm-text))",
                  lineHeight: 1,
                }}
              >
                {initial}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
