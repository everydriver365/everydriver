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
