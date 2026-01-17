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

  try {
    const { action, code, instructorId, redirectUri } = await req.json();
    
    const nylasClientId = Deno.env.get("NYLAS_CLIENT_ID");
    const nylasApiKey = Deno.env.get("NYLAS_API_KEY");
    const nylasApiUri = Deno.env.get("NYLAS_API_URI") || "https://api.us.nylas.com";
    
    if (!nylasClientId || !nylasApiKey) {
      return new Response(
        JSON.stringify({ error: "Nylas not configured. Please add NYLAS_CLIENT_ID and NYLAS_API_KEY." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "getAuthUrl") {
      // Generate Nylas hosted auth URL
      // Nylas v3 uses hosted authentication - simpler flow
      const config = {
        client_id: nylasClientId,
        redirect_uri: redirectUri,
        // State contains instructor ID for callback handling
        state: instructorId,
        // Request calendar scopes
        access_type: "offline",
        provider: "google", // Can be extended to support microsoft, icloud, etc.
      };

      const params = new URLSearchParams({
        client_id: config.client_id,
        redirect_uri: config.redirect_uri,
        state: config.state,
        response_type: "code",
        access_type: "offline",
      });

      const authUrl = `${nylasApiUri}/v3/connect/auth?${params.toString()}`;
      
      console.log(`Generated Nylas auth URL for instructor ${instructorId}`);
      
      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "exchangeCode") {
      // Exchange authorization code for a grant
      console.log(`Exchanging code for instructor ${instructorId}`);
      
      const tokenResponse = await fetch(`${nylasApiUri}/v3/connect/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${btoa(`${nylasClientId}:${nylasApiKey}`)}`,
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirectUri,
          client_id: nylasClientId,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error || !tokenData.grant_id) {
        console.error("Nylas token exchange failed:", tokenData);
        return new Response(
          JSON.stringify({ error: tokenData.error_description || tokenData.error || "Failed to connect calendar" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Got grant_id: ${tokenData.grant_id} for email: ${tokenData.email}`);

      // Store grant in database
      const { error: upsertError } = await supabase
        .from("instructor_nylas_grants")
        .upsert({
          instructor_id: instructorId,
          grant_id: tokenData.grant_id,
          email: tokenData.email,
          provider: tokenData.provider || "google",
        }, { onConflict: "instructor_id" });

      if (upsertError) {
        console.error("Error storing grant:", upsertError);
        return new Response(
          JSON.stringify({ error: "Failed to store calendar connection" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          email: tokenData.email,
          provider: tokenData.provider || "google"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "checkConnection") {
      // Check if instructor has a valid Nylas grant
      const { data: grantData, error: fetchError } = await supabase
        .from("instructor_nylas_grants")
        .select("*")
        .eq("instructor_id", instructorId)
        .maybeSingle();

      if (fetchError || !grantData) {
        return new Response(
          JSON.stringify({ connected: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify grant is still valid with Nylas
      const grantResponse = await fetch(`${nylasApiUri}/v3/grants/${grantData.grant_id}`, {
        headers: {
          "Authorization": `Bearer ${nylasApiKey}`,
          "Accept": "application/json",
        },
      });

      if (!grantResponse.ok) {
        console.log(`Grant ${grantData.grant_id} is no longer valid`);
        // Clean up invalid grant
        await supabase
          .from("instructor_nylas_grants")
          .delete()
          .eq("instructor_id", instructorId);

        return new Response(
          JSON.stringify({ connected: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const grantInfo = await grantResponse.json();

      // Get count of synced events
      const { count: eventCount } = await supabase
        .from("instructor_calendar_events")
        .select("*", { count: "exact", head: true })
        .eq("instructor_id", instructorId);

      return new Response(
        JSON.stringify({
          connected: true,
          email: grantData.email || grantInfo.data?.email,
          provider: grantData.provider || grantInfo.data?.provider,
          lastSync: grantData.last_sync,
          externalEventCount: eventCount || 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "disconnect") {
      // Get grant to revoke
      const { data: grantData } = await supabase
        .from("instructor_nylas_grants")
        .select("grant_id")
        .eq("instructor_id", instructorId)
        .maybeSingle();

      if (grantData?.grant_id) {
        // Revoke access at Nylas (optional but good practice)
        try {
          await fetch(`${nylasApiUri}/v3/grants/${grantData.grant_id}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${nylasApiKey}`,
            },
          });
        } catch (err) {
          console.error("Error revoking Nylas grant:", err);
        }
      }

      // Remove from database
      await supabase
        .from("instructor_nylas_grants")
        .delete()
        .eq("instructor_id", instructorId);

      // Also remove synced calendar events
      await supabase
        .from("instructor_calendar_events")
        .delete()
        .eq("instructor_id", instructorId);

      // Also remove calendar_events (lessons synced to external calendar)
      await supabase
        .from("calendar_events")
        .delete()
        .eq("instructor_id", instructorId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
