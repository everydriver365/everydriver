import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Link2 } from "lucide-react";

interface BatchResult {
  ok: boolean;
  scanned: number;
  matched: number;
  ambiguous: number;
  no_match: number;
  errors: number;
  next_offset: number | null;
  done: boolean;
  error?: string;
}

/**
 * Admin tile: backfills lesson_id on orphan lesson_telematics rows.
 * Only updates rows where exactly ONE scheduled lesson matches.
 */
export function BackfillTelematicsTile() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<{ scanned: number; matched: number; ambiguous: number; no_match: number; errors: number } | null>(null);

  const run = async () => {
    if (running) return;
    setRunning(true);
    setResult(null);
    setProgress("Starting…");

    let offset = 0;
    const totals = { scanned: 0, matched: 0, ambiguous: 0, no_match: 0, errors: 0 };

    try {
      for (let safety = 0; safety < 200; safety++) {
        const { data, error } = await supabase.functions.invoke<BatchResult>(
          "backfill-telematics-lesson-ids",
          { body: { offset, limit: 500 } },
        );
        if (error) throw error;
        if (!data) throw new Error("No response");
        if (!data.ok) throw new Error(data.error || "Backfill returned ok=false");

        totals.scanned += data.scanned;
        totals.matched += data.matched;
        totals.ambiguous += data.ambiguous;
        totals.no_match += data.no_match;
        totals.errors += data.errors;

        setProgress(
          `Scanned ${totals.scanned} · matched ${totals.matched} · ambiguous ${totals.ambiguous} · no match ${totals.no_match}`,
        );

        if (data.done || data.next_offset == null) break;
        offset = data.next_offset;
      }

      setResult(totals);
      toast.success(
        `Backfill complete — ${totals.matched} linked, ${totals.ambiguous} ambiguous, ${totals.no_match} no match`,
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
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          Backfill Telematics
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {result
            ? `Done — ${result.matched} linked, ${result.ambiguous} ambiguous, ${result.no_match} no match`
            : progress ?? "Link orphan telematics sessions to their lessons"}
        </div>
      </CardContent>
    </Card>
  );
}
