import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const appId = Deno.env.get("SQUARE_APPLICATION_ID")?.trim();
    const oauthSecret = Deno.env.get("SQUARE_OAUTH_SECRET")?.trim();
    const environment = Deno.env.get("SQUARE_ENVIRONMENT")?.trim() || "sandbox";

    if (!appId || !oauthSecret) {
      return new Response(
        JSON.stringify({ error: "Square OAuth not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const env = environment.toLowerCase();
    const isProduction = env === "production" || env === "prod" || env === "live";
    const baseUrl = isProduction
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "authorize": {
        const { instructor_id, redirect_uri } = body;
        if (!instructor_id || !redirect_uri) {
          return new Response(
            JSON.stringify({ error: "Missing instructor_id or redirect_uri" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const state = JSON.stringify({ instructor_id });
        const scopes = [
          "PAYMENTS_WRITE",
          "PAYMENTS_READ",
          "MERCHANT_PROFILE_READ",
          "ORDERS_WRITE",
          "ORDERS_READ",
        ].join("+");

        const authorizeUrl = `${baseUrl}/oauth2/authorize?client_id=${appId}&scope=${scopes}&session=false&state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirect_uri)}`;

        return new Response(
          JSON.stringify({ url: authorizeUrl }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "callback": {
        const { code, instructor_id, redirect_uri } = body;
        if (!code || !instructor_id) {
          return new Response(
            JSON.stringify({ error: "Missing code or instructor_id" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Exchange code for tokens
        const tokenResponse = await fetch(`${baseUrl}/oauth2/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: appId,
            client_secret: oauthSecret,
            code,
            grant_type: "authorization_code",
            redirect_uri,
          }),
        });

        const tokenData = await tokenResponse.json();
        console.log("Square OAuth token response status:", tokenResponse.status);

        if (!tokenResponse.ok || !tokenData.access_token) {
          console.error("Square OAuth token error:", tokenData);
          return new Response(
            JSON.stringify({ error: tokenData.message || "Failed to obtain access token" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { access_token, refresh_token, expires_at, merchant_id } = tokenData;

        // Fetch merchant info
        let merchantName = merchant_id;
        try {
          const merchantRes = await fetch(`${baseUrl}/v2/merchants/${merchant_id}`, {
            headers: {
              "Authorization": `Bearer ${access_token}`,
              "Square-Version": "2024-01-18",
            },
          });
          if (merchantRes.ok) {
            const merchantData = await merchantRes.json();
            merchantName = merchantData.merchant?.business_name || merchant_id;
          }
        } catch (e) {
          console.error("Error fetching merchant info:", e);
        }

        // Store tokens against instructor
        const { error: updateError } = await supabase
          .from("instructors")
          .update({
            square_merchant_id: merchant_id,
            square_access_token_encrypted: access_token,
            square_refresh_token_encrypted: refresh_token,
            square_token_expires_at: expires_at,
            square_connected_at: new Date().toISOString(),
          })
          .eq("id", instructor_id);

        if (updateError) {
          console.error("Error storing Square tokens:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to save connection" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Square OAuth connected for instructor ${instructor_id}: ${merchantName}`);

        return new Response(
          JSON.stringify({ success: true, merchant_name: merchantName, merchant_id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "disconnect": {
        const { instructor_id } = body;
        if (!instructor_id) {
          return new Response(
            JSON.stringify({ error: "Missing instructor_id" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Revoke token first
        const { data: instructor } = await supabase
          .from("instructors")
          .select("square_access_token_encrypted")
          .eq("id", instructor_id)
          .maybeSingle();

        if (instructor?.square_access_token_encrypted) {
          try {
            await fetch(`${baseUrl}/oauth2/revoke`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                client_id: appId,
                access_token: instructor.square_access_token_encrypted,
              }),
            });
          } catch (e) {
            console.error("Error revoking Square token:", e);
          }
        }

        // Clear columns
        const { error } = await supabase
          .from("instructors")
          .update({
            square_merchant_id: null,
            square_access_token_encrypted: null,
            square_refresh_token_encrypted: null,
            square_token_expires_at: null,
            square_connected_at: null,
          })
          .eq("id", instructor_id);

        if (error) {
          return new Response(
            JSON.stringify({ error: "Failed to disconnect" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Square OAuth error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error", details: error instanceof Error ? error.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
