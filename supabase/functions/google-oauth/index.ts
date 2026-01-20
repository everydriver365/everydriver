import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, instructorId, code, redirectUri } = await req.json();

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "Google OAuth not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Generate OAuth authorization URL
    if (action === "getAuthUrl") {
      if (!instructorId || !redirectUri) {
        return new Response(
          JSON.stringify({ error: "instructorId and redirectUri are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const state = btoa(JSON.stringify({ instructorId }));
      
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: CALENDAR_SCOPE,
        access_type: "offline",
        prompt: "consent",
        state: state,
      });

      const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;

      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Exchange authorization code for tokens
    if (action === "exchangeCode") {
      if (!code || !instructorId || !redirectUri) {
        return new Response(
          JSON.stringify({ error: "code, instructorId, and redirectUri are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        console.error("Token exchange error:", tokenData);
        return new Response(
          JSON.stringify({ error: tokenData.error_description || tokenData.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Calculate token expiry
      const tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

      // Get user's email from the access token
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userInfo = await userInfoResponse.json();

      // Store tokens in instructor_calendar_tokens
      const { error: upsertError } = await supabase
        .from("instructor_calendar_tokens")
        .upsert({
          instructor_id: instructorId,
          provider: "google",
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expiry: tokenExpiry,
          email: userInfo.email,
          updated_at: new Date().toISOString(),
        }, { onConflict: "instructor_id,provider" });

      if (upsertError) {
        console.error("Error storing tokens:", upsertError);
        return new Response(
          JSON.stringify({ error: "Failed to store tokens" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, email: userInfo.email }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check connection status
    if (action === "checkConnection") {
      if (!instructorId) {
        return new Response(
          JSON.stringify({ error: "instructorId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: tokenData, error } = await supabase
        .from("instructor_calendar_tokens")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("provider", "google")
        .single();

      if (error || !tokenData) {
        return new Response(
          JSON.stringify({ connected: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if token is expired
      const isExpired = new Date(tokenData.token_expiry) < new Date();

      return new Response(
        JSON.stringify({
          connected: true,
          email: tokenData.email,
          isExpired,
          lastSync: tokenData.updated_at,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Refresh access token
    if (action === "refreshToken") {
      if (!instructorId) {
        return new Response(
          JSON.stringify({ error: "instructorId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: tokenData, error } = await supabase
        .from("instructor_calendar_tokens")
        .select("refresh_token")
        .eq("instructor_id", instructorId)
        .eq("provider", "google")
        .single();

      if (error || !tokenData?.refresh_token) {
        return new Response(
          JSON.stringify({ error: "No refresh token found" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const refreshResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: tokenData.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      const refreshData = await refreshResponse.json();

      if (refreshData.error) {
        return new Response(
          JSON.stringify({ error: refreshData.error_description || refreshData.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newExpiry = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();

      await supabase
        .from("instructor_calendar_tokens")
        .update({
          access_token: refreshData.access_token,
          token_expiry: newExpiry,
          updated_at: new Date().toISOString(),
        })
        .eq("instructor_id", instructorId)
        .eq("provider", "google");

      return new Response(
        JSON.stringify({ success: true, access_token: refreshData.access_token }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Disconnect
    if (action === "disconnect") {
      if (!instructorId) {
        return new Response(
          JSON.stringify({ error: "instructorId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the token to revoke
      const { data: tokenData } = await supabase
        .from("instructor_calendar_tokens")
        .select("access_token")
        .eq("instructor_id", instructorId)
        .eq("provider", "google")
        .single();

      // Revoke the token at Google
      if (tokenData?.access_token) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenData.access_token}`, {
          method: "POST",
        });
      }

      // Delete from database
      const { error } = await supabase
        .from("instructor_calendar_tokens")
        .delete()
        .eq("instructor_id", instructorId)
        .eq("provider", "google");

      if (error) {
        return new Response(
          JSON.stringify({ error: "Failed to disconnect" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
