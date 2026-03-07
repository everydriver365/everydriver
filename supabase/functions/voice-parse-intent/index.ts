import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, pupilNames } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are ED, a voice assistant for driving instructors. Parse the user's spoken command into a structured action.

Available pupils: ${pupilNames?.join(", ") || "none loaded"}

Return a JSON tool call with one of these actions:

1. send_message - Send a message to a pupil
   Parameters: pupil_name (string), message (string)
   Examples: "Tell Sarah I'm on my way", "Message John that I'll be 10 minutes late"

2. next_lesson - Query the next upcoming lesson
   Parameters: none
   Example: "What's my next lesson?"

3. today_schedule - Query today's full schedule
   Parameters: none
   Example: "What's my schedule today?", "How many lessons do I have?"

4. pupil_balance - Check a pupil's balance
   Parameters: pupil_name (string)
   Example: "How much does Sarah owe?"

5. navigate - Navigate to a page in the app
   Parameters: page (string - one of: schedule, diary, pupils, messages, payments, settings, home, gaps, tracking, fuel, expenses, income, tax, accounts, live, satnav, find-my-car, mileage, vehicle-health, health, todos, notes, reviews, referrals, dashcam, routes, test-results, notifications, website, resources, standards-check, cpd, availability, fleet-dashboard, nearby-friends, doodlepad, document-templates, plans, test-requests)
   Examples: "Show my schedule", "Go to payments", "Open expenses", "Show my diary", "Open to-do list", "Show live tracking", "Open sat nav", "Show CPD", "Open doodlepad", "Show lesson plans", "Open test requests", "Show fleet dashboard", "Show nearby friends", "Show document templates", "Open availability", "Open standards check", "Show resources", "Open my website", "Show notifications", "Open test results", "Show routes", "Open dashcam", "Show referrals", "Open reviews", "Show my notes", "Open vehicle health", "Show my mileage", "Find my car", "Show my health", "Go to income", "Show my tax", "Open accounts"

6. record_payment - Record a payment from a pupil
   Parameters: pupil_name (string), amount (number)
   Examples: "Record £30 from Sarah", "Sarah paid 35 pounds", "Log payment of 40 from Tom"

7. cancel_lesson - Cancel an upcoming lesson with a pupil
   Parameters: pupil_name (string)
   Examples: "Cancel my next lesson with Tom", "Cancel Tom's lesson"

8. weekly_earnings - Check total earnings for this week
   Parameters: none
   Examples: "How much did I earn this week?", "What are my weekly earnings?", "Total income this week"

9. free_slots - Check available free time on a given day
   Parameters: date (string - e.g. "today", "tomorrow", "monday", "2025-03-10")
   Examples: "When am I free tomorrow?", "What gaps do I have on Monday?", "Am I free today?"

10. log_lesson_note - Log a note about a pupil's lesson
    Parameters: pupil_name (string), note (string)
    Examples: "Sarah did well on roundabouts today", "Tom needs more practice on parallel parking"

11. pupil_count - Count total active pupils
    Parameters: none
    Examples: "How many pupils do I have?", "Total number of students"

12. tomorrow_schedule - Query tomorrow's schedule
    Parameters: none
    Examples: "What's on tomorrow?", "Who do I have tomorrow?"

13. reschedule_lesson - Move a pupil's next lesson to a different date
    Parameters: pupil_name (string), new_date (string)
    Examples: "Move Sarah's lesson to Thursday", "Reschedule Tom to next Monday"

14. send_running_late - Send a running late message to a pupil with ETA
    Parameters: pupil_name (string), delay_minutes (number)
    Examples: "Tell Sarah I'm running 10 minutes late", "Let Tom know I'll be 15 minutes late"

15. total_lessons_today - Count remaining lessons for today
    Parameters: none
    Examples: "How many lessons left today?", "Am I nearly done?"

16. pupil_test_date - Check when a pupil's driving test is
    Parameters: pupil_name (string)
    Examples: "When is Sarah's test?", "What date is Tom's driving test?"

17. unpaid_pupils - List pupils who owe money
    Parameters: none
    Examples: "Who hasn't paid?", "Which pupils owe me money?"

