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
  /** Background colour for the header + safe-area zone. Defaults to page bg. */
  surface?: "page" | "white";
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
  surface = "page",
  onBack,
  onPlus,
  onMenu,
}: Props) {
  const navigate = useNavigate();
  const { total: notifCount } = useCombinedNotificationCount(instructorId);

  // Header and the safe-area zone always share the page background, so the
  // top of every screen reads as one continuous surface (no white block, no
  // grey panel, no border). The `surface` prop is kept for API compatibility
  // but no longer changes the colour.
  void surface;
  const bg = "hsl(var(--dsm-page-bg,var(--dsm-bg)))";

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        // The native/app shell already owns the status-bar safe area. Adding
        // env(safe-area-inset-top) here duplicates it and creates the grey
        // blank banner above the Home header.
        paddingTop: 0,
        backgroundColor: bg,
      }}
    >
      <div className="flex h-11 items-center justify-between px-5" style={{ marginTop: 2 }}>
        {/* Left: DSM logo + wordmark (or back) */}
        <div className="flex items-center gap-2.5 min-w-0" style={{ opacity: 0.92 }}>
          {showBackButton ? (
            <button
              onClick={onBack}
              className="h-8 w-8 flex items-center justify-center -ml-1"
              aria-label="Back"
            >
              <ChevronLeft size={18} strokeWidth={1.7} color={ICON_COLOR} />
            </button>
          ) : null}
          <img src={dsmLogo} alt="DSM" className="h-6 w-auto object-contain shrink-0" />
        </div>

        {/* Right: bell, +, avatar, menu */}
        <div className="flex items-center" style={{ gap: 12 }}>
          <button
            onClick={() => navigate("/instructor/notifications")}
            className="relative flex items-center justify-center"
            style={{ width: 32, height: 32 }}
            aria-label="Notifications"
          >
            <Bell size={18} strokeWidth={1.7} color={ICON_COLOR} />
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
            <Plus size={18} strokeWidth={1.7} color={ICON_COLOR} />
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
            <Menu size={18} strokeWidth={1.7} color={ICON_COLOR} />
          </button>
        </div>
      </div>
    </header>
  );
}
