/**
 * Boot probe — no-op stubs.
 *
 * The visible diagnostic overlay was used to debug white-screen-on-launch
 * inside the Despia/WKWebView wrapper. The issue is resolved, so the probe
 * is disabled. Stubs are kept so call sites (lazyWithRetry, RoleRedirect,
 * main.tsx) continue to compile without modification.
 */

export function bootProbeLog(_line: string): void {
  /* no-op */
}

export function installBootProbe(): void {
  /* no-op */
}

export function markBootProbeMounted(): void {
  /* no-op */
}
