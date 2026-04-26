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

    // Mode 1: Postcode lookup using Ideal Postcodes (Royal Mail PAF data)
    if (postcode) {
      const idealApiKey = Deno.env.get("IDEAL_POSTCODES_API_KEY");
      if (!idealApiKey) throw new Error("IDEAL_POSTCODES_API_KEY not configured");

      const cleanPostcode = postcode.trim().replace(/\s+/g, "").toUpperCase();
      const url = `https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(cleanPostcode)}?api_key=${idealApiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.code !== 2000 || !data.result?.length) {
        return new Response(JSON.stringify({ addresses: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const addresses = data.result.map((item: any) => {
        const parts = [item.line_1, item.line_2, item.line_3, item.post_town, item.postcode].filter(Boolean);
        return {
          label: parts.join(", "),
          street: item.thoroughfare || "",
          houseNumber: item.building_number || "",
          buildingName: item.building_name || "",
          subBuildingName: item.sub_building_name || "",
          district: item.dependant_locality || item.double_dependant_locality || "",
          city: item.post_town || "",
          county: item.county || "",
          postcode: item.postcode || "",
          line1: item.line_1 || "",
          line2: item.line_2 || "",
          line3: item.line_3 || "",
        };
      });

      // Sort by street, then building number, then building name
      addresses.sort((a: any, b: any) => {
        const streetCmp = (a.street || "").localeCompare(b.street || "");
        if (streetCmp !== 0) return streetCmp;
        const numA = parseInt(a.houseNumber) || 0;
        const numB = parseInt(b.houseNumber) || 0;
        if (numA !== numB) return numA - numB;
        return (a.buildingName || "").localeCompare(b.buildingName || "");
      });

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
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
