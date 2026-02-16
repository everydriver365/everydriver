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

async function checkForMatchingRequests(slots: TestSlot[]) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('No Supabase credentials for matching check');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active "want_test" requests
    const { data: wantRequests, error } = await supabase
      .from('test_requests')
      .select('id, instructor_id, test_centre_name, test_date, notes, pupil_id')
      .eq('request_type', 'want_test')
      .eq('status', 'active');

    if (error || !wantRequests || wantRequests.length === 0) {
      console.log('No active want_test requests to match');
      return;
    }

    // Check for matches: centre name contains match
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

    // Get instructor names for the matches
    const instructorIds = [...new Set(matches.map(m => m.request.instructor_id))];
    const { data: instructors } = await supabase
      .from('instructors')
      .select('id, name')
      .in('id', instructorIds);

    const instructorMap = new Map((instructors || []).map(i => [i.id, i.name]));

    // Build alert message
    const alertLines = matches.map(m => {
      const name = instructorMap.get(m.request.instructor_id) || 'Unknown';
      return `• ${name} wants ${m.request.test_centre_name} — slot available: ${m.slot.date} at ${m.slot.time}`;
    });

    const alertMessage = `Test Slot Match Alert!\n\n${alertLines.join('\n')}`;

    // Insert admin activity log entry
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

    // Send SMS to admin
    const adminPhone = Deno.env.get('ADMIN_PHONE_NUMBER');
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioMessagingServiceSid = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (adminPhone && twilioAccountSid && twilioAuthToken) {
      try {
        const smsBody = new URLSearchParams({
          To: adminPhone,
          Body: alertMessage,
        });

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
      const defaultSlots = parseMarkdownToSlots(md, centres[0] || 'Unknown');

      // Check for matching requests in background
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

    // Check for matching requests
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
