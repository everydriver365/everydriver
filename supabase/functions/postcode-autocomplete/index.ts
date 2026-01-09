import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PostcodeSuggestion {
  postcode: string;
  area_name: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean the query - remove spaces and uppercase
    const cleanQuery = query.replace(/\s+/g, '').toUpperCase();
    
    console.log(`Fetching autocomplete for: ${cleanQuery}`);

    // Call postcodes.io autocomplete API
    const autocompleteResponse = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(cleanQuery)}/autocomplete`
    );

    if (!autocompleteResponse.ok) {
      console.error(`Postcodes.io autocomplete error: ${autocompleteResponse.status}`);
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const autocompleteData = await autocompleteResponse.json();
    const rawPostcodes: string[] = autocompleteData.result || [];
    
    if (rawPostcodes.length === 0) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Bulk lookup to get area names for all postcodes
    const bulkResponse = await fetch('https://api.postcodes.io/postcodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postcodes: rawPostcodes }),
    });

    const suggestions: PostcodeSuggestion[] = [];

    if (bulkResponse.ok) {
      const bulkData = await bulkResponse.json();
      
      for (const item of bulkData.result || []) {
        if (item.result) {
          // Format postcode with space
          const formattedPostcode = item.query.length > 3 
            ? item.query.slice(0, -3) + ' ' + item.query.slice(-3)
            : item.query;
          
          suggestions.push({
            postcode: formattedPostcode,
            area_name: item.result.admin_district || item.result.admin_ward || null,
          });
        }
      }
    } else {
      // Fallback: just return postcodes without area names
      for (const postcode of rawPostcodes) {
        const formattedPostcode = postcode.length > 3 
          ? postcode.slice(0, -3) + ' ' + postcode.slice(-3)
          : postcode;
        suggestions.push({ postcode: formattedPostcode, area_name: null });
      }
    }

    console.log(`Found ${suggestions.length} suggestions with area names`);

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Postcode autocomplete error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch suggestions', suggestions: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
