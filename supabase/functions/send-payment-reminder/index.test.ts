import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/send-payment-reminder`;

// Manual-only path so no DB lookups occur. method=email should be silently
// downgraded to sms for non-admin callers; with no Twilio creds set in test env
// the function just returns 200 with results.sent === 0 instead of emailing.
const reqBody = (method: "email" | "both" | "sms") => JSON.stringify({
  instructorId: "00000000-0000-0000-0000-000000000000",
  instructorName: "Test",
  method,
  manualEmail: "test@example.com",
  manualPhone: "+447700900000",
  manualName: "Test User",
});

async function call(method: "email" | "both" | "sms", auth?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: ANON_KEY,
  };
  if (auth) headers.Authorization = auth;
  const res = await fetch(FN_URL, { method: "POST", headers, body: reqBody(method) });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

Deno.test("send-payment-reminder: non-admin email request is downgraded (no email_sent)", async () => {
  const { status, json } = await call("email", `Bearer ${ANON_KEY}`);
  assertEquals(status, 200);
  // Email path was downgraded to SMS for non-admin -> emailSent must be 0
  assertEquals(json.emailSent ?? 0, 0);
});

Deno.test("send-payment-reminder: unauthenticated email request is downgraded (no email_sent)", async () => {
  const { status, json } = await call("email");
  assertEquals(status, 200);
  assertEquals(json.emailSent ?? 0, 0);
});

Deno.test("send-payment-reminder: SMS path still works (responds 200)", async () => {
  const { status, json } = await call("sms");
  assertEquals(status, 200);
  assert(json.success === true || typeof json.sent === "number");
});
