/**
 * Brand mark for the instructor portal header.
 *
 * Per-instructor branding: if the signed-in instructor has uploaded their
 * own logo (instructors.logo_url), that is rendered. Otherwise we fall
 * back to the platform DSM mark so unbranded accounts still look complete.
 */

import type { CSSProperties } from "react";
import dsmLogoSrc from "@/assets/dsm-logo.png";
import { useInstructorAuth } from "@/context/InstructorAuthContext";

export interface DsmLogoProps {
  /** Target height in px. Defaults to 24. Width scales to preserve aspect. */
  size?: number;
  /** Reserved for backwards compatibility — image is theme-agnostic. */
  dark?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function DsmLogo({ size = 24, className, style }: DsmLogoProps) {
  // Hook may be undefined on routes outside the InstructorAuthProvider — guard.
  let logoUrl: string | null = null;
  let altName = "DSM";
  try {
    const { instructor } = useInstructorAuth();
    if (instructor?.logo_url) logoUrl = instructor.logo_url;
    if (instructor?.name) altName = instructor.name;
  } catch {
    // No provider in scope — fall back to DSM mark.
  }

  return (
    <img
      src={logoUrl || dsmLogoSrc}
      alt={altName}
      className={className}
      style={{
        height: size,
        width: "auto",
        flexShrink: 0,
        display: "inline-block",
        objectFit: "contain",
        ...style,
      }}
    />
  );
}
