import { supabase } from "@/integrations/supabase/client";

/**
 * Checks whether an active pupil with the same name already exists for this
 * instructor. Case- and whitespace-insensitive. Returns the existing pupil
 * (id, name) when a match is found, or null otherwise.
 *
 * Pair with the partial unique index `pupils_unique_active_name_per_instructor`
 * on the `pupils` table — this check provides a friendly UX, the index is the
 * authoritative guard.
 */
export async function checkDuplicatePupilName(
  instructorId: string,
  rawName: string,
): Promise<{ id: string; name: string } | null> {
  const trimmed = (rawName || "").trim();
  if (!instructorId || !trimmed) return null;

  const { data, error } = await supabase
    .from("pupils")
    .select("id, name")
    .eq("instructor_id", instructorId)
    .is("deleted_at", null)
    .ilike("name", trimmed)
    .limit(1)
    .maybeSingle();

  if (error) {
    // Don't block the add on a lookup failure — the DB index will still catch it.
    console.warn("Duplicate pupil check failed:", error);
    return null;
  }
  return (data as { id: string; name: string } | null) ?? null;
}

/**
 * True when a Supabase/Postgres error represents a unique-violation
 * triggered by our active-name index.
 */
export function isDuplicatePupilNameError(err: any): boolean {
  if (!err) return false;
  const code = err.code || err?.cause?.code;
  const msg = String(err.message || "");
  return (
    code === "23505" &&
    (msg.includes("pupils_unique_active_name_per_instructor") ||
      msg.toLowerCase().includes("pupils"))
  );
}
