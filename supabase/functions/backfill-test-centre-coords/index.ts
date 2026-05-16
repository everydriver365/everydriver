import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Centre {
  id: string;
  name: string | null;
  postcode: string | null;
  address: string | null;
}

interface PcResult {
  query: string;
  result: { latitude: number; longitude: number } | null;
}

const POSTCODE_RE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;

function normalise(pc: string): string {
  return pc.toUpperCase().replace(/\s+/g, "");
}

function extractFromAddress(addr: string | null): string | null {
  if (!addr) return null;
  const m = addr.match(POSTCODE_RE);
  return m ? `${m[1].toUpperCase()} ${m[2].toUpperCase()}` : null;
}

function outcodeOf(pc: string): string | null {
  const m = pc.match(POSTCODE_RE);
  return m ? m[1].toUpperCase() : null;
}

async function lookupSingle(
  pc: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const r = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`,
    );
    if (!r.ok) {
      await r.text();
      return null;
    }
    const j = await r.json();
    if (j?.result?.latitude && j?.result?.longitude) {
      return { lat: j.result.latitude, lng: j.result.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

async function lookupOutcode(
  outcode: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const r = await fetch(
      `https://api.postcodes.io/outcodes/${encodeURIComponent(outcode)}`,
    );
    if (!r.ok) {
      await r.text();
      return null;
    }
    const j = await r.json();
    if (j?.result?.latitude && j?.result?.longitude) {
      return { lat: j.result.latitude, lng: j.result.longitude };
    }
    return null;
  } catch {
    return null;
  }
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
    .select("id, name, postcode, address")
    .is("lat", null);

  if (selErr) {
    return new Response(
      JSON.stringify({ error: selErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const all = (centres ?? []) as Centre[];
  let bulkRecovered = 0;
  let singleRecovered = 0;
  let addressRecovered = 0;
  let outcodeRecovered = 0;
  const stillMissing: Centre[] = [];

  // ---------- Pass 1: bulk via test_centres.postcode ----------
  const withPc = all.filter((c) => (c.postcode ?? "").trim().length > 0);
  const noPc = all.filter((c) => (c.postcode ?? "").trim().length === 0);
  const batchSize = 100;
  const resolved = new Set<string>(); // centre ids resolved this run

  for (let i = 0; i < withPc.length; i += batchSize) {
    const batch = withPc.slice(i, i + batchSize);
    const postcodes = batch.map((c) => (c.postcode ?? "").trim());

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
      // fall through — pass 2 will retry individually
    }

    const map = new Map<string, { lat: number; lng: number }>();
    for (const r of pcRes) {
      if (r.result) {
        map.set(normalise(r.query), {
          lat: r.result.latitude,
          lng: r.result.longitude,
        });
      }
    }

    for (const c of batch) {
      const coords = map.get(normalise(c.postcode ?? ""));
      if (!coords) continue;
      const { error: upErr } = await supabase
        .from("test_centres")
        .update({ lat: coords.lat, lng: coords.lng })
        .eq("id", c.id);
      if (!upErr) {
        bulkRecovered += 1;
        resolved.add(c.id);
      }
    }
  }

  for (const c of withPc) {
    if (!resolved.has(c.id)) stillMissing.push(c);
  }
  for (const c of noPc) stillMissing.push(c);

  // ---------- Pass 2: single-postcode fallback (concurrency 5) ----------
  const remainAfterBulk = [...stillMissing];
  stillMissing.length = 0;

  const concurrency = 5;
  let cursor = 0;
  async function worker() {
    while (cursor < remainAfterBulk.length) {
      const idx = cursor++;
      const c = remainAfterBulk[idx];
      const pc = (c.postcode ?? "").trim();
      if (!pc) {
        stillMissing.push(c);
        continue;
      }
      const coords = await lookupSingle(pc);
      if (coords) {
        const { error } = await supabase
          .from("test_centres")
          .update({ lat: coords.lat, lng: coords.lng })
          .eq("id", c.id);
        if (!error) {
          singleRecovered += 1;
          continue;
        }
      }
      stillMissing.push(c);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  // ---------- Pass 3: postcode extracted from address ----------
  const remainAfterSingle = [...stillMissing];
  stillMissing.length = 0;

  for (const c of remainAfterSingle) {
    const fromAddr = extractFromAddress(c.address);
    if (!fromAddr || normalise(fromAddr) === normalise(c.postcode ?? "")) {
      stillMissing.push(c);
      continue;
    }
    const coords = await lookupSingle(fromAddr);
    if (coords) {
      const { error } = await supabase
        .from("test_centres")
        .update({ lat: coords.lat, lng: coords.lng })
        .eq("id", c.id);
      if (!error) {
        addressRecovered += 1;
        continue;
      }
    }
    stillMissing.push(c);
  }

  // ---------- Pass 4: outcode centroid fallback ----------
  const remainAfterAddr = [...stillMissing];
  stillMissing.length = 0;

  for (const c of remainAfterAddr) {
    const oc = outcodeOf(c.postcode ?? "") ??
      outcodeOf(extractFromAddress(c.address) ?? "");
    if (!oc) {
      stillMissing.push(c);
      continue;
    }
    const coords = await lookupOutcode(oc);
    if (coords) {
      const { error } = await supabase
        .from("test_centres")
        .update({ lat: coords.lat, lng: coords.lng })
        .eq("id", c.id);
      if (!error) {
        outcodeRecovered += 1;
        continue;
      }
    }
    stillMissing.push(c);
  }

  return new Response(
    JSON.stringify({
      total: all.length,
      bulk_recovered: bulkRecovered,
      single_recovered: singleRecovered,
      address_recovered: addressRecovered,
      outcode_recovered: outcodeRecovered,
      updated: bulkRecovered + singleRecovered + addressRecovered +
        outcodeRecovered,
      failed: stillMissing.length,
      failures: stillMissing.map((c) => ({
        id: c.id,
        name: c.name,
        postcode: c.postcode,
        address: c.address,
      })),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
