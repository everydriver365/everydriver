import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, AlertTriangle, Cloud, Users, Calendar, ChevronRight, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface BriefingActionModalProps {
  actionId: string | null;
  instructorId: string | undefined;
  open: boolean;
  onClose: () => void;
}

interface DebtorInfo {
  id: string;
  name: string;
  debt: number;
}

interface TestInfo {
  id: string;
  pupilName: string;
  testDate: string;
  testTime: string | null;
  result: string;
  isMock: boolean;
}

const ACTION_CONFIG: Record<string, { icon: React.ElementType; title: string; route: string; buttonLabel: string }> = {
  payments: { icon: CreditCard, title: "Outstanding Balances", route: "/instructor/payments", buttonLabel: "Go to Payments" },
  tests: { icon: AlertTriangle, title: "Upcoming Tests", route: "/instructor/tests", buttonLabel: "Go to Tests" },
  weather: { icon: Cloud, title: "Weather Alert", route: "/instructor/schedule", buttonLabel: "View Schedule" },
  waitlist: { icon: Users, title: "Fill Gaps", route: "/instructor/schedule", buttonLabel: "Go to Schedule" },
  schedule: { icon: Calendar, title: "Today's Schedule", route: "/instructor/schedule", buttonLabel: "Go to Schedule" },
};

export function BriefingActionModal({ actionId, instructorId, open, onClose }: BriefingActionModalProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [debtors, setDebtors] = useState<DebtorInfo[]>([]);
  const [tests, setTests] = useState<TestInfo[]>([]);

  const config = actionId ? ACTION_CONFIG[actionId] : null;

  useEffect(() => {
    if (!open || !actionId || !instructorId) return;
    if (actionId === "payments") fetchDebtors();
    if (actionId === "tests") fetchUpcomingTests();
  }, [open, actionId, instructorId]);

  const fetchDebtors = async () => {
    setLoading(true);
    try {
      const { data } = await (supabase.from("pupils") as any)
        .select("id, name, account_balance")
        .eq("instructor_id", instructorId)
        .eq("is_active", true)
        .lt("account_balance", 0);
      setDebtors(
        (data || []).map((p: any) => ({ id: p.id, name: p.name, debt: Math.abs(p.account_balance || 0) }))
      );
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingTests = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await (supabase.from("driving_test_results") as any)
        .select("id, test_date, test_time, result, is_mock, pupil_id, pupils(name)")
        .eq("instructor_id", instructorId)
        .gte("test_date", today)
        .order("test_date", { ascending: true })
        .limit(10);
      setTests(
        (data || []).map((t: any) => ({
          id: t.id,
          pupilName: t.pupils?.name || "Unknown",
          testDate: t.test_date,
          testTime: t.test_time,
          result: t.result,
          isMock: t.is_mock,
        }))
      );
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = () => {
    if (config) {
      navigate(config.route);
      onClose();
    }
  };

  if (!config) return null;

  const IconComp = config.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-primary/10 flex items-center justify-center">
              <IconComp className="h-4.5 w-4.5 text-primary" />
            </div>
            <DialogTitle className="text-base">{config.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-2 min-h-[80px]">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : actionId === "payments" ? (
            <PaymentsContent debtors={debtors} />
          ) : actionId === "tests" ? (
            <TestsContent tests={tests} />
          ) : (
            <p className="text-sm text-muted-foreground">Tap below to view more details.</p>
          )}
        </div>

        <Button onClick={handleNavigate} className="w-full gap-2 rounded-2xl">
          {config.buttonLabel}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function PaymentsContent({ debtors }: { debtors: DebtorInfo[] }) {
  if (debtors.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No outstanding balances 🎉</p>;
  }
  const total = debtors.reduce((s, d) => s + d.debt, 0);
  return (
    <div className="space-y-2">
      {debtors.map((d) => (
        <div key={d.id} className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2">
          <span className="text-sm font-medium text-foreground truncate">{d.name}</span>
          <span className="text-sm font-semibold text-destructive">£{d.debt.toFixed(2)}</span>
        </div>
      ))}
      <p className="text-xs text-muted-foreground pt-1">
        {debtors.length} pupil{debtors.length !== 1 ? "s" : ""} · £{total.toFixed(2)} total outstanding
      </p>
    </div>
  );
}

function TestsContent({ tests }: { tests: TestInfo[] }) {
  if (tests.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No upcoming tests scheduled</p>;
  }
  return (
    <div className="space-y-2">
      {tests.map((t) => (
        <div key={t.id} className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2">
          <div className="min-w-0">
            <span className="text-sm font-medium text-foreground truncate block">{t.pupilName}</span>
            <span className="text-[11px] text-muted-foreground">
              {new Date(t.testDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
              {t.testTime ? ` · ${t.testTime}` : ""}
              {t.isMock ? " · Mock" : ""}
            </span>
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground pt-1">
        {tests.length} upcoming test{tests.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
