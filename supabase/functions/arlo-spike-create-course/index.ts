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

  const extractFirstResourceHref = (xml: string): string | null => {
    const match = xml.match(/<Link[^>]*type="application\/xml"[^>]*href="([^"]*)"/)
      || xml.match(/<Link[^>]*href="([^"]*)"[^>]*type="application\/xml"/);
    return match ? match[1] : null;
  };

  try {
    // STEP A — templates
    const tRes = await fetch(`${baseUrl}/eventtemplates/`, { headers: authHeaders });
    const templatesBody = await tRes.text();
    results.step_A_get_templates = { status: tRes.status, ok: tRes.ok, body: templatesBody.substring(0, 1000) };

    let templateHref: string | null = null;
    let templateName: string | null = null;

    const firstTemplateHref = extractFirstResourceHref(templatesBody);
    results.step_A_collection_first_href = firstTemplateHref;

    if (firstTemplateHref) {
      const templateDetailRes = await fetch(firstTemplateHref, {
        headers: { 'Authorization': `Basic ${basicAuth}`, 'Accept': 'application/xml' },
      });
      const templateDetailBody = await templateDetailRes.text();
      results.step_A_template_detail_status = templateDetailRes.status;
      results.step_A_template_detail_body = templateDetailBody.substring(0, 500);

      templateHref = extractXmlHref(templateDetailBody, 'self') || firstTemplateHref;
      templateName = extractXmlValue(templateDetailBody, 'Name');
      results.step_A_template_found = { templateHref, templateName };
    }

    if (!templateHref) {
      results.step_A_error = 'No template found — create an EventTemplate in your Arlo dashboard first (e.g. 10 Hour Intensive Course)';
      results.debug_templates_raw = templatesBody.substring(0, 2000);
      results.FINAL_RESULT = 'FAILED — no event template available';
      return new Response(JSON.stringify(results, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // STEP B — venues
    const vRes = await fetch(`${baseUrl}/venues/`, { headers: authHeaders });
    const venuesBody = await vRes.text();
    results.step_B_get_venues = { status: vRes.status, ok: vRes.ok, body: venuesBody.substring(0, 1000) };

    let venueHref: string | null = null;
    let venueName: string | null = null;

    const firstVenueHref = extractFirstResourceHref(venuesBody);
    results.step_B_collection_first_href = firstVenueHref;

    if (firstVenueHref) {
      const venueDetailRes = await fetch(firstVenueHref, {
        headers: { 'Authorization': `Basic ${basicAuth}`, 'Accept': 'application/xml' },
      });
      const venueDetailBody = await venueDetailRes.text();
      results.step_B_venue_detail_status = venueDetailRes.status;
      venueHref = extractXmlHref(venueDetailBody, 'self') || firstVenueHref;
      venueName = extractXmlValue(venueDetailBody, 'Name');
      results.step_B_venue_found = { venueHref, venueName };
    }

    // STEP C — presenters (try multiple endpoints)
    const presenterUrls = [
      `${baseUrl}/presenters/`,
      `${baseUrl}/contacts/?filter=IsPresenter=true`,
      `${baseUrl}/contacts/`,
    ];

    let presentersBody = '';
    let presentersStatus = 0;
    let presenterHref: string | null = null;
    let presenterName: string | null = null;

    for (const url of presenterUrls) {
      const res = await fetch(url, {
        headers: { 'Authorization': `Basic ${basicAuth}`, 'Accept': 'application/xml' },
      });
      presentersBody = await res.text();
      presentersStatus = res.status;
      const key = `step_C_tried_${url.split('/').filter(Boolean).pop()}`;
      results[key] = { status: res.status, body: presentersBody.substring(0, 300) };
      if (res.ok) break;
    }

    results.step_C_get_presenters = {
      status: presentersStatus,
      ok: presentersStatus >= 200 && presentersStatus < 300,
      body: presentersBody.substring(0, 500),
    };

    const firstPresenterHref = extractFirstResourceHref(presentersBody);
    if (firstPresenterHref) {
      const presenterDetailRes = await fetch(firstPresenterHref, {
        headers: { 'Authorization': `Basic ${basicAuth}`, 'Accept': 'application/xml' },
      });
      const presenterDetailBody = await presenterDetailRes.text();
      presenterHref = extractXmlHref(presenterDetailBody, 'self') || firstPresenterHref;
      presenterName = extractXmlValue(presenterDetailBody, 'Name')
        || extractXmlValue(presenterDetailBody, 'FirstName');
      results.step_C_presenter_found = { presenterHref, presenterName };
    }

    // Debug — raw collection bodies
    results.debug_templates_raw = templatesBody.substring(0, 2000);
    results.debug_venues_raw = venuesBody.substring(0, 2000);

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

      const eventHref = extractXmlHref(eBody, 'self');
      const eventId = extractXmlValue(eBody, 'EventID');
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
