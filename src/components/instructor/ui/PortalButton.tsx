import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PortalButton — unified primary / secondary action button.
 * Reads --portal-accent and matches the radius / shadow tokens.
 *
 * - "primary"   : accent fill, used for THE single primary action per screen
 * - "secondary" : white surface, hairline border
 * - "ghost"     : transparent, used inline with text
 *
 * Tap feedback (scale 0.98 in 180ms) is supplied automatically by the
 * `.instructor-portal button:active` global rule in index.css.
 */
export interface PortalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

export const PortalButton = forwardRef<HTMLButtonElement, PortalButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      leadingIcon,
      trailingIcon,
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    const base =
      "inline-flex items-center justify-center gap-2 font-semibold cursor-pointer disabled:cursor-not-allowed";
    const sizeCls = size === "lg" ? "px-5 py-4 text-[15px]" : "px-4 py-3 text-[14px]";
    const widthCls = fullWidth ? "w-full" : "";

    const variantCls =
      variant === "primary"
        ? "portal-btn-primary"
        : variant === "secondary"
          ? "portal-btn-secondary"
          : "bg-transparent text-[var(--portal-accent,#2B7BC8)]";

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(base, variantCls, sizeCls, widthCls, className)}
        {...rest}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          leadingIcon
        )}
        <span>{children}</span>
        {trailingIcon}
      </button>
    );
  },
);
PortalButton.displayName = "PortalButton";
