import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOLS = [
  {
    type: "function",
    function: {
      name: "book_lesson",
      description: "Book a driving lesson for a pupil",
      parameters: {
        type: "object",
        properties: {
          pupil_name: { type: "string", description: "Name of the pupil" },
          date: { type: "string", description: "Date in YYYY-MM-DD format" },
          time: { type: "string", description: "Time in HH:MM format (24h)" },
          duration_hours: { type: "number", description: "Duration in hours, default 1" },
        },
        required: ["pupil_name", "date", "time"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_lesson",
      description: "Cancel an upcoming lesson",
      parameters: {
        type: "object",
        properties: {
          pupil_name: { type: "string", description: "Name of the pupil" },
          date: { type: "string", description: "Date of the lesson to cancel" },
        },
        required: ["pupil_name"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_earnings",
      description: "Show earnings/revenue for a time period",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", enum: ["today", "this_week", "this_month", "last_month"], description: "Time period" },
        },
        required: ["period"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_schedule",
      description: "Show upcoming lessons/schedule",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", enum: ["today", "tomorrow", "this_week"], description: "Time period" },
        },
        required: ["period"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_pupil_note",
      description: "Add a note to a pupil's record",
      parameters: {
        type: "object",
        properties: {
          pupil_name: { type: "string" },
          note: { type: "string" },
        },
        required: ["pupil_name", "note"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_todo",
      description: "Create a to-do item",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
        },
        required: ["title"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "general_answer",
      description: "Provide a helpful text answer to a general question",
      parameters: {
        type: "object",
        properties: {
          answer: { type: "string" },
        },
        required: ["answer"],
        additionalProperties: false,
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { command, instructor_id, conversation_history } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get context: pupil names, today's schedule
    const { data: pupils } = await supabase
      .from("pupils")
      .select("id, name, phone, email, account_balance, notes")
      .eq("instructor_id", instructor_id)
      .is("deleted_at", null)
      .limit(100);

    const today = new Date().toISOString().split("T")[0];
    const { data: todayLessons } = await supabase
      .from("scheduled_lessons")
      .select("id, pupil_id, start_time, end_time, status, pupils(name)")
      .eq("instructor_id", instructor_id)
      .gte("start_time", today)
      .lte("start_time", today + "T23:59:59")
      .order("start_time");

    const pupilNames = (pupils || []).map(p => p.name).join(", ");
    const scheduleContext = (todayLessons || []).map(l => 
      `${new Date(l.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} - ${(l.pupils as any)?.name || "Unknown"} (${l.status})`
    ).join("\n");

    const systemPrompt = `You are an AI assistant for a UK driving instructor. Today is ${new Date().toLocaleDateString("en-GB")}.

The instructor's pupils are: ${pupilNames || "none yet"}.

Today's schedule:
${scheduleContext || "No lessons scheduled today."}

You can perform actions like booking lessons, cancelling lessons, showing earnings, viewing schedules, adding notes, and creating to-dos. Use the tools provided.

For dates, interpret relative terms like "tomorrow", "next Thursday", "this Friday" relative to today (${today}).
Always be concise and helpful. Use British English.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversation_history || []),
      { role: "user", content: command },
    ];

    // Call Lovable AI with tool calling
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        tools: TOOLS,
        tool_choice: "auto",
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const choice = aiData.choices?.[0];
    
    let resultText = "";
    let actionTaken = null;

    if (choice?.message?.tool_calls?.length) {
      const toolCall = choice.message.tool_calls[0];
      const fn = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      switch (fn) {
        case "book_lesson": {
          // Find pupil
          const pupil = (pupils || []).find(p => 
            p.name.toLowerCase().includes(args.pupil_name.toLowerCase())
          );
          if (!pupil) {
            resultText = `I couldn't find a pupil named "${args.pupil_name}". Your pupils are: ${pupilNames}`;
            break;
          }
          const startTime = `${args.date}T${args.time}:00`;
          const duration = args.duration_hours || 1;
          const endDate = new Date(startTime);
          endDate.setHours(endDate.getHours() + duration);
          
          const { data: inserted, error } = await supabase.from("scheduled_lessons").insert({
            instructor_id,
            pupil_id: pupil.id,
            start_time: startTime,
            end_time: endDate.toISOString(),
            status: "scheduled",
          }).select("id").single();
          
          if (error) {
            resultText = `Failed to book: ${error.message}`;
          } else {
            // Synchronous Google Calendar push — roll back if Google rejects.
            try {
              const { syncLessonNow } = await import("../_shared/googleCalendarSync.ts");
              await syncLessonNow(supabase, inserted!.id as string);
              resultText = `✅ Booked ${duration}hr lesson with ${pupil.name} on ${new Date(startTime).toLocaleDateString("en-GB")} at ${args.time}`;
              actionTaken = { type: "book_lesson", pupil: pupil.name, date: args.date, time: args.time };
            } catch (syncErr) {
              await supabase.from("scheduled_lessons").delete().eq("id", inserted!.id);
              resultText = `Couldn't add to Google Calendar — slot released. ${syncErr instanceof Error ? syncErr.message : ""}`;
            }
          }
          break;
        }
        case "cancel_lesson": {
          const pupil = (pupils || []).find(p => 
            p.name.toLowerCase().includes(args.pupil_name.toLowerCase())
          );
          if (!pupil) {
            resultText = `Couldn't find pupil "${args.pupil_name}"`;
            break;
          }
          
          let query = supabase
            .from("scheduled_lessons")
            .update({ status: "cancelled" })
            .eq("instructor_id", instructor_id)
            .eq("pupil_id", pupil.id)
            .eq("status", "scheduled");
          
          if (args.date) {
            query = query.gte("start_time", args.date).lte("start_time", args.date + "T23:59:59");
          } else {
            query = query.gte("start_time", new Date().toISOString());
          }
          
          const { error, count } = await query.select();
          if (error) {
            resultText = `Failed to cancel: ${error.message}`;
          } else {
            resultText = `✅ Cancelled upcoming lesson(s) with ${pupil.name}`;
            actionTaken = { type: "cancel_lesson", pupil: pupil.name };
          }
          break;
        }
        case "show_earnings": {
          const now = new Date();
          let from: string, to: string;
          
          switch (args.period) {
            case "today":
              from = today; to = today + "T23:59:59";
              break;
            case "this_week": {
              const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1);
              from = d.toISOString().split("T")[0];
              to = now.toISOString();
              break;
            }
            case "last_month": {
              const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              from = d.toISOString().split("T")[0];
              const end = new Date(now.getFullYear(), now.getMonth(), 0);
              to = end.toISOString().split("T")[0] + "T23:59:59";
              break;
            }
            default: {
              const d = new Date(now.getFullYear(), now.getMonth(), 1);
              from = d.toISOString().split("T")[0];
              to = now.toISOString();
            }
          }
          
          const { data: payments } = await supabase
            .from("payment_history")
            .select("amount")
            .eq("instructor_id", instructor_id)
            .gte("created_at", from)
            .lte("created_at", to);
          
          const total = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
          const count = (payments || []).length;
          resultText = `💰 ${args.period.replace("_", " ")}: £${total.toFixed(2)} from ${count} payment${count !== 1 ? "s" : ""}`;
          break;
        }
        case "show_schedule": {
          let from: string, to: string;
          const now = new Date();
          
          switch (args.period) {
            case "tomorrow": {
              const d = new Date(); d.setDate(d.getDate() + 1);
              from = d.toISOString().split("T")[0];
              to = from + "T23:59:59";
              break;
            }
            case "this_week": {
              from = today;
              const d = new Date(); d.setDate(d.getDate() + (7 - d.getDay()));
              to = d.toISOString().split("T")[0] + "T23:59:59";
              break;
            }
            default:
              from = today; to = today + "T23:59:59";
          }
          
          const { data: lessons } = await supabase
            .from("scheduled_lessons")
            .select("start_time, end_time, status, pupils(name)")
            .eq("instructor_id", instructor_id)
            .gte("start_time", from)
            .lte("start_time", to)
            .eq("status", "scheduled")
            .order("start_time");
          
          if (!lessons?.length) {
            resultText = `📅 No lessons scheduled for ${args.period.replace("_", " ")}`;
          } else {
            const lines = lessons.map(l => {
              const t = new Date(l.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
              const d = new Date(l.start_time).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
              return `• ${d} ${t} — ${(l.pupils as any)?.name || "Unknown"}`;
            });
            resultText = `📅 ${args.period.replace("_", " ")} (${lessons.length} lesson${lessons.length > 1 ? "s" : ""}):\n${lines.join("\n")}`;
          }
          break;
        }
        case "add_pupil_note": {
          const pupil = (pupils || []).find(p =>
            p.name.toLowerCase().includes(args.pupil_name.toLowerCase())
          );
          if (!pupil) {
            resultText = `Couldn't find pupil "${args.pupil_name}"`;
            break;
          }
          const newNotes = `${pupil.notes || ""}\n[${new Date().toLocaleDateString("en-GB")}] ${args.note}`.trim();
          await supabase.from("pupils").update({ notes: newNotes }).eq("id", pupil.id);
          resultText = `📝 Note added to ${pupil.name}'s record`;
          actionTaken = { type: "add_note", pupil: pupil.name };
          break;
        }
        case "create_todo": {
          await supabase.from("instructor_todos" as any).insert({
            instructor_id,
            title: args.title,
            is_completed: false,
          });
          resultText = `✅ To-do created: "${args.title}"`;
          actionTaken = { type: "create_todo", title: args.title };
          break;
        }
        case "general_answer": {
          resultText = args.answer;
          break;
        }
      }
    } else if (choice?.message?.content) {
      resultText = choice.message.content;
    } else {
      resultText = "I'm not sure how to help with that. Try asking me to book a lesson, show earnings, or check your schedule.";
    }

    // Log the command
    await supabase.from("ai_command_logs").insert({
      instructor_id,
      command_text: command,
      parsed_intent: actionTaken?.type || "general",
      result: { text: resultText, action: actionTaken },
    });

    return new Response(JSON.stringify({ result: resultText, action: actionTaken }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-command-center error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
