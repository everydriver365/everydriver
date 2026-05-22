import { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ArrowRight, CheckCircle2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useInstructorMTDStatus } from "@/hooks/useInstructorMTDStatus";
import { getCurrentTaxYear } from "@/lib/mtdDeadlines";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

const FONT = '"Poppins", system-ui, -apple-system, "Segoe UI", sans-serif';

const PAGE: React.CSSProperties = {
  background: "#F2F4F8",
  minHeight: "100vh",
  fontFamily: FONT,
};

const CARD: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #e0e3ea",
  borderRadius: 14,
  padding: 16,
};

const NINO_RE = /^[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]$/;
const UTR_RE = /^\d{10}$/;

type AccountingType = "cash" | "accruals";
type PeriodRow = {
  id: string;
  tax_year: number;
  quarter: number;
  period_start: string;
  period_end: string;
  deadline: string;
  status: string;
  submitted_at: string | null;
};
type Settings = {
  business_name: string | null;
  business_start_date: string | null;
  hmrc_nino: string | null;
  utr: string | null;
  accounting_type: AccountingType;
  flat_rate_expenses: boolean;
};

function shortMonth(iso: string): string {
  return format(parseISO(iso), "d MMM");
}
function longDate(iso: string): string {
  return format(parseISO(iso), "d MMM yyyy");
}

