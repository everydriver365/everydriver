import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postcode, query } = await req.json();
    const apiKey = Deno.env.get("HERE_API_KEY");
    if (!apiKey) throw new Error("HERE_API_KEY not configured");

    // Mode 1: Postcode lookup - returns list of addresses at that postcode
    if (postcode) {
      const url = `https://geocode.search.hereapi.com/v1/geocode?qq=postalCode=${encodeURIComponent(postcode)};country=GBR&limit=20&apiKey=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      const addresses = (data.items || [])
        .map((item: any) => ({
          label: item.address?.label || "",
          street: item.address?.street || "",
          houseNumber: item.address?.houseNumber || "",
          district: item.address?.district || "",
          city: item.address?.city || "",
          county: item.address?.county || "",
          postcode: item.address?.postalCode || "",
        }));

      return new Response(JSON.stringify({ addresses }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mode 2: Autocomplete - user typing an address
    if (query && query.length >= 3) {
      const url = `https://autosuggest.search.hereapi.com/v1/autosuggest?q=${encodeURIComponent(query)}&in=countryCode:GBR&at=52.5,-1.5&limit=8&apiKey=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      const suggestions: any[] = [];
      for (const item of (data.items || [])) {
        if (!item.address && !item.id) continue;
        
        let addr = item.address || {};
        // If we have an id but sparse address, look it up
        if (item.id && !addr.street) {
          try {
            const lookupUrl = `https://lookup.search.hereapi.com/v1/lookup?id=${encodeURIComponent(item.id)}&apiKey=${apiKey}`;
            const lookupRes = await fetch(lookupUrl);
            const lookupData = await lookupRes.json();
            if (lookupData.address) addr = lookupData.address;
          } catch {}
        }
        
        suggestions.push({
          label: addr.label || item.title || "",
          street: addr.street || "",
          houseNumber: addr.houseNumber || "",
          district: addr.district || "",
          city: addr.city || "",
          county: addr.county || "",
          postcode: addr.postalCode || "",
        });
      }

      return new Response(JSON.stringify({ addresses: suggestions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ addresses: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Address lookup error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
