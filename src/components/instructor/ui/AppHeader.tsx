import { ComponentType, ReactNode, SVGProps } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { haptics } from "@/lib/haptics";
import { useInstructorTheme } from "@/context/InstructorThemeContext";
import { DsmLogo } from "@/components/instructor/ui/DsmLogo";
import {
  BellHeaderIcon,
  ChevronLeftHeaderIcon,
  MenuHeaderIcon,
  MoonHeaderIcon,
  PlusHeaderIcon,
  SunHeaderIcon,
} from "@/components/instructor/ui/HeaderIcons";

/**
 * Premium tile-system global app header.
 *
 * Layout: [back?] [DSM logo + title] [bell] [plus] [theme] [menu]
 *
 * Brand colours, system greys (#6E6E73 light / #9A9AA0 dark), 0.5px
 * hairline divider, no drop shadows, no pills behind icons. Notification
 * badge is anchored on the bell, sized to the tile-system spec and ringed
 * with the header background colour so it reads cleanly in either theme.
 *
 * Sticky positioning with a compact row; the native/app shell owns the
 * status-bar safe area so we do not add another spacer here.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };
type IconComponent = ComponentType<IconProps>;

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

const PALETTE = {
  light: {
    bg: "#F2F4F8",
    border: "transparent",
    title: "#000000",
    icon: "#6E6E73",
    badgeRing: "#F2F4F8",
  },
  dark: {
    bg: "#1C1C1E",
    border: "#2C2C2E",
    title: "#FFFFFF",
    icon: "#9A9AA0",
    badgeRing: "#1C1C1E",
  },
} as const;

const BADGE_BG = "#C8434F";

/* ---------------- BackChevron ---------------- */

interface BackChevronProps {
  onPress: () => void;
  iconColour: string;
}

function BackChevron({ onPress, iconColour }: BackChevronProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label="Back"
      style={{
        background: "transparent",
        border: "none",
        padding: 4,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        color: iconColour,
      }}
    >
      <ChevronLeftHeaderIcon size={20} />
    </button>
  );
}

/* ---------------- HeaderIconButton ---------------- */

export interface HeaderIconButtonProps {
  icon: IconComponent;
  onPress: () => void;
  ariaLabel: string;
  badgeCount?: number;
  iconColour: string;
  badgeRingColour: string;
}

export function HeaderIconButton({
  icon: Icon,
  onPress,
  ariaLabel,
  badgeCount = 0,
  iconColour,
  badgeRingColour,
}: HeaderIconButtonProps) {
  const showBadge = badgeCount > 0;
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={ariaLabel}
      style={{
        position: "relative",
        background: "transparent",
        border: "none",
        padding: 8,
        borderRadius: 8,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        color: iconColour,
      }}
    >
      <Icon size={20} />
      {showBadge && (
        <span
          aria-label={`${badgeCount} notification${badgeCount === 1 ? "" : "s"}`}
          style={{
            position: "absolute",
            top: 4,
            right: 2,
            minWidth: 16,
            height: 14,
            padding: "0 4px",
            borderRadius: 999,
            background: BADGE_BG,
            border: `1.5px solid ${badgeRingColour}`,
            color: "#FFFFFF",
            fontSize: 9,
            fontWeight: 500,
            lineHeight: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT_STACK,
            boxSizing: "border-box",
          }}
        >
          {badgeCount > 9 ? "9+" : badgeCount}
        </span>
      )}
    </button>
  );
}

/* ---------------- AppHeader ---------------- */

export interface AppHeaderProps {
  /** Visual variant. 'home' = existing DSM logo header. 'screen' = title/subtitle screen header. */
  mode?: "home" | "screen";
  title: string;
  /** Subtitle line (screen mode only). Hidden when falsy. */
  subtitle?: string;
  /** Optional override for the back-chevron condition. Defaults to: any non-root route. */
  showBack?: boolean;
  /** Override the default `navigate(-1)` behaviour. */
  onBack?: () => void;
  /** Live notification count for the bell badge. */
  notificationCount?: number;
  onBellPress: () => void;
  onAddPress: () => void;
  onMenuPress: () => void;
  /** Screen mode: show the + add affordance (defaults true to match existing home behaviour). */
  showAdd?: boolean;
  /** Screen mode: show an Edit pill instead of +. Mutually exclusive with showAdd. */
  showEdit?: boolean;
  onEdit?: () => void;
  /** Optional trailing slot before the menu icon (e.g. offline-sync indicator). */
  trailing?: ReactNode;
  /** Path treated as the "root" — on this route the back chevron is hidden by default. */
  rootPath?: string;
}

