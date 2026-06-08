import { supabase } from "@/integrations/supabase/client";

export interface BlockBookingInput {
  pupilId: string;
  instructorId: string;
  amount: number; // £ paid, must be > 0
  hours: number; // hours purchased, must be > 0
  method: string; // "Cash" | "Card" | "Bank Transfer" | "Other"
  notes?: string;
}

/**
 * Records a block booking against a pupil:
 *   1) Inserts a row in `payment_history` (credit, payment_type = 'block_booking').
 *   2) Adds £amount to `pupils.account_balance` via the atomic
 *      `increment_pupil_balance` RPC.
 *   3) Adds `hours` to `pupils.prepaid_hours` so they're auto-consumed
 *      when lessons are completed (see EndLessonWizard).
 *
 * Throws on the first error — callers should toast a friendly message.
 */
export async function recordBlockBooking({
  pupilId,
  instructorId,
  amount,
  hours,
  method,
  notes,
}: BlockBookingInput): Promise<void> {
  if (!pupilId || !instructorId) throw new Error("Missing pupil or instructor");
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error("Amount must be greater than zero");
  if (!Number.isFinite(hours) || hours <= 0)
    throw new Error("Hours must be greater than zero");

  const rate = Math.round((amount / hours) * 100) / 100;
  const description =
    notes && notes.trim().length > 0
      ? `Block booking: ${hours}h @ £${rate.toFixed(2)}/hr — ${notes.trim()}`
      : `Block booking: ${hours}h @ £${rate.toFixed(2)}/hr`;

  // 1. Payment history credit
  const { error: phErr } = await supabase.from("payment_history").insert({
    pupil_id: pupilId,
    instructor_id: instructorId,
    amount,
    payment_method: method,
    payment_type: "block_booking",
    notes: description,
  });
  if (phErr) throw phErr;

  // 2. Credit the £ balance atomically
  const { error: balErr } = await supabase.rpc("increment_pupil_balance", {
    p_pupil_id: pupilId,
    p_amount: amount,
  });
  if (balErr) throw balErr;

  // 3. Add to prepaid hours bucket (read-then-update; concurrency on a single
  //    pupil's hours is low and this column has no dedicated RPC).
  const { data: cur, error: readErr } = await supabase
    .from("pupils")
    .select("prepaid_hours")
    .eq("id", pupilId)
    .single();
  if (readErr) throw readErr;
  const next = Math.round(((Number(cur?.prepaid_hours) || 0) + hours) * 100) / 100;
  const { error: updErr } = await supabase
    .from("pupils")
    .update({ prepaid_hours: next })
    .eq("id", pupilId);
  if (updErr) throw updErr;

  invalidatePaymentQueries({ pupilId, instructorId });
}
