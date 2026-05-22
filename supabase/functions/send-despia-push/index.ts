// Sends a push notification to a pupil through OneSignal (Despia native wrapper).
// Targeting uses OneSignal's `external_id` alias, which the pupil app binds via
// `despia('setonesignalplayerid://?user_id=...')`. We never store device tokens.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DespiaPushRequest {
  pupil_id: string;
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      return new Response(
        JSON.stringify({ skipped: "onesignal_not_configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { pupil_id, title, body, url, data }: DespiaPushRequest = await req.json();
    if (!pupil_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: "pupil_id, title and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Only fire if the pupil has a native binding — avoids needless OneSignal calls
    // for pupils who only ever use the web app.
    const { data: binding } = await supabase
      .from("pupil_native_push_bindings")
      .select("pupil_id, permission_granted")
      .eq("pupil_id", pupil_id)
      .maybeSingle();

    if (!binding) {
      return new Response(
        JSON.stringify({ skipped: "no_native_binding" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const oneSignalResp = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_aliases: { external_id: [pupil_id] },
        target_channel: "push",
        headings: { en: title },
        contents: { en: body },
        url, // Despia opens this URL inside the WebView on tap
        data: data ?? {},
      }),
    });

    const respBody = await oneSignalResp.json().catch(() => ({}));

    if (!oneSignalResp.ok) {
      console.error("[send-despia-push] OneSignal error", oneSignalResp.status, respBody);
      return new Response(
        JSON.stringify({ success: false, status: oneSignalResp.status, response: respBody }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, onesignal: respBody }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[send-despia-push] error", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
