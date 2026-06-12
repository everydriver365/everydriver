// Shared helper used by every edge function to send an email through the
// unified Lovable Emails pipeline (`send-transactional-email` + the
// `branded-notification` template). This is the ONLY approved way for
// project edge functions to send email — direct Resend/Mailgun/SendGrid
// calls are forbidden.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

export type Brand = "everydriver" | "dsm";

export interface BrandedEmailInput {
  to: string | string[];
  subject: string;
  heading?: string;
  preview?: string;
  intro?: string | null;
  paragraphs?: string[];
  details?: Array<{ label: string; value: string }>;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  footerNote?: string | null;
  signOff?: string | null;
  brand?: Brand;
  /** Stable key per recipient+event so retries don't duplicate sends. */
  idempotencyKey?: string;
}

export interface SendBrandedEmailResult {
  enqueued: number;
  failed: number;
  errors: string[];
}

function getClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

function makeIdempotency(base: string | undefined, recipient: string, fallback: string) {
  const key = base ?? `${fallback}-${Date.now()}`;
  return `${key}-${recipient}`.slice(0, 180);
}

export async function sendBrandedEmail(
  input: BrandedEmailInput,
  supabase?: SupabaseClient,
): Promise<SendBrandedEmailResult> {
  const client = supabase ?? getClient();
  const recipients = Array.isArray(input.to) ? input.to : [input.to];
  const cleaned = recipients
    .map((r) => (typeof r === "string" ? r.trim() : ""))
    .filter((r) => r.length > 0 && r.includes("@"));

  const result: SendBrandedEmailResult = { enqueued: 0, failed: 0, errors: [] };
  if (cleaned.length === 0) {
    result.errors.push("No valid recipients");
    return result;
  }

  const templateData = {
    subject: input.subject,
    heading: input.heading ?? input.subject,
    preview: input.preview,
    intro: input.intro ?? null,
    paragraphs: input.paragraphs ?? [],
    details: input.details ?? [],
    ctaLabel: input.ctaLabel ?? null,
    ctaUrl: input.ctaUrl ?? null,
    footerNote: input.footerNote ?? null,
    signOff: input.signOff ?? null,
    brand: input.brand ?? "everydriver",
  };

  for (const recipient of cleaned) {
    try {
      const { error } = await client.functions.invoke("send-transactional-email", {
        body: {
          templateName: "branded-notification",
          recipientEmail: recipient,
          idempotencyKey: makeIdempotency(input.idempotencyKey, recipient, "email"),
          templateData,
          purpose: "transactional",
        },
      });
      if (error) {
        result.failed++;
        result.errors.push(`${recipient}: ${error.message ?? String(error)}`);
      } else {
        result.enqueued++;
      }
    } catch (err) {
      result.failed++;
      result.errors.push(`${recipient}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return result;
}
