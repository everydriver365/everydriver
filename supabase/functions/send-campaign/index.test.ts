import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/send-campaign`;

const body = JSON.stringify({ campaignId: "00000000-0000-0000-0000-000000000000" });

Deno.test("send-campaign: rejects missing Authorization (401)", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body,
  });
  await res.text();
  assertEquals(res.status, 401);
});

Deno.test("send-campaign: rejects bogus bearer (401)", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: "Bearer not-a-real-jwt",
    },
    body,
  });
  await res.text();
  assertEquals(res.status, 401);
});
