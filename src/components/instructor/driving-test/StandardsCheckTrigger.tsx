import { useState, useEffect } from "react";
import { format, subMonths } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface StandardsCheckTriggerProps {
  instructorId: string;
}

interface TriggerMetrics {
  avgMinorFaults: number;
  avgSeriousFaults: number;
  physicalActionRate: number;
  passRate: number;
  totalTests: number;
  periodStart: string;
  periodEnd: string;
}

interface TriggerStatus {
  minorFaultsTriggered: boolean;
  seriousFaultsTriggered: boolean;
  physicalActionTriggered: boolean;
  passRateTriggered: boolean;
  triggersCount: number;
  standardsCheckRequired: boolean;
}

// DVSA Trigger thresholds
const THRESHOLDS = {
  minorFaults: 5, // Average 5 or more minor faults per test
  seriousFaults: 0.5, // Average 0.5 or more serious/dangerous faults per test
  physicalAction: 10, // 10% or higher physical action rate
  passRate: 55, // 55% or lower pass rate
};

export function StandardsCheckTrigger({ instructorId }: StandardsCheckTriggerProps) {
  const [metrics, setMetrics] = useState<TriggerMetrics | null>(null);
  const [triggerStatus, setTriggerStatus] = useState<TriggerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (instructorId) {
      calculateMetrics();
    }
  }, [instructorId]);

  const calculateMetrics = async () => {
    if (refreshing) return;
    setRefreshing(true);

    try {
      const periodEnd = new Date();
      const periodStart = subMonths(periodEnd, 12);

      // Fetch all real (non-mock) test results in the last 12 months
      const { data: results, error } = await supabase
        .from("driving_test_results")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("is_mock", false)
        .gte("test_date", format(periodStart, "yyyy-MM-dd"))
        .lte("test_date", format(periodEnd, "yyyy-MM-dd"));

      if (error) throw error;

      if (!results || results.length === 0) {
        setMetrics({
          avgMinorFaults: 0,
          avgSeriousFaults: 0,
          physicalActionRate: 0,
          passRate: 0,
          totalTests: 0,
          periodStart: format(periodStart, "yyyy-MM-dd"),
          periodEnd: format(periodEnd, "yyyy-MM-dd"),
        });
        setTriggerStatus({
          minorFaultsTriggered: false,
          seriousFaultsTriggered: false,
          physicalActionTriggered: false,
          passRateTriggered: false,
          triggersCount: 0,
          standardsCheckRequired: false,
        });
        setLoading(false);
        setRefreshing(false);
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

      const calculatedMetrics: TriggerMetrics = {
        avgMinorFaults,
        avgSeriousFaults,
        physicalActionRate,
        passRate,
        totalTests,
        periodStart: format(periodStart, "yyyy-MM-dd"),
        periodEnd: format(periodEnd, "yyyy-MM-dd"),
      };

      const minorFaultsTriggered = avgMinorFaults >= THRESHOLDS.minorFaults;
      const seriousFaultsTriggered = avgSeriousFaults >= THRESHOLDS.seriousFaults;
      const physicalActionTriggered = physicalActionRate >= THRESHOLDS.physicalAction;
      const passRateTriggered = passRate <= THRESHOLDS.passRate;

      const triggersCount = [
        minorFaultsTriggered,
        seriousFaultsTriggered,
        physicalActionTriggered,
        passRateTriggered,
      ].filter(Boolean).length;

      setMetrics(calculatedMetrics);
      setTriggerStatus({
        minorFaultsTriggered,
        seriousFaultsTriggered,
        physicalActionTriggered,
        passRateTriggered,
        triggersCount,
        standardsCheckRequired: triggersCount >= 3,
      });

      // Save to database for historical tracking
      await supabase.from("instructor_standards_check").upsert(
        {
          instructor_id: instructorId,
          calculated_at: new Date().toISOString(),
          period_start: format(periodStart, "yyyy-MM-dd"),
          period_end: format(periodEnd, "yyyy-MM-dd"),
          total_tests: totalTests,
          avg_minor_faults: avgMinorFaults,
          avg_serious_faults: avgSeriousFaults,
          physical_action_percentage: physicalActionRate,
          pass_rate_percentage: passRate,
          triggers_met: triggersCount,
          trigger_details: {
            minor_faults_triggered: minorFaultsTriggered,
            serious_faults_triggered: seriousFaultsTriggered,
            physical_action_triggered: physicalActionTriggered,
            pass_rate_triggered: passRateTriggered,
          },
        },
        { onConflict: "instructor_id" }
      );
    } catch (error) {
      console.error("Error calculating standards check metrics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics || metrics.totalTests === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            DVSA Standards Check Triggers
          </CardTitle>
          <CardDescription>
            No test results recorded in the last 12 months.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const MetricRow = ({
    label,
    value,
    threshold,
    thresholdLabel,
    triggered,
    inverse = false,
    format: formatFn = (v: number) => v.toFixed(1),
  }: {
    label: string;
    value: number;
    threshold: number;
    thresholdLabel: string;
    triggered: boolean;
    inverse?: boolean;
    format?: (v: number) => string;
  }) => {
    const progress = inverse
      ? Math.min(100, (threshold / Math.max(value, 0.1)) * 100)
      : Math.min(100, (value / threshold) * 100);

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{label}</span>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-bold",
                triggered ? "text-red-600" : "text-emerald-600"
              )}
            >
              {formatFn(value)}
            </span>
            {triggered ? (
              <Badge variant="destructive" className="text-xs">
                Triggered
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-600">
                OK
              </Badge>
            )}
          </div>
        </div>
        <div className="relative">
          <Progress
            value={progress}
            className={cn(
              "h-2",
              triggered ? "[&>div]:bg-red-500" : "[&>div]:bg-emerald-500"
            )}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="absolute top-0 h-2 w-0.5 bg-amber-500"
                  style={{ left: `${inverse ? 100 : 100}%`, transform: "translateX(-50%)" }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Trigger threshold: {thresholdLabel}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-xs text-muted-foreground">
          Threshold: {thresholdLabel}
        </p>
      </div>
    );
  };

  return (
    <Card className={cn(triggerStatus?.standardsCheckRequired && "border-red-500 border-2")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {triggerStatus?.standardsCheckRequired ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              )}
              DVSA Standards Check Triggers
            </CardTitle>
            <CardDescription className="mt-1">
              Rolling 12-month period • {metrics.totalTests} test{metrics.totalTests !== 1 ? "s" : ""} recorded
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={calculateMetrics}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>

        {triggerStatus?.standardsCheckRequired && (
          <div className="mt-3 p-3 rounded-2xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                  Standards Check Required
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  {triggerStatus.triggersCount} of 4 indicators have reached their trigger points.
                  The DVSA will request you book an ADI standards check.
                </p>
              </div>
            </div>
          </div>
        )}

        {triggerStatus && triggerStatus.triggersCount > 0 && !triggerStatus.standardsCheckRequired && (
          <div className="mt-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {triggerStatus.triggersCount} of 4 triggers met
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  A standards check is requested when 3 or more triggers are met.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <MetricRow
          label="Avg. Minor Faults"
          value={metrics.avgMinorFaults}
          threshold={THRESHOLDS.minorFaults}
          thresholdLabel="≥5 per test"
          triggered={triggerStatus?.minorFaultsTriggered || false}
        />

        <MetricRow
          label="Avg. Serious/Dangerous Faults"
          value={metrics.avgSeriousFaults}
          threshold={THRESHOLDS.seriousFaults}
          thresholdLabel="≥0.5 per test"
          triggered={triggerStatus?.seriousFaultsTriggered || false}
          format={(v) => v.toFixed(2)}
        />

        <MetricRow
          label="Physical Action Rate"
          value={metrics.physicalActionRate}
          threshold={THRESHOLDS.physicalAction}
          thresholdLabel="≥10%"
          triggered={triggerStatus?.physicalActionTriggered || false}
          format={(v) => `${v.toFixed(1)}%`}
        />

        <MetricRow
          label="Pass Rate"
          value={metrics.passRate}
          threshold={THRESHOLDS.passRate}
          thresholdLabel="≤55%"
          triggered={triggerStatus?.passRateTriggered || false}
          inverse
          format={(v) => `${v.toFixed(1)}%`}
        />

        <div className="pt-2 text-xs text-muted-foreground border-t">
          <p>
            Period: {format(new Date(metrics.periodStart), "dd MMM yyyy")} -{" "}
            {format(new Date(metrics.periodEnd), "dd MMM yyyy")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
