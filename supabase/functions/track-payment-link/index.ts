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
      const paidAmount = amount || linkData.amount_requested || 0;

      const { error: updateError } = await supabase
        .from("payment_link_tracking")
        .update({
          paid_at: new Date().toISOString(),
          paid_amount: paidAmount,
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

      // Record payment_history and update pupil account_balance
      if (linkData.pupil_id && linkData.instructor_id && paidAmount > 0) {
        try {
          // Insert payment_history record
          const { error: historyError } = await supabase
            .from("payment_history")
            .insert({
              pupil_id: linkData.pupil_id,
              instructor_id: linkData.instructor_id,
              amount: paidAmount,
              payment_method: "Square",
              notes: `Email Payment Link - Code: ${linkCode}`,
            });

          if (historyError) {
            console.error("Error inserting payment_history:", historyError);
          }

          // Update pupil account_balance
          const { data: pupilData } = await supabase
            .from("pupils")
            .select("account_balance")
            .eq("id", linkData.pupil_id)
            .single();

          if (pupilData) {
            const currentBalance = pupilData.account_balance || 0;
            const newBalance = currentBalance + paidAmount;
            await supabase
              .from("pupils")
              .update({ account_balance: newBalance })
              .eq("id", linkData.pupil_id);

            console.log(`Pupil balance updated: ${currentBalance} -> ${newBalance}`);
          }

          // Send payment receipt email
          try {
            const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
            await fetch(`${supabaseUrl}/functions/v1/send-payment-receipt`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseAnonKey}`,
              },
              body: JSON.stringify({
                pupilId: linkData.pupil_id,
                instructorId: linkData.instructor_id,
                amount: paidAmount,
                paymentMethod: "Email Payment Link",
                transactionReference: linkCode,
              }),
            });
            console.log("Payment receipt email triggered for payment link");
          } catch (emailError) {
            console.error("Failed to send receipt email:", emailError);
          }
        } catch (dbError) {
          console.error("Error recording payment details:", dbError);
        }
      }

      console.log(`Link ${linkCode} marked as paid: £${paidAmount}`);
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
