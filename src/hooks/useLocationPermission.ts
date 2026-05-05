import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logPhoneTrackingEvent } from "@/lib/phoneTrackingAudit";

export type LocationPermissionStatus = "unknown" | "prompt" | "granted" | "denied" | "unavailable";

interface Options {
  /** Persist status per (instructor, pupil). When provided, the hook seeds
   *  initial state from the DB and writes back on each change. */
  instructorId?: string | null;
  pupilId?: string | null;
}

/**
 * Cross-browser location permission state with a request helper.
 * Optionally persists the status per (instructor, pupil) in
 * `phone_tracking_permissions` so Phone tracking can resume immediately
 * once permission is granted.
 */
export function useLocationPermission(opts: Options = {}) {
  const { instructorId = null, pupilId = null } = opts;
  const [status, setStatus] = useState<LocationPermissionStatus>("unknown");
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const lastWrittenRef = useRef<LocationPermissionStatus | null>(null);

  const persist = useCallback(
    async (next: LocationPermissionStatus) => {
      if (!instructorId) return;
      if (lastWrittenRef.current === next) return;
      lastWrittenRef.current = next;
      const row: Record<string, any> = {
        instructor_id: instructorId,
        pupil_id: pupilId,
        status: next,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      };
      if (next === "granted") row.granted_at = new Date().toISOString();
      if (next === "denied") row.denied_at = new Date().toISOString();
      await supabase
        .from("phone_tracking_permissions")
        .upsert([row] as any, { onConflict: "instructor_id,pupil_id" });
      void logPhoneTrackingEvent({
        instructorId,
        pupilId,
        event: "permission_changed",
        status: next,
      });
    },
    [instructorId, pupilId],
  );

  const probe = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return "unavailable" as const;
    }
    try {
      // @ts-ignore
      if (navigator.permissions?.query) {
        // @ts-ignore
        const res = await navigator.permissions.query({ name: "geolocation" });
        const map: Record<string, LocationPermissionStatus> = {
          granted: "granted",
          denied: "denied",
          prompt: "prompt",
        };
        const next = map[res.state] ?? "prompt";
        setStatus(next);
        res.onchange = () => {
          const v = map[res.state] ?? "prompt";
          setStatus(v);
          void persist(v);
        };
        return next;
      }
    } catch {
      // ignore
    }
    setStatus("prompt");
    return "prompt" as const;
  }, [persist]);

  // Seed from persistent storage, then probe live state.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (instructorId) {
        let q = supabase
          .from("phone_tracking_permissions")
          .select("status")
          .eq("instructor_id", instructorId);
        q = pupilId ? q.eq("pupil_id", pupilId) : q.is("pupil_id", null);
        const { data } = await q.maybeSingle();
        if (!cancelled && data?.status) {
          setStatus(data.status as LocationPermissionStatus);
          lastWrittenRef.current = data.status as LocationPermissionStatus;
        }
      }
      const live = await probe();
      if (!cancelled) {
        setHydrated(true);
        // Reconcile DB with current OS-level state.
        void persist(live);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [instructorId, pupilId, probe, persist]);

  // Persist whenever status changes from outside the probe path.
  useEffect(() => {
    if (!hydrated) return;
    if (status === "unknown") return;
    void persist(status);
  }, [status, hydrated, persist]);

  const request = useCallback(async (): Promise<LocationPermissionStatus> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      setError("This device/browser doesn't expose GPS.");
      return "unavailable";
    }

    // Detect iframe without geolocation permissions-policy.
    const inIframe = typeof window !== "undefined" && window.self !== window.top;
    if (inIframe) {
      try {
        // @ts-ignore
        const allowed = document.featurePolicy?.allowsFeature?.("geolocation");
        if (allowed === false) {
          setStatus("denied");
          setError(
            "Location is blocked inside the preview iframe. Open the app in its own tab to allow location.",
          );
          return "denied";
        }
      } catch {
        /* ignore */
      }
    }

    setError(null);
    return new Promise((resolve) => {
      let settled = false;
      const finish = (next: LocationPermissionStatus, msg?: string) => {
        if (settled) return;
        settled = true;
        if (msg) setError(msg);
        setStatus(next);
        resolve(next);
      };

      // Hard fallback in case the browser never invokes either callback
      // (happens inside some sandboxed iframes / WebViews).
      const fallback = setTimeout(() => {
        finish(
          "denied",
          "No response from the location service. If you're inside a preview, open the app in its own tab.",
        );
      }, 12000);

      try {
        navigator.geolocation.getCurrentPosition(
          () => {
            clearTimeout(fallback);
            finish("granted");
          },
          (err) => {
            clearTimeout(fallback);
            if (err.code === err.PERMISSION_DENIED) {
              finish("denied", "Location permission was denied.");
            } else if (err.code === err.POSITION_UNAVAILABLE) {
              finish("prompt", "Location is currently unavailable. Try again outdoors.");
            } else if (err.code === err.TIMEOUT) {
              finish("prompt", "Timed out waiting for GPS. Try again.");
            } else {
              finish("prompt", err.message || "Unable to read location.");
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
      } catch (e: any) {
        clearTimeout(fallback);
        finish("denied", e?.message || "Browser blocked the location request.");
      }
    });
  }, []);

  return { status, error, request, refresh: probe, hydrated };
}
