import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

// Simple HMAC-like signature using Web Crypto
async function signState(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function verifyState(data: string, signature: string, secret: string): Promise<boolean> {
  const expectedSig = await signState(data, secret);
  return expectedSig === signature;
}

// Helper to validate that the caller owns the instructor record
async function validateInstructorOwnership(
  supabaseUrl: string,
  supabaseKey: string,
  instructorId: string,
  authUserId: string
): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Check if user owns this instructor record
  const { data: instructor } = await supabase
    .from("instructors")
    .select("id, auth_user_id")
    .eq("id", instructorId)
    .single();

  const instructorData = instructor as { id: string; auth_user_id: string | null } | null;
  if (instructorData && instructorData.auth_user_id === authUserId) {
    return true;
  }

  // Check if user is admin
  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", authUserId)
    .eq("role", "admin")
    .maybeSingle();

  return !!adminRole;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  
  console.log(`[google-oauth] ${req.method} request to ${url.pathname}`);
  
  // Handle GET requests (OAuth callback from Google)
  if (req.method === "GET") {
    console.log("[google-oauth] Handling OAuth callback GET request");
    return handleOAuthCallback(url);
  }
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle POST requests (API calls from frontend)
  console.log("[google-oauth] Handling API POST request");
  return handleAPIRequest(req);
});

async function handleOAuthCallback(url: URL): Promise<Response> {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stateSecret = Deno.env.get("GOOGLE_CLIENT_SECRET"); // Reuse client secret for state signing

  // Default fallback URL
  let returnUrl = "https://everydriver.lovable.app/instructor/settings";

  try {
    // Parse and verify state
    if (state) {
      const [stateData, signature] = state.split(".");
      if (stateData && signature) {
        const isValid = await verifyState(stateData, signature, stateSecret!);
        if (isValid) {
          const decoded = JSON.parse(atob(stateData));
          if (decoded.returnTo) {
            returnUrl = decoded.returnTo;
          }
        }
      }
    }
  } catch (e) {
    console.error("State parsing error:", e);
  }

  // Handle error from Google
  if (error) {
    console.error("OAuth error from Google:", error);
    return Response.redirect(`${returnUrl}?calendar=error&reason=${encodeURIComponent(error)}`, 302);
  }

  if (!code || !state) {
    return Response.redirect(`${returnUrl}?calendar=error&reason=missing_params`, 302);
  }

  try {
    // Parse state to get instructorId
    const [stateData, signature] = state.split(".");
    if (!stateData || !signature) {
      return Response.redirect(`${returnUrl}?calendar=error&reason=invalid_state`, 302);
    }

    const isValid = await verifyState(stateData, signature, stateSecret!);
    if (!isValid) {
      return Response.redirect(`${returnUrl}?calendar=error&reason=state_tampered`, 302);
    }

    const decoded = JSON.parse(atob(stateData));
    const instructorId = decoded.instructorId;

    if (!instructorId) {
      return Response.redirect(`${returnUrl}?calendar=error&reason=no_instructor_id`, 302);
    }

    // The redirect URI must match what was used in getAuthUrl
    const redirectUri = `${supabaseUrl}/functions/v1/google-oauth`;

    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("Token exchange error:", tokenData);
      return Response.redirect(`${returnUrl}?calendar=error&reason=${encodeURIComponent(tokenData.error)}`, 302);
    }

    // Get user's email
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = await userInfoResponse.json();

    // Store tokens
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

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
      return Response.redirect(`${returnUrl}?calendar=error&reason=storage_failed`, 302);
    }

    console.log(`Successfully connected Google Calendar for instructor ${instructorId}, email: ${userInfo.email}`);
    return Response.redirect(`${returnUrl}?calendar=success`, 302);

  } catch (err) {
    console.error("Callback error:", err);
    return Response.redirect(`${returnUrl}?calendar=error&reason=exception`, 302);
  }
}

async function handleAPIRequest(req: Request): Promise<Response> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "Google OAuth not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user's token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, instructorId, returnTo } = await req.json();

    // Create service role client for privileged operations
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate instructor ownership for operations that require it
    if (instructorId) {
      const isAuthorized = await validateInstructorOwnership(supabaseUrl, supabaseKey, instructorId, user.id);
      if (!isAuthorized) {
        return new Response(
          JSON.stringify({ error: "Not authorized to access this instructor's data" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Generate OAuth authorization URL
    if (action === "getAuthUrl") {
      if (!instructorId) {
        return new Response(
          JSON.stringify({ error: "instructorId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Use the edge function URL as redirect (stable, doesn't change)
      const redirectUri = `${supabaseUrl}/functions/v1/google-oauth`;

      // Create signed state with instructorId and return URL
      const stateData = btoa(JSON.stringify({ 
        instructorId,
        returnTo: returnTo || "https://everydriver.lovable.app/instructor/settings"
      }));
      const signature = await signState(stateData, clientSecret);
      const state = `${stateData}.${signature}`;
      
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
        JSON.stringify({ authUrl, redirectUri }),
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

      const isExpired = new Date(tokenData.token_expiry) < new Date();

      // If email is missing, fetch it from Google and update the record
      let email = tokenData.email;
      if (!email && tokenData.access_token) {
        try {
          const userInfoResponse = await fetch(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
          );
          
          if (userInfoResponse.ok) {
            const userInfo = await userInfoResponse.json();
            email = userInfo.email;
            
            // Save the email for future requests
            if (email) {
              await supabase
                .from("instructor_calendar_tokens")
                .update({ email })
                .eq("instructor_id", instructorId)
                .eq("provider", "google");
              console.log(`Auto-populated email for instructor ${instructorId}: ${email}`);
            }
          }
        } catch (e) {
          console.error("Failed to fetch email from Google:", e);
        }
      }

      return new Response(
        JSON.stringify({
          connected: true,
          email,
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

      const { data: tokenData } = await supabase
        .from("instructor_calendar_tokens")
        .select("access_token")
        .eq("instructor_id", instructorId)
        .eq("provider", "google")
        .single();

      if (tokenData?.access_token) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenData.access_token}`, {
          method: "POST",
        });
      }

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
}
