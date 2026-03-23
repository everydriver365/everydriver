import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { trigger_type, instructor_id, pupil_id, pupil_name, context } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get active automations for this trigger
    const { data: automations, error } = await supabase
      .from("instructor_automations")
      .select("*")
      .eq("instructor_id", instructor_id)
      .eq("trigger_type", trigger_type)
      .eq("is_active", true);

    if (error) throw error;
    if (!automations || automations.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const automation of automations) {
      const config = automation.action_config || {};
      const message = (config.message || "")
        .replace(/\{pupil_name\}/g, pupil_name || "Student")
        .replace(/\{date\}/g, new Date().toLocaleDateString("en-GB"))
        .replace(/\{time\}/g, new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));

      try {
        switch (automation.action_type) {
          case "send_sms": {
            const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
            const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
            const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
            
            if (accountSid && authToken && fromNumber && context?.pupil_phone) {
              const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
              await fetch(twilioUrl, {
                method: "POST",
                headers: {
                  "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  To: context.pupil_phone,
                  From: fromNumber,
                  Body: message,
                }),
              });
            }
            break;
          }
          case "create_todo": {
            await supabase.from("instructor_todos" as any).insert({
              instructor_id,
              title: message || `Follow up: ${trigger_type}`,
              is_completed: false,
            });
            break;
          }
          case "add_note": {
            if (pupil_id) {
              // Update pupil notes
              const { data: pupil } = await supabase
                .from("pupils")
                .select("notes")
                .eq("id", pupil_id)
                .single();
              
              const newNotes = `${pupil?.notes || ""}\n[Auto] ${new Date().toLocaleDateString()}: ${message}`.trim();
              await supabase.from("pupils").update({ notes: newNotes }).eq("id", pupil_id);
            }
            break;
          }
          case "send_email": {
            const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
            if (RESEND_API_KEY && context?.pupil_email) {
              await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${RESEND_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: "noreply@everydriver.lovable.app",
                  to: context.pupil_email,
                  subject: config.subject || `Update from your instructor`,
                  html: `<p>${message.replace(/\n/g, "<br>")}</p>`,
                }),
              });
            }
            break;
          }
          case "move_pipeline": {
            if (config.target_stage) {
              await supabase
                .from("pipeline_leads")
                .update({ stage: config.target_stage })
                .eq("instructor_id", instructor_id)
                .ilike("name", `%${pupil_name}%`);
            }
            break;
          }
        }
        processed++;
      } catch (actionError) {
        console.error(`Automation ${automation.id} failed:`, actionError);
      }
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-automations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