export default function MTDDashboard() {
  const { instructor, loading: authLoading } = useInstructorAuth();
  const status = useInstructorMTDStatus(instructor?.id);

  const currentTaxYear = useMemo(() => getCurrentTaxYear(new Date()), []);
  const [selectedTaxYear, setSelectedTaxYear] = useState<number>(currentTaxYear);

  const [periods, setPeriods] = useState<PeriodRow[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!instructor?.id) return;
    let cancelled = false;
    (async () => {
      setLoadingPeriods(true);
      const [pRes, sRes] = await Promise.all([
        supabase
          .from("mtd_quarterly_periods")
          .select("id,tax_year,quarter,period_start,period_end,deadline,status,submitted_at")
          .eq("instructor_id", instructor.id)
          .eq("tax_year", selectedTaxYear)
          .order("quarter"),
        supabase
          .from("mtd_instructor_settings")
          .select("business_name,business_start_date,hmrc_nino,utr,accounting_type,flat_rate_expenses")
          .eq("instructor_id", instructor.id)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setPeriods((pRes.data ?? []) as PeriodRow[]);
      if (sRes.data) {
        setSettings({
          business_name: sRes.data.business_name,
          business_start_date: sRes.data.business_start_date,
          hmrc_nino: sRes.data.hmrc_nino,
          utr: sRes.data.utr,
          accounting_type: (sRes.data.accounting_type as AccountingType) ?? "cash",
          flat_rate_expenses: sRes.data.flat_rate_expenses ?? false,
        });
      }
      setLoadingPeriods(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [instructor?.id, selectedTaxYear]);

  if (authLoading || status.loading) {
    return (
      <div style={PAGE} className="flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#2952b3]" />
      </div>
    );
  }
  if (!instructor) {
    return <Navigate to="/instructor-app/login?redirect=/instructor-app/mtd/dashboard" replace />;
  }
  if (!status.enrolled) {
    return <Navigate to="/instructor-app/mtd" replace />;
  }

  const today = new Date();

  return (
    <div style={PAGE}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px 64px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1F2937" }}>Making Tax Digital</h1>
          <span
            style={{
              background: "#e8f5ee",
              color: "#2d8a4e",
              border: "1px solid #b9dec7",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              padding: "3px 8px",
              borderRadius: 999,
            }}
          >
            Enrolled
          </span>
        </div>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
          Your quarterly periods, deadlines and submission status.
        </p>

        {/* Settings summary */}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          style={{
            ...CARD,
            display: "block",
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: "#8a93a4", textTransform: "uppercase" }}>
              Your MTD setup
            </div>
            <Pencil size={14} color="#6B7280" />
          </div>
          <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
            <KV k="Business" v={settings?.business_name ?? "—"} />
            <KV k="Basis" v={(settings?.accounting_type ?? "cash") === "cash" ? "Cash" : "Accruals"} />
            <KV k="NINO" v={settings?.hmrc_nino ?? "—"} />
            <KV k="UTR" v={settings?.utr ?? "—"} />
            <KV k="Flat rate" v={settings?.flat_rate_expenses ? "On" : "Off"} />
            <KV k="Trading since" v={settings?.business_start_date ? longDate(settings.business_start_date) : "—"} />
          </div>
        </button>

        {/* Tax year selector */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[currentTaxYear, currentTaxYear + 1].map((y) => {
            const active = y === selectedTaxYear;
            return (
              <button
                key={y}
                onClick={() => setSelectedTaxYear(y)}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: active ? "1px solid #2952b3" : "1px solid #e0e3ea",
                  background: active ? "#2952b3" : "#fff",
                  color: active ? "#fff" : "#1F2937",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: FONT,
                }}
              >
                {y}/{String((y + 1) % 100).padStart(2, "0")}
              </button>
            );
          })}
        </div>

        {/* Periods */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {loadingPeriods ? (
            <div style={{ ...CARD, textAlign: "center", color: "#6B7280", fontSize: 13 }}>
              <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" /> Loading periods…
            </div>
          ) : periods.length === 0 ? (
            <div style={{ ...CARD, textAlign: "center", color: "#6B7280", fontSize: 13 }}>
              No periods seeded yet for this tax year.
            </div>
          ) : (
            periods.map((p) => {
              const deadline = parseISO(p.deadline);
              const start = parseISO(p.period_start);
              const end = parseISO(p.period_end);
              const isCurrent = today >= start && today <= deadline;
              const isOverdue = p.status === "open" && deadline < today;
              const statusLabel =
                p.status === "submitted" || p.status === "accepted"
                  ? "Submitted"
                  : isOverdue
                    ? "Overdue"
                    : "Open";
              const statusPill: React.CSSProperties =
                statusLabel === "Submitted"
                  ? { background: "#e8f5ee", color: "#2d8a4e" }
                  : statusLabel === "Overdue"
                    ? { background: "#fbe8e8", color: "#991b1b" }
                    : { background: "#eef0f5", color: "#475569" };

              return (
                <div
                  key={p.id}
                  style={{
                    ...CARD,
                    borderLeft: isCurrent ? "4px solid #2D3FE7" : CARD.border as string,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#8a93a4", textTransform: "uppercase", letterSpacing: 0.4 }}>
                        Q{p.quarter} {format(start, "MMM")}–{format(end, "MMM")}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1F2937", marginTop: 4 }}>
                        Due {longDate(p.deadline)}
                      </div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                        Period: {shortMonth(p.period_start)} – {shortMonth(p.period_end)}
                      </div>
                    </div>
                    <span
                      style={{
                        ...statusPill,
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: 0.4,
                        padding: "3px 8px",
                        borderRadius: 999,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  {p.status === "open" && (
                    <div style={{ marginTop: 12 }}>
                      <Button
                        size="sm"
                        onClick={() => toast("HMRC submission coming soon", {
                          description: "Direct submission to HMRC will be enabled when our integration is approved.",
                        })}
                        style={{ background: "#2952b3" }}
                      >
                        Submit
                      </Button>
                    </div>
                  )}
                  {(p.status === "submitted" || p.status === "accepted") && p.submitted_at && (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#2d8a4e" }}>
                      <CheckCircle2 size={14} /> Submitted {longDate(p.submitted_at.slice(0, 10))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Link
            to="/instructor/tax"
            style={{ fontSize: 13, color: "#2952b3", fontWeight: 600 }}
          >
            View full tax breakdown →
          </Link>
        </div>
      </div>

      {settings && (
        <SettingsSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          instructorId={instructor.id}
          settings={settings}
          onSaved={(s) => {
            setSettings(s);
            setSheetOpen(false);
            toast.success("MTD settings updated");
          }}
        />
      )}
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#8a93a4", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>
        {k}
      </div>
      <div style={{ fontSize: 13, color: "#1F2937", fontWeight: 600, marginTop: 2 }}>{v}</div>
    </div>
  );
}

function SettingsSheet({
  open,
  onOpenChange,
  instructorId,
  settings,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  instructorId: string;
  settings: Settings;
  onSaved: (s: Settings) => void;
}) {
  const [draft, setDraft] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setDraft(settings);
    setErr(null);
  }, [settings, open]);

  const ninoCanonical = (draft.hmrc_nino ?? "").toUpperCase().replace(/\s+/g, "");
  const ninoOk = NINO_RE.test(ninoCanonical);
  const utrOk = UTR_RE.test(draft.utr ?? "");
  const nameOk = (draft.business_name ?? "").trim().length > 0;
  const dateOk =
    !!draft.business_start_date && new Date(draft.business_start_date).getTime() <= Date.now();
  const valid = ninoOk && utrOk && nameOk && dateOk;

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setErr(null);
    const res = await supabase
      .from("mtd_instructor_settings")
      .update({
        business_name: draft.business_name?.trim() ?? null,
        business_start_date: draft.business_start_date,
        hmrc_nino: ninoCanonical,
        utr: draft.utr,
        accounting_type: draft.accounting_type,
        flat_rate_expenses: draft.flat_rate_expenses,
      })
      .eq("instructor_id", instructorId);
    setSaving(false);
    if (res.error) {
      setErr(res.error.message);
      return;
    }
    onSaved({ ...draft, hmrc_nino: ninoCanonical });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit MTD setup</SheetTitle>
          <SheetDescription>Update the details HMRC will see on your submissions.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="bn">Business name</Label>
            <Input
              id="bn"
              value={draft.business_name ?? ""}
              onChange={(e) => setDraft({ ...draft, business_name: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Business start date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1.5",
                    !draft.business_start_date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {draft.business_start_date
                    ? format(parseISO(draft.business_start_date), "PPP")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={draft.business_start_date ? parseISO(draft.business_start_date) : undefined}
                  onSelect={(d) =>
                    setDraft({
                      ...draft,
                      business_start_date: d ? format(d, "yyyy-MM-dd") : null,
                    })
                  }
                  disabled={(d) => d > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="nino2">NI Number</Label>
            <Input
              id="nino2"
              value={draft.hmrc_nino ?? ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  hmrc_nino: e.target.value.toUpperCase().replace(/\s+/g, "").slice(0, 9),
                })
              }
              maxLength={9}
              className="mt-1.5 tracking-wider"
            />
            {(draft.hmrc_nino ?? "").length > 0 && !ninoOk && (
              <p style={{ fontSize: 11, color: "#c9302c", marginTop: 4 }}>
                Enter a valid NI number (e.g. AB123456C)
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="utr2">UTR</Label>
            <Input
              id="utr2"
              inputMode="numeric"
              value={draft.utr ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, utr: e.target.value.replace(/\D/g, "").slice(0, 10) })
              }
              maxLength={10}
              className="mt-1.5 tracking-wider"
            />
            {(draft.utr ?? "").length > 0 && !utrOk && (
              <p style={{ fontSize: 11, color: "#c9302c", marginTop: 4 }}>UTR must be 10 digits</p>
            )}
          </div>

          <div>
            <Label>Accounting basis</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {(["cash", "accruals"] as const).map((v) => {
                const active = draft.accounting_type === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDraft({ ...draft, accounting_type: v })}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: active ? "2px solid #2952b3" : "1px solid #e0e3ea",
                      background: active ? "#f0f4fc" : "#fff",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {v === "cash" ? "Cash" : "Accruals"}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border border-[#e0e3ea] rounded-xl">
            <div>
              <Label htmlFor="fre2" style={{ cursor: "pointer" }}>
                Flat rate expenses
              </Label>
              <p style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                Use simplified vehicle expenses.
              </p>
            </div>
            <Switch
              id="fre2"
              checked={draft.flat_rate_expenses}
              onCheckedChange={(c) => setDraft({ ...draft, flat_rate_expenses: c })}
            />
          </div>

          {err && (
            <div
              style={{
                background: "#fbe8e8",
                border: "1px solid #f5c2c2",
                color: "#991b1b",
                fontSize: 12,
                padding: 10,
                borderRadius: 10,
              }}
            >
              {err}
            </div>
          )}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!valid || saving} style={{ background: "#2952b3" }}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
