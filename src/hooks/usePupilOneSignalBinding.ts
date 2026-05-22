import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { detectNativeWrapper } from "./useIsNativeWrapper";

/**
 * Inside the Despia native wrapper, bind the pupil's id to OneSignal as the
 * `external_id` alias, request push permission, and record a row in
 * `pupil_native_push_bindings` so the backend knows to send native pushes.
 *
 * On the web this is a no-op — web push handles browser pupils.
 *
 * Despia docs: https://setup.despia.com/lovable/native-features/onesignal
 * Sending docs: https://setup.despia.com/best-practices/backend/one-signal/user-session
 */
export function usePupilOneSignalBinding(pupilId: string | undefined | null) {
  useEffect(() => {
    if (!pupilId) return;
    if (!detectNativeWrapper()) return;

    let cancelled = false;

    const run = async () => {
      try {
        // The Despia bridge is exposed as `window.despia` when the WebView is
        // hosted inside the native shell. Call defensively — if the bridge is
        // missing we still record the binding so the backend can retry later.
        const w = window as any;
        const despiaCall: ((cmd: string, keys?: string[]) => Promise<any> | void) | undefined =
          typeof w.despia === "function"
            ? w.despia
            : typeof w.Despia?.call === "function"
              ? w.Despia.call.bind(w.Despia)
              : undefined;

        let permissionGranted = false;
        if (despiaCall) {
          try {
            // Prompt for push permission (no-op if already granted).
            await despiaCall("registerpush://");
          } catch {
            /* ignore */
          }
          try {
            const status = await despiaCall("checkNativePushPermissions://", [
              "nativePushEnabled",
            ]);
            permissionGranted = !!(status && (status as any).nativePushEnabled);
          } catch {
            /* ignore */
          }
          try {
            // Bind this device's OneSignal subscription to our pupil id so the
            // backend can target with include_aliases.external_id.
            await despiaCall(`setonesignalplayerid://?user_id=${encodeURIComponent(pupilId)}`);
          } catch {
            /* ignore */
          }
        }

        if (cancelled) return;

        const ua = (navigator.userAgent || "").toLowerCase();
        const platform: "ios" | "android" | "web-wrapper" =
          /iphone|ipad|ipod/.test(ua) ? "ios"
            : /android/.test(ua) ? "android"
            : "web-wrapper";

        await supabase
          .from("pupil_native_push_bindings")
          .upsert(
            {
              pupil_id: pupilId,
              platform,
              permission_granted: permissionGranted,
              user_agent: navigator.userAgent,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: "pupil_id" },
          );
      } catch (err) {
        // Telemetry only — never break the portal.
        console.warn("[onesignal-binding] failed", err);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [pupilId]);
}
