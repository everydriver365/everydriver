/**
 * Native deep-link handling for iOS and Android.
 *
 * Supabase reset-password and signup-confirmation emails embed a URL that
 * points at our web origin (`https://drive365.co.uk/reset-password?...` or
 * `/auth/redirect?...`). When that URL is opened on a device that has the
 * Drive365 / DSM app installed via Universal Links (iOS) or App Links
 * (Android), the OS hands the URL to the app instead of the browser.
 *
 * This module:
 *   1. Listens for `appUrlOpen` events from `@capacitor/app`.
 *   2. Exchanges any Supabase auth code / recovery tokens carried in the URL
 *      so the session is live before we navigate.
 *   3. Routes the in-app router to the correct screen (reset-password,
 *      auth/redirect, instructor-app/signup, etc.) and clears any transient
 *      login-page error state so the user lands on a clean screen.
 *
 * On the web (non-native) it is a no-op — Supabase's normal hash-based flow
 * runs in the browser as usual.
 */

import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import type { NavigateFunction } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/** Event dispatched on `window` whenever a deep link is consumed.
 *  Login pages listen for it to clear their local error/success state. */
export const DEEPLINK_EVENT = "auth-deeplink-arrived";

/** Paths we know how to route to from a deep link. Anything else falls
 *  back to the root and the normal router takes over. */
const KNOWN_AUTH_PATHS = [
  "/reset-password",
  "/auth/redirect",
  "/instructor-app/signup",
  "/instructor-app/login",
  "/instructor/login",
  "/admin/login",
  "/school/login",
  "/pupil/login",
];

interface ParsedDeepLink {
  path: string;
  search: string;
  hash: string;
  code: string | null;
  /** Tokens carried in the URL hash (legacy Supabase implicit flow). */
  accessToken: string | null;
  refreshToken: string | null;
  type: string | null;
}

function parseDeepLink(rawUrl: string): ParsedDeepLink | null {
  try {
    const url = new URL(rawUrl);
    // Hash params come after `#` and use URL-encoded form
    const hashParams = new URLSearchParams(
      url.hash.startsWith("#") ? url.hash.slice(1) : url.hash,
    );
    return {
      path: url.pathname || "/",
      search: url.search,
      hash: url.hash,
      code: url.searchParams.get("code"),
      accessToken: hashParams.get("access_token"),
      refreshToken: hashParams.get("refresh_token"),
      type:
        url.searchParams.get("type") ?? hashParams.get("type"),
    };
  } catch {
    return null;
  }
}

/** Try every known token-exchange path so the session is live before the
 *  user lands on the destination screen. Failures are logged but never
 *  block navigation — the destination page can still surface its own
 *  "link expired" message via `onAuthStateChange`. */
async function consumeAuthTokens(parsed: ParsedDeepLink): Promise<void> {
  // PKCE flow → ?code=...
  if (parsed.code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(parsed.code);
      if (error) console.warn("[deepLinks] exchangeCodeForSession failed", error);
    } catch (err) {
      console.warn("[deepLinks] exchangeCodeForSession threw", err);
    }
    return;
  }
  // Implicit / recovery flow → #access_token=...&refresh_token=...
  if (parsed.accessToken && parsed.refreshToken) {
    try {
      const { error } = await supabase.auth.setSession({
        access_token: parsed.accessToken,
        refresh_token: parsed.refreshToken,
      });
      if (error) console.warn("[deepLinks] setSession failed", error);
    } catch (err) {
      console.warn("[deepLinks] setSession threw", err);
    }
  }
}

/** Strip auth-sensitive params (code, tokens) from the URL we navigate to,
 *  so they don't end up in the browser history. The `portal` query is
 *  preserved so ResetPassword/RoleRedirectPage know which login to return
 *  the user to. */
function buildSafeTarget(parsed: ParsedDeepLink): string {
  const search = new URLSearchParams(parsed.search);
  search.delete("code");
  search.delete("type");
  // Drop refresh/access tokens if a provider ever puts them in the query
  search.delete("access_token");
  search.delete("refresh_token");
  const qs = search.toString();
  const path = KNOWN_AUTH_PATHS.includes(parsed.path) ? parsed.path : "/";
  return qs ? `${path}?${qs}` : path;
}

/** Install the deep-link listener. Returns a cleanup function. */
export function installDeepLinkHandler(navigate: NavigateFunction): () => void {
  if (!Capacitor.isNativePlatform()) {
    // Web/preview: nothing to do — Supabase JS already auto-consumes
    // tokens from window.location.hash on load.
    return () => {};
  }

  let handle: { remove: () => Promise<void> } | null = null;

  const handler = async (event: URLOpenListenerEvent) => {
    const parsed = parseDeepLink(event.url);
    if (!parsed) return;

    // Notify any mounted login page to clear its error/success banners
    // before we navigate away (or alongside the navigation).
    try {
      window.dispatchEvent(
        new CustomEvent(DEEPLINK_EVENT, { detail: { path: parsed.path } }),
      );
    } catch {
      // CustomEvent unsupported (ancient WebView) — ignore.
    }

    await consumeAuthTokens(parsed);

    const target = buildSafeTarget(parsed);
    navigate(target, { replace: true });
  };

  App.addListener("appUrlOpen", handler).then((h) => {
    handle = h;
  });

  return () => {
    handle?.remove().catch(() => undefined);
  };
}
