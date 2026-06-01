import { Capacitor } from "@capacitor/core";

export type PreflightResult = {
  ok: boolean;
  platform: "native-ios" | "native-android" | "web";
  reason?: string;
  /** Soft = warn-only (web); Hard = strongly recommend cancel (native without permission) */
  severity: "ok" | "soft" | "hard";
};

/**
 * Checks whether background GPS is actually likely to work before a lesson
 * starts. Does NOT request permission — purely a diagnostic so we can warn
 * the instructor before they head off and discover no route was recorded.
 */
export async function preflightGps(): Promise<PreflightResult> {
  const isNative = Capacitor.isNativePlatform();
  const platform: PreflightResult["platform"] = isNative
    ? Capacitor.getPlatform() === "ios" ? "native-ios" : "native-android"
    : "web";

  if (isNative) {
    try {
      // Dynamic import via variable so TypeScript doesn't require the optional plugin's types
      const modName = "@capacitor/geolocation";
      const { Geolocation } = await (new Function("m", "return import(m)") as any)(modName);
      const perms = await Geolocation.checkPermissions();
      if (perms.location !== "granted") {
        return {
          ok: false,
          platform,
          severity: "hard",
          reason: "Location permission is not granted. Your lesson route won't be tracked.",
        };
      }
      return { ok: true, platform, severity: "ok" };
    } catch (e) {
      return {
        ok: false,
        platform,
        severity: "hard",
        reason: "Couldn't check location permission. Tracking may not work.",
      };
    }
  }

  // Web path — browsers pause Geolocation watchers when the tab is backgrounded
  try {
    if ("permissions" in navigator) {
      const status = await (navigator as any).permissions.query({ name: "geolocation" });
      if (status.state !== "granted") {
        return {
          ok: false,
          platform,
          severity: "soft",
          reason: "You're in a browser and location isn't granted — tracking won't run in the background.",
        };
      }
    }
    return {
      ok: false,
      platform,
      severity: "soft",
      reason: "You're in a browser — tracking will pause if the tab is backgrounded. Use the installed app for reliable lesson tracking.",
    };
  } catch {
    return { ok: true, platform, severity: "ok" };
  }
}
