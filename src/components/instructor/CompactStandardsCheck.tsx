import { useState, useEffect } from "react";
import { format, subMonths, parseISO } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Target,
  Pencil,
  ExternalLink,
  CalendarClock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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

const THRESHOLDS = {
  minorFaults: 5,
  seriousFaults: 0.5,
  physicalAction: 10,
  passRate: 55,
};

const RESULT_OPTIONS: { value: string; label: string }[] = [
  { value: "pending", label: "Pending / Scheduled" },
  { value: "grade_a", label: "Grade A" },
  { value: "grade_b", label: "Grade B" },
  { value: "fail", label: "Fail" },
];

const resultLabel = (v: string | null) =>
  RESULT_OPTIONS.find((o) => o.value === v)?.label ?? null;

const resultBadgeClass = (v: string | null) => {
  switch (v) {
    case "grade_a":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    case "grade_b":
      return "bg-sky-500/10 text-sky-700 dark:text-sky-400";
    case "fail":
      return "bg-destructive/10 text-destructive";
    case "pending":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export function CompactStandardsCheck({ instructorId }: CompactStandardsCheckProps) {
  const [metrics, setMetrics] = useState<TriggerMetrics | null>(null);
  const [triggersCount, setTriggersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkAt, setCheckAt] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [formAt, setFormAt] = useState("");
  const [formResult, setFormResult] = useState<string>("pending");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (instructorId) {
      calculateMetrics();
      fetchCheck();
    }
  }, [instructorId]);

  const fetchCheck = async () => {
    const { data } = await supabase
      .from("instructors")
      .select("standards_check_at, standards_check_result")
      .eq("id", instructorId)
      .maybeSingle();
    if (data) {
      setCheckAt((data as any).standards_check_at ?? null);
      setCheckResult((data as any).standards_check_result ?? null);
    }
  };

  const openEdit = () => {
    setFormAt(checkAt ? format(parseISO(checkAt), "yyyy-MM-dd'T'HH:mm") : "");
    setFormResult(checkResult ?? "pending");
    setEditOpen(true);
  };

  const saveCheck = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({
          standards_check_at: formAt ? new Date(formAt).toISOString() : null,
          standards_check_result: formAt ? formResult : null,
        })
        .eq("id", instructorId);
      if (error) throw error;
      toast.success("Standards Check saved");
      setEditOpen(false);
      fetchCheck();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

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

      setMetrics({ avgMinorFaults, avgSeriousFaults, physicalActionRate, passRate, totalTests });

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
    <>
      <Card
        className={cn(
          "transition-colors",
          standardsCheckRequired && "border-destructive/50 bg-destructive/5"
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              DVSA Standards Check
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={openEdit}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                {checkAt ? "Edit" : "Log"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => navigate("/instructor/test-results")}
              >
                Driving tests <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Recorded standards check appointment */}
          {checkAt && (
            <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-muted/40 border">
              <div className="flex items-center gap-2 min-w-0">
                <CalendarClock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {format(parseISO(checkAt), "EEE d MMM yyyy · HH:mm")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Standards Check appointment</p>
                </div>
              </div>
              {checkResult && (
                <span
                  className={cn(
                    "text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
                    resultBadgeClass(checkResult)
                  )}
                >
                  {resultLabel(checkResult)}
                </span>
              )}
            </div>
          )}

          {/* External link to gov.uk reference */}
          <a
            href="https://www.gov.uk/check-your-adi-standards-check-result"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-[#2B7BC8] hover:underline"
          >
            DVSA Standards Check info <ExternalLink className="h-3 w-3" />
          </a>

          {!metrics ? (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">No test results recorded</p>
              <p className="text-xs text-muted-foreground mt-1">Log driving test results to track triggers</p>
            </div>
          ) : (
            <>
              {/* Status Banner */}
              {standardsCheckRequired ? (
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Standards Check Required</span>
                </div>
              ) : hasWarning ? (
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    {triggersCount} trigger{triggersCount > 1 ? "s" : ""} met
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-emerald-500/10">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">All metrics OK</span>
                </div>
              )}

              {/* DVSA Trigger Points */}
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                  DVSA Trigger Points (last 12 months)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <TriggerIndicator
                    label="Minor Faults"
                    value={metrics.avgMinorFaults.toFixed(1)}
                    threshold="<5 avg"
                    triggered={metrics.avgMinorFaults >= THRESHOLDS.minorFaults}
                  />
                  <TriggerIndicator
                    label="Serious Faults"
                    value={metrics.avgSeriousFaults.toFixed(2)}
                    threshold="<0.5 avg"
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
              </div>

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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Standards Check</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sc-date">Date &amp; time</Label>
              <Input
                id="sc-date"
                type="datetime-local"
                value={formAt}
                onChange={(e) => setFormAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Result</Label>
              <Select value={formResult} onValueChange={setFormResult}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESULT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveCheck} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
        "p-2 rounded-2xl text-center",
        triggered ? "bg-destructive/10" : "bg-muted/50"
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-bold", triggered ? "text-destructive" : "text-foreground")}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground">{threshold}</p>
    </div>
  );
}
