import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("Checking for expiring webhook channels...");

  try {
    // Find channels expiring in the next 24 hours
    const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: expiringChannels, error: fetchError } = await supabase
      .from("calendar_webhook_channels")
      .select("instructor_id, channel_id, resource_id, expiration")
      .lt("expiration", oneDayFromNow);

    if (fetchError) {
      console.error("Error fetching expiring channels:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiringChannels?.length || 0} channels to renew`);

    const results: Array<{ instructorId: string; status: string; error?: string }> = [];

    for (const channel of expiringChannels || []) {
      try {
        console.log(`Renewing webhook for instructor ${channel.instructor_id}`);

        // Call sync function to setup a new webhook (which will stop the old one first)
        const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
          body: {
            action: "setupWebhook",
            instructorId: channel.instructor_id,
          },
        });

        if (error) {
          console.error(`Error renewing webhook for ${channel.instructor_id}:`, error);
          results.push({
            instructorId: channel.instructor_id,
            status: "error",
            error: error.message,
          });
        } else if (data.success) {
          console.log(`Successfully renewed webhook for ${channel.instructor_id}`);
          results.push({
            instructorId: channel.instructor_id,
            status: "renewed",
          });
        } else {
          results.push({
            instructorId: channel.instructor_id,
            status: "failed",
          });
        }
      } catch (err) {
        console.error(`Exception renewing webhook for ${channel.instructor_id}:`, err);
        results.push({
          instructorId: channel.instructor_id,
          status: "exception",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const renewedCount = results.filter((r) => r.status === "renewed").length;
    const errorCount = results.filter((r) => r.status !== "renewed").length;

    console.log(`Renewal complete. Renewed: ${renewedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        totalChannels: expiringChannels?.length || 0,
        renewedCount,
        errorCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in renew-calendar-webhooks:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
