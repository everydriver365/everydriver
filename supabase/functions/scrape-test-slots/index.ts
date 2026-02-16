import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function scrapeSpecificCentre(apiKey: string, centreName: string): Promise<TestSlot[]> {
  const escapedCentre = centreName.replace(/'/g, "\\'");
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
    console.error(`Scrape failed for ${centreName}:`, data.error);
    return [];
  }

  const md = data.data?.actions?.scrapes?.[0]?.markdown || data.data?.markdown || data.markdown || '';
  return parseMarkdownToSlots(md, centreName);
}

async function checkForMatchingRequests(slots: TestSlot[]) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.log('No Supabase credentials for matching check');
      return;
    }

    const { data: wantRequests, error } = await supabase
      .from('test_requests')
      .select('id, instructor_id, test_centre_name, test_date, notes, pupil_id')
      .eq('request_type', 'want_test')
      .eq('status', 'active');

    if (error || !wantRequests || wantRequests.length === 0) {
      console.log('No active want_test requests to match');
      return;
    }

    // Match by centre name only (ignoring date/time)
    const matches: { slot: TestSlot; request: typeof wantRequests[0] }[] = [];
    for (const slot of slots) {
      for (const req of wantRequests) {
        if (req.test_centre_name && 
            slot.centre.toLowerCase().includes(req.test_centre_name.toLowerCase())) {
          matches.push({ slot, request: req });
        }
      }
    }

    if (matches.length === 0) {
      console.log('No matching slots found for want_test requests');
      return;
    }

    console.log(`Found ${matches.length} matching slots!`);

    const instructorIds = [...new Set(matches.map(m => m.request.instructor_id))];
    const { data: instructors } = await supabase
      .from('instructors')
      .select('id, name')
      .in('id', instructorIds);

    const instructorMap = new Map((instructors || []).map(i => [i.id, i.name]));

    const alertLines = matches.map(m => {
      const name = instructorMap.get(m.request.instructor_id) || 'Unknown';
      return `• ${name} wants ${m.request.test_centre_name} — slot available: ${m.slot.date} at ${m.slot.time}`;
    });

    const alertMessage = `Test Slot Match Alert!\n\n${alertLines.join('\n')}`;

    await supabase.from('admin_activity_log').insert({
      action_type: 'test_slot_match',
      description: `${matches.length} available test slot(s) match instructor requests`,
      entity_type: 'test_request',
      metadata: { matches: matches.map(m => ({ 
        centre: m.slot.centre, 
        date: m.slot.date, 
        time: m.slot.time,
        instructor_id: m.request.instructor_id,
        instructor_name: instructorMap.get(m.request.instructor_id),
        request_id: m.request.id,
      }))},
    });

    // Insert scraped_match records (with dedup)
    for (const m of matches) {
      const { data: existing } = await supabase
        .from('test_slot_reservations')
        .select('id')
        .eq('instructor_id', m.request.instructor_id)
        .eq('centre', m.slot.centre)
        .eq('date', m.slot.date)
        .eq('time', m.slot.time)
        .maybeSingle();

      if (!existing) {
        await supabase.from('test_slot_reservations').insert({
          instructor_id: m.request.instructor_id,
          centre: m.slot.centre,
          date: m.slot.date,
          time: m.slot.time,
          status: 'scraped_match',
        });
        console.log(`Inserted scraped_match for ${m.slot.centre} ${m.slot.date} ${m.slot.time}`);
      }
    }

    // Send SMS to admin
    const adminPhone = Deno.env.get('ADMIN_PHONE_NUMBER');
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioMessagingServiceSid = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (adminPhone && twilioAccountSid && twilioAuthToken) {
      try {
        const smsBody = new URLSearchParams({ To: adminPhone, Body: alertMessage });
        if (twilioMessagingServiceSid) {
          smsBody.set('MessagingServiceSid', twilioMessagingServiceSid);
        } else if (twilioPhoneNumber) {
          smsBody.set('From', twilioPhoneNumber);
        }

        const smsResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: smsBody.toString(),
          }
        );

        if (smsResponse.ok) {
          console.log('Admin SMS sent successfully');
        } else {
          const errData = await smsResponse.text();
          console.error('Failed to send admin SMS:', errData);
        }
      } catch (smsErr) {
        console.error('SMS send error:', smsErr);
      }
    } else {
      console.log('Admin phone or Twilio not configured, skipping SMS');
    }
  } catch (err) {
    console.error('Error checking for matching requests:', err);
  }
}

