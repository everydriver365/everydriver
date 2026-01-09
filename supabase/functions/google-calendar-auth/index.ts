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
    
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    
    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "Google OAuth not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "getAuthUrl") {
      // Generate OAuth URL for instructor to connect their Google Calendar
      const scope = encodeURIComponent("https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events");
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${instructorId}`;
      
      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "exchangeCode") {
      // Exchange authorization code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        return new Response(
          JSON.stringify({ error: tokens.error_description || tokens.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Calculate token expiry
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      // Store tokens in instructor_calendar_tokens table
      const { error: upsertError } = await supabase
        .from("instructor_calendar_tokens")
        .upsert({
          instructor_id: instructorId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: expiresAt,
          calendar_id: "primary",
        }, { onConflict: "instructor_id" });

      if (upsertError) {
        console.error("Error storing tokens:", upsertError);
        return new Response(
          JSON.stringify({ error: "Failed to store calendar tokens" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "refreshToken") {
      // Get stored refresh token
      const { data: tokenData, error: fetchError } = await supabase
        .from("instructor_calendar_tokens")
        .select("refresh_token")
        .eq("instructor_id", instructorId)
        .maybeSingle();

      if (fetchError || !tokenData) {
        return new Response(
          JSON.stringify({ error: "No calendar connection found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Refresh the access token
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: tokenData.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        return new Response(
          JSON.stringify({ error: tokens.error_description || tokens.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      // Update stored token
      await supabase
        .from("instructor_calendar_tokens")
        .update({
          access_token: tokens.access_token,
          token_expiry: expiresAt,
        })
        .eq("instructor_id", instructorId);

      return new Response(
        JSON.stringify({ access_token: tokens.access_token }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "disconnect") {
      // Remove calendar connection
      await supabase
        .from("instructor_calendar_tokens")
        .delete()
        .eq("instructor_id", instructorId);

      // Also remove synced events
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
