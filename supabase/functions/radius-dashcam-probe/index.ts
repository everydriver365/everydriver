// Probe edge function to test Radius/Kinesis dashcam API access
// using existing RADIUS_* credentials. Non-destructive, read-only.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProbeResult {
  url: string;
  method: string;
  authMode: string;
  status: number;
  ok: boolean;
  contentType: string | null;
  bodyPreview: string;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const RADIUS_API_TOKEN = Deno.env.get("RADIUS_API_TOKEN");
  const RADIUS_EXPORT_API_KEY = Deno.env.get("RADIUS_EXPORT_API_KEY");
  const RADIUS_EXPORT_ENDPOINT = Deno.env.get("RADIUS_EXPORT_ENDPOINT");
  const RADIUS_CUSTOMER_ID = Deno.env.get("RADIUS_CUSTOMER_ID");
  const RADIUS_USERNAME = Deno.env.get("RADIUS_USERNAME");
  const RADIUS_PASSWORD = Deno.env.get("RADIUS_PASSWORD");

  const config = {
    hasToken: !!RADIUS_API_TOKEN,
    hasExportKey: !!RADIUS_EXPORT_API_KEY,
    hasExportEndpoint: !!RADIUS_EXPORT_ENDPOINT,
    hasCustomerId: !!RADIUS_CUSTOMER_ID,
    hasUsername: !!RADIUS_USERNAME,
    hasPassword: !!RADIUS_PASSWORD,
    exportEndpoint: RADIUS_EXPORT_ENDPOINT ?? null,
  };

  if (!RADIUS_EXPORT_ENDPOINT) {
    return new Response(
      JSON.stringify({ ok: false, error: "RADIUS_EXPORT_ENDPOINT missing", config }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Normalize base URL (strip trailing slash)
  const base = RADIUS_EXPORT_ENDPOINT.replace(/\/$/, "");

  // Try to derive a Kinesis API base from the export endpoint host
  // Common patterns: api.kinesisfleetpro.com, kinesis-api.radius.com
  let host: string;
  try {
    host = new URL(base).host;
  } catch {
    host = "";
  }

  const candidateBases = [
    base,
    `https://api.kinesisfleetpro.com`,
    `https://api.kinesisfleetpro.com/v1`,
    `https://api.kinesis.radius.co.uk`,
    `https://kinesis.radius.com/api`,
    `https://api.surecam.com/v1`,
  ];

  const candidatePaths = [
    `/videos`,
    `/videos?customerId=${RADIUS_CUSTOMER_ID ?? ""}`,
    `/clips`,
    `/events?hasVideo=true`,
    `/devices`,
    `/v1/videos`,
    `/api/videos`,
  ];

  const authModes: Array<{ name: string; headers: Record<string, string> }> = [];
  if (RADIUS_API_TOKEN) {
    authModes.push({
      name: "Bearer RADIUS_API_TOKEN",
      headers: { Authorization: `Bearer ${RADIUS_API_TOKEN}` },
    });
    authModes.push({
      name: "X-Api-Key RADIUS_API_TOKEN",
      headers: { "X-Api-Key": RADIUS_API_TOKEN },
    });
  }
  if (RADIUS_EXPORT_API_KEY) {
    authModes.push({
      name: "X-Api-Key RADIUS_EXPORT_API_KEY",
      headers: { "X-Api-Key": RADIUS_EXPORT_API_KEY },
    });
    authModes.push({
      name: "Bearer RADIUS_EXPORT_API_KEY",
      headers: { Authorization: `Bearer ${RADIUS_EXPORT_API_KEY}` },
    });
  }

  const results: ProbeResult[] = [];

  // Limit total probes to avoid running forever — try first 2 bases × first 4 paths × all auth modes
  const probeBases = candidateBases.slice(0, 2);
  const probePaths = candidatePaths.slice(0, 4);

  for (const b of probeBases) {
    for (const p of probePaths) {
      for (const auth of authModes) {
        const url = `${b.replace(/\/$/, "")}${p}`;
        try {
          const res = await fetch(url, {
            method: "GET",
            headers: {
              ...auth.headers,
              Accept: "application/json",
            },
            // Short timeout via AbortSignal
            signal: AbortSignal.timeout(8000),
          });
          const contentType = res.headers.get("content-type");
          const text = await res.text();
          results.push({
            url,
            method: "GET",
            authMode: auth.name,
            status: res.status,
            ok: res.ok,
            contentType,
            bodyPreview: text.slice(0, 300),
          });
        } catch (err) {
          results.push({
            url,
            method: "GET",
            authMode: auth.name,
            status: 0,
            ok: false,
            contentType: null,
            bodyPreview: "",
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }
  }

  // Summarize: any 2xx? any 401/403? all 404?
  const successes = results.filter((r) => r.ok);
  const auth401or403 = results.filter((r) => r.status === 401 || r.status === 403);
  const notFound = results.filter((r) => r.status === 404);
  const summary = {
    totalProbes: results.length,
    successes: successes.length,
    auth_failures: auth401or403.length,
    not_found: notFound.length,
    verdict:
      successes.length > 0
        ? "ENDPOINT_FOUND — credentials work, see successes[]"
        : auth401or403.length > 0
          ? "ENDPOINT_EXISTS_BUT_NO_AUTH — credentials lack video scope, contact Radius for API access"
          : "NO_ENDPOINT_FOUND — no candidate URL responded; need correct API base URL from Radius",
  };

  return new Response(
    JSON.stringify({ ok: true, config, summary, successes, results }, null, 2),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
