// Force Vite dev server restart
declare const __BUILD_TIME__: string;

// Boot probe FIRST — before any other import side effects — so we can catch
// errors thrown during module evaluation inside the Despia/WKWebView wrapper.
import { installBootProbe, bootProbeLog, markBootProbeMounted } from "./lib/bootProbe";
installBootProbe();

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";
import "./i18n";
import { ThemeProvider } from "./context/ThemeContext";
import { InstructorThemeProvider } from "./context/InstructorThemeContext";
import { AppErrorBoundary } from "@/components/common/AppErrorBoundary";
import { WhitelabelTheme } from "@/components/WhitelabelTheme";
import { detectNativeWrapper } from "@/hooks/useIsNativeWrapper";
import { installQueryBudget } from "@/lib/queryBudget";
import { enforceRememberMeOnBoot } from "@/lib/sessionPersistence";
import { installBundleRefresh } from "@/lib/bundleRefresh";

bootProbeLog("imports resolved");

// Honour the "Remember me" choice before any auth-gated UI mounts.
void enforceRememberMeOnBoot();

// Wire cache-busting: re-check the bundle hash on app resume / tab visible
// without registering a second global auth listener.
installBundleRefresh();

if (import.meta.env.DEV) {
  installQueryBudget();
}

// When the app is loaded inside a native wrapper (Despia / Capacitor / WebView)
// unregister any service workers AND clear Cache Storage so cached assets from
// a previous browser/PWA visit don't pin the wrapper to a stale bundle.
// Native push and asset delivery are handled by the wrapper itself.
if (typeof window !== "undefined" && detectNativeWrapper()) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister().catch(() => {}));
    }).catch(() => {});
  }
  if ("caches" in window) {
    caches.keys().then((keys) => {
      keys.forEach((k) => caches.delete(k).catch(() => {}));
    }).catch(() => {});
  }
  // Expose build time for in-app diagnostics — check `window.__BUILD_TIME__`
  // in the WebView console to confirm which bundle is actually running.
  try {
    (window as unknown as { __BUILD_TIME__?: string }).__BUILD_TIME__ =
      typeof __BUILD_TIME__ === "string" ? __BUILD_TIME__ : undefined;
    // eslint-disable-next-line no-console
    console.info("[build]", (window as unknown as { __BUILD_TIME__?: string }).__BUILD_TIME__);
  } catch {
    /* ignore */
  }
}

// Configure native status bar to match the page background instead of black.
if (typeof window !== "undefined" && detectNativeWrapper()) {
  import("@capacitor/status-bar")
    .then(({ StatusBar, Style }) => {
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
      StatusBar.setBackgroundColor({ color: "#F4F7F6" }).catch(() => {});
      // Light background → dark content (Style.Dark = dark text/icons)
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    })
    .catch(() => {});
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <InstructorThemeProvider>
      <AppErrorBoundary>
        <WhitelabelTheme />
        <App />
      </AppErrorBoundary>
    </InstructorThemeProvider>
  </ThemeProvider>
);

// Signal a successful React mount so the boot probe can auto-hide.
// Wrapped in rAF so we run after the first paint, not just after createRoot returns.
if (typeof requestAnimationFrame !== "undefined") {
  requestAnimationFrame(() => markBootProbeMounted());
} else {
  setTimeout(() => markBootProbeMounted(), 0);
}

