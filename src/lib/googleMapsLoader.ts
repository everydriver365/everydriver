import { supabase } from "@/integrations/supabase/client";

/** Load Google Maps JS SDK into the page (idempotent). */
export function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (w.google?.maps?.marker?.AdvancedMarkerElement) return resolve();
    if (w.google?.maps) {
      // Maps loaded but marker library missing — import it dynamically
      w.google.maps.importLibrary("marker").then(() => resolve()).catch(reject);
      return;
    }

    const existing = document.querySelector('script[data-google-maps="1"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google Maps script failed to load")));
      return;
    }

    const s = document.createElement("script");
    s.dataset.googleMaps = "1";
    s.async = true;
    s.defer = true;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=visualization,marker`;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Google Maps script failed to load"));
    document.head.appendChild(s);
  });
}

/** Fetch the Google Maps API key from the backend. */
export async function fetchGoogleMapsKey(): Promise<string> {
  const { data: session } = await supabase.auth.getSession();
  const jwt = session?.session?.access_token;
  if (!jwt) return "";

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const url = `https://${projectId}.supabase.co/functions/v1/get-google-maps-key`;

  const res = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${jwt}`,
    },
  });
  const data = await res.json();
  return data?.key || "";
}

/** Call snap-to-road edge function. */
export async function callSnapToRoad(
  points: Array<{ lat: number; lng: number }>
): Promise<Array<{ lat: number; lng: number }>> {
  if (!points || points.length < 2) {
    return points || [];
  }
  const { data: session } = await supabase.auth.getSession();
  const jwt = session?.session?.access_token ?? null;
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const url = `https://${projectId}.supabase.co/functions/v1/snap-to-road`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    body: JSON.stringify({ points, interpolate: true }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "Snap-to-road failed");

  return (data.snapped || [])
    .filter((p: any) => Number.isFinite(p?.lat) && Number.isFinite(p?.lng))
    .map((p: any) => ({ lat: p.lat, lng: p.lng }));
}

/** Convert km/h to mph */
export function kmhToMph(kmh: number | null) {
  if (!kmh) return 0;
  return Math.round(kmh * 0.621371);
}
