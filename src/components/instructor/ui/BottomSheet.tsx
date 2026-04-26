import { ReactNode, useEffect } from "react";
import { CloseButton } from "@/components/instructor/ui/CloseButton";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Roboto", sans-serif';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** Eyebrow shown above the title. Optional. */
  eyebrow?: ReactNode;
  /** Sheet title. */
  title?: ReactNode;
  /** Subtitle below the title. Optional. */
  subtitle?: ReactNode;
  /** Sheet body content. */
  children: ReactNode;
  /** Footer slot — typically primary/secondary buttons. */
  footer?: ReactNode;
  /** Whether to render the close button (default true). */
  showClose?: boolean;
  /** Disable backdrop close (e.g. while sending). */
  dismissable?: boolean;
  /** Cap on body height — defaults to 70vh. */
  bodyMaxHeight?: string;
  ariaLabel?: string;
}

/**
 * Premium tile-system bottom sheet wrapper.
 *
 * Generic shell used by the gap-filler recipient picker, send confirmation,
 * and result screens. Header (eyebrow + title + subtitle + close), scrollable
 * body, sticky footer.
 */
export function BottomSheet({
  open,
  onClose,
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  showClose = true,
  dismissable = true,
  bodyMaxHeight = "70vh",
  ariaLabel,
}: BottomSheetProps) {
  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open || !dismissable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismissable, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(0,0,0,0.45)",
        fontFamily: FONT_STACK,
      }}
      onClick={() => {
        if (dismissable) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Header */}
        {(title || eyebrow || showClose) && (
          <div
            style={{
              padding: 16,
              borderBottom: "0.5px solid #E5E5EA",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              {eyebrow && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#6E6E73",
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}
                >
                  {eyebrow}
                </div>
              )}
              {title && (
                <div
                  style={{
                    fontSize: eyebrow ? 17 : 15,
                    fontWeight: 500,
                    color: "#000000",
                    letterSpacing: eyebrow ? -0.3 : -0.2,
                    margin: 0,
                    lineHeight: 1.25,
                  }}
                >
                  {title}
                </div>
              )}
              {subtitle && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#6E6E73",
                    marginTop: 2,
                    lineHeight: 1.35,
                  }}
                >
                  {subtitle}
                </div>
              )}
            </div>
            {showClose && <CloseButton onPress={onClose} />}
          </div>
        )}

        {/* Body */}
        <div
          style={{
            padding: 16,
            overflowY: "auto",
            maxHeight: bodyMaxHeight,
            flex: "1 1 auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: 16,
              borderTop: "0.5px solid #E5E5EA",
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
