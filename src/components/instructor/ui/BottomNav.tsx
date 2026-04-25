import { ComponentType, SVGProps } from "react";
import { useLocation } from "react-router-dom";
import { haptics } from "@/lib/haptics";

/**
 * Premium tile-system bottom navigation.
 *
 * Single source of truth for the instructor mobile nav. Each tab renders
 * a line-style icon (24×24, 1.8px stroke, currentColor), an 11/500 label,
 * an optional 14px notification badge, and a 16×2 active underline.
 *
 * Active colour: #2B7BC8. Inactive: #6E6E73. Badge: #C8434F. Hairline:
 * #E5E5EA. No drop shadows, no pills, no non-system colours.
 *
 * Behaviour preserved from the previous nav: route-based active detection
 * (exact match for the root tab, prefix match for the rest), haptic
 * selection feedback on tap, conditional badge rendering with 9+ overflow,
 * iOS safe-area inset, and full state preservation (tap simply navigates —
 * no remount of destination screens).
 */

const ACTIVE = "#2B7BC8";
const INACTIVE = "#6E6E73";
const BADGE_BG = "#C8434F";
const HAIRLINE = "#E5E5EA";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

export interface BottomNavIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  active?: boolean;
}

export interface BottomNavTabConfig {
  /** User-visible label (also used for aria-label). */
  label: string;
  /** Route path to navigate to. Used both for navigation and active detection. */
  path: string;
  /** Line-style icon component — must accept `size` and optional `active`. */
  icon: ComponentType<BottomNavIconProps>;
  /** Optional live badge count. Renders only when > 0. */
  badge?: number;
  /** Whether active detection should be exact (true) or prefix (false). */
  exact?: boolean;
}

interface NavTabProps {
  tab: BottomNavTabConfig;
  isActive: boolean;
  onPress: () => void;
}

function NavTab({ tab, isActive, onPress }: NavTabProps) {
  const Icon = tab.icon;
  const colour = isActive ? ACTIVE : INACTIVE;
  const badge = tab.badge ?? 0;

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={tab.label}
      aria-current={isActive ? "page" : undefined}
      style={{
        position: "relative",
        background: "transparent",
        border: "none",
        padding: "8px 4px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span style={{ position: "relative", display: "inline-flex", color: colour }}>
        <Icon size={24} active={isActive} />
        {badge > 0 && (
          <span
            aria-label={`${badge} notification${badge === 1 ? "" : "s"}`}
            style={{
              position: "absolute",
              top: -2,
              right: -4,
              minWidth: 14,
              height: 14,
              padding: "0 4px",
              borderRadius: 999,
              background: BADGE_BG,
              border: "1.5px solid #FFFFFF",
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
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: -0.1,
          color: colour,
          fontFamily: FONT_STACK,
          lineHeight: 1,
        }}
      >
        {tab.label}
      </span>
      {isActive && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            bottom: 2,
            left: "50%",
            transform: "translateX(-50%)",
            width: 16,
            height: 2,
            background: ACTIVE,
            borderRadius: 1,
          }}
        />
      )}
    </button>
  );
}

export interface BottomNavProps {
  tabs: BottomNavTabConfig[];
  onNavigate: (path: string) => void;
}

export function BottomNav({ tabs, onNavigate }: BottomNavProps) {
  const location = useLocation();
  const rootPath = tabs[0]?.path;

  const handlePress = (path: string) => {
    haptics.selection();
    onNavigate(path);
  };

  return (
    <nav
      role="navigation"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: "#FFFFFF",
        borderTop: `0.5px solid ${HAIRLINE}`,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
          gap: 0,
          padding: "8px 4px",
        }}
      >
        {tabs.map((tab) => {
          const isActive =
            tab.exact ?? tab.path === rootPath
              ? location.pathname === tab.path
              : location.pathname === tab.path ||
                location.pathname.startsWith(`${tab.path}/`);

          return (
            <NavTab
              key={tab.path}
              tab={tab}
              isActive={isActive}
              onPress={() => handlePress(tab.path)}
            />
          );
        })}
      </div>
      {/* iOS safe-area inset preserved */}
      <div className="h-safe-area-inset-bottom" style={{ background: "inherit" }} />
    </nav>
  );
}
