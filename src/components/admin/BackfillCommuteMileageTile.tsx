import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Route } from "lucide-react";

interface BatchResult {
  ok: boolean;
  processed: number;
  inserted: number;
  skipped: number;
  errors: number;
  next_offset: number | null;
  total_groups: number;
  done: boolean;
  error?: string;
}

/**
 * Admin tile: runs `backfill-commute-mileage` in pages of 50 instructor-days
 * until done. Idempotent — safe to re-run.
 */
export function BackfillCommuteMileageTile() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<{ inserted: number; skipped: number; errors: number; processed: number } | null>(null);

  const run = async () => {
    if (running) return;
    setRunning(true);
    setResult(null);
    setProgress("Starting…");

    let offset = 0;
    let totals = { processed: 0, inserted: 0, skipped: 0, errors: 0 };

    try {
      for (let safetyPage = 0; safetyPage < 1000; safetyPage++) {
        const { data, error } = await supabase.functions.invoke<BatchResult>(
          "backfill-commute-mileage",
          { body: { offset } },
        );
        if (error) throw error;
        if (!data) throw new Error("No response from backfill function");
        if (!data.ok) throw new Error(data.error || "Backfill returned ok=false");

        totals = {
          processed: totals.processed + data.processed,
          inserted: totals.inserted + data.inserted,
          skipped: totals.skipped + data.skipped,
          errors: totals.errors + data.errors,
        };

        setProgress(
          `Processed ${totals.processed} of ${data.total_groups} instructor-days · ` +
          `${totals.inserted} inserted · ${totals.skipped} skipped · ${totals.errors} errors`,
        );

        if (data.done || data.next_offset == null) break;
        offset = data.next_offset;
      }

      setResult(totals);
      toast.success(
        `Backfill complete — ${totals.inserted} commute rows inserted, ` +
        `${totals.skipped} skipped, ${totals.errors} errors`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Backfill failed: ${msg}`);
      setProgress(`Failed: ${msg}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card
      onClick={running ? undefined : run}
      className={`transition-colors h-full ${running ? "opacity-80" : "hover:bg-accent/50 cursor-pointer"}`}
    >
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-sm font-medium">
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Route className="h-4 w-4" />
          )}
          Backfill Commute Mileage
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {result
            ? `Done — ${result.inserted} inserted, ${result.skipped} skipped, ${result.errors} errors`
            : progress
              ? progress
              : "Recover home→first / last→home miles since 6 Apr 2026"}
        </div>
      </CardContent>
    </Card>
  );
}
