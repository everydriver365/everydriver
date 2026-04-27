import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Body {
  payment_id: string;
  pupil_id: string;
  reason: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Partial<Body>;
    if (!body.payment_id || !body.pupil_id || !body.reason || body.reason.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Missing or invalid fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the payment belongs to this pupil and resolve instructor_id
    const { data: payment, error: pErr } = await supabase
      .from("payment_history")
      .select("id, pupil_id, instructor_id")
      .eq("id", body.payment_id)
      .maybeSingle();

    if (pErr || !payment) {
      return new Response(JSON.stringify({ error: "Payment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payment.pupil_id !== body.pupil_id) {
      return new Response(JSON.stringify({ error: "Payment does not belong to this pupil" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: dispute, error: dErr } = await supabase
      .from("payment_disputes")
      .insert({
        payment_id: body.payment_id,
        pupil_id: body.pupil_id,
        instructor_id: payment.instructor_id,
        reason: body.reason.trim().slice(0, 1000),
      })
      .select()
      .single();

    if (dErr) {
      return new Response(JSON.stringify({ error: dErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ dispute }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
