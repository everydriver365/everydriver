/**
 * DSM brand mark — official logo image.
 *
 * Used in the global app header and re-usable on splash / login / share
 * cards. Image is rendered at the requested edge size, preserving aspect.
 */

import type { CSSProperties } from "react";
import dsmLogoSrc from "@/assets/dsm-logo.png";

export interface DsmLogoProps {
  /** Target height in px. Defaults to 24. Width scales to preserve aspect. */
  size?: number;
  /** Reserved for backwards compatibility — image is theme-agnostic. */
  dark?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function DsmLogo({ size = 24, className, style }: DsmLogoProps) {
  return (
    <img
      src={dsmLogoSrc}
      alt="DSM"
      className={className}
      style={{
        height: size,
        width: "auto",
        flexShrink: 0,
        display: "inline-block",
        ...style,
      }}
    />
  );
}
