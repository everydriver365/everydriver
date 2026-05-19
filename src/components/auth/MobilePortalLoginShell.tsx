import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  logoSrc: string;
  logoAlt: string;
  /** Override the rendered logo height (px). Default 44. */
  logoHeightPx?: number;
  title: string;
  subtitle: string;
  /** Form body. */
  children: ReactNode;
  /** Optional footer pinned to the bottom (e.g. "New here? Sign up"). */
  footer?: ReactNode;
  /** Optional className extension for the root. */
  className?: string;
  /** Tailwind breakpoint at which the shell hides (desktop takes over). Default "md". */
  hideAt?: "md" | "lg";
}

/**
 * Shared mobile-only login shell with the Drive365 navy aesthetic.
 * Matches the pupil login: full-bleed #0F2044 background, centred logo +
 * title/subtitle block, and a form area underneath. Each portal supplies
 * its own logo and form contents.
 *
 * Render this with `md:hidden` and keep the desktop layout untouched.
 */
export function MobilePortalLoginShell({
  logoSrc,
  logoAlt,
  logoHeightPx = 44,
  title,
  subtitle,
  children,
  footer,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "md:hidden fixed inset-0 bg-[#0F2044] text-white flex flex-col overflow-y-auto z-40",
        className,
      )}
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + 40px)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)",
        paddingLeft: 28,
        paddingRight: 28,
        minHeight: "100dvh",
      }}
    >
      <style>{`
        @media (max-height: 720px) {
          .mpl-brand-gap { margin-top: 28px !important; }
          .mpl-welcome { font-size: 22px !important; }
        }
      `}</style>

      <div className="flex flex-col items-center">
        <img
          src={logoSrc}
          alt={logoAlt}
          style={{ height: logoHeightPx }}
          className="object-contain"
        />
        <h1
          className="mpl-welcome text-white font-bold mt-7 text-center"
          style={{ fontSize: 26, letterSpacing: "-0.6px", lineHeight: 1.1 }}
        >
          {title}
        </h1>
        <p className="text-white/90 mt-1.5 text-center" style={{ fontSize: 14 }}>
          {subtitle}
        </p>
      </div>

      <div className="mt-10 mpl-brand-gap flex flex-col flex-1">{children}</div>

      {footer && <div className="mt-6 text-center">{footer}</div>}
    </div>
  );
}

/* ─────────────────── Reusable dark-form primitives ─────────────────── */

/** White-on-navy input shell — apply to <input> alongside positioning. */
export const darkPortalInputClass =
  "w-full h-[50px] pl-11 pr-4 rounded-[12px] text-white text-[15px] placeholder:text-white/40 outline-none transition-colors focus:border-white/60";

export const darkPortalInputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.18)",
  border: "1px solid rgba(255,255,255,0.3)",
};

export const darkPortalLabelClass =
  "text-[12px] font-semibold text-white/60 uppercase tracking-[0.6px] mb-1.5";

/** Primary white pill button on navy. */
export const darkPortalPrimaryBtnClass =
  "w-full rounded-[12px] bg-white text-[#0F2044] font-bold disabled:cursor-not-allowed";

/** Ghost outlined button (for Face ID / secondary actions). */
export const darkPortalGhostBtnClass =
  "w-full rounded-[12px] bg-transparent flex items-center justify-center gap-2.5 py-3.5 transition-opacity active:opacity-80";

export const darkPortalGhostBtnStyle: React.CSSProperties = {
  border: "1.5px solid rgba(255,255,255,0.22)",
};
