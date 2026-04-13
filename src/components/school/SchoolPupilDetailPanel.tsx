import { useState, useEffect } from "react";
import { User, BookOpen, CreditCard, Award, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ExpandChevron } from "@/components/ui/ExpandChevron";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { demoSchoolPupils, demoSchoolLessons, demoSchoolPayments, demoSchoolTestResults } from "@/data/demoSchoolData";

interface Props { pupilId: string; }

export default function SchoolPupilDetailPanel({ pupilId }: Props) {
  const { isDemo } = useSchoolDemo();
  const [pupil, setPupil] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Record<string, boolean>>({ instructor: true, tests: true, lessons: false, payments: false });

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

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!pupil) return <div className="text-center text-muted-foreground py-12">Pupil not found</div>;

  return (
    <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-12rem)]">
      <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold">{pupil.name}</h3>
          <p className="text-sm text-muted-foreground">{pupil.email || pupil.phone || "No contact"}</p>
        </div>
        <Badge variant="outline" className="ml-auto">{pupil.course_status || "active"}</Badge>
      </div>

      <Section title="Instructor" icon={User} isOpen={open.instructor} onToggle={() => toggle("instructor")}>
        <p className="text-sm"><span className="text-muted-foreground">Assigned to:</span> <strong>{pupil.instructors?.name || "Unassigned"}</strong></p>
      </Section>

      <Section title="Test Status" icon={Award} isOpen={open.tests} onToggle={() => toggle("tests")}>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 border rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Theory Test</p>
            {pupil.theory_test_date ? (
              <>
                <p className="text-sm font-medium">{new Date(pupil.theory_test_date).toLocaleDateString("en-GB")}</p>
                {pupil.theory_test_passed ? <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto mt-1" /> : <Clock className="h-4 w-4 text-amber-500 mx-auto mt-1" />}
              </>
            ) : <p className="text-xs text-muted-foreground">Not booked</p>}
          </div>
          <div className="p-3 border rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Driving Test</p>
            {pupil.test_date ? (
              <>
                <p className="text-sm font-medium">{new Date(pupil.test_date).toLocaleDateString("en-GB")}</p>
                {testResults.length > 0 ? (
                  testResults[0].result === "pass" ? <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto mt-1" /> : <XCircle className="h-4 w-4 text-destructive mx-auto mt-1" />
                ) : <Clock className="h-4 w-4 text-amber-500 mx-auto mt-1" />}
              </>
            ) : <p className="text-xs text-muted-foreground">Not booked</p>}
          </div>
        </div>
      </Section>

      <Section title={`Lesson History (${lessons.length})`} icon={BookOpen} isOpen={open.lessons} onToggle={() => toggle("lessons")}>
        {lessons.length === 0 ? <p className="text-sm text-muted-foreground text-center py-2">No lessons yet</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Duration</TableHead><TableHead>Status</TableHead><TableHead>Amount</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {lessons.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">{new Date(l.start_time).toLocaleDateString("en-GB")}</TableCell>
                  <TableCell className="text-xs">{l.duration_minutes || 60}min</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{l.status}</Badge></TableCell>
                  <TableCell className="text-xs">£{l.amount_due || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      <Section title={`Payment History (${payments.length})`} icon={CreditCard} isOpen={open.payments} onToggle={() => toggle("payments")}>
        {payments.length === 0 ? <p className="text-sm text-muted-foreground text-center py-2">No payments yet</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {payments.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs">{new Date(p.created_at).toLocaleDateString("en-GB")}</TableCell>
                  <TableCell className="text-xs font-medium">£{p.amount}</TableCell>
                  <TableCell className="text-xs">{p.payment_method || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>
    </div>
  );
}

function Section({ title, icon: Icon, isOpen, onToggle, children }: { title: string; icon: any; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium flex-1 text-left">{title}</span>
        <ExpandChevron isExpanded={isOpen} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}
