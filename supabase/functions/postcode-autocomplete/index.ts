import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const response = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(cleanQuery)}/autocomplete`
    );

    if (!response.ok) {
      console.error(`Postcodes.io error: ${response.status}`);
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Format postcodes with proper spacing (e.g., "SW1A 1AA")
    const suggestions = (data.result || []).map((postcode: string) => {
      // Insert space before last 3 characters
      if (postcode.length > 3) {
        return postcode.slice(0, -3) + ' ' + postcode.slice(-3);
      }
      return postcode;
    });

    console.log(`Found ${suggestions.length} suggestions`);

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
