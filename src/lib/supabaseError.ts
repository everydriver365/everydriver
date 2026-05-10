/**
 * Friendly Supabase / Postgres error formatting.
 *
 * Use these helpers in mutation paths so that an RLS rejection (a common
 * cause of "Failed to save" toasts when a policy is missing) produces a
 * clear message and a developer breadcrumb in the console.
 */
import type { PostgrestError } from "@supabase/supabase-js";

export type DbErr = PostgrestError | Error | null | undefined | { code?: string; message?: string };

export function isRlsError(err: DbErr): boolean {
  if (!err) return false;
  const code = (err as any).code as string | undefined;
  const msg = ((err as any).message as string | undefined) ?? "";
  if (code === "42501") return true;
  return /row[- ]level security|new row violates row-level security/i.test(msg);
}

export function friendlyDbError(
  err: DbErr,
  context?: { table?: string; operation?: "insert" | "update" | "delete" | "upsert" | "select" },
): string {
  if (!err) return "Something went wrong. Please try again.";

  if (isRlsError(err)) {
    if (context?.table) {
      // Developer breadcrumb — easy to grep for next time something silently breaks.
      console.error(
        `[RLS] ${context.operation ?? "mutation"} on "${context.table}" denied. ` +
          `Check policies in Supabase for an instructor-owns-own-rows rule.`,
        err,
      );
    }
    return "Permission denied. Please refresh the page and try again — if the problem persists, contact support.";
  }

  const msg = ((err as any).message as string | undefined) ?? "";
  if (/duplicate key|unique constraint/i.test(msg)) {
    return "That entry already exists.";
  }
  if (/foreign key/i.test(msg)) {
    return "Can't save — a related record is missing or has been removed.";
  }
  if (/check constraint|violates/i.test(msg)) {
    return "Some of the information looks invalid. Please check and try again.";
  }
  if (/network|fetch failed/i.test(msg)) {
    return "Network problem. Check your connection and try again.";
  }
  return msg || "Something went wrong. Please try again.";
}