async function handleAutoMode(apiKey: string): Promise<Response> {
  console.log('AUTO MODE: Starting scheduled scrape...');

  const supabase = getSupabaseClient();
  if (!supabase) {
    return new Response(
      JSON.stringify({ success: false, error: 'No Supabase credentials' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get all unique centre names from active want_test requests
  const { data: wantRequests, error } = await supabase
    .from('test_requests')
    .select('test_centre_name')
    .eq('request_type', 'want_test')
    .eq('status', 'active');

  if (error || !wantRequests || wantRequests.length === 0) {
    console.log('AUTO MODE: No active want_test requests, nothing to scrape');
    return new Response(
      JSON.stringify({ success: true, message: 'No active requests to check', centres_scraped: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const uniqueCentres = [...new Set(
    wantRequests
      .map(r => r.test_centre_name)
      .filter((name): name is string => !!name)
  )];

  console.log(`AUTO MODE: Scraping ${uniqueCentres.length} centres: ${uniqueCentres.join(', ')}`);

  let allSlots: TestSlot[] = [];

  for (const centre of uniqueCentres) {
    try {
      console.log(`AUTO MODE: Scraping ${centre}...`);
      const slots = await scrapeSpecificCentre(apiKey, centre);
      console.log(`AUTO MODE: Found ${slots.length} slots at ${centre}`);
      allSlots = allSlots.concat(slots);
    } catch (err) {
      console.error(`AUTO MODE: Failed to scrape ${centre}:`, err);
    }
  }

  console.log(`AUTO MODE: Total ${allSlots.length} slots found across all centres`);

  if (allSlots.length > 0) {
    await checkForMatchingRequests(allSlots);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      centres_scraped: uniqueCentres.length, 
      total_slots: allSlots.length,
      centres: uniqueCentres,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
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

    let body: { centre?: string; mode?: string } = {};
    try {
      body = await req.json();
    } catch {
      // No body means auto mode
    }

    // AUTO MODE: triggered by cron or explicit request
    if (!body.centre && (!body.mode || body.mode === 'auto')) {
      // If no centre specified and mode is auto (or no body at all), run auto
      // But distinguish: if body has no mode and no centre, it could be the old "discover centres" call
      // We use presence of mode:'auto' or completely empty body for auto mode
      if (body.mode === 'auto' || Object.keys(body).length === 0) {
        return await handleAutoMode(apiKey);
      }
    }

    const targetCentre = body.centre;

    if (!targetCentre) {
      // MODE 1: Discover all available centres (explicit call without centre)
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
      const defaultSlots = parseMarkdownToSlots(md, centres[0] || 'Unknown');

      if (defaultSlots.length > 0) {
        checkForMatchingRequests(defaultSlots).catch(console.error);
      }

      console.log(`Found ${centres.length} centres`);
      return new Response(
        JSON.stringify({ success: true, centres, slots: defaultSlots }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // MODE 2: Scrape slots for a specific centre
    console.log(`Scraping slots for: ${targetCentre}`);
    const slots = await scrapeSpecificCentre(apiKey, targetCentre);
    console.log(`Found ${slots.length} slots for ${targetCentre}`);

    if (slots.length > 0) {
      checkForMatchingRequests(slots).catch(console.error);
    }

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
