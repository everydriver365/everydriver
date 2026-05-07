import { useNavigate } from "react-router-dom";
import { Bell, Plus, Menu, ChevronLeft, Phone } from "lucide-react";
import dsmLogo from "@/assets/dsm-logo.png";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useAICallDivert } from "@/hooks/useAICallDivert";

interface Props {
  instructorId: string | undefined;
  firstName: string;
  profileImageUrl?: string | null;
  isOnline?: boolean;
  showBackButton?: boolean;
  showGreeting?: boolean;
  /** Background colour for the header + safe-area zone. Defaults to page bg. */
  surface?: "page" | "white";
  isHomePage?: boolean;
  pageTitle?: string;
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
  isHomePage = false,
  pageTitle,
  onBack,
  onPlus,
  onMenu,
}: Props) {
  const navigate = useNavigate();
  const { total: notifCount } = useCombinedNotificationCount(instructorId);
  const aiDivert = useAICallDivert(instructorId, null);
  const divertOn = aiDivert.settings.mode !== "off";
  const divertActive = aiDivert.active;
  const divertColor = divertOn ? "#1A7A3C" : "#CC2229";

  void surface;
  const bg = "hsl(var(--dsm-page-bg,var(--dsm-bg)))";

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        paddingTop: 0,
        backgroundColor: bg,
      }}
    >
      <div className="flex h-14 items-center justify-between px-5" style={{ marginTop: 2 }}>
        {/* Left: logo+wordmark on home; back+title on other tab roots; back+title on subpages */}
        <div className="flex items-center gap-2.5 min-w-0" style={{ opacity: 0.95 }}>
          {showBackButton && (
            <button
              onClick={onBack}
              className="h-8 w-8 flex items-center justify-center -ml-1 shrink-0"
              aria-label="Back"
            >
              <ChevronLeft size={22} strokeWidth={1.7} color={ICON_COLOR} />
            </button>
          )}
          {isHomePage ? (
            <>
              <img src={dsmLogo} alt="DSM" className="w-auto object-contain shrink-0" style={{ height: 29 }} />
              <div
                className="flex flex-col min-w-0 leading-none"
                style={{ color: "hsl(var(--dsm-text-primary, 240 6% 11%))" }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: -0.1 }}>
                  Driving School
                </span>
                <span style={{ fontSize: 10, fontWeight: 400, letterSpacing: -0.1, marginTop: 2 }}>
                  Manager
                </span>
              </div>
            </>
          ) : (
            <h1
              className="truncate"
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: -0.3,
                color: "hsl(var(--dsm-text-primary, 240 6% 11%))",
              }}
            >
              {pageTitle}
            </h1>
          )}
        </div>

        {/* Right: phone divert, bell, +, menu */}
        <div className="flex items-center" style={{ gap: 12 }}>
          <button
            onClick={() => {
              void aiDivert.setMode(divertActive ? "off" : "auto");
            }}
            className="relative flex items-center justify-center"
            style={{ width: 32, height: 32 }}
            aria-label={divertActive ? "Turn AI call divert off" : "Turn AI call divert on"}
            title={divertActive ? "AI call divert active — tap to turn off" : "AI call divert off — tap to turn on"}
          >
            <Phone size={20} strokeWidth={1.9} color={divertColor} />
          </button>
          <button
            onClick={() => navigate("/instructor/notifications")}
            className="relative flex items-center justify-center"
            style={{ width: 32, height: 32 }}
            aria-label="Notifications"
          >
            <Bell size={20} strokeWidth={1.7} color={ICON_COLOR} />
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
                  background: "#E15D5A",
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
            <Plus size={20} strokeWidth={1.7} color={ICON_COLOR} />
          </button>
          <button
            onClick={onMenu}
            className="flex items-center justify-center"
            style={{ width: 32, height: 32 }}
            aria-label="Menu"
          >
            <Menu size={20} strokeWidth={1.7} color={ICON_COLOR} />
          </button>
        </div>
      </div>
    </header>
  );
}
