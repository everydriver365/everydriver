import { useEffect, useState } from "react";
import { Loader2, Sparkles, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TestReadinessCardProps {
  pupilId: string;
  instructorId: string;
}

interface ReadinessRow {
  score: number;
  verdict: "not_ready" | "nearly_ready" | "ready";
  summary: string;
  recommendations: string[];
  assessed_at: string;
}

function verdictTone(v: ReadinessRow["verdict"]) {
  if (v === "ready") return { bg: "#D1FAE5", fg: "#059669", label: "Ready" };
  if (v === "nearly_ready") return { bg: "#FEF3C7", fg: "#D97706", label: "Nearly ready" };
  return { bg: "#FEE2E2", fg: "#DC2626", label: "Not ready" };
}

export function TestReadinessCard({ pupilId, instructorId }: TestReadinessCardProps) {
  const { toast } = useToast();
  const [row, setRow] = useState<ReadinessRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("pupil_test_readiness")
      .select("score, verdict, summary, recommendations, assessed_at")
      .eq("pupil_id", pupilId)
      .order("assessed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setRow((data as ReadinessRow | null) ?? null);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [pupilId]);

  const runAssessment = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("assess-test-readiness", {
        body: { pupilId, instructorId },
      });
      if (error) throw error;
      if ((data as { assessment?: ReadinessRow })?.assessment) {
        await load();
        toast({ title: "Assessment complete" });
      } else if ((data as { error?: string })?.error) {
        toast({ title: "Cannot assess", description: (data as { error: string }).error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Assessment failed", description: String(e), variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const tone = row ? verdictTone(row.verdict) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          AI Test Readiness
        </CardTitle>
        <Button size="sm" variant="outline" onClick={runAssessment} disabled={running}>
          {running ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
          {row ? "Re-assess" : "Assess now"}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : !row ? (
          <div className="text-sm text-muted-foreground">No assessment yet. Click "Assess now" to generate one.</div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold">{row.score}<span className="text-base text-muted-foreground">/10</span></div>
              {tone && (
                <span style={{ background: tone.bg, color: tone.fg }} className="px-2 py-0.5 rounded-full text-xs font-semibold">
                  {tone.label}
                </span>
              )}
            </div>
            <p className="text-sm">{row.summary}</p>
            {row.recommendations?.length > 0 && (
              <ul className="text-sm list-disc pl-5 space-y-1 text-muted-foreground">
                {row.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
            <div className="text-xs text-muted-foreground">
              Assessed {new Date(row.assessed_at).toLocaleString("en-GB")}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
