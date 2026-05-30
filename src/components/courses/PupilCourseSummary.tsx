/**
 * PupilCourseSummary — read-only desktop course summary page.
 *
 * Phase 1 of the spec: structure + live data only.
 * Edits, refunds, activity log and duplication are deferred.
 *
 * Data sources (all live, no mock):
 * - pupils                — pupil profile, balance, course_status, accessibility (medical_notes / special_needs)
 * - scheduled_lessons     — every lesson scheduled for the pupil → acts as "attendees / sessions"
 * - payment_history       — every payment recorded against the pupil
 * - instructors           — instructor profile, fee split (school_skim_percentage)
 * - course_reviews        — average rating for the instructor
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Star,
  ArrowLeft,
} from "lucide-react";

type Props = {
  pupilId: string;
  /** Back link href ("instructor" routes back to /instructor/course-summaries, "school" uses callback) */
  onBack?: () => void;
  backHref?: string;
};

type Pupil = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  postcode: string | null;
  pickup_address: string | null;
  pickup_postcode: string | null;
  what3words: string | null;
  course_type: string | null;
  course_status: string | null;
  account_balance: number | null;
  test_date: string | null;
  test_time: string | null;
  test_passed: boolean | null;
  transmission_type: string | null;
  special_needs: string | null;
  medical_notes: string | null;
  intensive_hours_paid: number | null;
  prepaid_hours: number | null;
  custom_hourly_rate: number | null;
  instructor_id: string;
  notes: string | null;
};

type Lesson = {
  id: string;
  lesson_date: string;
  start_time: string;
  duration_minutes: number;
  status: string | null;
  payment_status: string | null;
  payment_method: string | null;
  amount_due: number | null;
  price_per_hour: number | null;
  pickup_location: string | null;
};

type Payment = {
  id: string;
  amount: number;
  payment_method: string | null;
  recorded_at: string;
  notes: string | null;
  payment_type: string | null;
};

type Instructor = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  profile_image_url: string | null;
  hourly_rate: number | null;
  school_skim_percentage: number | null;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtTime = (t: string | null) => (t ? t.slice(0, 5) : "—");

function StatusBadge({ status }: { status: string | null }) {
  const s = (status || "").toLowerCase();
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    scheduled: { bg: "#DBEAFE", fg: "#1E4D9B", label: "Booked" },
    booked: { bg: "#DBEAFE", fg: "#1E4D9B", label: "Booked" },
    completed: { bg: "#D1FAE5", fg: "#059669", label: "Completed" },
    in_progress: { bg: "#D1FAE5", fg: "#059669", label: "Started" },
    cancelled: { bg: "#FEE2E2", fg: "#C0271F", label: "Cancelled" },
    no_show: { bg: "#FEF3C7", fg: "#B45309", label: "No-show" },
  };
  const v = map[s] || { bg: "#F3F4F6", fg: "#374151", label: status || "Unknown" };
  return (
    <span
      style={{
        backgroundColor: v.bg,
        color: v.fg,
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 999,
      }}
    >
      {v.label}
    </span>
  );
}

function PaymentMethodPill({ method }: { method: string | null }) {
  const m = (method || "").toLowerCase();
  const colour =
    m.includes("klarna")
      ? { bg: "#FCE7F3", fg: "#9D174D" }
      : m.includes("clearpay")
      ? { bg: "#D1FAE5", fg: "#059669" }
      : m.includes("cash")
      ? { bg: "#FEF3C7", fg: "#B45309" }
      : m.includes("gocardless") || m.includes("bank")
      ? { bg: "#DBEAFE", fg: "#1E4D9B" }
      : m.includes("square") || m.includes("sumup") || m.includes("card")
      ? { bg: "#F3F4F6", fg: "#374151" }
      : { bg: "#F3F4F6", fg: "#6B7280" };
  return (
    <span
      style={{
        backgroundColor: colour.bg,
        color: colour.fg,
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 999,
      }}
    >
      {method || "—"}
    </span>
  );
}

