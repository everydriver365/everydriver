import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GPSGateUser {
  Id: number;
  Username: string;
  Name: string;
  Description: string;
}

function normalizeGpsGateUser(raw: any): GPSGateUser | null {
  const idRaw = raw?.Id ?? raw?.id;
  const usernameRaw = raw?.Username ?? raw?.username;
  const nameRaw = raw?.Name ?? raw?.name;
  const descRaw = raw?.Description ?? raw?.description;

  const id = typeof idRaw === "number" ? idRaw : Number.parseInt(String(idRaw ?? ""), 10);
  if (!Number.isFinite(id)) return null;

  return {
    Id: id,
    Username: String(usernameRaw ?? ""),
    Name: String(nameRaw ?? ""),
    Description: String(descRaw ?? ""),
  };
}

function normalizeText(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

function digitsOnly(v: unknown): string {
  return String(v ?? "").replace(/\D+/g, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const { query } = await req.json();
    const searchQuery = normalizeText(query);
    const searchDigits = digitsOnly(query);

    // Get GPSgate credentials
    const GPSGATE_URL_RAW = Deno.env.get("GPSGATE_SERVER_URL");
    const GPSGATE_APP_ID = Deno.env.get("GPSGATE_APP_ID");
    const GPSGATE_TOKEN = Deno.env.get("GPSGATE_API_TOKEN");

    if (!GPSGATE_URL_RAW || !GPSGATE_APP_ID || !GPSGATE_TOKEN) {
      return new Response(
        JSON.stringify({ error: "GPSgate not configured", candidates: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize URL
    let GPSGATE_URL = GPSGATE_URL_RAW.trim().replace(/\/+$/, "");
    if (!GPSGATE_URL.startsWith("http://") && !GPSGATE_URL.startsWith("https://")) {
      GPSGATE_URL = `https://${GPSGATE_URL}`;
    }

    const authHeaders = {
      "Authorization": GPSGATE_TOKEN,
      "Accept": "application/json"
    };

    // Fetch users from GPSgate
    const usersRes = await fetch(
      `${GPSGATE_URL}/comGpsGate/api/v.1/applications/${GPSGATE_APP_ID}/users?FromIndex=0&PageSize=1000`,
      { headers: authHeaders }
    );

    if (!usersRes.ok) {
      const text = await usersRes.text();
      console.error(`[GPSgate-Lookup] Failed to fetch users: ${usersRes.status}`, text);
      return new Response(
        JSON.stringify({ error: "Failed to fetch GPSgate users", candidates: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawUsers = await usersRes.json();
    const gpsGateUsers: GPSGateUser[] = Array.isArray(rawUsers)
      ? rawUsers.map(normalizeGpsGateUser).filter(Boolean) as GPSGateUser[]
      : [];

    // If no query provided, return all users (up to 20)
    if (!searchQuery) {
      const candidates = gpsGateUsers.slice(0, 20).map(u => ({
        id: u.Id,
        username: u.Username,
        name: u.Name,
        description: u.Description,
      }));
      return new Response(
        JSON.stringify({ candidates, total: gpsGateUsers.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter users by matching query against Username, Name, Description
    const matches = gpsGateUsers.filter(u => {
      const uUsername = normalizeText(u.Username);
      const uName = normalizeText(u.Name);
      const uDesc = normalizeText(u.Description);

      // Substring match on any field
      if (uUsername.includes(searchQuery) || 
          uName.includes(searchQuery) || 
          uDesc.includes(searchQuery)) {
        return true;
      }

      // Reverse check: query contains username/name
      if (searchQuery.includes(uUsername) && uUsername.length > 2) {
        return true;
      }
      if (searchQuery.includes(uName) && uName.length > 2) {
        return true;
      }

      // Digit matching for IMEI/phone patterns
      if (searchDigits.length >= 6) {
        const uDigits = digitsOnly(`${u.Username} ${u.Name} ${u.Description}`);
        if (uDigits.includes(searchDigits) || searchDigits.includes(uDigits)) {
          return true;
        }
      }

      return false;
    });

    // Return top 20 matches
    const candidates = matches.slice(0, 20).map(u => ({
      id: u.Id,
      username: u.Username,
      name: u.Name,
      description: u.Description,
    }));

    console.log(`[GPSgate-Lookup] Query "${query}" matched ${candidates.length} of ${gpsGateUsers.length} users`);

    return new Response(
      JSON.stringify({ candidates, total: gpsGateUsers.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error(`[GPSgate-Lookup] Error:`, err);
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err), candidates: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
