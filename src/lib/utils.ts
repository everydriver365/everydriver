import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert kilometers to miles
export function kmToMiles(km: number): number {
  return km * 0.621371;
}

// Convert km/h to mph
export function kmhToMph(kmh: number): number {
  return kmh * 0.621371;
}

// Format distance in miles with unit
export function formatMiles(km: number | null | undefined, decimals: number = 1): string {
  if (km == null) return "—";
  return `${kmToMiles(km).toFixed(decimals)} mi`;
}

// Format speed in mph with unit
export function formatMph(kmh: number | null | undefined): string {
  if (kmh == null) return "—";
  return `${Math.round(kmhToMph(kmh))} mph`;
}

/** Strip internal parenthetical labels like "(manual assign)" from instructor names. */
export function cleanInstructorName(name: string | null | undefined): string {
  if (!name) return "";
  return name.replace(/\s*\(.*?\)\s*/g, "").trim();
}

/** Decode HTML entities (e.g. &#038; → &) in a string. */
export function decodeHtml(html: string | null | undefined): string {
  if (!html) return "";
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}
