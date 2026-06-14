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

    // STEP D — probe multiple event creation paths
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

    results.step_D_xml_sent = eventXml;

    const eventCreationPaths = [
      `${templateHref}events/`,
      `${baseUrl}/events/`,
      `https://dsm.arlo.co/api/2012-02-01/auth/resources/events/`,
      `https://dsm.arlo.co/api/2012-02-01/pub/resources/events/`,
    ];

    let createEventBody = '';
    let createEventStatus = 0;
    let successfulPath: string | null = null;

    for (const path of eventCreationPaths) {
      const attempt = await fetch(path, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/xml',
          'Accept': 'application/xml',
        },
        body: eventXml,
      });
      const attemptBody = await attempt.text();
      const key = `step_D_attempt_${path.replace(/https?:\/\/[^/]+/, '')}`;
      results[key] = {
        status: attempt.status,
        ok: attempt.ok,
        body: attemptBody.substring(0, 500),
      };
      if (attempt.status !== 404) {
        createEventStatus = attempt.status;
        createEventBody = attemptBody;
        successfulPath = path;
        results.step_D_successful_path = path;
        break;
      }
    }

    results.step_D_create_event = {
      status: createEventStatus,
      ok: createEventStatus >= 200 && createEventStatus < 300,
      body: createEventBody.substring(0, 2000),
    };

    if (createEventStatus === 201) {
      results.step_D_success = 'Event created successfully';
      const eventId = extractXmlValue(createEventBody, 'EventID');
      const eventHref = extractXmlHref(createEventBody, 'self');
      results.step_D_event_id = eventId;
      results.step_D_event_href = eventHref;
      results.FINAL_RESULT = 'PROCEED TO SESSION CREATION';
    } else if (createEventStatus === 0) {
      results.step_D_error = 'All paths returned 404 — event creation endpoint not found';
      results.FINAL_RESULT = 'FAILED — no valid event creation path found';
      results.step_D_recommendation = 'Check Arlo account has API write permissions enabled. Contact Arlo support to confirm the correct event creation endpoint for your plan.';
    } else {
      results.step_D_error = `Event creation returned ${createEventStatus} via ${successfulPath}`;
      results.FINAL_RESULT = `FAILED — got ${createEventStatus} not 201`;
    }
  } catch (err) {
    results.unexpected_error = String(err);
    results.FINAL_RESULT = 'ERROR — unexpected failure';
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
