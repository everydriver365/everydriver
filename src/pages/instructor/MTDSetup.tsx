import { useEffect, useMemo, useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { useInstructorMTDStatus } from "@/hooks/useInstructorMTDStatus";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  padding: 20,
};

const NINO_RE = /^[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]$/;
const UTR_RE = /^\d{10}$/;

type AccountingType = "cash" | "accruals";

interface WizardState {
  business_name: string;
  business_start_date: Date | undefined;
  hmrc_nino: string; // stored as canonical (no spaces, uppercase)
  utr: string;
  accounting_type: AccountingType;
  flat_rate_expenses: boolean;
}

function formatNinoForDisplay(raw: string): string {
  const clean = raw.toUpperCase().replace(/\s+/g, "");
  // AB 12 34 56 C
  const parts: string[] = [];
  if (clean.length > 0) parts.push(clean.slice(0, 2));
  if (clean.length > 2) parts.push(clean.slice(2, 4));
  if (clean.length > 4) parts.push(clean.slice(4, 6));
  if (clean.length > 6) parts.push(clean.slice(6, 8));
  if (clean.length > 8) parts.push(clean.slice(8, 9));
  return parts.join(" ");
}

function StepDots({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
      {[1, 2, 3, 4].map((n) => {
        const active = n === step;
        const done = n < step;
        return (
          <div
            key={n}
            style={{
              width: active ? 28 : 24,
              height: 24,
              borderRadius: 999,
              background: active ? "#2952b3" : done ? "#cdd9f3" : "#eef0f5",
              color: active ? "#fff" : done ? "#2952b3" : "#8a93a4",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 120ms",
            }}
          >
            {done ? "✓" : n}
          </div>
        );
      })}
    </div>
  );
}

