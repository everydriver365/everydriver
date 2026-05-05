import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/send-pupil-welcome`;

const body = JSON.stringify({
  pupilId: "00000000-0000-0000-0000-000000000000",
  pupilEmail: "test@example.com",
  instructorId: "00000000-0000-0000-0000-000000000000",
});

Deno.test("send-pupil-welcome: rejects missing Authorization (403)", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body,
  });
  await res.text();
  assertEquals(res.status, 403);
});

Deno.test("send-pupil-welcome: rejects bogus bearer (403)", async () => {
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
  assertEquals(res.status, 403);
});

Deno.test("send-pupil-welcome: rejects anon key bearer (403)", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body,
  });
  await res.text();
  assertEquals(res.status, 403);
});
