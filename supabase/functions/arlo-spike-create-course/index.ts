import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const platform = Deno.env.get('ARLO_PLATFORM');
  const username = Deno.env.get('ARLO_USERNAME');
  const password = Deno.env.get('ARLO_PASSWORD');

  const results: Record<string, unknown> = {};

  if (!platform || !username || !password) {
    results.FINAL_RESULT = 'FAILED — missing ARLO_PLATFORM / ARLO_USERNAME / ARLO_PASSWORD secrets';
    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const basicAuth = btoa(`${username}:${password}`);
  const baseUrl = `https://${platform}.arlo.co/api/2012-02-01/auth/resources`;
  const authHeaders = {
    'Authorization': `Basic ${basicAuth}`,
    'Accept': 'application/xml',
  };

  const extractXmlValue = (xml: string, tag: string): string | null => {
    const match = xml.match(new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 's'));
    return match ? match[1].trim() : null;
  };

  const extractXmlHref = (xml: string, rel: string): string | null => {
    const m1 = xml.match(new RegExp(`<Link[^>]*rel="${rel}"[^>]*href="([^"]*)"`, 's'));
    const m2 = xml.match(new RegExp(`<Link[^>]*href="([^"]*)"[^>]*rel="${rel}"`, 's'));
    return m1?.[1] ?? m2?.[1] ?? null;
  };

  const findSelfHref = (item: any): string | null => {
    const links = item?.Links ?? item?.Link;
    if (!links) return null;
    const arr = Array.isArray(links) ? links : [links];
    return arr.find((l: any) => l?.rel === 'self')?.href ?? null;
  };

  try {
    // STEP A — templates
    const tRes = await fetch(`${baseUrl}/eventtemplates/`, { headers: authHeaders });
    const tBody = await tRes.text();
    results.step_A_get_templates = { status: tRes.status, ok: tRes.ok, body: tBody.substring(0, 1000) };

    let templateHref: string | null = null;
    let templateName: string | null = null;
    templateHref = extractXmlHref(tBody, 'self');
    templateName = extractXmlValue(tBody, 'Name');
    results.step_A_template_found = { templateHref, templateName };

    if (!templateHref) {
      results.step_A_error = 'No template found — create an EventTemplate in your Arlo dashboard first (e.g. 10 Hour Intensive Course)';
      results.FINAL_RESULT = 'FAILED — no event template available';
      return new Response(JSON.stringify(results, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // STEP B — venues
    const vRes = await fetch(`${baseUrl}/venues/`, { headers: authHeaders });
    const vBody = await vRes.text();
    results.step_B_get_venues = { status: vRes.status, ok: vRes.ok, body: vBody.substring(0, 1000) };

    let venueHref: string | null = null;
    let venueName: string | null = null;
    venueHref = extractXmlHref(vBody, 'self');
    venueName = extractXmlValue(vBody, 'Name');
    results.step_B_venue_found = { venueHref, venueName };

    // STEP C — presenters
    const pRes = await fetch(`${baseUrl}/presenters/`, { headers: authHeaders });
    const pBody = await pRes.text();
    results.step_C_get_presenters = { status: pRes.status, ok: pRes.ok, body: pBody.substring(0, 1000) };

    let presenterHref: string | null = null;
    let presenterName: string | null = null;
    presenterHref = extractXmlHref(pBody, 'self');
    presenterName = extractXmlValue(pBody, 'Name');
    results.step_C_presenter_found = { presenterHref, presenterName };

    // STEP D — create event
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const finish = new Date(tomorrow);
    finish.setHours(17, 0, 0, 0);

    const eventXml = `<?xml version="1.0" encoding="utf-8"?>
<Event>
  <Code>ED-SPIKE-001</Code>
  <LocationName>Winchester</LocationName>
  <Status>Draft</Status>
  <Link rel="http://schemas.arlo.co/api/2012/02/auth/related/EventTemplate" type="application/xml" href="${templateHref}" />
  ${presenterHref ? `<Link rel="http://schemas.arlo.co/api/2012/02/auth/related/Presenter" type="application/xml" href="${presenterHref}" />` : ''}
</Event>`;

    results.step_D_event_xml_sent = eventXml;

    const eRes = await fetch(`${baseUrl}/events/`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/xml',
        'Accept': 'application/xml',
      },
      body: eventXml,
    });
    const eBody = await eRes.text();
    results.step_D_create_event = { status: eRes.status, ok: eRes.ok, body: eBody.substring(0, 2000) };

    if (eRes.status === 201) {
      results.step_D_success = 'Event created in Arlo';

      let eventHref: string | null = null;
      let eventId: string | null = null;
      eventHref = extractXmlHref(eBody, 'self');
      eventId = extractXmlValue(eBody, 'EventID');
      results.step_D_event_id = eventId;
      results.step_D_event_href = eventHref;

      if (eventHref) {
        const sessionXml = `<?xml version="1.0" encoding="utf-8"?>
<EventSession>
  <StartDateTime>${tomorrow.toISOString()}</StartDateTime>
  <FinishDateTime>${finish.toISOString()}</FinishDateTime>
  ${venueHref ? `<Link rel="http://schemas.arlo.co/api/2012/02/auth/related/Venue" type="application/xml" href="${venueHref}" />` : ''}
  ${presenterHref ? `<Link rel="http://schemas.arlo.co/api/2012/02/auth/related/Presenter" type="application/xml" href="${presenterHref}" />` : ''}
</EventSession>`;

        results.step_E_session_xml_sent = sessionXml;

        const sRes = await fetch(`${eventHref}sessions/`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/xml',
            'Accept': 'application/xml',
          },
          body: sessionXml,
        });
        const sBody = await sRes.text();
        results.step_E_create_session = { status: sRes.status, ok: sRes.ok, body: sBody.substring(0, 2000) };

        const sessionId = extractXmlValue(sBody, 'SessionID');
        results.step_E_session_id = sessionId;

        if (sRes.status === 201) {
          results.step_E_success = 'Session created — course fully created in Arlo with date and presenter';
          results.FINAL_RESULT = 'SUCCESS — full course creation works end to end';
        } else {
          results.step_E_error = `Session creation failed with status ${sRes.status}`;
          results.FINAL_RESULT = 'PARTIAL — event created but session failed';
        }
      } else {
        results.FINAL_RESULT = 'PARTIAL — event created but no href returned for session step';
      }
    } else {
      results.step_D_error = `Event creation failed with status ${eRes.status}`;
      results.FINAL_RESULT = 'FAILED — could not create event in Arlo';
    }
  } catch (err) {
    results.unexpected_error = String(err);
    results.FINAL_RESULT = 'ERROR — unexpected failure';
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
