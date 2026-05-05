/**
 * Remember-me / session persistence helper.
 *
 * Supabase always persists sessions to localStorage (see client.ts), so by default
 * users stay signed in across browser restarts. To honour an unchecked
 * "Remember me" checkbox we layer a sentinel on top:
 *
 *  - On login we record the user's choice in localStorage (`auth_remember_me`).
 *  - When "Remember me" is OFF we also drop a sentinel in sessionStorage. That
 *    sentinel lives only for the current tab/window session. On the next app
 *    boot, if the choice is OFF and the sentinel is gone (i.e. the browser was
 *    closed), we clear the Supabase session locally so the user has to sign in
 *    again. When ON we leave everything alone — the existing localStorage
 *    session keeps them signed in indefinitely.
 *
 * This works for every portal (instructor, pupil, admin, school) because they
 * all share the same Supabase auth storage.
 */

import { supabase } from "@/integrations/supabase/client";

const REMEMBER_KEY = "auth_remember_me";
const SESSION_SENTINEL = "auth_session_alive";

/** Record the user's "Remember me" preference at sign-in time. */
export function setRememberMe(remember: boolean) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? "true" : "false");
    if (remember) {
      sessionStorage.removeItem(SESSION_SENTINEL);
    } else {
      sessionStorage.setItem(SESSION_SENTINEL, "1");
    }
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
 * Call once at app start (before any auth-gated UI renders). If the user opted
 * out of "Remember me" and the browser session sentinel is missing, sign them
 * out locally so the saved Supabase session does not auto-restore.
 */
export async function enforceRememberMeOnBoot(): Promise<void> {
  try {
    const remember = getRememberMe();
    if (remember) return;
    const alive = sessionStorage.getItem(SESSION_SENTINEL);
    if (alive) return; // same tab/window session — keep them signed in
    // New browser session and they did not tick remember-me → clear the session.
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
