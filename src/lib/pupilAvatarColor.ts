/**
 * Deterministic avatar background colour for a pupil.
 *
 * Single source of truth shared between the Pupils list, the Tracking
 * pupil-selector row, and any other surface that renders pupil avatars
 * — so the same pupil always gets the same colour across the app.
 *
 * Palette is the premium tile-system avatar palette (matches PupilCardStack).
 */

export const PUPIL_AVATAR_PALETTE = [
  "#3B8B3B", // green
  "#2B7BC8", // blue
  "#C8434F", // red
  "#8A5BC9", // purple
  "#B8801F", // amber
  "#6E6E73", // neutral
] as const;

export function pupilAvatarColor(seed: string | null | undefined): string {
  const value = (seed || "").trim();
  if (!value) return PUPIL_AVATAR_PALETTE[PUPIL_AVATAR_PALETTE.length - 1];
  const sum = value
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PUPIL_AVATAR_PALETTE[sum % PUPIL_AVATAR_PALETTE.length];
}

export function pupilAvatarInitial(name: string | null | undefined): string {
  const trimmed = (name || "").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}