18. nearest_fuel - Find the nearest fuel station
    Parameters: none
    Examples: "Where is the nearest fuel?", "Find me a petrol station", "I need fuel"

19. call_office - Request the office/school to call the instructor back
    Parameters: none
    Examples: "Get the office to call me", "Ask the school to ring me"

20. add_pupil - Add a new pupil
    Parameters: pupil_name (string), phone (string, optional)
    Examples: "Add a new pupil called Emma Smith", "Create a pupil named Jack, phone 07700900123"

21. pupil_contact - Get a pupil's contact details
    Parameters: pupil_name (string)
    Examples: "What's Sarah's phone number?", "Give me Tom's contact details", "What's Emma's email?"

22. monthly_earnings - Check total earnings for this month
    Parameters: none
    Examples: "How much did I earn this month?", "What are my monthly earnings?", "Total income this month"

23. lesson_count - Count how many lessons a pupil has had
    Parameters: pupil_name (string)
    Examples: "How many lessons has Sarah had?", "How many sessions with Tom?"

24. add_todo - Add a to-do item
    Parameters: todo_text (string)
    Examples: "Add a to-do: order new L plates", "Remind me to book MOT", "Add task: print lesson plans"

25. next_test - List upcoming driving tests across all pupils
    Parameters: none
    Examples: "Who has a test coming up?", "Any upcoming driving tests?", "Next test dates"

26. week_schedule - Get overview of the current week's schedule
    Parameters: none
    Examples: "What does my week look like?", "Show me this week's schedule", "How busy am I this week?"

27. pupil_progress - Get a summary of how a pupil is doing
    Parameters: pupil_name (string)
    Examples: "How is Sarah doing?", "Give me an update on Tom", "Sarah's progress"

28. record_expense - Log a business expense
    Parameters: amount (number), expense_category (string - e.g. fuel, car wash, insurance, maintenance, parking, tolls, training, other)
    Examples: "Log an expense of £40 for fuel", "Record a £15 car wash expense", "Add £200 insurance expense"

29. total_hours_today - Check total teaching hours for today
    Parameters: none
    Examples: "How many hours am I teaching today?", "Total hours today", "How long am I working today?"

30. unknown - Could not understand the command
    Parameters: original_text (string)

Match pupil names fuzily (e.g. "sara" matches "Sarah Jones"). Pick the closest match from the available pupils list.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "execute_command",
              description: "Execute a parsed voice command",
              parameters: {
                type: "object",
                properties: {
                  action: {
                    type: "string",
                    enum: [
                      "send_message", "next_lesson", "today_schedule", "pupil_balance",
                      "navigate", "record_payment", "cancel_lesson", "weekly_earnings",
                      "free_slots", "log_lesson_note", "pupil_count", "tomorrow_schedule",
                      "reschedule_lesson", "send_running_late", "total_lessons_today",
                      "pupil_test_date", "unpaid_pupils", "nearest_fuel", "call_office",
                      "add_pupil", "pupil_contact", "monthly_earnings", "lesson_count",
                      "add_todo", "next_test", "week_schedule", "pupil_progress",
                      "record_expense", "total_hours_today", "unknown"
                    ],
                  },
                  pupil_name: { type: "string", description: "Matched pupil name from the available list" },
                  message: { type: "string", description: "Message content for send_message" },
                  page: { type: "string", description: "Page name for navigate" },
                  original_text: { type: "string", description: "Original text for unknown commands" },
                  amount: { type: "number", description: "Payment/expense amount" },
                  note: { type: "string", description: "Lesson note text for log_lesson_note" },
                  date: { type: "string", description: "Date reference for free_slots" },
                  new_date: { type: "string", description: "New date for reschedule_lesson" },
                  delay_minutes: { type: "number", description: "How many minutes late for send_running_late" },
                  phone: { type: "string", description: "Phone number for add_pupil" },
                  todo_text: { type: "string", description: "To-do item text for add_todo" },
                  expense_category: { type: "string", description: "Expense category for record_expense (e.g. fuel, car wash, insurance)" },
                },
                required: ["action"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "execute_command" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ action: "unknown", original_text: transcript }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-parse-intent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
