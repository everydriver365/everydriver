import { useState, useEffect } from "react";
import { format, subMonths } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface CompactStandardsCheckProps {
  instructorId: string;
}

interface TriggerMetrics {
  avgMinorFaults: number;
  avgSeriousFaults: number;
  physicalActionRate: number;
  passRate: number;
  totalTests: number;
}

// DVSA Trigger thresholds
const THRESHOLDS = {
  minorFaults: 5,
  seriousFaults: 0.5,
  physicalAction: 10,
  passRate: 55,
};

export function CompactStandardsCheck({ instructorId }: CompactStandardsCheckProps) {
  const [metrics, setMetrics] = useState<TriggerMetrics | null>(null);
  const [triggersCount, setTriggersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (instructorId) {
      calculateMetrics();
    }
  }, [instructorId]);

  const calculateMetrics = async () => {
    try {
      const periodEnd = new Date();
      const periodStart = subMonths(periodEnd, 12);

      const { data: results, error } = await supabase
        .from("driving_test_results")
        .select("*")
        .eq("instructor_id", instructorId)
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
        (sum, r) => sum + (r.total_serious_faults || 0) + (r.total_dangerous_faults || 0),
        0
      );
      const physicalActionCount = results.filter((r) => r.examiner_took_action).length;
      const passCount = results.filter((r) => r.result === "pass").length;

      const avgMinorFaults = totalMinorFaults / totalTests;
      const avgSeriousFaults = totalSeriousFaults / totalTests;
      const physicalActionRate = (physicalActionCount / totalTests) * 100;
      const passRate = (passCount / totalTests) * 100;

      setMetrics({
        avgMinorFaults,
        avgSeriousFaults,
        physicalActionRate,
        passRate,
        totalTests,
      });

      const count = [
        avgMinorFaults >= THRESHOLDS.minorFaults,
        avgSeriousFaults >= THRESHOLDS.seriousFaults,
        physicalActionRate >= THRESHOLDS.physicalAction,
        passRate <= THRESHOLDS.passRate,
      ].filter(Boolean).length;

      setTriggersCount(count);
    } catch (error) {
      console.error("Error calculating standards check metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    navigate("/instructor/test-results");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const standardsCheckRequired = triggersCount >= 3;
  const hasWarning = triggersCount > 0 && triggersCount < 3;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-colors hover:bg-muted/50",
        standardsCheckRequired && "border-destructive/50 bg-destructive/5"
      )}
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            DVSA Standards Check
          </CardTitle>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!metrics ? (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">No test results recorded</p>
            <p className="text-xs text-muted-foreground mt-1">Log test results to track triggers</p>
          </div>
        ) : (
          <>
            {/* Status Banner */}
            {standardsCheckRequired ? (
              <div className="flex items-center gap-2 p-2 rounded-none bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Standards Check Required</span>
              </div>
            ) : hasWarning ? (
              <div className="flex items-center gap-2 p-2 rounded-none bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {triggersCount} trigger{triggersCount > 1 ? "s" : ""} met
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-none bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">All metrics OK</span>
              </div>
            )}

            {/* Trigger Indicators */}
            <div className="grid grid-cols-2 gap-2">
              <TriggerIndicator
                label="Minor Faults"
                value={metrics.avgMinorFaults.toFixed(1)}
                threshold="<5"
                triggered={metrics.avgMinorFaults >= THRESHOLDS.minorFaults}
              />
              <TriggerIndicator
                label="Serious Faults"
                value={metrics.avgSeriousFaults.toFixed(2)}
                threshold="<0.5"
                triggered={metrics.avgSeriousFaults >= THRESHOLDS.seriousFaults}
              />
              <TriggerIndicator
                label="Physical Action"
                value={`${metrics.physicalActionRate.toFixed(0)}%`}
                threshold="<10%"
                triggered={metrics.physicalActionRate >= THRESHOLDS.physicalAction}
              />
              <TriggerIndicator
                label="Pass Rate"
                value={`${metrics.passRate.toFixed(0)}%`}
                threshold=">55%"
                triggered={metrics.passRate <= THRESHOLDS.passRate}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1 border-t">
              <span className="text-xs text-muted-foreground">
                {metrics.totalTests} test{metrics.totalTests !== 1 ? "s" : ""} (12 months)
              </span>
              <Badge variant={standardsCheckRequired ? "destructive" : hasWarning ? "secondary" : "outline"}>
                {triggersCount}/4 triggers
              </Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TriggerIndicator({
  label,
  value,
  threshold,
  triggered,
}: {
  label: string;
  value: string;
  threshold: string;
  triggered: boolean;
}) {
  return (
    <div
      className={cn(
        "p-2 rounded-none text-center",
        triggered ? "bg-destructive/10" : "bg-muted/50"
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-sm font-bold",
          triggered ? "text-destructive" : "text-foreground"
        )}
      >
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground">{threshold}</p>
    </div>
  );
}
