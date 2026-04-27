import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type OfferType = "discount_50_3mo" | "pause_30d" | "pause_60d";

interface RequestBody {
  offer_type: OfferType;
  from_plan_slug: string;
  to_plan_slug: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Identify caller
  const { data: userData, error: userErr } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: instructor } = await supabase
    .from("instructors")
    .select("id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (!instructor) {
    return new Response(JSON.stringify({ error: "No instructor profile" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!["discount_50_3mo", "pause_30d", "pause_60d"].includes(body.offer_type)) {
    return new Response(JSON.stringify({ error: "Invalid offer type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Eligibility: server-side enforcement
  const { data: eligible } = await supabase.rpc("check_save_offer_eligibility", {
    p_instructor_id: instructor.id,
  });
  if (!eligible) {
    return new Response(
      JSON.stringify({ error: "Not eligible — save offer already used in last 12 months" }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Get current subscription
  const { data: sub } = await supabase
    .from("instructor_subscriptions")
    .select("id")
    .eq("instructor_id", instructor.id)
    .eq("status", "active")
    .maybeSingle();

  if (!sub) {
    return new Response(JSON.stringify({ error: "No active subscription" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const now = new Date();
  const updates: Record<string, unknown> = {};
  let offerValue: Record<string, unknown> = {};

  if (body.offer_type === "discount_50_3mo") {
    const until = new Date(now);
    until.setMonth(until.getMonth() + 3);
    updates.save_discount_until = until.toISOString();
    updates.save_discount_percent = 50;
    offerValue = { percent: 50, months: 3, until: until.toISOString() };
  } else if (body.offer_type === "pause_30d" || body.offer_type === "pause_60d") {
    const days = body.offer_type === "pause_30d" ? 30 : 60;
    const resume = new Date(now);
    resume.setDate(resume.getDate() + days);
    updates.status = "paused";
    updates.paused_at = now.toISOString();
    updates.resume_at = resume.toISOString();
    offerValue = { days, resume_at: resume.toISOString() };
  }

  // Apply subscription change
  const { error: updErr } = await supabase
    .from("instructor_subscriptions")
    .update(updates)
    .eq("id", sub.id);
  if (updErr) {
    return new Response(JSON.stringify({ error: updErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Log offer + funnel event
  await supabase.from("subscription_save_offers").insert({
    instructor_id: instructor.id,
    from_plan_slug: body.from_plan_slug,
    to_plan_slug: body.to_plan_slug,
    offer_type: body.offer_type,
    offer_value: offerValue,
    accepted_at: now.toISOString(),
  });

  await supabase.from("funnel_events").insert({
    instructor_id: instructor.id,
    event_name: "save_offer_accepted",
    event_data: { offer_type: body.offer_type, from: body.from_plan_slug, to: body.to_plan_slug },
  });

  return new Response(
    JSON.stringify({ ok: true, offer_type: body.offer_type, offer_value: offerValue }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