export function PupilCourseSummary({ pupilId, onBack, backHref }: Props) {
  const [loading, setLoading] = useState(true);
  const [pupil, setPupil] = useState<Pupil | null>(null);
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [rating, setRating] = useState<{ avg: number; count: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);

      const { data: pupilRow } = await supabase
        .from("pupils")
        .select(
          "id,name,email,phone,postcode,pickup_address,pickup_postcode,what3words,course_type,course_status,account_balance,test_date,test_time,test_passed,transmission_type,special_needs,medical_notes,intensive_hours_paid,prepaid_hours,custom_hourly_rate,instructor_id,notes"
        )
        .eq("id", pupilId)
        .maybeSingle();

      if (cancelled || !pupilRow) {
        setPupil(null);
        setLoading(false);
        return;
      }
      setPupil(pupilRow as Pupil);

      const [{ data: instructorRow }, { data: lessonRows }, { data: paymentRows }] = await Promise.all([
        supabase
          .from("instructors")
          .select("id,name,email,phone,profile_image_url,hourly_rate,school_skim_percentage")
          .eq("id", pupilRow.instructor_id)
          .maybeSingle(),
        supabase
          .from("scheduled_lessons")
          .select(
            "id,lesson_date,start_time,duration_minutes,status,payment_status,payment_method,amount_due,price_per_hour,pickup_location"
          )
          .eq("pupil_id", pupilId)
          .is("deleted_at", null)
          .order("lesson_date", { ascending: true })
          .order("start_time", { ascending: true }),
        supabase
          .from("payment_history")
          .select("id,amount,payment_method,recorded_at,notes,payment_type")
          .eq("pupil_id", pupilId)
          .is("deleted_at", null)
          .order("recorded_at", { ascending: false }),
      ]);

      if (cancelled) return;

      setInstructor((instructorRow as Instructor) || null);
      setLessons((lessonRows as Lesson[]) || []);
      setPayments((paymentRows as Payment[]) || []);

      // Reviews are instructor-level, not course-level — show instructor's overall rating.
      const { data: reviewRows } = await supabase
        .from("course_reviews")
        .select("rating")
        .eq("instructor_id", pupilRow.instructor_id)
        .eq("is_visible", true);

      if (!cancelled) {
        if (reviewRows && reviewRows.length > 0) {
          const avg =
            reviewRows.reduce((acc, r) => acc + (r.rating || 0), 0) / reviewRows.length;
          setRating({ avg, count: reviewRows.length });
        } else {
          setRating(null);
        }
      }

      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [pupilId]);

  const totals = useMemo(() => {
    const totalCollected = payments
      .filter((p) => (p.amount || 0) > 0)
      .reduce((a, p) => a + Number(p.amount || 0), 0);
    const totalRefunded = payments
      .filter((p) => (p.amount || 0) < 0)
      .reduce((a, p) => a + Math.abs(Number(p.amount || 0)), 0);
    const skimPct = Number(instructor?.school_skim_percentage || 0);
    const schoolProfit = (totalCollected * skimPct) / 100;
    const paidToInstructor = totalCollected - schoolProfit;
    const attendedCount = lessons.filter((l) => (l.status || "").toLowerCase() === "completed").length;
    const totalLessons = lessons.length;
    const totalHours = lessons.reduce((a, l) => a + (l.duration_minutes || 0), 0) / 60;
    const attendancePct = totalLessons > 0 ? Math.round((attendedCount / totalLessons) * 100) : 0;
    const outstanding = (pupil?.account_balance || 0) < 0 ? Math.abs(pupil!.account_balance!) : 0;
    return {
      totalCollected,
      totalRefunded,
      schoolProfit,
      paidToInstructor,
      attendedCount,
      totalLessons,
      totalHours,
      attendancePct,
      outstanding,
    };
  }, [payments, lessons, instructor, pupil]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pupil) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Course / pupil not found.</div>
    );
  }

  const attendanceColour =
    totals.attendancePct >= 100 ? "#059669" : totals.attendancePct >= 75 ? "#B45309" : "#C0271F";

  return (
    <div className="p-6 space-y-4" style={{ backgroundColor: "#F4F7F6", minHeight: "100%" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {(onBack || backHref) &&
            (backHref ? (
              <Link
                to={backHref}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            ) : (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ))}
          <h1 className="text-xl font-bold">{pupil.name}'s course</h1>
          <StatusBadge status={pupil.course_status || "scheduled"} />
        </div>
      </div>

      {/* Outstanding banner */}
      {totals.outstanding > 0 && (
        <div
          style={{
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderLeft: "4px solid #C0271F",
            borderRadius: 12,
            padding: "14px 20px",
          }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" style={{ color: "#C0271F" }} />
            <div>
              <div style={{ color: "#C0271F", fontSize: 14, fontWeight: 600 }}>
                Outstanding balance — {fmt(totals.outstanding)}
              </div>
              <div style={{ fontSize: 12, color: "#9CA3AF" }}>{pupil.name}</div>
            </div>
          </div>
        </div>
      )}

      {/* 4-column grid */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "320px 280px 1fr 200px" }}
      >
        {/* Column 1 — Course summary + location + sessions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="bg-transparent pb-3">
              <CardTitle className="text-base">Course summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Lessons" value={String(totals.totalLessons)} />
                <Stat label="Attended" value={String(totals.attendedCount)} />
                <Stat label="Hours" value={totals.totalHours.toFixed(1)} />
              </div>
              <Row label="Course type" value={pupil.course_type || "—"} />
              <Row label="Transmission" value={pupil.transmission_type || "—"} />
              <Row label="Hourly rate" value={pupil.custom_hourly_rate ? fmt(pupil.custom_hourly_rate) : (instructor?.hourly_rate ? fmt(instructor.hourly_rate) : "—")} />
              <Row label="Test date" value={fmtDate(pupil.test_date)} />
              <Row label="Test time" value={fmtTime(pupil.test_time)} />
              <Row label="Prepaid hours" value={String(pupil.prepaid_hours ?? 0)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-transparent pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Pick-up location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Address" value={pupil.pickup_address || "—"} />
              <Row label="Postcode" value={pupil.pickup_postcode || pupil.postcode || "—"} />
              <Row
                label="what3words"
                value={
                  pupil.what3words ? (
                    <a
                      href={`https://what3words.com/${pupil.what3words}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      ///{pupil.what3words}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              {pupil.notes && (
                <div className="pt-2 border-t text-xs text-muted-foreground whitespace-pre-wrap">
                  {pupil.notes}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-transparent pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Sessions</CardTitle>
              {rating ? (
                <span
                  style={{ fontSize: 12, fontWeight: 600, color: "#B45309" }}
                  className="flex items-center gap-1"
                  title="Average instructor rating"
                >
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {rating.avg.toFixed(1)} / 5 · {rating.count}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">No reviews yet</span>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>{totals.attendedCount}/{totals.totalLessons} attended</span>
                  <span style={{ color: attendanceColour }}>{totals.attendancePct}%</span>
                </div>
                <Progress value={totals.attendancePct} className="h-1.5" />
              </div>

              {(pupil.special_needs || pupil.medical_notes) && (
                <div
                  style={{
                    backgroundColor: "#FFFBEB",
                    borderLeft: "3px solid #F59E0B",
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontSize: 11,
                  }}
                  className="text-amber-900"
                >
                  <strong>Accessibility:</strong>{" "}
                  {[pupil.special_needs, pupil.medical_notes].filter(Boolean).join(" · ")}
                </div>
              )}

              <div className="divide-y max-h-[420px] overflow-y-auto -mx-2">
                {lessons.length === 0 && (
                  <div className="text-sm text-muted-foreground px-2 py-3">No lessons scheduled yet.</div>
                )}
                {lessons.map((l) => (
                  <div key={l.id} className="px-2 py-2 flex items-center gap-2">
                    <AttendanceIcon status={l.status} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold">{fmtDate(l.lesson_date)} · {fmtTime(l.start_time)}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {l.duration_minutes} min{l.pickup_location ? ` · ${l.pickup_location}` : ""}
                      </div>
                    </div>
                    <PaymentMethodPill method={l.payment_method} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Column 2 — Instructor */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="bg-transparent pb-3">
              <CardTitle className="text-base">Instructor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {instructor ? (
                <>
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        backgroundColor: "#1E4D9B",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {instructor.name?.charAt(0) || "I"}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{instructor.name}</div>
                      <Badge variant="secondary" className="text-[10px]">Confirmed</Badge>
                    </div>
                  </div>
                  {instructor.phone && (
                    <a href={`tel:${instructor.phone}`} className="flex items-center gap-2 text-xs hover:text-primary">
                      <Phone className="h-3.5 w-3.5" /> {instructor.phone}
                    </a>
                  )}
                  {instructor.email && (
                    <a href={`mailto:${instructor.email}`} className="flex items-center gap-2 text-xs hover:text-primary">
                      <Mail className="h-3.5 w-3.5" /> {instructor.email}
                    </a>
                  )}

                  <div className="pt-3 border-t space-y-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Payment breakdown
                    </div>
                    <Row label="Total collected" value={fmt(totals.totalCollected)} />
                    <Row label="School skim %" value={`${instructor.school_skim_percentage ?? 0}%`} />
                    <Row label="School profit" value={fmt(totals.schoolProfit)} />
                    <Row label="Paid to instructor" value={fmt(totals.paidToInstructor)} />
                    {totals.totalRefunded > 0 && (
                      <Row label="Refunded" value={<span style={{ color: "#C0271F" }}>{fmt(totals.totalRefunded)}</span>} />
                    )}
                  </div>

                  <div
                    style={{
                      backgroundColor: "#F0FDF4",
                      color: "#059669",
                      fontWeight: 700,
                      padding: 10,
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                    className="flex items-center justify-between"
                  >
                    <span>School profit</span>
                    <span style={{ fontSize: 16 }}>{fmt(totals.schoolProfit)}</span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No instructor assigned.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 3 — Course balance + payment history */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="bg-transparent pb-3">
              <CardTitle className="text-base">Course balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <BigStat label="Total collected" value={fmt(totals.totalCollected)} />
                <BigStat label="Paid to instructor" value={fmt(totals.paidToInstructor)} />
                <BigStat label="School profit" value={fmt(totals.schoolProfit)} accent="#059669" />
                <BigStat
                  label="Outstanding"
                  value={fmt(totals.outstanding)}
                  accent={totals.outstanding > 0 ? "#C0271F" : undefined}
                />
              </div>
              {totals.totalRefunded > 0 && (
                <div className="mt-3 text-xs" style={{ color: "#C0271F" }}>
                  Total refunded: {fmt(totals.totalRefunded)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-transparent pb-3">
              <CardTitle className="text-base">Payment history</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-sm text-muted-foreground">No payments recorded yet.</div>
              ) : (
                <div className="divide-y">
                  {payments.map((p) => {
                    const isRefund = (p.amount || 0) < 0;
                    return (
                      <div key={p.id} className="py-2 flex items-center gap-3">
                        <div className="text-[11px] text-muted-foreground" style={{ minWidth: 70 }}>
                          {fmtDate(p.recorded_at)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">
                            {isRefund ? "↩ Refund" : p.payment_type || p.notes || "Payment"}
                          </div>
                          {p.notes && !isRefund && (
                            <div className="text-[10px] text-muted-foreground truncate">{p.notes}</div>
                          )}
                        </div>
                        <PaymentMethodPill method={p.payment_method} />
                        <div
                          className="text-xs font-bold tabular-nums"
                          style={{ color: isRefund ? "#C0271F" : "#059669", minWidth: 70, textAlign: "right" }}
                        >
                          {isRefund ? "-" : ""}{fmt(Math.abs(Number(p.amount || 0)))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 4 — Actions (Phase 1: read-only placeholder) */}
        <div>
          <Card>
            <CardHeader className="bg-transparent pb-3">
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground space-y-2">
                <p>Inline edits, refunds, duplicate course, and email reminders will be enabled in the next phase.</p>
                <Link
                  to={`/instructor/pupils/${pupil.id}`}
                  className="block text-primary hover:underline text-sm font-medium"
                >
                  Open pupil profile →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity log placeholder (full-width). Live event sourcing comes in Phase 2. */}
      <Card>
        <CardHeader className="bg-transparent pb-3">
          <CardTitle className="text-base">Activity log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Activity logging will begin recording events from when Phase 2 is deployed.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 10, color: "#9CA3AF" }}>{label}</div>
    </div>
  );
}

function BigStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div
      style={{
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        padding: "10px 12px",
      }}
    >
      <div style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: accent || "inherit" }}>{value}</div>
    </div>
  );
}

function AttendanceIcon({ status }: { status: string | null }) {
  const s = (status || "").toLowerCase();
  if (s === "completed") return <CheckCircle2 className="h-4 w-4" style={{ color: "#059669" }} />;
  if (s === "cancelled" || s === "no_show") return <XCircle className="h-4 w-4" style={{ color: "#C0271F" }} />;
  return <Clock className="h-4 w-4" style={{ color: "#B45309" }} />;
}

