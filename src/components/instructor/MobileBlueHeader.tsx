import { useNavigate } from "react-router-dom";
import { Bell, Plus, Menu, ChevronLeft } from "lucide-react";
import dsmLogo from "@/assets/dsm-logo.png";
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

const ICON_COLOR = "#5F5E5A";
const BG = "#F7F5F0";

export function MobileBlueHeader({
  instructorId,
  showBackButton = false,
  onBack,
  onPlus,
  onMenu,
}: Props) {
  const navigate = useNavigate();
  const { total: notifCount } = useCombinedNotificationCount(instructorId);

  return (
    <header className="sticky top-0 z-40" style={{ background: BG }}>
      <div style={{ height: "env(safe-area-inset-top)", background: BG }} />
      <div
        className="flex items-center justify-between"
        style={{ padding: "14px 18px", background: BG }}
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
