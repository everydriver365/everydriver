import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // GET = Meta webhook verification
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();

    // ── Instructor reply → forward to visitor via SMS ──
    if (body?.instructor_reply) {
      return await handleInstructorReply(body);
    }

    // ── Widget message (from in-app chat widget) ──
    if (body?.widget_message) {
      return await handleWidgetMessage(body);
    }
    
    // ── Meta webhook (real WhatsApp inbound) ──
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Only process message events
    if (!value?.messages?.[0]) {
      return new Response(JSON.stringify({ status: "no_message" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message = value.messages[0];
    const senderPhone = message.from; // e.g. "447123456789"
    const messageText = message.text?.body || "";
    const senderName = value.contacts?.[0]?.profile?.name || null;

    if (!messageText.trim()) {
      return new Response(JSON.stringify({ status: "empty_message" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find instructor by WhatsApp phone number ID (the business number receiving the message)
    const businessPhoneId = value.metadata?.phone_number_id;
    
    // Look up which instructor owns this WhatsApp number
    // We match by whatsapp_phone or phone field on instructors table
    const { data: instructor, error: instrError } = await supabase
      .from("instructors")
      .select("id, name, hourly_rate, car_details, postcode, ai_receptionist_enabled, whatsapp_phone, phone")
      .or(`whatsapp_phone.eq.${senderPhone},phone.eq.${senderPhone}`)
      .maybeSingle();

    // If no instructor matched by sender phone, try finding by the business phone ID
    // For now, get the first instructor with AI receptionist enabled as fallback
    let targetInstructor = instructor;
    if (!targetInstructor) {
      const { data: fallback } = await supabase
        .from("instructors")
        .select("id, name, hourly_rate, car_details, postcode, ai_receptionist_enabled, whatsapp_phone, phone")
        .eq("ai_receptionist_enabled", true)
        .limit(1)
        .maybeSingle();
      targetInstructor = fallback;
    }

    if (!targetInstructor) {
      console.log("No instructor found for inbound WhatsApp message from", senderPhone);
      return new Response(JSON.stringify({ status: "no_instructor" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if AI receptionist is enabled
    if (!targetInstructor.ai_receptionist_enabled) {
      console.log("AI receptionist disabled for instructor", targetInstructor.id);
      // Still log the message but don't auto-reply
      await logMessage(supabase, targetInstructor.id, senderPhone, senderName, messageText, "inbound", "visitor");
      return new Response(JSON.stringify({ status: "ai_disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get or create conversation
    const conversation = await getOrCreateConversation(supabase, targetInstructor.id, senderPhone, senderName);

    // Log the inbound message
    await supabase.from("whatsapp_messages").insert({
      conversation_id: conversation.id,
      content: messageText,
      direction: "inbound",
      sender_type: "visitor",
    });

    // Update conversation timestamp
    await supabase.from("whatsapp_conversations").update({
      last_message_at: new Date().toISOString(),
      ...(senderName && !conversation.visitor_name ? { visitor_name: senderName } : {}),
    }).eq("id", conversation.id);

    // Check if AI is enabled for this specific conversation
    if (!conversation.ai_enabled) {
      console.log("AI disabled for conversation", conversation.id);
      return new Response(JSON.stringify({ status: "ai_disabled_for_conversation" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather context for AI
    const context = await gatherInstructorContext(supabase, targetInstructor);

    // Get conversation history (last 10 messages)
    const { data: history } = await supabase
      .from("whatsapp_messages")
      .select("content, direction, sender_type, created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const reversedHistory = (history || []).reverse();

    // Generate AI reply
    const aiReply = await generateAIReply(messageText, context, reversedHistory, targetInstructor.name);

    if (!aiReply) {
      // AI couldn't generate a reply — notify instructor
      await notifyInstructor(supabase, supabaseUrl, targetInstructor.id, senderName || senderPhone, messageText);
      return new Response(JSON.stringify({ status: "handoff" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send SMS notification to instructor instead of WhatsApp reply
    // (The AI reply is still stored in DB and visible in the dashboard)
    // For real WhatsApp inbound, we can't reply without Meta API approval
    // So we just log it and notify the instructor via SMS
    const instructorPhone = targetInstructor.whatsapp_phone || targetInstructor.phone;
    if (instructorPhone) {
      const senderLabel = senderName || senderPhone;
      const notifyText = `💬 New WhatsApp message from ${senderLabel}: "${messageText.substring(0, 120)}"\n\nAI replied automatically. Check your dashboard.`;
      await sendSMSNotification(instructorPhone, notifyText);
    }

    // Log the AI reply
    await supabase.from("whatsapp_messages").insert({
      conversation_id: conversation.id,
      content: aiReply,
      direction: "outbound",
      sender_type: "ai",
    });

    // Update conversation timestamp again
    await supabase.from("whatsapp_conversations").update({
      last_message_at: new Date().toISOString(),
    }).eq("id", conversation.id);

    return new Response(JSON.stringify({ status: "replied" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("whatsapp-webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Handle instructor reply: forward to visitor via SMS ──
async function handleInstructorReply(body: any) {
  const { conversation_id, message } = body;
  if (!conversation_id || !message) {
    return new Response(JSON.stringify({ status: "missing_fields" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get conversation to find visitor phone
  const { data: conv } = await supabase
    .from("whatsapp_conversations")
    .select("phone_number, visitor_name, instructor_id")
    .eq("id", conversation_id)
    .maybeSingle();

  if (!conv?.phone_number) {
    return new Response(JSON.stringify({ status: "no_phone" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get instructor name for the SMS
  const { data: instr } = await supabase
    .from("instructors")
    .select("name")
    .eq("id", conv.instructor_id)
    .maybeSingle();

  const senderName = instr?.name || "Your driving instructor";
  const smsBody = `${senderName}: ${message}`;

  const smsSuccess = await sendSMSNotification(conv.phone_number, smsBody);
  const deliveryStatus = smsSuccess ? "delivered" : "failed";

  // Update delivery_status on the most recent outbound instructor message for this conversation
  const { data: recentMsg } = await supabase
    .from("whatsapp_messages")
    .select("id")
    .eq("conversation_id", conversation_id)
    .eq("direction", "outbound")
    .eq("sender_type", "instructor")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentMsg) {
    await supabase
      .from("whatsapp_messages")
      .update({ delivery_status: deliveryStatus })
      .eq("id", recentMsg.id);
  }

  return new Response(JSON.stringify({ status: smsSuccess ? "sms_sent" : "sms_failed", delivery_status: deliveryStatus }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Rate-limit tracker: conversation_id -> last SMS timestamp
const smsRateLimits = new Map<string, number>();

// ── Handle widget messages: in-app chat + SMS notification to instructor ──
async function handleWidgetMessage(body: any) {
  const { conversation_id, message, visitor_name, visitor_phone, instructor_id } = body;

  if (!conversation_id || !message) {
    return new Response(JSON.stringify({ status: "missing_fields" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Determine who to forward the message to via WhatsApp
  let forwardToPhone: string | null = null;
  let targetInstructor: any = null;

  if (instructor_id) {
    // Widget is on an instructor's page — forward to that instructor's WhatsApp
    const { data: instr } = await supabase
      .from("instructors")
      .select("id, name, hourly_rate, car_details, postcode, ai_receptionist_enabled, whatsapp_phone, phone")
      .eq("id", instructor_id)
      .maybeSingle();

    if (instr) {
      targetInstructor = instr;
      forwardToPhone = instr.whatsapp_phone || instr.phone || null;
    }
  }

  // Fallback: forward to admin WhatsApp number
  if (!forwardToPhone) {
    forwardToPhone = Deno.env.get("ADMIN_PHONE_NUMBER") || null;
  }

  // Detect human handoff request
  const isHandoffRequest = /speak to someone|talk to a person|real person|human|call me|phone me|contact me/i.test(message);

  if (isHandoffRequest) {
    // Send urgent SMS to admin/instructor
    const adminPhone = Deno.env.get("ADMIN_PHONE_NUMBER");
    const handoffPhone = adminPhone || forwardToPhone;

    if (handoffPhone) {
      const { data: history } = await supabase
        .from("whatsapp_messages")
        .select("content, direction, sender_type, created_at")
        .eq("conversation_id", conversation_id)
        .order("created_at", { ascending: true })
        .limit(20);

      const chatSummary = (history || [])
        .slice(-5)
        .map((m: any) => `${m.direction === "inbound" ? "Visitor" : "AI"}: ${m.content}`)
        .join("\n");

      const handoffText = `🚨 HUMAN HANDOFF REQUESTED\n\n👤 Name: ${visitor_name || "Unknown"}\n📱 Phone: ${visitor_phone || "Not provided"}\n\n📝 Recent messages:\n${chatSummary}\n\n⚡ Reply in your dashboard.`;
      await sendSMSNotification(handoffPhone, handoffText);
    }

    // Disable AI for this conversation so future messages go straight to admin
    await supabase.from("whatsapp_conversations").update({
      ai_enabled: false,
      last_message_at: new Date().toISOString(),
    }).eq("id", conversation_id);

    // Send a friendly handoff reply to the visitor
    const handoffReply = "Of course! I've notified the team and someone will be in touch with you shortly. They'll be able to see our conversation so you won't need to repeat yourself. 😊";
    await supabase.from("whatsapp_messages").insert({
      conversation_id,
      content: handoffReply,
      direction: "outbound",
      sender_type: "ai",
    });

    return new Response(JSON.stringify({ status: "handoff", ai_reply: handoffReply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Send SMS notification to instructor (rate-limited: max 1 per conversation per 10 min)
  if (forwardToPhone) {
    const lastSms = smsRateLimits.get(conversation_id) || 0;
    const now = Date.now();
    if (now - lastSms > 10 * 60 * 1000) {
      const senderLabel = visitor_name || visitor_phone || "Website visitor";
      const notifyText = `💬 New enquiry from ${senderLabel}: "${message.substring(0, 120)}"\n\nReply in your dashboard.`;
      await sendSMSNotification(forwardToPhone, notifyText);
      smsRateLimits.set(conversation_id, now);
    }
  }

  // Generate AI reply
  let aiReply: string | null = null;

  // Check if AI is still enabled for this conversation
  const { data: convCheck } = await supabase
    .from("whatsapp_conversations")
    .select("ai_enabled")
    .eq("id", conversation_id)
    .maybeSingle();

  if (convCheck && convCheck.ai_enabled === false) {
    // AI disabled — just forward to admin, no AI reply
    return new Response(JSON.stringify({ status: "forwarded_to_human" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (targetInstructor) {
    const context = await gatherInstructorContext(supabase, targetInstructor);
    const { data: history } = await supabase
      .from("whatsapp_messages")
      .select("content, direction, sender_type, created_at")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: false })
      .limit(10);

    const reversedHistory = (history || []).reverse();
    aiReply = await generateAIReply(message, context, reversedHistory, targetInstructor.name);
  } else {
    // No instructor context — use a generic reply
    aiReply = await generateGenericReply(message, visitor_name);
  }

  if (aiReply) {
    // Store AI reply in DB
    await supabase.from("whatsapp_messages").insert({
      conversation_id,
      content: aiReply,
      direction: "outbound",
      sender_type: "ai",
    });

    // Update conversation timestamp
    await supabase.from("whatsapp_conversations").update({
      last_message_at: new Date().toISOString(),
    }).eq("id", conversation_id);
  }

  return new Response(JSON.stringify({ status: "ok", ai_reply: aiReply }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Send SMS notification via Twilio ──
// Returns true if SMS was accepted by Twilio, false otherwise
async function sendSMSNotification(to: string, text: string): Promise<boolean> {
  const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
  const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
  const TWILIO_MSG_SID = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");
  const TWILIO_FROM = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!TWILIO_SID || !TWILIO_TOKEN) {
    console.log("Twilio credentials not configured, skipping SMS notification");
    return false;
  }

  // Normalize phone number
  let normalizedPhone = to.replace(/[\s\-\(\)]/g, "");
  if (normalizedPhone.startsWith("0")) {
    normalizedPhone = "+44" + normalizedPhone.slice(1);
  }
  if (!normalizedPhone.startsWith("+")) {
    normalizedPhone = "+" + normalizedPhone;
  }

  try {
    const params = new URLSearchParams();
    if (TWILIO_MSG_SID) {
      params.append("MessagingServiceSid", TWILIO_MSG_SID);
    } else if (TWILIO_FROM) {
      params.append("From", TWILIO_FROM);
    }
    params.append("To", normalizedPhone);
    params.append("Body", text);

    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    if (!resp.ok) {
      console.error("SMS notification failed:", resp.status, await resp.text());
      return false;
    } else {
      console.log("SMS notification sent to:", normalizedPhone);
      return true;
    }
  } catch (err) {
    console.error("SMS notification error:", err);
    return false;
  }
}

// ── Generic AI reply for non-instructor chats ──
async function generateGenericReply(message: string, visitorName: string | null): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a friendly AI receptionist for Drive365, a driving instructor franchise. Answer questions about driving lessons, courses, and the franchise helpfully and concisely. Use British English. Plain text only — no markdown. If you can't answer something, say "Let me get someone to help you — they'll be in touch shortly."`,
          },
          { role: "user", content: message },
        ],
      }),
    });

    if (!resp.ok) return null;
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

async function getOrCreateConversation(supabase: any, instructorId: string, phone: string, name: string | null) {
  const { data: existing } = await supabase
    .from("whatsapp_conversations")
    .select("*")
    .eq("instructor_id", instructorId)
    .eq("phone_number", phone)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("whatsapp_conversations")
    .insert({
      instructor_id: instructorId,
      phone_number: phone,
      visitor_name: name,
      last_message_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return created;
}

async function logMessage(supabase: any, instructorId: string, phone: string, name: string | null, content: string, direction: string, senderType: string) {
  const conversation = await getOrCreateConversation(supabase, instructorId, phone, name);
  await supabase.from("whatsapp_messages").insert({
    conversation_id: conversation.id,
    content,
    direction,
    sender_type: senderType,
  });
  await supabase.from("whatsapp_conversations").update({
    last_message_at: new Date().toISOString(),
  }).eq("id", conversation.id);
}

async function gatherInstructorContext(supabase: any, instructor: any) {
  // Get courses
  const { data: courses } = await supabase
    .from("instructor_courses")
    .select("course_name, total_price, course_hours, short_description")
    .eq("instructor_id", instructor.id)
    .eq("is_active", true);

  // Get next 5 available slots from working hours minus booked lessons
  const { data: workingHours } = await supabase
    .from("instructor_working_hours")
    .select("*")
    .eq("instructor_id", instructor.id);

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: bookedLessons } = await supabase
    .from("scheduled_lessons")
    .select("lesson_date, start_time, end_time")
    .eq("instructor_id", instructor.id)
    .gte("lesson_date", now.toISOString().split("T")[0])
    .lte("lesson_date", nextWeek.toISOString().split("T")[0])
    .in("status", ["scheduled", "confirmed"]);

  return {
    name: instructor.name,
    hourlyRate: instructor.hourly_rate,
    carDetails: instructor.car_details,
    postcode: instructor.postcode,
    courses: courses || [],
    workingHours: workingHours || [],
    bookedLessons: bookedLessons || [],
  };
}

async function generateAIReply(
  message: string,
  context: any,
  history: any[],
  instructorName: string
): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY not set");
    return null;
  }

  const coursesInfo = context.courses.length > 0
    ? context.courses.map((c: any) => `- ${c.course_name}: £${c.total_price} (${c.course_hours} hours) ${c.short_description || ""}`).join("\n")
    : "No specific courses listed — hourly lessons available.";

  const systemPrompt = `You are a friendly AI receptionist for ${instructorName}, a driving instructor.

Your job is to answer enquiries about driving lessons naturally and helpfully. Be warm, professional, and concise. Use British English.

INSTRUCTOR INFO:
- Name: ${context.name}
- Hourly rate: £${context.hourlyRate || "TBC"}
- Car: ${context.carDetails || "Modern dual-control vehicle"}
- Area: ${context.postcode || "Local area"}

COURSES AVAILABLE:
${coursesInfo}

RULES:
- Always be helpful and try to answer questions about pricing, availability, and lessons
- If you genuinely cannot answer something (e.g. specific medical questions, complaints), say "Let me get ${instructorName} to help you with that — they'll be in touch shortly"
- Never make up information you don't have
- Keep responses concise — this is WhatsApp, not an essay
- Don't use markdown formatting — plain text only
- If asked about availability, mention they can book online or you can help find a suitable time
- Encourage booking by being enthusiastic but not pushy
- Sign off naturally, don't add "AI" labels`;

  const messages: any[] = [
    { role: "system", content: systemPrompt },
  ];

  // Add conversation history
  for (const msg of history) {
    messages.push({
      role: msg.direction === "inbound" ? "user" : "assistant",
      content: msg.content,
    });
  }

  // The latest message is already in history, but make sure
  if (history.length === 0 || history[history.length - 1]?.content !== message) {
    messages.push({ role: "user", content: message });
  }

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!resp.ok) {
      console.error("AI gateway error:", resp.status, await resp.text());
      return null;
    }

    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content;

    // Check for handoff signal
    if (reply && reply.includes("Let me get") && reply.includes("to help you")) {
      // Still return the reply but also trigger notification
      return reply;
    }

    return reply || null;
  } catch (err) {
    console.error("AI generation error:", err);
    return null;
  }
}

async function notifyInstructor(supabase: any, supabaseUrl: string, instructorId: string, senderName: string, message: string) {
  try {
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instructorId,
        notification: {
          title: "WhatsApp: New message needs attention",
          body: `${senderName}: ${message.substring(0, 100)}`,
          tag: "whatsapp-handoff",
          data: { type: "whatsapp_handoff" },
        },
      }),
    });
  } catch (err) {
    console.error("Failed to notify instructor:", err);
  }
}
