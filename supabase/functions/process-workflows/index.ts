import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WorkflowStep {
  type: "condition" | "delay" | "action";
  config: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { trigger_type, instructor_id, pupil_id, pupil_name, context } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get active workflows for this trigger
    const { data: workflows, error } = await supabase
      .from("automation_workflows")
      .select("*")
      .eq("instructor_id", instructor_id)
      .eq("trigger_type", trigger_type)
      .eq("is_active", true);

    if (error) throw error;
    if (!workflows?.length) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Also process simple automations
    const { data: simpleAutomations } = await supabase
      .from("instructor_automations")
      .select("*")
      .eq("instructor_id", instructor_id)
      .eq("trigger_type", trigger_type)
      .eq("is_active", true);

    let processed = 0;

    // Process multi-step workflows
    for (const workflow of workflows) {
      const steps = (workflow.steps as WorkflowStep[]) || [];
      let shouldContinue = true;

      for (const step of steps) {
        if (!shouldContinue) break;

        switch (step.type) {
          case "condition": {
            // Evaluate condition
            const { field, operator, value } = step.config;
            let fieldValue: any;

            if (field === "pupil_balance" && pupil_id) {
              const { data: pupil } = await supabase
                .from("pupils")
                .select("account_balance")
                .eq("id", pupil_id)
                .single();
              fieldValue = pupil?.account_balance || 0;
            } else if (field === "lesson_count" && pupil_id) {
              const { count } = await supabase
                .from("scheduled_lessons")
                .select("*", { count: "exact", head: true })
                .eq("pupil_id", pupil_id)
                .eq("status", "completed");
              fieldValue = count || 0;
            } else if (field === "day_of_week") {
              fieldValue = new Date().getDay();
            }

            switch (operator) {
              case "greater_than": shouldContinue = fieldValue > Number(value); break;
              case "less_than": shouldContinue = fieldValue < Number(value); break;
              case "equals": shouldContinue = String(fieldValue) === String(value); break;
              case "not_equals": shouldContinue = String(fieldValue) !== String(value); break;
              default: shouldContinue = true;
            }
            break;
          }
          case "delay": {
            // For now, log and skip delays (would need a queue system for real delays)
            console.log(`Workflow ${workflow.id}: delay ${step.config.minutes || 0} minutes (skipped in sync mode)`);
            break;
          }
          case "action": {
            const message = (step.config.message || "")
              .replace(/\{pupil_name\}/g, pupil_name || "Student")
              .replace(/\{date\}/g, new Date().toLocaleDateString("en-GB"))
              .replace(/\{time\}/g, new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));

            switch (step.config.action_type) {
              case "send_sms": {
                const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
                const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
                const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
                if (accountSid && authToken && fromNumber && context?.pupil_phone) {
                  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
                    method: "POST",
                    headers: {
                      "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
                      "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({ To: context.pupil_phone, From: fromNumber, Body: message }),
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
                  const { data: pupil } = await supabase.from("pupils").select("notes").eq("id", pupil_id).single();
                  const newNotes = `${pupil?.notes || ""}\n[Auto] ${new Date().toLocaleDateString()}: ${message}`.trim();
                  await supabase.from("pupils").update({ notes: newNotes }).eq("id", pupil_id);
                }
                break;
              }
              case "move_pipeline": {
                if (step.config.target_stage) {
                  await supabase
                    .from("pipeline_leads")
                    .update({ stage: step.config.target_stage })
                    .eq("instructor_id", instructor_id)
                    .ilike("name", `%${pupil_name}%`);
                }
                break;
              }
            }
            break;
          }
        }
      }
      if (shouldContinue) processed++;
    }

    return new Response(JSON.stringify({ processed, workflows: workflows.length, simple: simpleAutomations?.length || 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-workflows error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
