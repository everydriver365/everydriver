import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type LoginSurface = "dark" | "light";

interface Props {
  logoSrc: string;
  logoAlt: string;
  logoHeightPx?: number;
  heroSrc?: string;
  heroAlt?: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  hideAt?: "md" | "lg";
  /** Visual surface — dark navy (default) or light white. */
  surface?: LoginSurface;
  /** Vertical px offset for the hero image (negative = move higher). */
  heroOffsetY?: number;
}

export function MobilePortalLoginShell({
  logoSrc,
  logoAlt,
  logoHeightPx = 44,
  heroSrc,
  heroAlt,
  title,
  subtitle,
  children,
  footer,
  className,
  hideAt = "md",
  surface = "dark",
  heroOffsetY = 0,
}: Props) {
  const isLight = surface === "light";

  const baseBg = isLight ? "#FFFFFF" : "#0F2044";
  const fadeRgba = isLight ? "255,255,255" : "15,32,68";
  const textBaseClass = isLight ? "text-[#0F2044]" : "text-white";
  const subTextClass = isLight ? "text-[#0F2044]/70" : "text-white/90";

  return (
    <div
      data-surface={surface}
      className={cn(
        hideAt === "lg" ? "lg:hidden" : "md:hidden",
        "fixed inset-0 flex flex-col overflow-y-auto z-40",
        textBaseClass,
        className,
      )}
      style={{
        backgroundColor: baseBg,
        paddingTop: "calc(env(safe-area-inset-top) + 40px)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)",
        paddingLeft: 28,
        paddingRight: 28,
        minHeight: "100dvh",
        ...(heroSrc
          ? {
              backgroundImage: `linear-gradient(180deg, rgba(${fadeRgba},0) 0%, rgba(${fadeRgba},0) 40%, rgba(${fadeRgba},0.85) 58%, rgba(${fadeRgba},1) 72%), url(${heroSrc})`,
              backgroundSize: "100% auto, 100% auto",
              backgroundPosition: `left top, left ${heroOffsetY}px`,
              backgroundRepeat: "no-repeat, no-repeat",
            }
          : {}),
      }}
    >
      <style>{`
        @media (max-height: 720px) {
          .mpl-brand-gap { margin-top: 20px !important; }
          .mpl-welcome { font-size: 22px !important; }
        }
      `}</style>

      <div className="flex flex-col items-center">
        {!heroSrc && (
          <img
            src={logoSrc}
            alt={logoAlt}
            style={{ height: logoHeightPx }}
            className="object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
          />
        )}
      </div>

      {heroSrc && <div className="flex-1" />}

      <div className={cn("flex flex-col items-center", !heroSrc && "mt-0")}>
        <h1
          className={cn(
            "mpl-welcome font-bold mt-7 text-center",
            textBaseClass,
            isLight ? "" : "drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]",
          )}
          style={{ fontSize: 26, letterSpacing: "-0.6px", lineHeight: 1.1 }}
        >
          {title}
        </h1>
        <p className={cn("mt-1.5 text-center", subTextClass)} style={{ fontSize: 14 }}>
          {subtitle}
        </p>
      </div>

      <div className={cn("mpl-brand-gap flex flex-col", heroSrc ? "mt-5" : "mt-10 flex-1")}>{children}</div>

      {footer && <div className="mt-6 text-center">{footer}</div>}
    </div>
  );
}

/* ─────────────────── Form tokens — dark (default) ─────────────────── */

export const darkPortalInputClass =
  "w-full h-[50px] pl-11 pr-4 rounded-[12px] text-white text-[15px] placeholder:text-white/40 outline-none transition-colors focus:border-white/60";

export const darkPortalInputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.18)",
  border: "1px solid rgba(255,255,255,0.3)",
};

export const darkPortalLabelClass =
  "text-[12px] font-semibold text-white/60 uppercase tracking-[0.6px] mb-1.5";

export const darkPortalPrimaryBtnClass =
  "w-full rounded-[12px] bg-white text-[#0F2044] font-bold disabled:cursor-not-allowed";

export const darkPortalGhostBtnClass =
  "w-full rounded-[12px] bg-transparent flex items-center justify-center gap-2.5 py-3.5 transition-opacity active:opacity-80";

export const darkPortalGhostBtnStyle: React.CSSProperties = {
  border: "1.5px solid rgba(255,255,255,0.22)",
};

/* ─────────────────── Form tokens — light ─────────────────── */

export const lightPortalInputClass =
  "w-full h-[52px] pl-11 pr-4 rounded-[14px] text-[#0F2044] text-[15px] placeholder:text-[#0F2044]/40 outline-none transition-colors focus:border-[#0F2044]/40";

export const lightPortalInputStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid rgba(15,32,68,0.14)",
  boxShadow: "0 6px 20px -10px rgba(15,32,68,0.18)",
};

export const lightPortalLabelClass =
  "text-[12px] font-semibold text-[#0F2044]/60 uppercase tracking-[0.6px] mb-1.5";

export const lightPortalPrimaryBtnClass =
  "w-full rounded-[14px] bg-[#0F2044] text-white font-bold disabled:cursor-not-allowed shadow-[0_10px_30px_-12px_rgba(15,32,68,0.55)]";

export const lightPortalGhostBtnClass =
  "w-full rounded-[14px] bg-white flex items-center justify-center gap-2.5 py-3.5 transition-opacity active:opacity-80 text-[#0F2044]";

export const lightPortalGhostBtnStyle: React.CSSProperties = {
  border: "1.5px solid rgba(15,32,68,0.14)",
  boxShadow: "0 6px 20px -12px rgba(15,32,68,0.2)",
};

/* ─────────────────── Surface-aware helpers ─────────────────── */

export function getPortalFormTokens(surface: LoginSurface = "dark") {
  if (surface === "light") {
    return {
      inputClass: lightPortalInputClass,
      inputStyle: lightPortalInputStyle,
      labelClass: lightPortalLabelClass,
      primaryBtnClass: lightPortalPrimaryBtnClass,
      ghostBtnClass: lightPortalGhostBtnClass,
      ghostBtnStyle: lightPortalGhostBtnStyle,
      textColor: "#0F2044",
      textColorClass: "text-[#0F2044]",
      mutedTextClass: "text-[#0F2044]/70",
      dividerClass: "bg-[#0F2044]/15",
      iconColorClass: "text-[#0F2044]",
      errorBoxClass: "bg-[#0F2044]/5 border-[#0F2044]/15",
    };
  }
  return {
    inputClass: darkPortalInputClass,
    inputStyle: darkPortalInputStyle,
    labelClass: darkPortalLabelClass,
    primaryBtnClass: darkPortalPrimaryBtnClass,
    ghostBtnClass: darkPortalGhostBtnClass,
    ghostBtnStyle: darkPortalGhostBtnStyle,
    textColor: "#FFFFFF",
    textColorClass: "text-white",
    mutedTextClass: "text-white/90",
    dividerClass: "bg-white/25",
    iconColorClass: "text-white",
    errorBoxClass: "bg-white/10 border-white/20",
  };
}
