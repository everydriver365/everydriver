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

  // Handle "next monday" etc
  const nextMatch = lower.match(/^next\s+(\w+)$/);
  const dayName = nextMatch ? nextMatch[1] : lower;

  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayIndex = days.indexOf(dayName);
  if (dayIndex !== -1) {
    const current = now.getDay();
    let diff = dayIndex - current;
    if (diff <= 0) diff += 7;
    if (nextMatch && diff < 7) diff += 7; // "next" means the week after
    const d = new Date(now);
    d.setDate(d.getDate() + diff);
    return d.toISOString().split("T")[0];
  }

  const parsed = new Date(dateStr!);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];

  return now.toISOString().split("T")[0];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, pupil_name, message, page, instructor_id, amount, note, date, new_date, delay_minutes, phone, todo_text, expense_category, original_text } = await req.json();

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
          diary: "/instructor/diary",
          pupils: "/instructor/pupils",
          messages: "/instructor/messages",
          payments: "/instructor/pay",
          settings: "/instructor/settings",
          home: "/instructor",
          gaps: "/instructor/gaps",
          tracking: "/instructor/tracking",
          fuel: "/instructor/fuel",
          expenses: "/instructor/expenses",
          income: "/instructor/income",
          tax: "/instructor/tax",
          accounts: "/instructor/accounts",
          live: "/instructor/live",
          satnav: "/instructor/satnav",
          "find-my-car": "/instructor/find-my-car",
          mileage: "/instructor/mileage",
          "vehicle-health": "/instructor/vehicle-health",
          health: "/instructor/health",
          todos: "/instructor/todos",
          notes: "/instructor/notes",
          reviews: "/instructor/reviews",
          referrals: "/instructor/referrals",
          dashcam: "/instructor/dashcam",
          routes: "/instructor/routes",
          "test-results": "/instructor/test-results",
          notifications: "/instructor/notifications",
          website: "/instructor/website",
          resources: "/instructor/resources",
          "standards-check": "/instructor/standards-check",
          cpd: "/instructor/cpd",
          availability: "/instructor/availability",
          "fleet-dashboard": "/instructor/fleet-dashboard",
          "nearby-friends": "/instructor/nearby-friends",
          doodlepad: "/instructor/doodlepad",
          "document-templates": "/instructor/document-templates",
          plans: "/instructor/plans",
          "test-requests": "/instructor/test-requests",
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
          payment_method: "Cash",
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

      case "pupil_count": {
        const { count } = await supabase
          .from("pupils")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructor_id)
          .is("deleted_at", null);

        responseText = `You have ${count || 0} active pupil${(count || 0) !== 1 ? 's' : ''}.`;
        break;
      }

      case "tomorrow_schedule": {
        const tom = new Date();
        tom.setDate(tom.getDate() + 1);
        const tomorrowStr = tom.toISOString().split("T")[0];

        const { data: lessons } = await supabase
          .from("scheduled_lessons")
          .select("start_time, duration_minutes, pupils!inner(name)")
          .eq("instructor_id", instructor_id)
          .eq("lesson_date", tomorrowStr)
          .neq("status", "cancelled")
          .order("start_time", { ascending: true });

        if (lessons && lessons.length > 0) {
          const summary = lessons.map((l: any) => {
            const name = l.pupils?.name || "Unknown";
            const time = l.start_time?.slice(0, 5) || "TBC";
            return `${name} at ${time}`;
          }).join(", ");
          responseText = `You have ${lessons.length} lesson${lessons.length > 1 ? 's' : ''} tomorrow. ${summary}.`;
        } else {
          responseText = "You have no lessons scheduled for tomorrow.";
        }
        break;
      }

      case "reschedule_lesson": {
        if (!pupil_name || !new_date) {
          responseText = "I need a pupil name and a new date. Try saying 'Move Sarah's lesson to Thursday'.";
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
          responseText = `${pupil.name} doesn't have any upcoming lessons to reschedule.`;
          break;
        }

        const newDateStr = resolveDate(new_date);
        await supabase.from("scheduled_lessons").update({
          lesson_date: newDateStr,
        }).eq("id", lesson.id);

        const time = lesson.start_time?.slice(0, 5) || "TBC";
        responseText = `Moved ${pupil.name}'s lesson from ${lesson.lesson_date} to ${newDateStr} at ${time}.`;
        break;
      }

      case "send_running_late": {
        if (!pupil_name) {
          responseText = "Which pupil should I tell you're running late?";
          break;
        }

        const mins = delay_minutes || 10;

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

        const firstName = pupil.name.split(" ")[0];
        const lateMsg = `Hi ${firstName}, I'm running about ${mins} minutes late. Apologies for the delay, I'll be with you shortly!`;

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
            content: lateMsg,
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
              formData.append("Body", lateMsg);

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
              responseText = `Sent a running late message to ${pupil.name}. Told them you'll be about ${mins} minutes late.`;
            } else {
              responseText = `Running late message sent to ${pupil.name} in the app. They don't have SMS set up.`;
            }
          } catch {
            responseText = `Running late message sent to ${pupil.name} in the app, but text message failed.`;
          }
        } else {
          responseText = `Running late message sent to ${pupil.name} in the app.`;
        }
        break;
      }

      case "total_lessons_today": {
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const currentTime = now.toTimeString().split(" ")[0];

        const { data: remaining } = await supabase
          .from("scheduled_lessons")
          .select("start_time, pupils!inner(name)")
          .eq("instructor_id", instructor_id)
          .eq("lesson_date", todayStr)
          .neq("status", "cancelled")
          .gte("start_time", currentTime)
          .order("start_time", { ascending: true });

        const count = remaining?.length || 0;
        if (count > 0) {
          const names = remaining!.map((l: any) => l.pupils?.name || "Unknown").join(", ");
          responseText = `You have ${count} lesson${count > 1 ? 's' : ''} left today: ${names}.`;
        } else {
          responseText = "You have no more lessons today. You're done!";
        }
        break;
      }

      case "pupil_test_date": {
        if (!pupil_name) {
          responseText = "Which pupil's test date would you like to check?";
          break;
        }

        const { data: pupils } = await supabase
          .from("pupils")
          .select("name, test_date")
          .eq("instructor_id", instructor_id)
          .is("deleted_at", null)
          .ilike("name", `%${pupil_name}%`)
          .limit(1);

        const pupil = pupils?.[0];
        if (!pupil) {
          responseText = `I couldn't find a pupil called ${pupil_name}.`;
        } else if (pupil.test_date) {
          responseText = `${pupil.name}'s driving test is on ${pupil.test_date}.`;
        } else {
          responseText = `${pupil.name} doesn't have a test date set yet.`;
        }
        break;
      }

      case "unpaid_pupils": {
        const { data: pupils } = await supabase
          .from("pupils")
          .select("name, account_balance")
          .eq("instructor_id", instructor_id)
          .is("deleted_at", null)
          .lt("account_balance", 0)
          .order("account_balance", { ascending: true });

        if (pupils && pupils.length > 0) {
          const total = pupils.reduce((sum: number, p: any) => sum + Math.abs(p.account_balance || 0), 0);
          const list = pupils.map((p: any) => `${p.name} owes £${Math.abs(p.account_balance).toFixed(2)}`).join(", ");
          responseText = `${pupils.length} pupil${pupils.length > 1 ? 's' : ''} with outstanding balances totalling £${total.toFixed(2)}. ${list}.`;
        } else {
          responseText = "All pupils are up to date with payments. No outstanding balances.";
        }
        break;
      }

      case "nearest_fuel": {
        responseText = "Opening the fuel finder for you now.";
        return new Response(JSON.stringify({ responseText, navigate: "/instructor/fuel" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "call_office": {
        const { data: instructor } = await supabase
          .from("instructors")
          .select("name")
          .eq("id", instructor_id)
          .single();

        const instrName = instructor?.name || "An instructor";

        await supabase.from("admin_activity_log").insert({
          action_type: "callback_request",
          description: `${instrName} has requested a callback from the office (via voice assistant).`,
          entity_type: "instructor",
          entity_id: instructor_id,
          metadata: { source: "voice_assistant", instructor_name: instrName },
        });

        responseText = "Done. I've sent a callback request to the office. They'll ring you back shortly.";
        break;
      }

      // ========== NEW COMMANDS ==========

      case "add_pupil": {
        if (!pupil_name) {
          responseText = "I need a name for the new pupil. Try saying 'Add a pupil called Emma Smith'.";
          break;
        }

        const insertData: any = {
          instructor_id,
          name: pupil_name,
          status: "active",
        };
        if (phone) insertData.phone = phone;

        const { error } = await supabase.from("pupils").insert(insertData);

        if (error) {
          console.error("add_pupil error:", error);
          responseText = `Sorry, I couldn't add ${pupil_name}. There was an error.`;
        } else {
          responseText = `Added ${pupil_name} as a new pupil.${phone ? ` Phone: ${phone}.` : ""}`;
        }
        break;
      }

      case "pupil_contact": {
        if (!pupil_name) {
          responseText = "Which pupil's contact details do you need?";
          break;
        }

        const { data: pupils } = await supabase
          .from("pupils")
          .select("name, phone, email")
          .eq("instructor_id", instructor_id)
          .is("deleted_at", null)
          .ilike("name", `%${pupil_name}%`)
          .limit(1);

        const pupil = pupils?.[0];
        if (!pupil) {
          responseText = `I couldn't find a pupil called ${pupil_name}.`;
        } else {
          const parts: string[] = [];
          if (pupil.phone) parts.push(`phone: ${pupil.phone}`);
          if (pupil.email) parts.push(`email: ${pupil.email}`);
          if (parts.length > 0) {
            responseText = `${pupil.name}'s contact details: ${parts.join(", ")}.`;
          } else {
            responseText = `${pupil.name} doesn't have any contact details on file.`;
          }
        }
        break;
      }

      case "monthly_earnings": {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

        const { data: payments } = await supabase
          .from("payment_history")
          .select("amount")
          .eq("instructor_id", instructor_id)
          .gte("payment_date", firstDay)
          .lte("payment_date", lastDay);

        const total = (payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const count = payments?.length || 0;

        if (count > 0) {
          responseText = `You've earned £${total.toFixed(2)} this month from ${count} payment${count > 1 ? 's' : ''}.`;
        } else {
          responseText = "No payments recorded this month yet.";
        }
        break;
      }

      case "lesson_count": {
        if (!pupil_name) {
          responseText = "Which pupil would you like to check?";
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

        const { count } = await supabase
          .from("scheduled_lessons")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructor_id)
          .eq("pupil_id", pupil.id)
          .neq("status", "cancelled");

        responseText = `${pupil.name} has had ${count || 0} lesson${(count || 0) !== 1 ? 's' : ''}.`;
        break;
      }

      case "add_todo": {
        if (!todo_text) {
          responseText = "What should the to-do say? Try 'Add a to-do: order new L plates'.";
          break;
        }

        const { error } = await supabase.from("instructor_todos").insert({
          instructor_id,
          title: todo_text,
          priority: 4,
          project: "Inbox",
        });

        if (error) {
          console.error("add_todo error:", error);
          responseText = "Sorry, I couldn't add that to-do.";
        } else {
          responseText = `To-do added: "${todo_text}".`;
        }
        break;
      }

      case "next_test": {
        const todayStr = new Date().toISOString().split("T")[0];

        const { data: pupils } = await supabase
          .from("pupils")
          .select("name, test_date")
          .eq("instructor_id", instructor_id)
          .is("deleted_at", null)
          .gte("test_date", todayStr)
          .order("test_date", { ascending: true })
          .limit(5);

        if (pupils && pupils.length > 0) {
          const list = pupils.map((p: any) => `${p.name} on ${p.test_date}`).join(", ");
          responseText = `Upcoming tests: ${list}.`;
        } else {
          responseText = "No pupils have upcoming test dates set.";
        }
        break;
      }

      case "week_schedule": {
        const now = new Date();
        const day = now.getDay();
        const mondayOffset = day === 0 ? -6 : 1 - day;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset);
        const mondayStr = monday.toISOString().split("T")[0];

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const sundayStr = sunday.toISOString().split("T")[0];

        const { data: lessons } = await supabase
          .from("scheduled_lessons")
          .select("lesson_date, start_time, duration_minutes")
          .eq("instructor_id", instructor_id)
          .neq("status", "cancelled")
          .gte("lesson_date", mondayStr)
          .lte("lesson_date", sundayStr)
          .order("lesson_date", { ascending: true });

        if (!lessons || lessons.length === 0) {
          responseText = "You have no lessons this week.";
          break;
        }

        const dayCounts: Record<string, number> = {};
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        for (const l of lessons) {
          const d = new Date(l.lesson_date + "T12:00:00");
          const name = dayNames[d.getDay()];
          dayCounts[name] = (dayCounts[name] || 0) + 1;
        }

        const totalHours = lessons.reduce((s: number, l: any) => s + (l.duration_minutes || 60), 0) / 60;
        const breakdown = Object.entries(dayCounts).map(([d, c]) => `${d}: ${c}`).join(", ");
        responseText = `This week you have ${lessons.length} lesson${lessons.length > 1 ? 's' : ''} totalling ${totalHours} hours. ${breakdown}.`;
        break;
      }

      case "pupil_progress": {
        if (!pupil_name) {
          responseText = "Which pupil would you like a progress update on?";
          break;
        }

        const { data: pupils } = await supabase
          .from("pupils")
          .select("id, name, test_date, lesson_count, total_hours")
          .eq("instructor_id", instructor_id)
          .is("deleted_at", null)
          .ilike("name", `%${pupil_name}%`)
          .limit(1);

        const pupil = pupils?.[0];
        if (!pupil) {
          responseText = `I couldn't find a pupil called ${pupil_name}.`;
          break;
        }

        // Get lesson count
        const { count: lessonCount } = await supabase
          .from("scheduled_lessons")
          .select("id", { count: "exact", head: true })
          .eq("instructor_id", instructor_id)
          .eq("pupil_id", pupil.id)
          .neq("status", "cancelled");

        // Get latest lesson note
        const { data: recentLessons } = await supabase
          .from("scheduled_lessons")
          .select("lesson_date, notes")
          .eq("instructor_id", instructor_id)
          .eq("pupil_id", pupil.id)
          .not("notes", "is", null)
          .order("lesson_date", { ascending: false })
          .limit(1);

        const parts: string[] = [`${pupil.name} has had ${lessonCount || 0} lessons`];
        if (pupil.test_date) parts.push(`test date: ${pupil.test_date}`);
        if (recentLessons?.[0]?.notes) {
          const lastNote = recentLessons[0].notes.split("\n").pop() || recentLessons[0].notes;
          parts.push(`latest note: "${lastNote.substring(0, 80)}"`);
        }
        responseText = parts.join(". ") + ".";
        break;
      }

      case "record_expense": {
        if (!amount || amount <= 0) {
          responseText = "I need an amount. Try saying 'Log an expense of £40 for fuel'.";
          break;
        }

        const category = expense_category || "other";

        const { error } = await supabase.from("instructor_expenses").insert({
          instructor_id,
          amount,
          category,
          description: `${category} expense (recorded via voice)`,
          expense_date: new Date().toISOString().split("T")[0],
        });

        if (error) {
          console.error("record_expense error:", error);
          responseText = "Sorry, I couldn't record that expense.";
        } else {
          responseText = `Recorded £${amount.toFixed(2)} ${category} expense.`;
        }
        break;
      }

      case "total_hours_today": {
        const todayStr = new Date().toISOString().split("T")[0];

        const { data: lessons } = await supabase
          .from("scheduled_lessons")
          .select("duration_minutes")
          .eq("instructor_id", instructor_id)
          .eq("lesson_date", todayStr)
          .neq("status", "cancelled");

        if (!lessons || lessons.length === 0) {
          responseText = "You have no lessons today, so zero teaching hours.";
          break;
        }

        const totalMins = lessons.reduce((s: number, l: any) => s + (l.duration_minutes || 60), 0);
        const hours = totalMins / 60;
        responseText = `You have ${hours} hour${hours !== 1 ? 's' : ''} of teaching today across ${lessons.length} lesson${lessons.length > 1 ? 's' : ''}.`;
        break;
      }

      case "general_query": {
        const originalText = original_text || note || todo_text || message || "";
        
        // Fetch instructor profile for context
        const { data: instructor } = await supabase
          .from("instructors")
          .select("name, phone, hourly_rate, areas_covered, transmission_type, car_make, car_model, adi_number, adi_grade, qualifications, bio, email, weekend_surcharge_amount, bank_holiday_surcharge_amount, odd_hours_surcharge_amount, odd_hours_start, odd_hours_end")
          .eq("id", instructor_id)
          .single();

        if (!instructor) {
          responseText = "I couldn't find your profile information.";
          break;
        }

        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) {
          responseText = "AI is not configured. Please try again later.";
          break;
        }

        const areasText = instructor.areas_covered
          ? (Array.isArray(instructor.areas_covered) ? instructor.areas_covered.join(", ") : instructor.areas_covered)
          : "not set";

        const contextPrompt = `You are ED, a voice assistant for a driving instructor. Answer the question naturally and concisely (1-2 sentences max, suitable for spoken response).

Instructor profile:
- Name: ${instructor.name || "Not set"}
- Phone: ${instructor.phone || "Not set"}
- Email: ${instructor.email || "Not set"}
- Hourly rate: ${instructor.hourly_rate ? `£${instructor.hourly_rate}` : "Not set"}
- Surcharges: ${[
  Number(instructor.weekend_surcharge_amount) > 0 ? `+£${Number(instructor.weekend_surcharge_amount).toFixed(2)}/hr at weekends` : null,
  Number(instructor.bank_holiday_surcharge_amount) > 0 ? `+£${Number(instructor.bank_holiday_surcharge_amount).toFixed(2)}/hr on bank holidays` : null,
  Number(instructor.odd_hours_surcharge_amount) > 0 && instructor.odd_hours_start && instructor.odd_hours_end
    ? `+£${Number(instructor.odd_hours_surcharge_amount).toFixed(2)}/hr off-peak (${instructor.odd_hours_start}–${instructor.odd_hours_end})`
    : null,
].filter(Boolean).join("; ") || "None"}
- Transmission: ${instructor.transmission_type || "Not set"}
- Car: ${instructor.car_make ? `${instructor.car_make} ${instructor.car_model || ""}`.trim() : "Not set"}
- Areas covered: ${areasText}
- ADI number: ${instructor.adi_number || "Not set"}
- ADI grade: ${instructor.adi_grade || "Not set"}
- Qualifications: ${instructor.qualifications || "Not set"}
- Bio: ${instructor.bio || "Not set"}

If you don't have the information to answer, say so briefly.`;

        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: contextPrompt },
                { role: "user", content: originalText },
              ],
            }),
          });

          if (!aiResponse.ok) {
            responseText = "Sorry, I couldn't process that question right now.";
            break;
          }

          const aiData = await aiResponse.json();
          responseText = aiData.choices?.[0]?.message?.content || "Sorry, I couldn't find an answer to that.";
        } catch (aiErr) {
          console.error("general_query AI error:", aiErr);
          responseText = "Sorry, something went wrong while answering your question.";
        }
        break;
      }

      default:
        responseText = "Sorry, I didn't understand that command. Try saying something like 'Tell Sarah I'm on my way', 'Record £30 from Tom', 'Open expenses', or 'Add a to-do: book MOT'.";
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
