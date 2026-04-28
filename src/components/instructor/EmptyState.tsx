import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Optional CTA button shown beneath the body copy. */
  ctaLabel?: string;
  onCtaPress?: () => void;
  iconColor?: string;
  /** @deprecated retained for backward compatibility, no longer used. */
  iconBg?: string;
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  ctaLabel,
  onCtaPress,
  iconColor = "#C7C7CC",
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center text-center shadow-premium"
      style={{
        background: "#FFFFFF",
        borderRadius: 14,
        padding: "36px 20px",
        gap: 14,
        fontFamily: FONT_STACK,
      }}
    >
      <Icon size={64} strokeWidth={1.4} color={iconColor} aria-hidden />
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#6E6E73",
            letterSpacing: "0.3px",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 13,
              color: "#6E6E73",
              lineHeight: 1.45,
              maxWidth: 280,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {ctaLabel && onCtaPress && (
        <button
          type="button"
          onClick={onCtaPress}
          style={{
            marginTop: 4,
            background: "#2B7BC8",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 10,
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: FONT_STACK,
          }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
