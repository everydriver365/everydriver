import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Centre {
  id: string;
  postcode: string | null;
}

interface PcResult {
  query: string;
  result: { latitude: number; longitude: number } | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: centres, error: selErr } = await supabase
    .from("test_centres")
    .select("id, postcode")
    .is("lat", null)
    .not("postcode", "is", null);

  if (selErr) {
    return new Response(
      JSON.stringify({ error: selErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let updated = 0;
  let failed = 0;
  let skipped = 0;
  const batchSize = 100;

  for (let i = 0; i < (centres ?? []).length; i += batchSize) {
    const batch = (centres as Centre[]).slice(i, i + batchSize);
    const postcodes = batch
      .map((c) => (c.postcode ?? "").trim())
      .filter((p) => p.length > 0);

    if (postcodes.length === 0) {
      skipped += batch.length;
      continue;
    }

    let pcRes: PcResult[] = [];
    try {
      const r = await fetch("https://api.postcodes.io/postcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcodes }),
      });
      const j = await r.json();
      pcRes = (j?.result ?? []) as PcResult[];
    } catch (_e) {
      failed += batch.length;
      continue;
    }

    const map = new Map<string, { lat: number; lng: number }>();
    for (const r of pcRes) {
      if (r.result) {
        map.set(r.query.toUpperCase().replace(/\s+/g, ""), {
          lat: r.result.latitude,
          lng: r.result.longitude,
        });
      }
    }

    for (const c of batch) {
      const key = (c.postcode ?? "").toUpperCase().replace(/\s+/g, "");
      const coords = map.get(key);
      if (!coords) {
        failed += 1;
        continue;
      }
      const { error: upErr } = await supabase
        .from("test_centres")
        .update({ lat: coords.lat, lng: coords.lng })
        .eq("id", c.id);
      if (upErr) failed += 1;
      else updated += 1;
    }
  }

  return new Response(
    JSON.stringify({ total: centres?.length ?? 0, updated, failed, skipped }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
