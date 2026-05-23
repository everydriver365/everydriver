import { useState, useEffect } from "react";
import { format, subMonths, parseISO } from "date-fns";
import {
  AlertTriangle,
  Loader2,
  Pencil,
  ExternalLink,
  ClipboardCheck,
  ClipboardX,
} from "lucide-react";
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

const MAX_TRIGGERS = 6;

const RESULT_OPTIONS: { value: string; label: string }[] = [
  { value: "pending", label: "Pending / Scheduled" },
  { value: "grade_a", label: "Grade A" },
  { value: "grade_b", label: "Grade B" },
  { value: "fail", label: "Fail" },
];

const DVSA_INFO_URL = "https://www.gov.uk/check-your-adi-standards-check-result";

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

  const divider = <div style={{ height: 1, background: "#f0f1f4", width: "100%" }} />;

  if (loading) {
    return (
      <div
        style={{
          background: "#fff", border: "1px solid #e0e3ea", borderRadius: 14,
          padding: 24, display: "flex", justifyContent: "center",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <Loader2 size={18} className="animate-spin" color="#aaa" />
      </div>
    );
  }

  const points = Math.min(triggersCount, MAX_TRIGGERS);
  const pct = (points / MAX_TRIGGERS) * 100;

  return (
    <>
      <div style={{ fontFamily: "Poppins, sans-serif" }}>
        {/* Page title rendered by settings shell */}


        {/* Card */}
        <div
          style={{
            background: "#fff", border: "1px solid #e0e3ea", borderRadius: 14,
            overflow: "hidden",
          }}
        >
          {/* Section header */}
          <div style={{ padding: "13px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <span style={{
                width: 34, height: 34, borderRadius: 9, background: "#e8eefb",
                display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <ClipboardCheck size={18} color="#2952b3" />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1f", lineHeight: 1.2 }}>
                  DVSA Standards Check
                </div>
                <div style={{ fontSize: 10, color: "#aaa", marginTop: 1 }}>
                  Track results and trigger points
                </div>
              </div>
            </div>
            <a
              href={DVSA_INFO_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 11, fontWeight: 500, color: "#2952b3",
                textDecoration: "none", flexShrink: 0,
              }}
            >
              Info <ExternalLink size={11} />
            </a>
          </div>

          {divider}

          {/* Trigger points tracker */}
          <div style={{ padding: "12px 14px 14px" }}>
            <div style={{
              background: "#fff8e8", border: "0.5px solid #fde9a0",
              borderRadius: 10, padding: "12px 14px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#854f0b", lineHeight: 1.2 }}>
                      Trigger points tracker
                    </div>
                    <div style={{ fontSize: 10, color: "#b87a2a", marginTop: 1 }}>
                      {points} of {MAX_TRIGGERS} trigger points
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#f59e0b", flexShrink: 0 }}>
                  {points}/{MAX_TRIGGERS}
                </div>
              </div>
              <div style={{
                height: 6, background: "#fde9a0", borderRadius: 3,
                marginTop: 10, overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", width: `${pct}%`, background: "#f59e0b",
                  borderRadius: 3, transition: "width 0.3s ease",
                }} />
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                marginTop: 5, fontSize: 9, color: "#b87a2a",
              }}>
                <span>0 points</span>
                <span>Check triggered at {MAX_TRIGGERS}</span>
              </div>
            </div>
          </div>

          {divider}

          {/* Action buttons */}
          <div style={{ padding: "12px 14px", display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={openEdit}
              style={{
                flex: 1, background: "#2952b3", color: "#fff", border: "none",
                borderRadius: 10, padding: "9px", fontSize: 11, fontWeight: 600,
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                cursor: "pointer", fontFamily: "Poppins, sans-serif",
              }}
            >
              <Pencil size={12} /> Log result
            </button>
            <button
              type="button"
              onClick={() => navigate("/instructor/test-results")}
              style={{
                flex: 1, background: "#F2F4F8", color: "#1a1a1f",
                border: "1px solid #e0e3ea", borderRadius: 10, padding: "9px",
                fontSize: 11, fontWeight: 600,
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                cursor: "pointer", fontFamily: "Poppins, sans-serif",
              }}
            >
              <ExternalLink size={12} /> Driving test link
            </button>
          </div>

          {divider}

          {/* Empty / results state */}
          {!checkAt && !metrics ? (
            <div style={{ padding: "28px 20px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <span style={{
                width: 48, height: 48, borderRadius: 14, background: "#e8eefb",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginBottom: 12,
              }}>
                <ClipboardX size={22} color="#2952b3" />
              </span>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1f" }}>
                No test results recorded
              </div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 4, lineHeight: 1.5, maxWidth: 280 }}>
                Log your DVSA Standards Check results to track trigger points over time
              </div>
            </div>
          ) : (
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              {checkAt && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "#F2F4F8", border: "1px solid #eaecee",
                  borderRadius: 10, padding: "10px 12px", gap: 10,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1f" }}>
                      {format(parseISO(checkAt), "EEE d MMM yyyy · HH:mm")}
                    </div>
                    <div style={{ fontSize: 10, color: "#aaa", marginTop: 1 }}>
                      Standards Check appointment
                    </div>
                  </div>
                  {checkResult && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 999,
                      background: "#e8eefb", color: "#2952b3", whiteSpace: "nowrap",
                    }}>
                      {RESULT_OPTIONS.find((o) => o.value === checkResult)?.label ?? checkResult}
                    </span>
                  )}
                </div>
              )}
              {metrics && (
                <div style={{ fontSize: 10, color: "#aaa", textAlign: "center" }}>
                  Based on {metrics.totalTests} test{metrics.totalTests !== 1 ? "s" : ""} in the last 12 months
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
