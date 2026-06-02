// Geotab Authenticate — caches session token + active server in geotab_session_cache.
// Returns { server, database, userName, sessionId }. Reused by other geotab-* functions.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_SERVER = "my.geotab.com";

export interface GeotabCredentials {
  server: string;
  database: string;
  userName: string;
  sessionId: string;
}

async function geotabRpc(server: string, method: string, params: Record<string, unknown>) {
  const url = `https://${server}/apiv1`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params }),
  });
  const json = await res.json();
  if (json.error) {
    const err = new Error(json.error.errors?.[0]?.message ?? json.error.message ?? "Geotab RPC error");
    (err as any).geotabError = json.error;
    throw err;
  }
  return json.result;
}

export async function authenticateGeotab(
  supabase: ReturnType<typeof createClient>,
  opts: { forceRefresh?: boolean } = {},
): Promise<GeotabCredentials> {
  const userName = Deno.env.get("GEOTAB_USERNAME");
  const password = Deno.env.get("GEOTAB_PASSWORD");
  const database = Deno.env.get("GEOTAB_DATABASE");
  if (!userName || !password || !database) {
    throw new Error("Missing GEOTAB_USERNAME / GEOTAB_PASSWORD / GEOTAB_DATABASE secrets");
  }

  const cacheKey = `${userName}::${database}`;

  if (!opts.forceRefresh) {
    const { data: cached } = await supabase
      .from("geotab_session_cache")
      .select("server_url, session_id, expires_at")
      .eq("id", cacheKey)
      .maybeSingle();
    if (cached?.session_id && cached?.expires_at && new Date(cached.expires_at) > new Date()) {
      return { server: cached.server_url, database, userName, sessionId: cached.session_id };
    }
  }

  // Authenticate against the default server; Geotab may redirect us to the real one.
  let server = DEFAULT_SERVER;
  let result = await geotabRpc(server, "Authenticate", { database, userName, password });
  if (result?.path && result.path !== "ThisServer") {
    server = result.path;
    result = await geotabRpc(server, "Authenticate", { database, userName, password });
  }
  const sessionId = result?.credentials?.sessionId;
  if (!sessionId) throw new Error("Geotab Authenticate returned no sessionId");

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(); // 12h
  await supabase
    .from("geotab_session_cache")
    .upsert(
      {
        id: cacheKey,
        server_url: server,
        session_id: sessionId,
        expires_at: expiresAt,
      },
      { onConflict: "id" },
    );

  return { server, database, userName, sessionId };
}

export async function geotabCall<T = unknown>(
  supabase: ReturnType<typeof createClient>,
  method: string,
  typeName: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  let creds = await authenticateGeotab(supabase);
  const invoke = async (c: GeotabCredentials) =>
    geotabRpc(c.server, method, {
      ...(typeName ? { typeName } : {}),
      ...params,
      credentials: { database: c.database, userName: c.userName, sessionId: c.sessionId },
    });
  try {
    return (await invoke(creds)) as T;
  } catch (err) {
    const code = (err as any)?.geotabError?.errors?.[0]?.name;
    if (code === "InvalidUserException" || code === "DbUnavailableException") {
      creds = await authenticateGeotab(supabase, { forceRefresh: true });
      return (await invoke(creds)) as T;
    }
    throw err;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const creds = await authenticateGeotab(supabase, { forceRefresh: !!body.forceRefresh });
    return new Response(
      JSON.stringify({
        ok: true,
        server: creds.server,
        database: creds.database,
        userName: creds.userName,
        sessionIdPreview: `${creds.sessionId.slice(0, 4)}…${creds.sessionId.slice(-4)}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
