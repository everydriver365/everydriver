/**
 * InstructorTopBar — the single mobile header used across the whole instructor app.
 *
 * Lifted from the navy hero header on the DSM2026 homepage so every subpage
 * shares the exact same look (logo / name / Phone / Car / Bell / Menu).
 *
 * Two modes:
 *   - Home mode (default): DSM logo + first name + chevron (tap → profile).
 *   - Subpage mode (pass `onBack`): back chevron + page title.
 */
import { ChevronRight, ChevronLeft, Phone, Car, Bell, Menu, type LucideIcon } from "lucide-react";
import { DsmLogo } from "@/components/instructor/ui/DsmLogo";

const NAVY = "#072b47";
const WHITE = "#FFFFFF";
const RED = "#CC2229";
const FONT =
  'Poppins, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif';

export interface InstructorTopBarProps {
  firstName: string;
  unreadCount?: number;
  onPhone: () => void;
  onLiveTrack: () => void;
  onBell: () => void;
  onMenu: () => void;
  onProfile?: () => void;
  /** When provided, shows a back chevron and renders `pageTitle` in place of the name. */
  onBack?: () => void;
  pageTitle?: string;
  /** Optional small indicator (e.g. calendar sync dot) shown next to the name on home. */
  statusDot?: React.ReactNode;
}

export function InstructorTopBar({
  firstName,
  unreadCount = 0,
  onPhone,
  onLiveTrack,
  onBell,
  onMenu,
  onProfile,
  onBack,
  pageTitle,
  statusDot,
}: InstructorTopBarProps) {
  const isSubpage = typeof onBack === "function";

  return (
    <div
      style={{
        backgroundColor: NAVY,
        padding: "calc(env(safe-area-inset-top, 0px) + 12px) 18px 16px",
        marginTop: "calc(-1 * env(safe-area-inset-top, 0px))",
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {isSubpage ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                background: "rgba(255,255,255,0.10)",
                border: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft size={20} color={WHITE} strokeWidth={2} />
            </button>
          ) : (
            <DsmLogo size={28} />
          )}

          <button
            type="button"
            onClick={!isSubpage ? onProfile : undefined}
            disabled={isSubpage}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "transparent",
              border: 0,
              padding: 0,
              cursor: isSubpage ? "default" : "pointer",
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: WHITE,
                fontFamily: FONT,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {isSubpage ? (pageTitle || "") : (firstName || "Instructor")}
            </span>
            {!isSubpage && (
              <ChevronRight size={14} color="rgba(255,255,255,0.5)" strokeWidth={2.2} />
            )}
            {!isSubpage && statusDot ? (
              <span style={{ marginLeft: 6, display: "inline-flex", alignItems: "center" }}>
                {statusDot}
              </span>
            ) : null}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <TopBarIconButton Icon={Phone} onPress={onPhone} ariaLabel="Calls" />
          <TopBarIconButton Icon={Car} onPress={onLiveTrack} ariaLabel="Live track" />
          <TopBarIconButton Icon={Bell} onPress={onBell} badge={unreadCount} ariaLabel="Notifications" />
          <TopBarIconButton Icon={Menu} onPress={onMenu} ariaLabel="Menu" />
        </div>
      </div>
    </div>
  );
}

function TopBarIconButton({
  Icon,
  onPress,
  badge,
  ariaLabel,
}: {
  Icon: LucideIcon;
  onPress: () => void;
  badge?: number;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={ariaLabel}
      style={{
        position: "relative",
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.10)",
        border: 0,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={17} color={WHITE} strokeWidth={1.8} />
      {badge && badge > 0 ? (
        <span
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            minWidth: 15,
            height: 15,
            borderRadius: 8,
            backgroundColor: RED,
            border: `2px solid ${NAVY}`,
            color: WHITE,
            fontSize: 7,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 3px",
            fontFamily: FONT,
          }}
        >
          {badge > 99 ? "99" : badge}
        </span>
      ) : null}
    </button>
  );
}
