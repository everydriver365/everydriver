import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Plus, Menu, ChevronLeft, Phone } from "lucide-react";
import dsmLogo from "@/assets/dsm-logo.png";
import { useCombinedNotificationCount } from "@/hooks/useCombinedNotificationCount";
import { useAICallDivert } from "@/hooks/useAICallDivert";
import { AICallDivertSheet } from "@/components/instructor/AICallDivertSheet";

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
  const [divertSheetOpen, setDivertSheetOpen] = useState(false);
  const { total: notifCount } = useCombinedNotificationCount(instructorId);
  const aiDivert = useAICallDivert(instructorId, null);
  const divertOn = aiDivert.settings.mode !== "off";
  const divertActive = aiDivert.active;
  const divertColor = divertOn ? "#1D9E75" : "#6B6B6B";
  const ICON_BASE = "#6B6B6B";

  void surface;
  const pageBg = "hsl(var(--dsm-page-bg,var(--dsm-bg)))";

  return (
    <>
      <header
        className="sticky top-0 z-40"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          backgroundColor: "#FFFFFF",
          paddingLeft: 8,
          paddingRight: 8,
          paddingBottom: 8,
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            background: "#FFFFFF",
            borderRadius: 16,
            padding: 14,
            boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
          }}
        >
        {/* Left: logo+wordmark on home; back+title on other tab roots; back+title on subpages */}
        <div className="flex items-center min-w-0" style={{ gap: 10 }}>
          {showBackButton && (
            <button
              onClick={onBack}
              className="h-8 w-8 flex items-center justify-center -ml-1 shrink-0"
              aria-label="Back"
            >
              <ChevronLeft size={22} strokeWidth={1.7} color={ICON_BASE} />
            </button>
          )}
          {isHomePage ? (
            <>
              <img src={dsmLogo} alt="DSM" className="w-auto object-contain shrink-0" style={{ height: 32 }} />
              <div className="flex flex-col min-w-0" style={{ lineHeight: 1.2 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "#3A3A3A" }}>
                  Driving School
                </span>
                <span style={{ fontSize: 12, fontWeight: 400, color: "#6B6B6B" }}>
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
                color: "#3A3A3A",
              }}
            >
              {pageTitle}
            </h1>
          )}
        </div>

        {/* Right: phone divert, bell, +, menu */}
        <div className="flex items-center" style={{ gap: 16 }}>
          <button
            onClick={() => setDivertSheetOpen(true)}
            className="relative flex items-center justify-center transition-transform active:scale-95"
            style={{ width: 44, height: 44, margin: -12, WebkitTapHighlightColor: "transparent" }}
            aria-label={divertOn ? "Call settings — auto-divert on" : "Call settings"}
            title={divertOn ? "AI call divert on" : "Call settings"}
          >
            <Phone size={20} strokeWidth={1.9} color={divertColor} aria-hidden="true" />
          </button>
          <button
            onClick={() => navigate("/instructor/notifications")}
            className="relative flex items-center justify-center transition-transform active:scale-95"
            style={{ width: 44, height: 44, margin: -12, WebkitTapHighlightColor: "transparent" }}
            aria-label={`Notifications${notifCount > 0 ? `, ${notifCount} unread` : ""}`}
          >
            <Bell size={20} strokeWidth={1.7} color={ICON_BASE} aria-hidden="true" />
            {notifCount > 0 && (
              <span
                className="absolute flex items-center justify-center"
                aria-hidden="true"
                style={{
                  top: 8,
                  right: 7,
                  minWidth: 14,
                  height: 14,
                  padding: "0 3px",
                  borderRadius: 8,
                  background: "#C8242C",
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
            className="flex items-center justify-center transition-transform active:scale-95"
            style={{ width: 44, height: 44, margin: -12, WebkitTapHighlightColor: "transparent" }}
            aria-label="Add new"
          >
            <Plus size={20} strokeWidth={1.7} color={ICON_BASE} aria-hidden="true" />
          </button>
          <button
            onClick={onMenu}
            className="flex items-center justify-center transition-transform active:scale-95"
            style={{ width: 44, height: 44, margin: -12, WebkitTapHighlightColor: "transparent" }}
            aria-label="Menu"
          >
            <Menu size={20} strokeWidth={1.7} color={ICON_BASE} aria-hidden="true" />
          </button>
        </div>
        </div>
      </header>
      <AICallDivertSheet open={divertSheetOpen} onOpenChange={setDivertSheetOpen} state={aiDivert} />
    </>
  );
}
