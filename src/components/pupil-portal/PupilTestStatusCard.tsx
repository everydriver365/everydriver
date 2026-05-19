import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { GraduationCap, Car, CheckCircle2, XCircle, CalendarClock, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  pupilId: string;
  brandColour?: string | null;
}

interface TestRow {
  theory_test_date: string | null;
  theory_test_passed: boolean | null;
  test_date: string | null;
  test_passed: boolean | null;
}

type Status = "passed" | "not-passed" | "booked" | "taken" | "none";

function resolveStatus(date: string | null, passed: boolean | null): { status: Status; label: string; sub: string | null } {
  if (passed === true) return { status: "passed", label: "Passed", sub: date ? format(parseISO(date), "d MMM yyyy") : null };
  if (passed === false) return { status: "not-passed", label: "Not passed", sub: date ? format(parseISO(date), "d MMM yyyy") : null };
  if (date) {
    const d = parseISO(date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const isFuture = d >= today;
    return {
      status: isFuture ? "booked" : "taken",
      label: isFuture ? "Booked" : "Awaiting result",
      sub: format(d, "EEE d MMM yyyy"),
    };
  }
  return { status: "none", label: "Not set", sub: "Your instructor will update this" };
}

function StatusRow({
  icon: Icon, title, date, passed, brandColour,
}: {
  icon: typeof Car; title: string; date: string | null; passed: boolean | null; brandColour?: string | null;
}) {
  const { status, label, sub } = resolveStatus(date, passed);
  const tint = brandColour || "#1e3a5f";
  const styleByStatus: Record<Status, { bg: string; fg: string; Icon: typeof Car }> = {
    "passed":     { bg: "#DCFCE7", fg: "#15803D", Icon: CheckCircle2 },
    "not-passed": { bg: "#FEE2E2", fg: "#B91C1C", Icon: XCircle },
    "booked":     { bg: `${tint}15`, fg: tint, Icon: CalendarClock },
    "taken":      { bg: "#FEF3C7", fg: "#92400E", Icon: CalendarClock },
    "none":       { bg: "transparent", fg: "var(--brand-muted)", Icon: Circle },
  };
  const s = styleByStatus[status];
  const StatusIcon = s.Icon;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full shrink-0"
        style={{ backgroundColor: `${tint}15`, color: tint }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: "var(--brand-text)" }}>{title}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: "var(--brand-muted)" }}>{sub}</div>}
      </div>
      <div
        className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold shrink-0"
        style={{ backgroundColor: s.bg, color: s.fg, border: status === "none" ? "1px dashed var(--brand-border)" : "none" }}
      >
        <StatusIcon className="h-3 w-3" />
        {label}
      </div>
    </div>
  );
}

export function PupilTestStatusCard({ pupilId, brandColour }: Props) {
  const [row, setRow] = useState<TestRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("pupils")
        .select("theory_test_date, theory_test_passed, test_date, test_passed")
        .eq("id", pupilId)
        .maybeSingle();
      if (!cancelled) {
        setRow((data as TestRow) || { theory_test_date: null, theory_test_passed: null, test_date: null, test_passed: null });
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pupilId]);

  if (loading) return null;

  return (
    <Card style={{ backgroundColor: "var(--brand-card)", borderColor: "var(--brand-border)" }}>
      <CardHeader className="pb-1">
        <CardTitle className="text-base flex items-center gap-2" style={{ color: "var(--brand-text)" }}>
          <GraduationCap className="h-4 w-4" style={{ color: brandColour || "#1e3a5f" }} />
          Your Tests
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y" style={{ borderColor: "var(--brand-border)" }}>
        <StatusRow
          icon={GraduationCap}
          title="Theory test"
          date={row?.theory_test_date ?? null}
          passed={row?.theory_test_passed ?? null}
          brandColour={brandColour}
        />
        <StatusRow
          icon={Car}
          title="Driving test"
          date={row?.test_date ?? null}
          passed={row?.test_passed ?? null}
          brandColour={brandColour}
        />
      </CardContent>
    </Card>
  );
}
