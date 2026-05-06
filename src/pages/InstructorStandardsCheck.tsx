import { useEffect, useState } from "react";
import { format, subMonths } from "date-fns";
import { AlertTriangle, CheckCircle2, Loader2, Target, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";

const THRESHOLDS = {
  minorFaults: 5,
  seriousFaults: 0.5,
  physicalAction: 10,
  passRate: 55,
};

interface TriggerMetrics {
  avgMinorFaults: number;
  avgSeriousFaults: number;
  physicalActionRate: number;
  passRate: number;
  totalTests: number;
}

export default function InstructorStandardsCheck() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const [metrics, setMetrics] = useState<TriggerMetrics | null>(null);
  const [triggersCount, setTriggersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (instructor?.id) calculateMetrics();
  }, [instructor?.id]);

  const calculateMetrics = async () => {
    if (!instructor?.id) return;
    try {
      const periodEnd = new Date();
      const periodStart = subMonths(periodEnd, 12);

      const { data: results, error } = await supabase
        .from("driving_test_results")
        .select("*")
        .eq("instructor_id", instructor.id)
        .eq("is_mock", false)
        .gte("test_date", format(periodStart, "yyyy-MM-dd"))
        .lte("test_date", format(periodEnd, "yyyy-MM-dd"));

      if (error) throw error;

      if (!results || results.length === 0) {
        setMetrics(null);
        setTriggersCount(0);
        setLoading(false);
        return;
      }

      const totalTests = results.length;
      const totalMinorFaults = results.reduce((sum, r) => sum + (r.total_minor_faults || 0), 0);
      const totalSeriousFaults = results.reduce(
        (sum, r) => sum + (r.total_serious_faults || 0) + (r.total_dangerous_faults || 0), 0
      );
      const physicalActionCount = results.filter((r) => r.examiner_took_action).length;
      const passCount = results.filter((r) => r.result === "pass").length;

      const m: TriggerMetrics = {
        avgMinorFaults: totalMinorFaults / totalTests,
        avgSeriousFaults: totalSeriousFaults / totalTests,
        physicalActionRate: (physicalActionCount / totalTests) * 100,
        passRate: (passCount / totalTests) * 100,
        totalTests,
      };

      setMetrics(m);
      setTriggersCount(
        [
          m.avgMinorFaults >= THRESHOLDS.minorFaults,
          m.avgSeriousFaults >= THRESHOLDS.seriousFaults,
          m.physicalActionRate >= THRESHOLDS.physicalAction,
          m.passRate <= THRESHOLDS.passRate,
        ].filter(Boolean).length
      );
    } catch (error) {
      console.error("Error calculating standards check metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const standardsCheckRequired = triggersCount >= 3;
  const hasWarning = triggersCount > 0 && triggersCount < 3;

  return (
    <InstructorPortalLayout>
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Standards Check</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !metrics ? (
          <Card>
            <CardContent className="py-12 text-center space-y-2">
              <Target className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No test results recorded</p>
              <p className="text-sm text-muted-foreground">Log official test results to track your DVSA triggers</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate("/instructor/test-results")}>
                Go to Test Results
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Status Banner */}
            <Card className={cn(standardsCheckRequired && "border-destructive/50 bg-destructive/5")}>
              <CardContent className="py-5">
                {standardsCheckRequired ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-semibold text-destructive">Standards Check Required</p>
                      <p className="text-sm text-muted-foreground">3 or more triggers have been met</p>
                    </div>
                  </div>
                ) : hasWarning ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-700 dark:text-amber-400">
                        {triggersCount} trigger{triggersCount > 1 ? "s" : ""} met
                      </p>
                      <p className="text-sm text-muted-foreground">Monitor closely to avoid a standards check</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-700 dark:text-emerald-400">All Metrics OK</p>
                      <p className="text-sm text-muted-foreground">No DVSA triggers have been met</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trigger Cards */}
            <div className="grid grid-cols-2 gap-3">
              <TriggerCard
                label="Avg Minor Faults"
                value={metrics.avgMinorFaults.toFixed(1)}
                threshold="Must be < 5"
                triggered={metrics.avgMinorFaults >= THRESHOLDS.minorFaults}
              />
              <TriggerCard
                label="Avg Serious Faults"
                value={metrics.avgSeriousFaults.toFixed(2)}
                threshold="Must be < 0.5"
                triggered={metrics.avgSeriousFaults >= THRESHOLDS.seriousFaults}
              />
              <TriggerCard
                label="Physical Action"
                value={`${metrics.physicalActionRate.toFixed(0)}%`}
                threshold="Must be < 10%"
                triggered={metrics.physicalActionRate >= THRESHOLDS.physicalAction}
              />
              <TriggerCard
                label="Pass Rate"
                value={`${metrics.passRate.toFixed(0)}%`}
                threshold="Must be > 55%"
                triggered={metrics.passRate <= THRESHOLDS.passRate}
              />
            </div>

            {/* Summary */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Based on {metrics.totalTests} official test{metrics.totalTests !== 1 ? "s" : ""} (last 12 months)
                  </span>
                  <Badge variant={standardsCheckRequired ? "destructive" : hasWarning ? "secondary" : "outline"}>
                    {triggersCount}/4 triggers
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
    </InstructorPortalLayout>
  );
}

function TriggerCard({
  label, value, threshold, triggered,
}: {
  label: string; value: string; threshold: string; triggered: boolean;
}) {
  return (
    <Card className={cn(triggered && "border-destructive/30 bg-destructive/5")}>
      <CardContent className="py-4 text-center space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-2xl font-bold", triggered ? "text-destructive" : "text-foreground")}>
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{threshold}</p>
      </CardContent>
    </Card>
  );
}
