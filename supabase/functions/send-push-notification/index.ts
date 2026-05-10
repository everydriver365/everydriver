import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { initVapidKeys, sendPush } from "../_shared/webpush.ts";
import { shouldSendToInstructor, enqueueOutbox, NotifyCategory, NotifyImportance } from "../_shared/notify-gate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string }>;
  requireInteraction?: boolean;
}

interface NotificationRequest {
  instructorId: string;
  notification: PushPayload;
  category?: NotifyCategory;
  importance?: NotifyImportance;
  pupilId?: string;
  jobValue?: number;
  bypassGate?: boolean;
}

// Send Expo push notifications via Expo's push API
async function sendExpoPush(tokens: string[], notification: PushPayload): Promise<{ sent: number; failed: number; staleTokens: string[] }> {
  const messages = tokens.map((token) => ({
    to: token,
    sound: "default",
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
    badge: notification.badge ? parseInt(notification.badge) : undefined,
    categoryId: notification.tag,
  }));

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    const data = result.data || [];
    let sent = 0;
    let failed = 0;
    const staleTokens: string[] = [];

    data.forEach((item: any, index: number) => {
      if (item.status === "ok") {
        sent++;
      } else {
        failed++;
        // DeviceNotRegistered means the token is stale
        if (item.details?.error === "DeviceNotRegistered") {
          staleTokens.push(tokens[index]);
        }
        console.error(`Expo push error for token ${tokens[index]}:`, item);
      }
    });

    return { sent, failed, staleTokens };
  } catch (error) {
    console.error("Expo push API error:", error);
    return { sent: 0, failed: tokens.length, staleTokens: [] };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check
    const authHeader = req.headers.get("Authorization");
    const isInternal = authHeader && supabaseServiceKey && authHeader.includes(supabaseServiceKey.substring(0, 50));

    if (!isInternal) {
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Missing authorization header" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { error: authError } = await userClient.auth.getUser();
      if (authError) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: NotificationRequest = await req.json();
    const { instructorId, notification, category, importance, pupilId, jobValue, bypassGate } = body;

    if (!instructorId || !notification) {
      return new Response(
        JSON.stringify({ error: "Missing instructorId or notification" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Notification-preference gate
    if (!bypassGate && category) {
      const gate = await shouldSendToInstructor(supabase, instructorId, {
        category, channel: "push", importance, pupilId, jobValue,
      });
      if (!gate.allow) {
        if (gate.defer_until) {
          await enqueueOutbox(supabase, {
            instructor_id: instructorId,
            category,
            importance,
            title: notification.title,
            body: notification.body,
            payload: { notification, pupilId, jobValue },
            deliver_at: gate.defer_until,
          });
        }
        return new Response(
          JSON.stringify({ success: false, gated: true, reason: gate.reason, defer_until: gate.defer_until ?? null }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    let webSent = 0;
    let webTotal = 0;
    let expoSent = 0;
    let expoTotal = 0;

    // 1. Send Web Push notifications (if VAPID configured)
    if (vapidPublicKey && vapidPrivateKey) {
      await initVapidKeys(vapidPublicKey, vapidPrivateKey);

      const { data: subscriptions, error } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("instructor_id", instructorId);

      if (!error && subscriptions && subscriptions.length > 0) {
        webTotal = subscriptions.length;
        const staleIds: string[] = [];

        for (const sub of subscriptions) {
          const result = await sendPush(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            notification
          );
          if (result.success) {
            webSent++;
          } else if (result.stale) {
            staleIds.push(sub.id);
          }
        }

        if (staleIds.length > 0) {
          await supabase.from("push_subscriptions").delete().in("id", staleIds);
          console.log(`Removed ${staleIds.length} stale web push subscriptions`);
        }
      }
    }

    // 2. Send Expo push notifications (for native apps)
    const { data: expoTokens, error: expoError } = await supabase
      .from("expo_push_tokens")
      .select("token")
      .eq("instructor_id", instructorId);

    if (!expoError && expoTokens && expoTokens.length > 0) {
      expoTotal = expoTokens.length;
      const tokens = expoTokens.map((t: any) => t.token);
      const expoResult = await sendExpoPush(tokens, notification);
      expoSent = expoResult.sent;

      // Clean up stale tokens
      if (expoResult.staleTokens.length > 0) {
        await supabase
          .from("expo_push_tokens")
          .delete()
          .in("token", expoResult.staleTokens);
        console.log(`Removed ${expoResult.staleTokens.length} stale Expo tokens`);
      }
    }

    const totalSent = webSent + expoSent;
    const totalTargets = webTotal + expoTotal;

    if (totalTargets === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No push subscriptions found (web or native)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: totalSent,
        total: totalTargets,
        web: { sent: webSent, total: webTotal },
        expo: { sent: expoSent, total: expoTotal },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
