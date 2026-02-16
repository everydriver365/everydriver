const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TestSlot {
  centre: string;
  date: string;
  time: string;
}

function parseMarkdownToSlots(markdown: string): TestSlot[] {
  const slots: TestSlot[] = [];
  const lines = markdown.split('\n');

  let currentCentre = '';

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Match headings for test centres (e.g. ### Available slots for Banbury)
    const centreHeading = trimmed.match(/^#{1,4}\s+(?:Available slots for\s+)?(.+)/i);
    if (centreHeading) {
      const heading = centreHeading[1].trim();
      if (!heading.toLowerCase().includes('available') && !heading.toLowerCase().startsWith('we only') && heading.length > 2) {
        currentCentre = heading;
      } else if (heading.toLowerCase().includes('available slots for')) {
        currentCentre = heading.replace(/available slots for\s+/i, '').trim();
      }
      continue;
    }

    // Match date lines like "Thursday 9 April 2026 8:10am"
    const dateTimeMatch = trimmed.match(/^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d{1,2}\s+\w+\s+\d{4})\s+(\d{1,2}:\d{2}(?:am|pm))/i);
    if (dateTimeMatch && currentCentre) {
      slots.push({ centre: currentCentre, date: dateTimeMatch[1], time: dateTimeMatch[2] });
      continue;
    }

    // Table rows fallback
    const tableMatch = trimmed.match(/^\|(.+)\|$/);
    if (tableMatch) {
      const cells = tableMatch[1].split('|').map(c => c.trim());
      if (cells.some(c => c.includes('---'))) continue;
      if (cells.length >= 3) {
        slots.push({ centre: cells[0], date: cells[1], time: cells[2] });
      } else if (cells.length === 2 && currentCentre) {
        slots.push({ centre: currentCentre, date: cells[0], time: cells[1] });
      }
    }
  }

  return slots;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = 'https://testbooking.onrender.com/available-slots';
    console.log('Scraping URL:', url);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Scrape failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = data.data?.markdown || data.markdown || '';
    console.log('Scraped markdown length:', markdown.length);
    console.log('Markdown preview:', markdown.substring(0, 500));

    const slots = parseMarkdownToSlots(markdown);
    console.log('Parsed slots count:', slots.length);

    return new Response(
      JSON.stringify({ success: true, slots, rawMarkdown: markdown }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping test slots:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape test slots';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