export function AppHeader({
  mode = "home",
  title,
  subtitle,
  showBack,
  onBack,
  notificationCount = 0,
  onBellPress,
  onAddPress,
  onMenuPress,
  showAdd,
  showEdit,
  onEdit,
  trailing,
  rootPath,
}: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode: themeMode, toggle } = useInstructorTheme();
  const isDark = themeMode === "dark";
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const computedShowBack =
    showBack ?? (rootPath ? location.pathname !== rootPath : false);

  const handleBack = () => {
    haptics.selection();
    if (onBack) onBack();
    else navigate(-1);
  };

  const handleTap = (cb: () => void) => () => {
    haptics.selection();
    cb();
  };

  if (mode === "screen") {
    const showAddBtn = !!showAdd && !showEdit;
    return (
      <header
        role="banner"
        className="sticky top-0 z-40"
        style={{
          background: "#FFFFFF",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
          }}
        >
          <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
            <h1
              style={{
                margin: 0,
                fontFamily: FONT_STACK,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: -0.4,
                lineHeight: "26px",
                color: "#1A1A1A",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </h1>
            {subtitle ? (
              <div
                style={{
                  fontFamily: FONT_STACK,
                  fontSize: 10,
                  color: "#8E8E93",
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <HeaderIconButton
              icon={BellHeaderIcon}
              onPress={handleTap(onBellPress)}
              ariaLabel="Notifications"
              badgeCount={notificationCount}
              iconColour="#1A1A1A"
              badgeRingColour="#FFFFFF"
            />

            {showEdit && (
              <button
                type="button"
                onClick={handleTap(onEdit ?? (() => {}))}
                style={{
                  background: "#EEF3FF",
                  border: "none",
                  borderRadius: 20,
                  padding: "5px 10px",
                  fontFamily: FONT_STACK,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#1A52A0",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                Edit
              </button>
            )}

            {showAddBtn && (
              <button
                type="button"
                onClick={handleTap(onAddPress)}
                aria-label="Add"
                style={{
                  width: 27,
                  height: 27,
                  borderRadius: 14,
                  background: "#FFFFFF",
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#5B6B8A",
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <PlusHeaderIcon size={13} />
              </button>
            )}

            {trailing}

            <button
              type="button"
              onClick={handleTap(onMenuPress)}
              aria-label="Menu"
              style={{
                width: 27,
                height: 27,
                borderRadius: 14,
                background: "#FFFFFF",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#5B6B8A",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <MenuHeaderIcon size={13} />
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      role="banner"
      className="sticky top-0 z-40"
      style={{
        background: palette.bg,
        borderBottom: `0.5px solid ${palette.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
        }}
      >
        {computedShowBack && (
          <BackChevron onPress={handleBack} iconColour={palette.icon} />
        )}

        {/* Logo + title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: 1,
            minWidth: 0,
          }}
        >
          <DsmLogo size={24} dark={isDark} />
          <h1
            style={{
              margin: 0,
              minWidth: 0,
              fontFamily: FONT_STACK,
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: -0.2,
              color: palette.title,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
        </div>

        {/* Right-side actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            flexShrink: 0,
          }}
        >
          <HeaderIconButton
            icon={BellHeaderIcon}
            onPress={handleTap(onBellPress)}
            ariaLabel="Notifications"
            badgeCount={notificationCount}
            iconColour={palette.icon}
            badgeRingColour={palette.badgeRing}
          />
          <HeaderIconButton
            icon={PlusHeaderIcon}
            onPress={handleTap(onAddPress)}
            ariaLabel="Quick add"
            iconColour={palette.icon}
            badgeRingColour={palette.badgeRing}
          />
          <HeaderIconButton
            icon={isDark ? SunHeaderIcon : MoonHeaderIcon}
            onPress={handleTap(toggle)}
            ariaLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
            iconColour={palette.icon}
            badgeRingColour={palette.badgeRing}
          />
          {trailing}
          <HeaderIconButton
            icon={MenuHeaderIcon}
            onPress={handleTap(onMenuPress)}
            ariaLabel="Menu"
            iconColour={palette.icon}
            badgeRingColour={palette.badgeRing}
          />
        </div>
      </div>
    </header>
  );
}

