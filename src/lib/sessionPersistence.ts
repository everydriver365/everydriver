/**
 * Remember-me / session persistence helper.
 *
 * Supabase always persists sessions to localStorage. To honour an unchecked
 * "Remember me" we layer a sentinel on top:
 *
 *  - Wrapped apps (Despia / Capacitor / standalone PWA / WebView) ALWAYS keep
 *    the session. Installing the app to the home screen is itself an opt-in,
 *    and WebView sessionStorage gets wiped on every cold launch — silently
 *    signing the user out is wrong.
 *  - In a regular browser, an unchecked "Remember me" + a fresh browser
 *    session (no in-tab sentinel) clears the Supabase session locally.
 */

import { supabase } from "@/integrations/supabase/client";
import { isWrappedApp, clearBiometricCredentials, type BiometricScope } from "@/lib/biometricAuth";

const REMEMBER_KEY = "auth_remember_me";
const SESSION_SENTINEL = "auth_session_alive";

/** Record the user's "Remember me" preference at sign-in time. */
export function setRememberMe(remember: boolean) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? "true" : "false");
    // Always drop the sentinel so the current tab/window keeps the session
    // alive regardless of the choice. The choice only matters on the NEXT
    // browser session.
    sessionStorage.setItem(SESSION_SENTINEL, "1");
  } catch {
    // Ignore storage errors (private mode, etc.)
  }
}

/** Read the stored preference. Defaults to true (legacy behaviour). */
export function getRememberMe(): boolean {
  try {
    const v = localStorage.getItem(REMEMBER_KEY);
    return v === null ? true : v === "true";
  } catch {
    return true;
  }
}

/**
 * Call once at app start (before any auth-gated UI renders). Wrapped apps are
 * exempt. In a regular browser, an unchecked "Remember me" with no in-tab
 * sentinel triggers a local sign-out so the saved Supabase session does not
 * auto-restore.
 */
export async function enforceRememberMeOnBoot(): Promise<void> {
  try {
    // Wrapped apps (Despia, Capacitor, PWA) always remember.
    if (isWrappedApp()) {
      try { sessionStorage.setItem(SESSION_SENTINEL, "1"); } catch {}
      return;
    }
    const remember = getRememberMe();
    if (remember) {
      // Keep the sentinel fresh so a later toggle doesn't blow away the live session.
      try { sessionStorage.setItem(SESSION_SENTINEL, "1"); } catch {}
      return;
    }
    const alive = sessionStorage.getItem(SESSION_SENTINEL);
    if (alive) return; // same tab/window session — keep them signed in
    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
  } catch {
    // No-op
  }
}

/** Clear preference (e.g. on explicit sign-out). */
export function clearRememberMe() {
  try {
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(SESSION_SENTINEL);
  } catch {
    // ignore
  }
}

/**
 * Convenience: forget both the remember-me preference AND any stored
 * quick-sign-in credentials for the given scope. Call from explicit
 * "Sign out" buttons.
 */
export async function clearAuthPersistence(scope: BiometricScope): Promise<void> {
  await clearBiometricCredentials(scope).catch(() => undefined);
  clearRememberMe();
}
