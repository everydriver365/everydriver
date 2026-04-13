import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Loader2, ChevronRight } from "lucide-react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { demoSchoolPupils, demoSchoolLessons, demoSchoolPayments, demoSchoolTestResults } from "@/data/demoSchoolData";

interface Props { pupilId: string; }

function SectionHeader({ title, count, isOpen, onToggle, actionLabel, onAction }: {
  title: string; count?: number; isOpen: boolean; onToggle: () => void; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <div className="flex items-center border-b border-t bg-muted/20 select-none">
      <button onClick={onToggle} className="flex items-center gap-1 px-3 py-1.5 flex-1 text-left group">
        <ChevronRight className={cn("h-3 w-3 text-primary transition-transform", isOpen && "rotate-90")} />
        <span className="text-[11px] font-semibold text-primary">{title}</span>
        {count !== undefined && <span className="text-[11px] text-muted-foreground">({count})</span>}
      </button>
      {actionLabel && (
        <button onClick={onAction} className="text-[10px] text-primary hover:underline px-3">{actionLabel}</button>
      )}
    </div>
  );
}

function DetailRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start gap-2 px-3 py-1 text-[11px]", className)}>
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function SchoolPupilDetailPanel({ pupilId }: Props) {
  const { isDemo } = useSchoolDemo();
  const [pupil, setPupil] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Record<string, boolean>>({
    details: true, instructor: true, theory: true, driving: true,
    lessons: false, payments: false,
  });

  useEffect(() => {
    if (!pupilId) return;
    if (isDemo) {
      const p = demoSchoolPupils.find(p => p.id === pupilId);
      setPupil(p || null);
      setLessons(demoSchoolLessons.filter(l => l.pupil_id === pupilId));
      setPayments(demoSchoolPayments.filter(pay => pay.pupil_id === pupilId));
      setTestResults(demoSchoolTestResults.filter(t => t.pupil_id === pupilId));
      setLoading(false);
      return;
    }
    fetchAll();
  }, [pupilId, isDemo]);

  const fetchAll = async () => {
    setLoading(true);
    const [pupilRes, lessonsRes, paymentsRes, testsRes] = await Promise.all([
      supabase.from("pupils").select("*, instructors(name)").eq("id", pupilId).single(),
      supabase.from("scheduled_lessons").select("*").eq("pupil_id", pupilId).order("start_time", { ascending: false }).limit(20),
      supabase.from("payment_history").select("*").eq("pupil_id", pupilId).order("created_at", { ascending: false }).limit(20),
      supabase.from("driving_test_results").select("*").eq("pupil_id", pupilId).order("test_date", { ascending: false }),
    ]);
    setPupil(pupilRes.data);
    setLessons(lessonsRes.data || []);
    setPayments(paymentsRes.data || []);
    setTestResults(testsRes.data || []);
    setLoading(false);
  };

  const toggle = (key: string) => setOpen(p => ({ ...p, [key]: !p[key] }));

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (!pupil) return <div className="text-center text-muted-foreground py-12 text-xs">Pupil not found</div>;

  const theoryStatus = pupil.theory_test_passed ? "Passed" : pupil.theory_test_date ? "Booked" : "Not booked";
  const lastTestResult = testResults.length > 0 ? testResults[0] : null;
  const drivingStatus = lastTestResult
    ? (lastTestResult.result === "pass" ? "Passed" : "Failed")
    : pupil.test_date ? "Booked" : "Not booked";

  return (
    <div className="text-[12px]">
      {/* Pupil name header */}
      <div className="px-3 py-2 border-b bg-card">
        <div className="font-bold text-sm">{pupil.name}</div>
        <div className="text-[11px] text-muted-foreground">{pupil.email || pupil.phone || "No contact info"}</div>
      </div>

      {/* Details section */}
      <SectionHeader title="Details" isOpen={open.details} onToggle={() => toggle("details")} />
      {open.details && (
        <div className="py-1">
          <DetailRow label="Status" value={
            <span className={cn(
              "capitalize",
              pupil.course_status === "completed" ? "text-emerald-700" : "text-foreground"
            )}>{pupil.course_status || "active"}</span>
          } />
          <DetailRow label="Phone" value={pupil.phone || "—"} />
          <DetailRow label="Email" value={pupil.email || "—"} />
          <DetailRow label="Lessons" value={`${pupil.lessons_completed || 0} completed`} />
          <DetailRow label="Progress" value={`${pupil.progress || 0}%`} />
        </div>
      )}

      {/* Instructor section */}
      <SectionHeader title="Instructor" isOpen={open.instructor} onToggle={() => toggle("instructor")} />
      {open.instructor && (
        <div className="py-1">
          <DetailRow label="Assigned to" value={<strong>{pupil.instructors?.name || "Unassigned"}</strong>} />
        </div>
      )}

      {/* Theory Test */}
      <SectionHeader title="Theory Test" isOpen={open.theory} onToggle={() => toggle("theory")} />
      {open.theory && (
        <div className="py-1">
          <DetailRow label="Status" value={
            <span className="flex items-center gap-1.5">
              {theoryStatus}
              {pupil.theory_test_passed && <CheckCircle className="h-3 w-3 text-emerald-500" />}
              {!pupil.theory_test_passed && pupil.theory_test_date && <Clock className="h-3 w-3 text-amber-500" />}
            </span>
          } />
          {pupil.theory_test_date && (
            <DetailRow label="Date" value={new Date(pupil.theory_test_date).toLocaleDateString("en-GB")} />
          )}
        </div>
      )}

      {/* Driving Test */}
      <SectionHeader title="Driving Test" isOpen={open.driving} onToggle={() => toggle("driving")} />
      {open.driving && (
        <div className="py-1">
          <DetailRow label="Status" value={
            <span className="flex items-center gap-1.5">
              {drivingStatus}
              {drivingStatus === "Passed" && <CheckCircle className="h-3 w-3 text-emerald-500" />}
              {drivingStatus === "Failed" && <XCircle className="h-3 w-3 text-destructive" />}
              {drivingStatus === "Booked" && <Clock className="h-3 w-3 text-amber-500" />}
            </span>
          } />
          {pupil.test_date && (
            <DetailRow label="Date" value={new Date(pupil.test_date).toLocaleDateString("en-GB")} />
          )}
          {lastTestResult && (
            <>
              <DetailRow label="Faults" value={`${lastTestResult.minor_faults || 0} minor, ${lastTestResult.serious_faults || 0} serious`} />
            </>
          )}
        </div>
      )}

      {/* Lesson History */}
      <SectionHeader title="Lesson History" count={lessons.length} isOpen={open.lessons} onToggle={() => toggle("lessons")} actionLabel="View all" />
      {open.lessons && (
        <div>
          {lessons.length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center py-3">No lessons recorded</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="text-[10px]">
                  <TableHead className="py-1 px-2 h-auto">Date</TableHead>
                  <TableHead className="py-1 px-2 h-auto">Duration</TableHead>
                  <TableHead className="py-1 px-2 h-auto">Status</TableHead>
                  <TableHead className="py-1 px-2 h-auto">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessons.map(l => (
                  <TableRow key={l.id} className="text-[11px]">
                    <TableCell className="py-1 px-2">{new Date(l.start_time).toLocaleDateString("en-GB")}</TableCell>
                    <TableCell className="py-1 px-2">{l.duration_minutes || 60}min</TableCell>
                    <TableCell className="py-1 px-2 capitalize">{l.status}</TableCell>
                    <TableCell className="py-1 px-2">£{l.amount_due || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Payment History */}
      <SectionHeader title="Payment History" count={payments.length} isOpen={open.payments} onToggle={() => toggle("payments")} actionLabel="View all" />
      {open.payments && (
        <div>
          {payments.length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center py-3">No payments recorded</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="text-[10px]">
                  <TableHead className="py-1 px-2 h-auto">Date</TableHead>
                  <TableHead className="py-1 px-2 h-auto">Amount</TableHead>
                  <TableHead className="py-1 px-2 h-auto">Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(p => (
                  <TableRow key={p.id} className="text-[11px]">
                    <TableCell className="py-1 px-2">{new Date(p.created_at).toLocaleDateString("en-GB")}</TableCell>
                    <TableCell className="py-1 px-2 font-medium">£{p.amount}</TableCell>
                    <TableCell className="py-1 px-2">{p.payment_method || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
