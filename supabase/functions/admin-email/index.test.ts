import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/admin-email`;

const body = JSON.stringify({ action: "folders" });

Deno.test("admin-email: rejects missing Authorization (401)", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body,
  });
  await res.text();
  assertEquals(res.status, 401);
});

Deno.test("admin-email: rejects bogus bearer token (401)", async () => {
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

// To verify a non-admin authenticated user is blocked with 403, sign in as an
// instructor/pupil/parent and pass their access_token. We exercise the closest
// path we can do unattended: anon-key as bearer (no real user) -> 401.
Deno.test("admin-email: rejects anon-key as bearer (401)", async () => {
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
  // Anon key is not a user JWT -> getClaims fails -> 401
  assertEquals(res.status, 401);
});