export default function MTDSetup() {
  const navigate = useNavigate();
  const { instructor, loading: authLoading } = useInstructorAuth();
  const status = useInstructorMTDStatus(instructor?.id);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [prefilledBusinessName, setPrefilledBusinessName] = useState<string | null>(null);

  const [state, setState] = useState<WizardState>({
    business_name: "",
    business_start_date: undefined,
    hmrc_nino: "",
    utr: "",
    accounting_type: "cash",
    flat_rate_expenses: false,
  });

  // Pre-populate business_name from instructors table
  useEffect(() => {
    if (!instructor?.id || prefilledBusinessName !== null) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("instructors")
        .select("business_name")
        .eq("id", instructor.id)
        .maybeSingle();
      if (cancelled) return;
      const bn = data?.business_name ?? "";
      setPrefilledBusinessName(bn);
      setState((s) => (s.business_name ? s : { ...s, business_name: bn }));
    })();
    return () => {
      cancelled = true;
    };
  }, [instructor?.id, prefilledBusinessName]);

  // Validation
  const ninoCanonical = state.hmrc_nino.toUpperCase().replace(/\s+/g, "");
  const ninoValid = NINO_RE.test(ninoCanonical);
  const utrValid = UTR_RE.test(state.utr);
  const startDateValid =
    !!state.business_start_date && state.business_start_date.getTime() <= Date.now();

  const step1Valid = state.business_name.trim().length > 0 && startDateValid;
  const step2Valid = ninoValid && utrValid;

  if (authLoading || status.loading) {
    return (
      <div style={PAGE} className="flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#2952b3]" />
      </div>
    );
  }

  if (!instructor) {
    return <Navigate to="/instructor-app/login?redirect=/instructor-app/mtd/setup" replace />;
  }

  if (status.enrolled) {
    return <Navigate to="/instructor-app/mtd/dashboard" replace />;
  }

  const handleNext = () => {
    if (step === 1 && !step1Valid) return;
    if (step === 2 && !step2Valid) return;
    setStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : s));
  };
  const handleBack = () => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s));

  const handleSubmit = async () => {
    if (!confirmed || submitting) return;
    setSubmitError(null);
    setSubmitting(true);

    try {
      const upsert = await supabase
        .from("mtd_instructor_settings")
        .upsert(
          {
            instructor_id: instructor.id,
            is_mtd_enrolled: true,
            business_name: state.business_name.trim(),
            business_start_date: state.business_start_date
              ? format(state.business_start_date, "yyyy-MM-dd")
              : null,
            hmrc_nino: ninoCanonical,
            utr: state.utr,
            accounting_type: state.accounting_type,
            flat_rate_expenses: state.flat_rate_expenses,
          },
          { onConflict: "instructor_id" },
        );
      if (upsert.error) throw upsert.error;

      const seed = await supabase.functions.invoke("seed-mtd-periods", {
        body: { instructor_id: instructor.id },
      });
      if (seed.error) throw seed.error;

      toast.success("You're enrolled for Making Tax Digital");
      navigate("/instructor-app/mtd/dashboard", { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not complete enrolment";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={PAGE}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px 64px" }}>
        <div style={{ marginBottom: 20 }}>
          <Link to="/instructor-app/mtd" style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
            ← Back to MTD overview
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1F2937", marginTop: 8 }}>
            Set up Making Tax Digital
          </h1>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
            Four short steps. Takes about two minutes.
          </p>
        </div>

        <StepDots step={step} />

        <div style={CARD}>
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
                  Business details
                </h2>
                <p style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                  This is the name HMRC will see on your submissions.
                </p>
              </div>

              <div>
                <Label htmlFor="business_name">Business name</Label>
                <Input
                  id="business_name"
                  value={state.business_name}
                  onChange={(e) => setState({ ...state, business_name: e.target.value })}
                  placeholder="e.g. Smith School of Motoring"
                  className="mt-1.5"
                  maxLength={120}
                />
              </div>

              <div>
                <Label>Business start date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1.5",
                        !state.business_start_date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {state.business_start_date
                        ? format(state.business_start_date, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={state.business_start_date}
                      onSelect={(d) =>
                        setState((s) => ({ ...s, business_start_date: d ?? undefined }))
                      }
                      disabled={(d) => d > new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {state.business_start_date && !startDateValid && (
                  <p style={{ fontSize: 11, color: "#c9302c", marginTop: 4 }}>
                    Start date must be in the past
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
                  HMRC identifiers
                </h2>
                <p style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                  These uniquely identify you to HMRC. We store them securely.
                </p>
              </div>

              <div>
                <Label htmlFor="nino">National Insurance Number</Label>
                <Input
                  id="nino"
                  value={formatNinoForDisplay(state.hmrc_nino)}
                  onChange={(e) =>
                    setState({
                      ...state,
                      hmrc_nino: e.target.value.toUpperCase().replace(/\s+/g, "").slice(0, 9),
                    })
                  }
                  placeholder="AB 12 34 56 C"
                  className="mt-1.5 tracking-wider"
                  maxLength={13}
                />
                {state.hmrc_nino.length > 0 && !ninoValid && (
                  <p style={{ fontSize: 11, color: "#c9302c", marginTop: 4 }}>
                    Enter a valid NI number (e.g. AB123456C)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="utr">Unique Taxpayer Reference (UTR)</Label>
                <Input
                  id="utr"
                  inputMode="numeric"
                  value={state.utr}
                  onChange={(e) =>
                    setState({ ...state, utr: e.target.value.replace(/\D/g, "").slice(0, 10) })
                  }
                  placeholder="1234567890"
                  className="mt-1.5 tracking-wider"
                  maxLength={10}
                />
                {state.utr.length > 0 && !utrValid && (
                  <p style={{ fontSize: 11, color: "#c9302c", marginTop: 4 }}>
                    UTR must be 10 digits
                  </p>
                )}
                <p style={{ fontSize: 11, color: "#6B7280", marginTop: 6 }}>
                  Find your UTR on any letter from HMRC or your Self Assessment tax return.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
                  Accounting preferences
                </h2>
                <p style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                  You can change these settings later.
                </p>
              </div>

              <div>
                <Label>Accounting basis</Label>
                <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                  {(
                    [
                      { v: "cash", title: "Cash basis", sub: "Record income when payment is received" },
                      { v: "accruals", title: "Accruals basis", sub: "Record income when lesson is delivered" },
                    ] as const
                  ).map((opt) => {
                    const active = state.accounting_type === opt.v;
                    return (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setState({ ...state, accounting_type: opt.v })}
                        style={{
                          textAlign: "left",
                          padding: 12,
                          borderRadius: 12,
                          border: active ? "2px solid #2952b3" : "1px solid #e0e3ea",
                          background: active ? "#f0f4fc" : "#fff",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#1F2937" }}>
                          {opt.title}
                          {opt.v === "cash" && (
                            <span style={{ fontSize: 10, color: "#6B7280", marginLeft: 6, fontWeight: 500 }}>
                              (default)
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{opt.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  padding: 12,
                  border: "1px solid #e0e3ea",
                  borderRadius: 12,
                }}
              >
                <Switch
                  id="flat_rate"
                  checked={state.flat_rate_expenses}
                  onCheckedChange={(c) => setState({ ...state, flat_rate_expenses: c })}
                />
                <div>
                  <Label htmlFor="flat_rate" style={{ cursor: "pointer" }}>
                    Use simplified expenses (flat rate)
                  </Label>
                  <p style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>
                    HMRC allows self-employed drivers to use flat rates for vehicle costs
                    instead of actual expenses.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
                  Review &amp; confirm
                </h2>
                <p style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                  Check your details before enrolling.
                </p>
              </div>

              <dl style={{ display: "grid", gap: 10, fontSize: 13 }}>
                <Row k="Business name" v={state.business_name} />
                <Row
                  k="Business start date"
                  v={state.business_start_date ? format(state.business_start_date, "PPP") : "—"}
                />
                <Row k="NI number" v={formatNinoForDisplay(state.hmrc_nino)} />
                <Row k="UTR" v={state.utr} />
                <Row
                  k="Accounting basis"
                  v={state.accounting_type === "cash" ? "Cash basis" : "Accruals basis"}
                />
                <Row k="Flat rate expenses" v={state.flat_rate_expenses ? "On" : "Off"} />
              </dl>

              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
                <Checkbox
                  checked={confirmed}
                  onCheckedChange={(c) => setConfirmed(c === true)}
                  className="mt-0.5"
                />
                <span style={{ fontSize: 13, color: "#1F2937" }}>
                  I confirm my details are correct and I want to enrol for Making Tax Digital.
                </span>
              </label>

              {submitError && (
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
                  {submitError}
                </div>
              )}
            </div>
          )}

          {/* Footer nav */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, gap: 8 }}>
            {step > 1 ? (
              <Button variant="outline" onClick={handleBack} disabled={submitting}>
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
              </Button>
            ) : (
              <span />
            )}
            {step < 4 ? (
              <Button
                onClick={handleNext}
                disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                style={{ background: "#2952b3" }}
              >
                Next <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!confirmed || submitting}
                style={{ background: "#2952b3" }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Enrolling…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Complete enrolment
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 0",
        borderBottom: "1px solid #f0f2f6",
      }}
    >
      <dt style={{ color: "#6B7280" }}>{k}</dt>
      <dd style={{ color: "#1F2937", fontWeight: 600, textAlign: "right" }}>{v || "—"}</dd>
    </div>
  );
}
