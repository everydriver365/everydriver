import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Plus, Menu, ChevronLeft, Phone } from "lucide-react";
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
  surface?: "page" | "white";
  isHomePage?: boolean;
  pageTitle?: string;
  onBack?: () => void;
  onSOS: () => void;
  onPlus: () => void;
  onMenu: () => void;
}

const ICON = "#6B6B6B";
const TEXT_DARK = "#3A3A3A";
const RED = "#C8242C";
const GREEN = "#1D9E75";

/**
 * DSM flag logo: three coloured boxes (D red, S blue, M charcoal) with white serif letters.
 * Each box is 18×32 with 5px radius — sits flush as a single mark.
 */
function DSMFlag() {
  const boxes: { letter: string; bg: string }[] = [
    { letter: "D", bg: "#C8242C" },
    { letter: "S", bg: "#1E6FB8" },
    { letter: "M", bg: "#3A3A3A" },
  ];
  return (
    <div className="flex items-center" style={{ gap: 2 }} aria-hidden>
      {boxes.map((b) => (
        <div
          key={b.letter}
          style={{
            width: 18,
            height: 32,
            borderRadius: 5,
            background: b.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 17,
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {b.letter}
        </div>
      ))}
    </div>
  );
}

export function MobileBlueHeader({
  instructorId,
  showBackButton = false,
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
  const phoneColor = divertOn ? GREEN : ICON;

  return (
    <>
      <header
        className="sticky top-0 z-40"
        style={{ backgroundColor: "#F5F4F1" }}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: "4px 14px", minHeight: 52 }}
        >
          {/* Left */}
          <div className="flex items-center min-w-0" style={{ gap: 10 }}>
            {showBackButton && (
              <button
                onClick={onBack}
                className="flex items-center justify-center -ml-1 shrink-0"
                style={{ width: 44, height: 44 }}
                aria-label="Back"
              >
                <ChevronLeft size={22} strokeWidth={1.7} color={ICON} />
              </button>
            )}
            {isHomePage ? (
              <>
                <DSMFlag />
                <div className="flex flex-col leading-none min-w-0">
                  <span style={{ fontSize: 14, fontWeight: 500, color: TEXT_DARK, letterSpacing: -0.1 }}>
                    Driving School
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 400, color: "#6B6B6B", marginTop: 2 }}>
                    Manager
                  </span>
                </div>
              </>
            ) : (
              <h1
                className="truncate"
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 600,
                  letterSpacing: -0.3,
                  color: TEXT_DARK,
                }}
              >
                {pageTitle}
              </h1>
            )}
          </div>

          {/* Right icon row */}
          <div className="flex items-center" style={{ gap: 14 }}>
            <button
              onClick={() => setDivertSheetOpen(true)}
              className="flex items-center justify-center"
              style={{ width: 32, height: 32 }}
              aria-label={divertOn ? "AI call divert on" : "AI call divert off"}
            >
              <Phone size={20} strokeWidth={1.8} color={phoneColor} />
            </button>
            <button
              onClick={() => navigate("/instructor/notifications")}
              className="relative flex items-center justify-center"
              style={{ width: 32, height: 32 }}
              aria-label="Notifications"
            >
              <Bell size={20} strokeWidth={1.8} color={ICON} />
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
                    background: RED,
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontWeight: 600,
                    lineHeight: 1,
                  }}
                >
                  {notifCount > 99 ? "99+" : notifCount}
                </span>
              )}
            </button>
            <button
              onClick={onPlus}
              className="flex items-center justify-center"
              style={{ width: 32, height: 32 }}
              aria-label="Quick actions"
            >
              <Plus size={20} strokeWidth={1.8} color={ICON} />
            </button>
            <button
              onClick={onMenu}
              className="flex items-center justify-center"
              style={{ width: 32, height: 32 }}
              aria-label="Menu"
            >
              <Menu size={20} strokeWidth={1.8} color={ICON} />
            </button>
          </div>
        </div>
      </header>
      <AICallDivertSheet open={divertSheetOpen} onOpenChange={setDivertSheetOpen} state={aiDivert} />
    </>
  );
}
