const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TestSlot {
  centre: string;
  date: string;
  time: string;
}

function parseMarkdownToSlots(markdown: string, centreName: string): TestSlot[] {
  const slots: TestSlot[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    const dateTimeMatch = trimmed.match(
      /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d{1,2}\s+\w+\s+\d{4})\s+(\d{1,2}:\d{2}(?:am|pm))/i
    );
    if (dateTimeMatch) {
      slots.push({ centre: centreName, date: dateTimeMatch[1], time: dateTimeMatch[2] });
    }
  }

  return slots;
}

function extractCentreNames(markdown: string): string[] {
  const centres: string[] = [];
  const lines = markdown.split('\n');
  let inDropdownArea = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().includes('select a test centre')) {
      inDropdownArea = true;
      continue;
    }
    if (inDropdownArea && trimmed.startsWith('#')) {
      inDropdownArea = false;
      continue;
    }
    if (inDropdownArea && trimmed.length > 1 && !trimmed.startsWith('#') && !trimmed.startsWith('|')) {
      if (!centres.includes(trimmed)) {
        centres.push(trimmed);
      }
    }
  }

  return centres;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let body: { centre?: string } = {};
    try {
      body = await req.json();
    } catch {
      // No body is fine — means "get centres list"
    }

    const targetCentre = body.centre;

    if (!targetCentre) {
      // MODE 1: Discover all available centres
      console.log('Discovering centres...');
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://testbooking.onrender.com/available-slots',
          formats: ['markdown'],
          onlyMainContent: true,
          waitFor: 2000,
          actions: [
            { type: 'wait', milliseconds: 2000 },
            { type: 'click', selector: 'mat-select' },
            { type: 'wait', milliseconds: 1500 },
            { type: 'scrape' },
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return new Response(
          JSON.stringify({ success: false, error: data.error || 'Scrape failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const md = data.data?.actions?.scrapes?.[0]?.markdown || data.data?.markdown || data.markdown || '';
      const centres = extractCentreNames(md);
      // Also get default centre slots
      const defaultSlots = parseMarkdownToSlots(md, centres[0] || 'Unknown');

      console.log(`Found ${centres.length} centres`);
      return new Response(
        JSON.stringify({ success: true, centres, slots: defaultSlots }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // MODE 2: Scrape slots for a specific centre
    console.log(`Scraping slots for: ${targetCentre}`);

    const escapedCentre = targetCentre.replace(/'/g, "\\'");
    const clickScript = `
      const options = document.querySelectorAll('mat-option');
      for (const opt of options) {
        if (opt.textContent?.trim() === '${escapedCentre}') {
          opt.click();
          break;
        }
      }
    `;

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://testbooking.onrender.com/available-slots',
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000,
        actions: [
          { type: 'wait', milliseconds: 2000 },
          { type: 'click', selector: 'mat-select' },
          { type: 'wait', milliseconds: 1000 },
          { type: 'executeJavascript', script: clickScript },
          { type: 'wait', milliseconds: 2500 },
          { type: 'scrape' },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: data.error || 'Scrape failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const md = data.data?.actions?.scrapes?.[0]?.markdown || data.data?.markdown || data.markdown || '';
    const slots = parseMarkdownToSlots(md, targetCentre);
    console.log(`Found ${slots.length} slots for ${targetCentre}`);

    return new Response(
      JSON.stringify({ success: true, slots, centre: targetCentre }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to scrape' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
