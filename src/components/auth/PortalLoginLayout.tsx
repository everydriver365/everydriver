import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Lock, ShieldCheck, Clock } from "lucide-react";

export const portalTokens = {
  navy: "#0F2044",
  blue: "#1A52A0",
  blueLight: "#E6F1FB",
  red: "#CC2229",
  redDark: "#A81E24",
  green: "#1D9E75",
  greenDark: "#085041",
  mid: "#6B7280",
  muted: "#9CA3AF",
  placeholder: "#C4C9D4",
  surface: "#F2F4F8",
  white: "#FFFFFF",
  border: "#DDE3ED",
};

export interface PortalFeature {
  Icon: LucideIcon;
  title: string;
  sub: string;
  /** background colour for the icon tile (use white-translucent values on navy) */
  iconBg?: string;
  /** stroke colour for the icon */
  iconColor?: string;
}

interface Props {
  /** Brand mark for the large left-panel header */
  leftBrand: ReactNode;
  /** Optional small caption shown directly under the brand */
  leftBrandCaption?: string;
  /** Small uppercase tag above the headline (e.g. "Instructor portal") */
  leftTag: string;
  /** Headline JSX — line breaks + accent span allowed */
  leftHeadline: ReactNode;
  /** Sub-headline paragraph under the headline */
  leftSub: string;
  /** Three feature rows */
  leftFeatures: PortalFeature[];
  /** Footer line at the bottom of the left panel */
  leftFooter: string;

  /** Brand mark shown above the card title (small) */
  cardBrand: ReactNode;
  /** Small grey label next to cardBrand (e.g. "Admin portal") */
  cardTag?: string;
  /** Title (e.g. "Welcome back") */
  cardTitle: string;
  /** Subtitle under the title */
  cardSubtitle: string;

  /** Form / body content */
  children: ReactNode;
  /** Optional footer rendered under the trust strip (portal links etc.) */
  footer?: ReactNode;
}

const TRUST_ITEMS: { Icon: LucideIcon; label: string }[] = [
  { Icon: Lock, label: "SSL secured" },
  { Icon: ShieldCheck, label: "DVSA approved" },
  { Icon: Clock, label: "UK support" },
];

/**
 * Shared two-panel login layout used by Instructor, Admin, School, and Pupil portals.
 * Mobile: left panel collapses, right card fills viewport.
 */
export function PortalLoginLayout({
  leftBrand, leftBrandCaption, leftTag, leftHeadline, leftSub, leftFeatures, leftFooter,
  cardBrand, cardTag, cardTitle, cardSubtitle, children, footer,
}: Props) {
  const t = portalTokens;
  return (
    <div style={{ minHeight: "100vh", fontFamily: "Poppins, system-ui, sans-serif", background: t.surface }}>
      <div className="md:grid md:grid-cols-2" style={{ minHeight: "100vh" }}>
        {/* LEFT PANEL */}
        <div
          className="hidden md:flex"
          style={{
            backgroundColor: t.navy,
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "48px 56px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: -120, left: -120, width: 380, height: 380, borderRadius: "50%", border: "60px solid rgba(26,82,160,0.12)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -80, right: -80, width: 260, height: 260, borderRadius: "50%", background: "rgba(204,34,41,0.07)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            {leftBrand}
            {leftBrandCaption && (
              <p style={{ fontSize: 11, fontWeight: 300, color: "rgba(255,255,255,0.35)", marginTop: 7, letterSpacing: "0.04em" }}>
                {leftBrandCaption}
              </p>
            )}
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 18 }}>
              <div style={{ width: 16, height: 2, background: t.red, borderRadius: 1, flexShrink: 0 }} />
              {leftTag}
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 700, color: t.white, lineHeight: 1.12, letterSpacing: -0.8, marginBottom: 14 }}>
              {leftHeadline}
            </h1>
            <p style={{ fontSize: 14, fontWeight: 300, color: "rgba(255,255,255,0.4)", lineHeight: 1.75, marginBottom: 36, maxWidth: 320 }}>
              {leftSub}
            </p>

            {leftFeatures.map((f) => {
              const Icon = f.Icon;
              return (
                <div key={f.title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "rgba(255,255,255,0.05)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: f.iconBg ?? "rgba(26,82,160,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={15} color={f.iconColor ?? "rgba(255,255,255,0.85)"} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.white }}>{f.title}</div>
                    <div style={{ fontSize: 11, fontWeight: 300, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{f.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: 11, fontWeight: 300, color: "rgba(255,255,255,0.2)", position: "relative", zIndex: 1 }}>
            {leftFooter}
          </p>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ backgroundColor: t.surface, display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ width: "100%", maxWidth: 420, background: t.white, borderRadius: 18, border: `1px solid ${t.border}`, padding: "36px 40px", boxShadow: "0 4px 24px rgba(15,32,68,0.06)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
              {cardBrand}
              {cardTag && (
                <span style={{ fontSize: 11, fontWeight: 500, color: t.muted, letterSpacing: "0.03em" }}>{cardTag}</span>
              )}
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 700, color: t.navy, letterSpacing: -0.4, marginBottom: 5 }}>
              {cardTitle}
            </h2>
            <p style={{ fontSize: 13, fontWeight: 300, color: t.muted, marginBottom: 22, lineHeight: 1.6 }}>
              {cardSubtitle}
            </p>

            {children}

            {/* Trust Strip */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 20, paddingTop: 18, borderTop: "1px solid #E8EDF6" }}>
              {TRUST_ITEMS.map(({ Icon, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: t.placeholder }}>
                  <Icon size={12} color={t.placeholder} strokeWidth={1.8} />
                  {label}
                </div>
              ))}
            </div>

            {footer && <div style={{ marginTop: 16 }}>{footer}</div>}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/**
 * Themed primitives matching the DSM365 card aesthetic — use inside <PortalLoginLayout> children.
 */
export const portalInputStyle: React.CSSProperties = {
  width: "100%",
  border: `1.5px solid ${portalTokens.border}`,
  borderRadius: 9,
  padding: "12px 14px",
  fontSize: 14,
  fontWeight: 400,
  color: portalTokens.navy,
  backgroundColor: portalTokens.white,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

export const portalLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "#374151",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  display: "block",
  marginBottom: 7,
};

export function portalInputFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = portalTokens.blue;
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,82,160,0.09)";
}
export function portalInputBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = portalTokens.border;
  e.currentTarget.style.boxShadow = "none";
}
