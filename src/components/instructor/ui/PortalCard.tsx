import { type ReactNode, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * PortalCard — single elevation, single radius, no nested borders.
 * Reads from --portal-* tokens (see index.css). Only used inside .instructor-portal.
 *
 * Variants:
 *  - "elevated" (default): white surface, soft shadow
 *  - "flat":               white surface, hairline border, no shadow
 *  - "soft":               muted surface, no shadow (for grouping inside a parent card)
 */
export interface PortalCardProps {
  children: ReactNode;
  variant?: "elevated" | "flat" | "soft";
  className?: string;
  style?: CSSProperties;
  as?: "div" | "section" | "article";
}

export function PortalCard({
  children,
  variant = "elevated",
  className,
  style,
  as: Tag = "div",
}: PortalCardProps) {
  const variantClass =
    variant === "flat"
      ? "portal-card--flat"
      : variant === "soft"
        ? "portal-card--soft"
        : "portal-card";

  return (
    <Tag className={cn(variantClass, className)} style={style}>
      {children}
    </Tag>
  );
}
