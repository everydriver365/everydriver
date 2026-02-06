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

  console.log("Starting calendar sync for all connected instructors...");

  try {
    // Get all instructors with connected calendars
    // Prioritize those who haven't synced recently
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data: instructorsToSync, error: fetchError } = await supabase
      .from("instructor_calendar_tokens")
      .select("instructor_id")
      .or(`last_external_sync.is.null,last_external_sync.lt.${fifteenMinutesAgo}`);

    if (fetchError) {
      console.error("Error fetching instructors:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${instructorsToSync?.length || 0} instructors to sync`);

    const results: Array<{ instructorId: string; status: string; synced?: number; deleted?: number; error?: string }> = [];

    // Sync each instructor's calendar
    for (const token of instructorsToSync || []) {
      try {
        console.log(`Syncing calendar for instructor: ${token.instructor_id}`);

        // Call the google-calendar-sync function for each instructor
        const { data, error } = await supabase.functions.invoke("google-calendar-service", {
          body: {
            action: "fetchExternalEvents",
            instructorId: token.instructor_id,
          },
        });

        if (error) {
          console.error(`Error syncing instructor ${token.instructor_id}:`, error);
          results.push({
            instructorId: token.instructor_id,
            status: "error",
            error: error.message,
          });
        } else {
          console.log(`Successfully synced instructor ${token.instructor_id}:`, data);
          results.push({
            instructorId: token.instructor_id,
            status: "success",
            synced: data.synced,
            deleted: data.deleted,
          });
        }
      } catch (err) {
        console.error(`Exception syncing instructor ${token.instructor_id}:`, err);
        results.push({
          instructorId: token.instructor_id,
          status: "exception",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const errorCount = results.filter((r) => r.status !== "success").length;

    console.log(`Sync complete. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        totalInstructors: instructorsToSync?.length || 0,
        successCount,
        errorCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in sync-all-calendars:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
