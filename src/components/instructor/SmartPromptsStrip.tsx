import { LucideIcon, Car, CloudRain, MessageCircle, PoundSterling, BookOpen, AlertTriangle } from "lucide-react";
import { a11yPx } from "@/lib/a11yScale";

export type PromptTone = "amber" | "blue" | "green" | "red";

export interface SmartPrompt {
  id: string;
  tone: PromptTone;
  icon: LucideIcon;
  text: string;
  cta?: { label: string; onClick: () => void };
  /** Lower number = higher priority (rendered first). */
  priority: number;
}

const toneStyles: Record<PromptTone, { bg: string; border: string; fg: string; iconFg: string; ctaBg: string; ctaFg: string }> = {
  red:   { bg: "rgba(255,59,48,0.08)",  border: "rgba(255,59,48,0.18)",  fg: "#7A1F1A", iconFg: "#FF3B30", ctaBg: "#FF3B30", ctaFg: "#FFFFFF" },
  amber: { bg: "rgba(255,149,0,0.10)",  border: "rgba(255,149,0,0.20)",  fg: "#6B3E00", iconFg: "#FF9500", ctaBg: "#FF9500", ctaFg: "#FFFFFF" },
  blue:  { bg: "rgba(0,122,255,0.08)",  border: "rgba(0,122,255,0.18)",  fg: "#0A3D7A", iconFg: "#007AFF", ctaBg: "#007AFF", ctaFg: "#FFFFFF" },
  green: { bg: "rgba(52,199,89,0.10)",  border: "rgba(52,199,89,0.20)",  fg: "#0F4F2B", iconFg: "#34C759", ctaBg: "#34C759", ctaFg: "#FFFFFF" },
};

interface SmartPromptsStripProps {
  prompts: SmartPrompt[];
  /** Max prompts to display at once (default 2). */
  max?: number;
}

/**
 * Compact iOS-style alert strips shown directly under the main lesson card.
 * Renders the top N prompts ordered by priority. Hides itself entirely when
 * there is nothing relevant to surface.
 */
export function SmartPromptsStrip({ prompts, max = 2 }: SmartPromptsStripProps) {
  if (!prompts.length) return null;
  const top = [...prompts].sort((a, b) => a.priority - b.priority).slice(0, max);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {top.map((p) => {
        const t = toneStyles[p.tone];
        const Icon = p.icon;
        return (
          <div
            key={p.id}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: t.bg, border: `0.5px solid ${t.border}`,
              borderRadius: 14, padding: "10px 12px",
            }}
          >
            <span
              aria-hidden
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 26, height: 26, borderRadius: 999,
                background: "rgba(255,255,255,0.7)", color: t.iconFg, flexShrink: 0,
              }}
            >
              <Icon style={{ width: 14, height: 14 }} strokeWidth={2.2} />
            </span>
            <span style={{
              flex: 1, minWidth: 0,
              fontSize: a11yPx(13), fontWeight: 500, color: t.fg,
              letterSpacing: -0.1, lineHeight: 1.25,
            }}>
              {p.text}
            </span>
            {p.cta && (
              <button
                onClick={(e) => { e.stopPropagation(); p.cta!.onClick(); }}
                style={{
                  flexShrink: 0, border: "none", cursor: "pointer",
                  background: t.ctaBg, color: t.ctaFg,
                  borderRadius: 999, padding: "6px 12px",
                  fontSize: a11yPx(12), fontWeight: 600, letterSpacing: -0.08,
                }}
              >
                {p.cta.label}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Re-export icons commonly used by callers building the prompt list.
export const SmartPromptIcons = { Car, CloudRain, MessageCircle, PoundSterling, BookOpen, AlertTriangle };
