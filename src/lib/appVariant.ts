import { isEveryDriverHost, isWhitelabelDomain } from "@/lib/whitelabel";
import {
  isDrive365Domain,
  isInstructorSubdomain,
  isAccessibleDomain,
} from "@/components/DomainRouter";

export type AppVariant = "instructor" | "pupil" | "marketing";

const STORAGE_KEY = "lovable_app_variant";

export function rememberAppVariant(variant: AppVariant): void {
  if (variant === "marketing") return;
  try {
    localStorage.setItem(STORAGE_KEY, variant);
  } catch {
    /* ignore */
  }
}

function getStoredVariant(): AppVariant | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "instructor" || v === "pupil" ? v : null;
  } catch {
    return null;
  }
}

/**
 * Detect which "app" the user is currently using.
 *
 * Order of precedence:
 *  1. Current URL path (the most explicit signal).
 *  2. Hostname (instructor vs learner domains).
 *  3. Persisted hint from a previous session (used by the native Capacitor
 *     build, which serves both apps from the same URL).
 *  4. Fallback: "marketing" — keep the original landing-page behaviour.
 */
export function getAppVariant(): AppVariant {
  if (typeof window === "undefined") return "marketing";

  const path = window.location.pathname.toLowerCase();

  if (path.startsWith("/instructor")) return "instructor";
  if (
    path.startsWith("/pupil") ||
    path.startsWith("/login") ||
    path.startsWith("/booking") ||
    path.startsWith("/book/") ||
    path.startsWith("/learner-app")
  ) {
    return "pupil";
  }

  if (isEveryDriverHost()) return "instructor";

  if (
    isAccessibleDomain() ||
    isWhitelabelDomain() ||
    isInstructorSubdomain() ||
    isDrive365Domain()
  ) {
    return "pupil";
  }

  const stored = getStoredVariant();
  if (stored) return stored;

  return "marketing";
}
