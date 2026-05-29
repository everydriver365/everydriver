/**
 * Bundle cache-busting for the wrapped WebView (Despia / Capacitor / PWA).
 *
 * Problem: after we publish a new build the WebView often keeps the old
 * `index.html` / hashed `index-XXXXX.js` in its HTTP cache, so users keep
 * running yesterday's bundle until they fully kill the app.
 *
 * Strategy:
 *   1. On boot, snapshot the hash of the main module script that loaded us
 *      (e.g. `/assets/index-9f3a21bc.js` → `9f3a21bc`).
 *   2. When the app resumes from background, becomes visible again, or the
 *      user just signed in, re-fetch `/index.html` with `cache: 'no-store'`
 *      and compare its main script hash to the snapshot.
 *   3. If they differ → unregister service workers, clear caches, and do a
 *      hard reload with a cache-bust query param so the WebView fetches the
 *      newest bundle.
 *
 * The check is throttled (60s) and silent — failures are non-fatal because
 * a stale-but-working bundle is always better than a broken refresh loop.
 */

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

const THROTTLE_MS = 60_000;
const RELOAD_KEY = "__bundleRefreshLastReload";
const CHECK_KEY = "__bundleRefreshLastCheck";

let bootSignature: string | null = null;
let installed = false;

/** Extract the hashed main-module filename from a document. Returns the
 *  first `<script type="module" src="/assets/index-*.js">` value, or null
 *  if we can't find one (dev mode, custom HTML, etc.). */
function extractMainScriptSig(doc: Document | string): string | null {
  const html = typeof doc === "string" ? doc : doc.documentElement.outerHTML;
  // Match Vite's hashed module entry. Fall back to any /assets/index-*.js.
  const m =
    html.match(/<script[^>]+type=["']module["'][^>]+src=["']([^"']*\/assets\/index-[^"']+\.js)["']/i) ||
    html.match(/src=["']([^"']*\/assets\/index-[^"']+\.js)["']/i);
  return m ? m[1] : null;
}

async function fetchRemoteSig(): Promise<string | null> {
  try {
    const res = await fetch(`/index.html?_=${Date.now()}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    const text = await res.text();
    return extractMainScriptSig(text);
  } catch {
    return null;
  }
}

async function hardReload(): Promise<void> {
  // Avoid a reload storm — if we already reloaded in the last 60s, skip.
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || "0");
    if (Date.now() - last < THROTTLE_MS) return;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    /* sessionStorage may be unavailable */
  }

  // Clear any service worker + Cache Storage so the next load is fresh.
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => {})));
    }
  } catch {
    /* non-fatal */
  }

  const url = new URL(window.location.href);
  url.searchParams.set("v", String(Date.now()));
  window.location.replace(url.toString());
}

async function checkForNewBundle(reason: string, bypassThrottle = false): Promise<void> {
  // Throttle checks so we don't hammer the network on rapid resume/visibility
  // events from the OS. Wrapped apps can bypass to update ASAP.
  if (!bypassThrottle) {
    try {
      const last = Number(sessionStorage.getItem(CHECK_KEY) || "0");
      if (Date.now() - last < THROTTLE_MS) return;
      sessionStorage.setItem(CHECK_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  } else {
    try {
      sessionStorage.setItem(CHECK_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }

  if (!bootSignature) return; // dev mode or unknown — never reload
  const remote = await fetchRemoteSig();
  if (!remote) return;
  if (remote === bootSignature) return;

  // eslint-disable-next-line no-console
  console.info(`[bundleRefresh] new bundle detected (${reason}); reloading`);
  await hardReload();
}

/** Wire up resume / visibility / sign-in listeners. Idempotent. */
export function installBundleRefresh(): void {
  if (installed) return;
  installed = true;

  bootSignature = extractMainScriptSig(document);
  // In dev (no hashed bundle) just bail — Vite HMR handles freshness.
  if (!bootSignature) return;

  const isNative = !!Capacitor?.isNativePlatform?.();
  const isWrapped =
    isNative ||
    (typeof window !== "undefined" &&
      (window.matchMedia?.("(display-mode: standalone)").matches ||
        // @ts-expect-error iOS Safari standalone flag
        window.navigator?.standalone === true));

  // Check shortly after boot so a stale wrapper bundle updates without
  // needing a resume or login event.
  setTimeout(() => {
    void checkForNewBundle("boot", isWrapped);
  }, isWrapped ? 1500 : 5000);

  // Web: tab becomes visible again (covers PWA install + browser tabs).
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void checkForNewBundle("visibilitychange", isWrapped);
    }
  });

  // Native: Capacitor app resume.
  if (isNative) {
    App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) void checkForNewBundle("appStateChange", true);
    }).catch(() => {});
    App.addListener("resume", () => {
      void checkForNewBundle("resume", true);
    }).catch(() => {});
  }
}

/** Call after a successful sign-in so the freshly authenticated session
 *  lands on the newest bundle. Safe to call repeatedly. */
export function checkBundleAfterLogin(): void {
  // Allow login to bypass the throttle once — clear the check timestamp.
  try {
    sessionStorage.removeItem(CHECK_KEY);
  } catch {
    /* ignore */
  }
  void checkForNewBundle("login");
}
