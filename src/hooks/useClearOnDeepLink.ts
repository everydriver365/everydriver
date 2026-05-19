import { useEffect } from "react";
import { DEEPLINK_EVENT } from "@/lib/deepLinks";

/**
 * Subscribe a login page to deep-link arrivals. When a Supabase reset or
 * signup link is opened from the email and routed into the app, this clears
 * any banner state on the currently-mounted login form so the user lands on
 * a clean screen.
 */
export function useClearOnDeepLink(clear: () => void) {
  useEffect(() => {
    const handler = () => clear();
    window.addEventListener(DEEPLINK_EVENT, handler);
    return () => window.removeEventListener(DEEPLINK_EVENT, handler);
  }, [clear]);
}
