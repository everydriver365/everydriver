/**
 * Boot probe — visible diagnostic overlay used to debug white-screen-on-launch
 * inside native wrappers (Despia / WKWebView) where we can't open devtools.
 *
 * Auto-hides 4s after React signals a successful mount via
 * `markBootProbeMounted()`. Errors keep it visible.
 */

const PROBE_ID = "__boot_probe";
const MAX_LINES = 12;

let enabled = false;
let buffer: string[] = [];
let mountedAt: number | null = null;
let hideTimer: number | null = null;

function ts(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

function ensureNode(): HTMLDivElement | null {
  if (typeof document === "undefined") return null;
  let el = document.getElementById(PROBE_ID) as HTMLDivElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = PROBE_ID;
    el.setAttribute("style", [
      "position:fixed",
      "top:0",
      "left:0",
      "right:0",
      "z-index:2147483647",
      "background:rgba(0,0,0,0.85)",
      "color:#0f0",
      "font:11px/1.35 -apple-system,monospace",
      "padding:6px 8px",
      "max-height:50vh",
      "overflow:auto",
      "white-space:pre-wrap",
      "pointer-events:auto",
      "word-break:break-word",
    ].join(";"));
    // Tap to dismiss manually
    el.addEventListener("click", () => {
      el?.remove();
    });
    if (document.body) {
      document.body.appendChild(el);
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        if (el && document.body && !document.getElementById(PROBE_ID)) {
          document.body.appendChild(el);
        }
      });
    }
  }
  return el;
}

function render(): void {
  if (!enabled) return;
  const el = ensureNode();
  if (!el) return;
  el.textContent = buffer.slice(-MAX_LINES).join("\n");
}

export function bootProbeLog(line: string): void {
  if (!enabled) return;
  buffer.push(`[${ts()}] ${line}`);
  render();
}

export function installBootProbe(): void {
  if (typeof window === "undefined") return;
  enabled = true;

  bootProbeLog("JS started");
  try {
    const buildTime = (window as unknown as { __BUILD_TIME__?: string }).__BUILD_TIME__;
    if (buildTime) bootProbeLog(`build=${buildTime}`);
    bootProbeLog(`ua=${(navigator.userAgent || "").slice(0, 90)}`);
    bootProbeLog(`url=${window.location.href}`);
  } catch {
    /* ignore */
  }

  window.addEventListener("error", (e: any) => {
    const tgt = e?.target;
    // Resource load errors (script/img/link) — capture src/href
    if (tgt && tgt !== window && (tgt.src || tgt.href)) {
      const url = (tgt.src || tgt.href || "").toString();
      bootProbeLog(`RES-ERR <${tgt.tagName}> ${url.slice(-90)}`);
      return;
    }
    const msg = e?.error?.message || e?.message || "unknown error";
    const src = e?.filename ? ` @ ${e.filename}:${e.lineno || "?"}` : "";
    bootProbeLog(`ERROR ${msg}${src}`);
    const stack = e?.error?.stack;
    if (typeof stack === "string") {
      stack.split("\n").slice(0, 3).forEach((s) => bootProbeLog(`  ${s.trim()}`));
    }
  }, true);

  window.addEventListener("unhandledrejection", (e) => {
    const r = (e as PromiseRejectionEvent).reason;
    const msg = r?.message || (typeof r === "string" ? r : JSON.stringify(r ?? "")).slice(0, 200);
    bootProbeLog(`UNHANDLED ${msg}`);
    const stack = r?.stack;
    if (typeof stack === "string") {
      stack.split("\n").slice(0, 3).forEach((s) => bootProbeLog(`  ${s.trim()}`));
    }
  });
}

export function markBootProbeMounted(): void {
  if (!enabled) return;
  if (mountedAt) return;
  mountedAt = Date.now();
  bootProbeLog("React mounted");
  if (hideTimer) window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    const el = document.getElementById(PROBE_ID);
    if (el) el.remove();
  }, 15000);
}
