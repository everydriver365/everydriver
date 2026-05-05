import { useEffect, useState, useCallback } from "react";

export type LocationPermissionStatus = "unknown" | "prompt" | "granted" | "denied" | "unavailable";

/**
 * Cross-browser location permission state with a request helper.
 * Uses Permissions API where available, falls back to a one-shot
 * getCurrentPosition probe.
 */
export function useLocationPermission() {
  const [status, setStatus] = useState<LocationPermissionStatus>("unknown");
  const [error, setError] = useState<string | null>(null);

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
        res.onchange = () => setStatus(map[res.state] ?? "prompt");
        return next;
      }
    } catch {
      // ignore
    }
    setStatus("prompt");
    return "prompt" as const;
  }, []);

  useEffect(() => {
    probe();
  }, [probe]);

  const request = useCallback(async (): Promise<LocationPermissionStatus> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return "unavailable";
    }
    setError(null);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setStatus("granted");
          resolve("granted");
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setStatus("denied");
            setError("Location permission was denied.");
            resolve("denied");
          } else {
            setError(err.message || "Unable to read location.");
            setStatus("prompt");
            resolve("prompt");
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  }, []);

  return { status, error, request, refresh: probe };
}
