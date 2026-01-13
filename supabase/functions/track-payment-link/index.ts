import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const linkCode = url.searchParams.get("code");
    const action = url.searchParams.get("action") || "open";

    if (!linkCode) {
      console.error("No link code provided");
      return new Response(JSON.stringify({ error: "Link code required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Tracking payment link: ${linkCode}, action: ${action}`);

    // Get current link data
    const { data: linkData, error: fetchError } = await supabase
      .from("payment_link_tracking")
      .select("*, instructors(name, payment_link_base_url, stripe_account_id)")
      .eq("link_code", linkCode)
      .single();

    if (fetchError || !linkData) {
      console.error("Link not found:", fetchError);
      return new Response(JSON.stringify({ error: "Link not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (action === "open") {
      // Update opened tracking
      const { error: updateError } = await supabase
        .from("payment_link_tracking")
        .update({
          opened_at: linkData.opened_at || new Date().toISOString(),
          opened_count: (linkData.opened_count || 0) + 1,
          status: linkData.status === "sent" ? "opened" : linkData.status,
        })
        .eq("id", linkData.id);

      if (updateError) {
        console.error("Error updating link tracking:", updateError);
      } else {
        console.log(`Link ${linkCode} opened, count: ${(linkData.opened_count || 0) + 1}`);
      }

      // Redirect to actual payment page
      const paymentUrl = linkData.instructors?.payment_link_base_url || 
        `https://pay.everydriver.co.uk/${linkData.instructor_id}`;
      
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          "Location": paymentUrl,
        },
      });
    }

    if (action === "paid") {
      const body = await req.json().catch(() => ({}));
      const { amount } = body;

      const { error: updateError } = await supabase
        .from("payment_link_tracking")
        .update({
          paid_at: new Date().toISOString(),
          paid_amount: amount || linkData.amount_requested,
          status: "paid",
        })
        .eq("id", linkData.id);

      if (updateError) {
        console.error("Error marking link as paid:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      console.log(`Link ${linkCode} marked as paid: £${amount || linkData.amount_requested}`);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Return link info for status checks
    return new Response(JSON.stringify({
      link_code: linkData.link_code,
      status: linkData.status,
      opened_at: linkData.opened_at,
      opened_count: linkData.opened_count,
      paid_at: linkData.paid_at,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    console.error("Error in track-payment-link:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
