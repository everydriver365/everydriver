import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, pupil_name, message, page, instructor_id } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let responseText = "";

    switch (action) {
      case "send_message": {
        if (!pupil_name || !message) {
          responseText = "I couldn't determine who to message or what to say.";
          break;
        }

        // Find the pupil
        const { data: pupils } = await supabase
          .from("pupils")
          .select("id, name, phone")
          .eq("instructor_id", instructor_id)
          .is("deleted_at", null)
          .ilike("name", `%${pupil_name}%`)
          .limit(1);

        const pupil = pupils?.[0];
        if (!pupil) {
          responseText = `I couldn't find a pupil called ${pupil_name}.`;
          break;
        }

        // Find or create conversation
        let { data: convo } = await supabase
          .from("conversations")
          .select("id")
          .eq("instructor_id", instructor_id)
          .eq("pupil_id", pupil.id)
          .limit(1)
          .single();

        if (!convo) {
          const { data: newConvo } = await supabase
            .from("conversations")
            .insert({ instructor_id, pupil_id: pupil.id })
            .select("id")
            .single();
          convo = newConvo;
        }

        if (convo) {
          await supabase.from("messages").insert({
            conversation_id: convo.id,
            sender_type: "instructor",
            sender_id: instructor_id,
            content: message,
          });
        }

        // Also try SMS if phone available
        if (pupil.phone) {
          try {
            const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
            const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
            const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

            if (twilioSid && twilioAuth && twilioPhone) {
              const formData = new URLSearchParams();
              formData.append("To", pupil.phone);
              formData.append("From", twilioPhone);
              formData.append("Body", message);

              await fetch(
                `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Basic ${btoa(`${twilioSid}:${twilioAuth}`)}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                  body: formData.toString(),
                }
              );

              responseText = `Message sent to ${pupil.name} via text and in-app.`;
            } else {
              responseText = `Message sent to ${pupil.name} in the app.`;
            }
          } catch (smsErr) {
            console.error("SMS failed:", smsErr);
            responseText = `Message sent to ${pupil.name} in the app, but text message failed.`;
          }
        } else {
          responseText = `Message sent to ${pupil.name} in the app.`;
        }
        break;
      }

      case "next_lesson": {
        const now = new Date();
        const today = now.toISOString().split("T")[0];
        const currentTime = now.toTimeString().split(" ")[0];

        const { data: lessons } = await supabase
          .from("scheduled_lessons")
          .select("lesson_date, start_time, duration_minutes, pupils!inner(name)")
          .eq("instructor_id", instructor_id)
          .neq("status", "cancelled")
          .or(`lesson_date.gt.${today},and(lesson_date.eq.${today},start_time.gte.${currentTime})`)
          .order("lesson_date", { ascending: true })
          .order("start_time", { ascending: true })
          .limit(1);

        if (lessons && lessons.length > 0) {
          const l = lessons[0] as any;
          const pupilName = l.pupils?.name || "Unknown";
          const time = l.start_time?.slice(0, 5) || "TBC";
          responseText = `Your next lesson is with ${pupilName} at ${time} on ${l.lesson_date}. It's ${l.duration_minutes || 60} minutes long.`;
        } else {
          responseText = "You don't have any upcoming lessons scheduled.";
        }
        break;
      }

      case "today_schedule": {
        const today = new Date().toISOString().split("T")[0];

        const { data: lessons } = await supabase
          .from("scheduled_lessons")
          .select("start_time, duration_minutes, pupils!inner(name)")
          .eq("instructor_id", instructor_id)
          .eq("lesson_date", today)
          .neq("status", "cancelled")
          .order("start_time", { ascending: true });

        if (lessons && lessons.length > 0) {
          const summary = lessons.map((l: any) => {
            const name = l.pupils?.name || "Unknown";
            const time = l.start_time?.slice(0, 5) || "TBC";
            return `${name} at ${time}`;
          }).join(", ");
          const totalHours = lessons.reduce((sum: number, l: any) => sum + (l.duration_minutes || 60), 0) / 60;
          responseText = `You have ${lessons.length} lesson${lessons.length > 1 ? 's' : ''} today, totalling ${totalHours} hours. ${summary}.`;
        } else {
          responseText = "You have no lessons scheduled for today.";
        }
        break;
      }

      case "pupil_balance": {
        if (!pupil_name) {
          responseText = "Which pupil would you like to check?";
          break;
        }

        const { data: pupils } = await supabase
          .from("pupils")
          .select("name, account_balance")
          .eq("instructor_id", instructor_id)
          .is("deleted_at", null)
          .ilike("name", `%${pupil_name}%`)
          .limit(1);

        const pupil = pupils?.[0];
        if (!pupil) {
          responseText = `I couldn't find a pupil called ${pupil_name}.`;
        } else {
          const balance = pupil.account_balance || 0;
          if (balance > 0) {
            responseText = `${pupil.name} has a credit of £${balance.toFixed(2)}.`;
          } else if (balance < 0) {
            responseText = `${pupil.name} owes £${Math.abs(balance).toFixed(2)}.`;
          } else {
            responseText = `${pupil.name}'s account is clear, no balance outstanding.`;
          }
        }
        break;
      }

      case "navigate": {
        const pageMap: Record<string, string> = {
          schedule: "/instructor/schedule",
          pupils: "/instructor/pupils",
          messages: "/instructor/messages",
          payments: "/instructor/pay",
          settings: "/instructor/settings",
          home: "/instructor",
          gaps: "/instructor/gaps",
          tracking: "/instructor/tracking",
        };
        const route = pageMap[page || ""] || null;
        if (route) {
          responseText = `Navigating to ${page}.`;
        } else {
          responseText = `I'm not sure which page you mean.`;
        }
        return new Response(JSON.stringify({ responseText, navigate: route }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        responseText = "Sorry, I didn't understand that command. Try saying something like 'Tell Sarah I'm on my way' or 'What's my next lesson?'";
    }

    return new Response(JSON.stringify({ responseText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-execute error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
