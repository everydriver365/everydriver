import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function resolveDate(dateStr: string | undefined): string {
  const now = new Date();
  const lower = (dateStr || "today").toLowerCase().trim();

  if (lower === "today") return now.toISOString().split("T")[0];
  if (lower === "tomorrow") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }

  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayIndex = days.indexOf(lower);
  if (dayIndex !== -1) {
    const current = now.getDay();
    let diff = dayIndex - current;
    if (diff <= 0) diff += 7;
    const d = new Date(now);
    d.setDate(d.getDate() + diff);
    return d.toISOString().split("T")[0];
  }

  // Try parsing as date string
  const parsed = new Date(dateStr!);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];

  return now.toISOString().split("T")[0];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, pupil_name, message, page, instructor_id, amount, note, date } = await req.json();

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

      case "record_payment": {
        if (!pupil_name || !amount || amount <= 0) {
          responseText = "I need a pupil name and a valid amount. Try saying 'Record £30 from Sarah'.";
          break;
        }

        const { data: pupils } = await supabase
          .from("pupils")
          .select("id, name, account_balance")
          .eq("instructor_id", instructor_id)
          .is("deleted_at", null)
          .ilike("name", `%${pupil_name}%`)
          .limit(1);

        const pupil = pupils?.[0];
        if (!pupil) {
          responseText = `I couldn't find a pupil called ${pupil_name}.`;
          break;
        }

        await supabase.from("payment_history").insert({
          pupil_id: pupil.id,
          instructor_id,
          amount,
          payment_method: "Voice/Cash",
          notes: "Recorded via voice assistant",
        });

        const newBalance = (pupil.account_balance || 0) + amount;
        await supabase.from("pupils").update({ account_balance: newBalance }).eq("id", pupil.id);

        responseText = `Recorded £${amount.toFixed(2)} payment from ${pupil.name}. Their new balance is £${newBalance.toFixed(2)}.`;
        break;
      }

      case "cancel_lesson": {
        if (!pupil_name) {
          responseText = "Which pupil's lesson should I cancel?";
          break;
        }

        const { data: pupils } = await supabase
          .from("pupils")
          .select("id, name")
          .eq("instructor_id", instructor_id)
          .is("deleted_at", null)
          .ilike("name", `%${pupil_name}%`)
          .limit(1);

        const pupil = pupils?.[0];
        if (!pupil) {
          responseText = `I couldn't find a pupil called ${pupil_name}.`;
          break;
        }

        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const currentTime = now.toTimeString().split(" ")[0];

        const { data: lessons } = await supabase
          .from("scheduled_lessons")
          .select("id, lesson_date, start_time")
          .eq("instructor_id", instructor_id)
          .eq("pupil_id", pupil.id)
          .neq("status", "cancelled")
          .or(`lesson_date.gt.${todayStr},and(lesson_date.eq.${todayStr},start_time.gte.${currentTime})`)
          .order("lesson_date", { ascending: true })
          .order("start_time", { ascending: true })
          .limit(1);

        const lesson = lessons?.[0];
        if (!lesson) {
          responseText = `${pupil.name} doesn't have any upcoming lessons to cancel.`;
          break;
        }

        await supabase.from("scheduled_lessons").update({
          status: "cancelled",
          cancellation_reason: "Cancelled via voice assistant",
        }).eq("id", lesson.id);

        const time = lesson.start_time?.slice(0, 5) || "TBC";
        responseText = `Cancelled ${pupil.name}'s lesson on ${lesson.lesson_date} at ${time}.`;
        break;
      }

      case "weekly_earnings": {
        const now = new Date();
        const day = now.getDay();
        const mondayOffset = day === 0 ? -6 : 1 - day;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset);
        const mondayStr = monday.toISOString().split("T")[0];

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const sundayStr = sunday.toISOString().split("T")[0];

        const { data: payments } = await supabase
          .from("payment_history")
          .select("amount")
          .eq("instructor_id", instructor_id)
          .gte("payment_date", mondayStr)
          .lte("payment_date", sundayStr);

        const total = (payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const count = payments?.length || 0;

        if (count > 0) {
          responseText = `You've earned £${total.toFixed(2)} this week from ${count} payment${count > 1 ? 's' : ''}.`;
        } else {
          responseText = "No payments recorded this week yet.";
        }
        break;
      }

      case "free_slots": {
        const targetDate = resolveDate(date);

        const { data: lessons } = await supabase
          .from("scheduled_lessons")
          .select("start_time, duration_minutes")
          .eq("instructor_id", instructor_id)
          .eq("lesson_date", targetDate)
          .neq("status", "cancelled")
          .order("start_time", { ascending: true });

        const workStart = "08:00";
        const workEnd = "19:00";

        if (!lessons || lessons.length === 0) {
          responseText = `You're completely free on ${targetDate}, from ${workStart} to ${workEnd}.`;
          break;
        }

        const gaps: string[] = [];
        let cursor = workStart;

        for (const l of lessons) {
          const lessonStart = l.start_time?.slice(0, 5) || cursor;
          if (lessonStart > cursor) {
            gaps.push(`${cursor} to ${lessonStart}`);
          }
          const dur = l.duration_minutes || 60;
          const [h, m] = lessonStart.split(":").map(Number);
          const endMins = h * 60 + m + dur;
          const endH = String(Math.floor(endMins / 60)).padStart(2, "0");
          const endM = String(endMins % 60).padStart(2, "0");
          cursor = `${endH}:${endM}`;
        }

        if (cursor < workEnd) {
          gaps.push(`${cursor} to ${workEnd}`);
        }

        if (gaps.length > 0) {
          responseText = `On ${targetDate} you have ${gaps.length} free slot${gaps.length > 1 ? 's' : ''}: ${gaps.join(", ")}.`;
        } else {
          responseText = `You're fully booked on ${targetDate}.`;
        }
        break;
      }

      case "log_lesson_note": {
        if (!pupil_name || !note) {
          responseText = "I need a pupil name and a note. Try saying 'Sarah did well on roundabouts today'.";
          break;
        }

        const { data: pupils } = await supabase
          .from("pupils")
          .select("id, name")
          .eq("instructor_id", instructor_id)
          .is("deleted_at", null)
          .ilike("name", `%${pupil_name}%`)
          .limit(1);

        const pupil = pupils?.[0];
        if (!pupil) {
          responseText = `I couldn't find a pupil called ${pupil_name}.`;
          break;
        }

        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];

        // Find today's or most recent lesson for this pupil
        const { data: lessons } = await supabase
          .from("scheduled_lessons")
          .select("id, lesson_date, start_time, notes")
          .eq("instructor_id", instructor_id)
          .eq("pupil_id", pupil.id)
          .neq("status", "cancelled")
          .lte("lesson_date", todayStr)
          .order("lesson_date", { ascending: false })
          .order("start_time", { ascending: false })
          .limit(1);

        const lesson = lessons?.[0];
        if (!lesson) {
          responseText = `I couldn't find a recent lesson for ${pupil.name} to add a note to.`;
          break;
        }

        const existingNotes = lesson.notes ? lesson.notes + "\n" : "";
        await supabase.from("scheduled_lessons").update({
          notes: existingNotes + `[Voice] ${note}`,
        }).eq("id", lesson.id);

        responseText = `Note added to ${pupil.name}'s lesson on ${lesson.lesson_date}: "${note}".`;
        break;
      }

      default:
        responseText = "Sorry, I didn't understand that command. Try saying something like 'Tell Sarah I'm on my way', 'Record £30 from Tom', or 'When am I free tomorrow?'";
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
