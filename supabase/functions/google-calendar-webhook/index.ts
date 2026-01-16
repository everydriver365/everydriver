import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-goog-channel-id, x-goog-channel-token, x-goog-resource-id, x-goog-resource-state, x-goog-message-number",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Google sends these headers with push notifications
    const channelId = req.headers.get("x-goog-channel-id");
    const resourceId = req.headers.get("x-goog-resource-id");
    const resourceState = req.headers.get("x-goog-resource-state");
    const messageNumber = req.headers.get("x-goog-message-number");

    console.log(`Webhook received: channelId=${channelId}, resourceState=${resourceState}, messageNumber=${messageNumber}`);

    // Validate the webhook - must have channel headers
    if (!channelId || !resourceId) {
      console.log("Missing required headers, ignoring request");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Handle sync message (initial setup confirmation)
    if (resourceState === "sync") {
      console.log(`Sync confirmation received for channel ${channelId}`);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Look up the instructor associated with this channel
    const { data: channelData, error: channelError } = await supabase
      .from("calendar_webhook_channels")
      .select("instructor_id")
      .eq("channel_id", channelId)
      .maybeSingle();

    if (channelError || !channelData) {
      console.log(`Unknown channel ${channelId}, ignoring`);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const instructorId = channelData.instructor_id;
    console.log(`Processing webhook for instructor ${instructorId}, state: ${resourceState}`);

    // Handle change notifications
    if (resourceState === "exists" || resourceState === "update") {
      // Trigger a sync for this instructor
      console.log(`Triggering calendar sync for instructor ${instructorId}`);
      
      const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
        body: {
          action: "fetchExternalEvents",
          instructorId: instructorId,
        },
      });

      if (error) {
        console.error("Error triggering sync:", error);
      } else {
        console.log(`Sync completed: synced=${data?.synced}, deleted=${data?.deleted}`);
      }
    }

    // Handle resource deletion (calendar deleted or access revoked)
    if (resourceState === "not_exists") {
      console.log(`Calendar resource deleted for instructor ${instructorId}`);
      
      // Clean up the webhook channel
      await supabase
        .from("calendar_webhook_channels")
        .delete()
        .eq("channel_id", channelId);
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to prevent Google from retrying excessively
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
