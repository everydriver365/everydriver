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
  showBackButton = false,
  onBack,
  onPlus,
  onMenu,
}: Props) {
  const navigate = useNavigate();
  const { total: notifCount } = useCombinedNotificationCount(instructorId);

  const bgStyle = { background: "hsl(var(--dsm-bg))" };

  return (
    <header className="sticky top-0 z-40" style={bgStyle}>
      <div
        className="flex items-center justify-between"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)", paddingBottom: 12, paddingLeft: 18, paddingRight: 18, ...bgStyle }}
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
                  background: "#C8434F",
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
            className="flex items-center justify-center"
            style={{ width: 32, height: 32 }}
            aria-label="Menu"
          >
            <Menu size={18} strokeWidth={1.8} color={ICON_COLOR} />
          </button>
        </div>
      </div>
    </header>
  );
}
