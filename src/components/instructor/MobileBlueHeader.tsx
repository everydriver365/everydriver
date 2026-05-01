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

const ICON_COLOR = "hsl(var(--dsm-text-secondary))";

export function MobileBlueHeader({
  instructorId,
  profileImageUrl,
  showBackButton = false,
  onBack,
  onPlus,
  onMenu,
}: Props) {
  const navigate = useNavigate();
  const { total: notifCount } = useCombinedNotificationCount(instructorId);

  return (
    <header
      className="sticky top-0 z-40 bg-[#F2F2F7]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-12 items-center justify-between px-5">
        {/* Left: DSM logo (or back) */}
        <div className="flex items-center gap-2.5 min-w-0">
          {showBackButton ? (
            <button
              onClick={onBack}
              className="h-8 w-8 flex items-center justify-center -ml-1"
              aria-label="Back"
            >
              <ChevronLeft size={20} strokeWidth={1.8} color={ICON_COLOR} />
            </button>
          ) : null}
          <img src={dsmLogo} alt="DSM" className="h-10 w-auto object-contain shrink-0" />
        </div>

        {/* Right: bell, +, avatar, menu */}
        <div className="flex items-center" style={{ gap: 12 }}>
          <button
            onClick={() => navigate("/instructor/notifications")}
            className="relative flex items-center justify-center"
            style={{ width: 32, height: 32 }}
            aria-label="Notifications"
          >
            <Bell size={20} strokeWidth={1.8} color={ICON_COLOR} />
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
                  background: "#FF3B30",
                  color: "#FFFFFF",
                  fontSize: 9,
                  fontWeight: 600,
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
            <Plus size={20} strokeWidth={1.8} color={ICON_COLOR} />
          </button>
          <button
            onClick={() => navigate("/instructor/profile")}
            className="flex items-center justify-center rounded-full overflow-hidden bg-[hsl(var(--dsm-tile-icon-bg))] border border-[hsl(var(--dsm-border))]"
            style={{ width: 32, height: 32 }}
            aria-label="Profile"
          >
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[12px] font-semibold text-[hsl(var(--dsm-text))]">
                {(/* initial */ "I")}
              </span>
            )}
          </button>
          <button
            onClick={onMenu}
            className="flex items-center justify-center"
            style={{ width: 32, height: 32 }}
            aria-label="Menu"
          >
            <Menu size={20} strokeWidth={1.8} color={ICON_COLOR} />
          </button>
        </div>
      </div>
    </header>
  );
}
