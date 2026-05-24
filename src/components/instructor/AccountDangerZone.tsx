import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CreditCard, Crown, ExternalLink, Download,
  Users, Calendar, PoundSterling, Route, Trash2, Loader2, Clock,
} from "lucide-react";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useInstructorMembership } from "@/hooks/useInstructorMembership";
import { format, parseISO } from "date-fns";

interface Props {
  instructorId: string;
}

interface PendingDeletion {
  id: string;
  scheduled_purge_at: string;
  cancel_token: string | null;
}

const REASONS = [
  "Switching software",
  "No longer instructing",
  "Too expensive",
  "Other",
];

const ROW_CAP = 1000;
const BILLING_PORTAL_URL =
  (import.meta.env.VITE_BILLING_PORTAL_URL as string | undefined) || null;

function csvEscape(v: unknown) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCSV(rows: Record<string, unknown>[], headers: string[]) {
  return [headers.join(","), ...rows.map(r => headers.map(h => csvEscape(r[h])).join(","))].join("\n");
}
function download(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function warnIfCapped(count: number) {
  if (count === ROW_CAP) {
    toast({
      title: "Export may be incomplete",
      description:
        "More than 1000 records exist. Contact support for a full export.",
    });
  }
}

export function AccountDangerZone({ instructorId }: Props) {
  const navigate = useNavigate();
  const { data: membership } = useInstructorMembership(instructorId);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingDeletion | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const planName = membership?.planName || "Free";
  const renewLabel = membership?.currentPeriodEnd
    ? `Active · renews ${format(parseISO(membership.currentPeriodEnd), "d MMM yyyy")}`
    : membership?.status === "active" ? "Active" : "No active subscription";

  const loadPending = useCallback(async () => {
    const { data } = await supabase
      .from("account_deletion_requests")
      .select("id, scheduled_purge_at, cancel_token")
      .eq("instructor_id", instructorId)
      .is("cancelled_at", null)
      .is("completed_at", null)
      .maybeSingle();
    setPending(data as PendingDeletion | null);
  }, [instructorId]);

  useEffect(() => { loadPending(); }, [loadPending]);

  // ---------- CSV exports ----------
  const runExport = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try { await fn(); }
    catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Could not export data";
      toast({ title: "Export failed", description: msg, variant: "destructive" });
    } finally { setBusy(null); }
  };

  const exportPupils = () => runExport("pupils", async () => {
    const { data, error } = await supabase.from("pupils").select("*").eq("instructor_id", instructorId).order("name");
    if (error) throw error;
    const headers = ["name", "email", "phone", "pickup_address", "test_date", "test_centre", "lessons_completed", "prepaid_hours", "outstanding_balance", "created_at"];
    const count = data?.length || 0;
    download(toCSV((data || []) as any, headers), `pupils-${new Date().toISOString().slice(0, 10)}.csv`);
    toast({ title: "Pupils exported", description: `${count} rows` });
    warnIfCapped(count);
  });

  const exportLessons = () => runExport("lessons", async () => {
    const { data, error } = await supabase.from("lesson_history").select("*, pupil:pupils(name)").eq("instructor_id", instructorId).order("lesson_date", { ascending: false });
    if (error) throw error;
    const rows = (data || []).map((l: any) => ({
      pupil_name: l.pupil?.name || "Unknown",
      lesson_date: l.lesson_date,
      start_time: l.start_time,
      duration_minutes: l.duration_minutes,
      skills_practiced: Array.isArray(l.skills_practiced) ? l.skills_practiced.join("; ") : "",
      notes: l.notes || "",
      rating: l.rating || "",
    }));
    download(toCSV(rows, ["pupil_name", "lesson_date", "start_time", "duration_minutes", "skills_practiced", "notes", "rating"]), `lessons-${new Date().toISOString().slice(0, 10)}.csv`);
    toast({ title: "Lessons exported", description: `${rows.length} rows` });
    warnIfCapped(rows.length);
  });

  const exportPayments = () => runExport("payments", async () => {
    const { data, error } = await supabase.from("payment_history").select("*, pupil:pupils(name)").eq("instructor_id", instructorId).order("created_at", { ascending: false });
    if (error) throw error;
    const rows = (data || []).map((p: any) => ({
      date: p.created_at,
      pupil_name: p.pupil?.name || "Unknown",
      amount: p.amount,
      payment_method: p.payment_method || "",
      status: p.status || "",
    }));
    download(toCSV(rows, ["date", "pupil_name", "amount", "payment_method", "status"]), `payments-${new Date().toISOString().slice(0, 10)}.csv`);
    toast({ title: "Payments exported", description: `${rows.length} rows` });
    warnIfCapped(rows.length);
  });

  const exportMileage = () => runExport("mileage", async () => {
    const { data, error } = await supabase.from("mileage_logs").select("*").eq("instructor_id", instructorId).order("trip_date", { ascending: false });
    if (error) throw error;
    const count = data?.length || 0;
    download(toCSV((data || []) as any, ["trip_date", "start_location", "end_location", "miles", "purpose", "notes"]), `mileage-${new Date().toISOString().slice(0, 10)}.csv`);
    toast({ title: "Mileage exported", description: `${count} rows` });
    warnIfCapped(count);
  });

  const exportRows = [
    { key: "pupils",   name: "Pupils list",   subtitle: "Names, contacts, progress",        Icon: Users,         iconBg: "#e8eefb", iconColor: "#2952b3", onClick: exportPupils },
    { key: "lessons",  name: "Lesson history", subtitle: "Past lessons with notes",          Icon: Calendar,      iconBg: "#e8f5ee", iconColor: "#2d8a4e", onClick: exportLessons },
    { key: "payments", name: "Payments",       subtitle: "Income and transaction history",   Icon: PoundSterling, iconBg: "#f0edfb", iconColor: "#6b4fc4", onClick: exportPayments },
    { key: "mileage",  name: "Mileage log",    subtitle: "HMRC-ready business mileage",      Icon: Route,         iconBg: "#fff3e0", iconColor: "#d97706", onClick: exportMileage },
  ];

  // ---------- Deletion flow ----------
  const handleRequestDeletion = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-account-deletion", {
        body: { reason: reason || null },
      });
      if (error) throw error;
      const scheduledPurgeAt = (data as any)?.scheduled_purge_at as string | undefined;
      if (!scheduledPurgeAt) throw new Error("Server did not return a scheduled date");
      toast({
        title: "Deletion requested",
        description: "You'll be signed out. Check your email to confirm.",
      });
      setConfirmOpen(false);
      // Re-load pending row (RLS allows instructor to read own row before signout takes effect)
      await loadPending();
      // Edge function performs a global sign-out — clear local session and bounce.
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/", { replace: true });
      }, 1500);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not request deletion";
      toast({ title: "Couldn't request deletion", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!pending?.cancel_token) {
      toast({
        title: "Cancellation unavailable",
        description: "Use the cancel link in the email we sent you, or contact support.",
        variant: "destructive",
      });
      return;
    }
    setCancelling(true);
    try {
      const { error } = await supabase.functions.invoke("cancel-account-deletion", {
        body: { token: pending.cancel_token },
      });
      if (error) throw error;
      toast({ title: "Deletion cancelled", description: "Your account is fully restored." });
      await loadPending();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not cancel deletion";
      toast({ title: "Couldn't cancel", description: msg, variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  // ---------- Styles ----------
  const card: React.CSSProperties = {
    background: "#fff", border: "1px solid #e0e3ea", borderRadius: 14, overflow: "hidden",
  };
  const sectionHeader = (Icon: any, label: string, color = "#2952b3") => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 14px 6px" }}>
      <Icon size={15} color={color} />
      <span style={{ fontSize: 12, fontWeight: 600, color: color === "#2952b3" ? "#1a1a1f" : color }}>{label}</span>
    </div>
  );
  const desc = (t: string) => (
    <p style={{ fontSize: 10, color: "#aaa", margin: 0, padding: "0 14px 10px" }}>{t}</p>
  );

  const scheduledDateLabel = pending
    ? format(parseISO(pending.scheduled_purge_at), "d MMM yyyy")
    : null;

  const manageHref = BILLING_PORTAL_URL || "/instructor/settings/plan-billing";
  const manageIsExternal = Boolean(BILLING_PORTAL_URL);

  return (
    <div style={{ fontFamily: "Poppins, sans-serif", background: "#F2F4F8" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{
          width: 36, height: 36, borderRadius: 10, background: "#e8eefb",
          display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <CreditCard size={18} color="#2952b3" />
        </span>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1f", margin: 0, lineHeight: 1.2 }}>Plan, data & danger zone</h2>
          <p style={{ fontSize: 11, color: "#aaa", margin: "2px 0 0" }}>Billing, data export and account deletion</p>
        </div>
      </div>

      {/* Card 1 — Plan & billing */}
      <div style={card}>
        {sectionHeader(CreditCard, "Plan & billing")}
        {desc("Manage your subscription, payment method and invoices")}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px 14px" }}>
          <span style={{
            width: 36, height: 36, borderRadius: 10, background: "#e8eefb",
            display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Crown size={18} color="#2952b3" />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1f", lineHeight: 1.2 }}>{planName}</div>
            <div style={{ fontSize: 10, color: "#aaa", marginTop: 1 }}>{renewLabel}</div>
          </div>
          {manageIsExternal ? (
            <a
              href={manageHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "#1a1a1f", color: "#fff",
                fontSize: 11, fontWeight: 600,
                padding: "8px 12px", borderRadius: 9, textDecoration: "none", flexShrink: 0,
              }}
            >
              Manage
              <ExternalLink size={12} />
            </a>
          ) : (
            <Link
              to={manageHref}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "#1a1a1f", color: "#fff",
                fontSize: 11, fontWeight: 600,
                padding: "8px 12px", borderRadius: 9, textDecoration: "none", flexShrink: 0,
              }}
            >
              Manage
              <ExternalLink size={12} />
            </Link>
          )}
        </div>
      </div>

      {/* Card 2 — Export your data */}
      <div style={{ ...card, marginTop: 12 }}>
        {sectionHeader(Download, "Export your data")}
        {desc("Download your data as CSV files")}
        {exportRows.map((row, i) => (
          <div
            key={row.key}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              padding: "11px 14px",
              borderTop: i === 0 ? "none" : "1px solid #f0f1f4",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <span style={{
                width: 30, height: 30, borderRadius: 8, background: row.iconBg,
                display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <row.Icon size={15} color={row.iconColor} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1f", lineHeight: 1.2 }}>{row.name}</div>
                <div style={{ fontSize: 10, color: "#aaa", marginTop: 1 }}>{row.subtitle}</div>
              </div>
            </div>
            <button
              onClick={row.onClick}
              disabled={busy === row.key}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "#F2F4F8", border: "1px solid #e0e3ea",
                borderRadius: 8, padding: "6px 10px",
                fontFamily: "inherit", cursor: busy === row.key ? "wait" : "pointer",
                opacity: busy === row.key ? 0.6 : 1, flexShrink: 0,
              }}
            >
              {busy === row.key
                ? <Loader2 size={12} color="#2952b3" className="animate-spin" />
                : <Download size={12} color="#2952b3" />}
              <span style={{ fontSize: 10, fontWeight: 600, color: "#1a1a1f" }}>CSV</span>
            </button>
          </div>
        ))}
      </div>

      {/* Card 3 — Delete account */}
      <div style={{ ...card, marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px 6px" }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8, background: "#fbe8e8",
            display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Trash2 size={14} color="#c9302c" />
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#c9302c" }}>Delete account</span>
        </div>

        {pending ? (
          <>
            <div style={{
              margin: "0 14px 12px",
              padding: "11px 13px",
              background: "#fff8e8",
              border: "0.5px solid #f59e0b",
              borderRadius: 10,
              display: "flex", alignItems: "flex-start", gap: 8,
            }}>
              <Clock size={14} color="#f59e0b" style={{ marginTop: 1, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#854f0b", lineHeight: 1.2 }}>
                  Deletion requested
                </div>
                <div style={{ fontSize: 10, color: "#b87a2a", marginTop: 2 }}>
                  Your account will be deleted on {scheduledDateLabel}
                </div>
              </div>
            </div>
            <div style={{ padding: "0 14px 14px" }}>
              <button
                onClick={handleCancelDeletion}
                disabled={cancelling}
                style={{
                  width: "100%",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: "#fff", color: "#1a1a1f",
                  border: "1px solid #e0e3ea", borderRadius: 9,
                  padding: "10px 12px",
                  fontFamily: "inherit", fontSize: 12, fontWeight: 600,
                  cursor: cancelling ? "wait" : "pointer",
                  opacity: cancelling ? 0.6 : 1,
                }}
              >
                {cancelling && <Loader2 size={13} className="animate-spin" />}
                {cancelling ? "Cancelling…" : "Cancel deletion"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 10, color: "#aaa", margin: 0, padding: "0 14px 8px" }}>
              Permanently delete your account after a 30-day grace period
            </p>
            <div style={{ padding: "0 14px 14px" }}>
              <button
                onClick={() => { setReason(""); setConfirmOpen(true); }}
                style={{
                  width: "100%",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: "#fbe8e8", color: "#c9302c",
                  border: "1px solid #f5c5c5", borderRadius: 9,
                  padding: "10px 12px",
                  fontFamily: "inherit", fontSize: 12, fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Trash2 size={13} />
                Request deletion
              </button>
            </div>
          </>
        )}
      </div>

      {/* Confirmation drawer */}
      <Drawer open={confirmOpen} onOpenChange={(o) => !submitting && setConfirmOpen(o)}>
        <DrawerContent style={{ fontFamily: "Poppins, sans-serif" }}>
          <DrawerHeader>
            <DrawerTitle style={{ color: "#1a1a1f" }}>Delete your account</DrawerTitle>
            <DrawerDescription style={{ color: "#666", fontSize: 13 }}>
              Your account will be permanently deleted after a 30-day grace period. You can cancel any time before then.
            </DrawerDescription>
          </DrawerHeader>
          <div style={{ padding: "0 16px 8px" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#1a1a1f", marginBottom: 6 }}>
              Reason (optional)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
              style={{
                width: "100%", padding: "10px 12px",
                background: "#F2F4F8", border: "1px solid #e0e3ea",
                borderRadius: 9, fontFamily: "inherit", fontSize: 13, color: "#1a1a1f",
              }}
            >
              <option value="">Select a reason…</option>
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, padding: "12px 16px 20px" }}>
            <button
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
              style={{
                flex: 1, padding: "11px 12px",
                background: "#fff", color: "#1a1a1f",
                border: "1px solid #e0e3ea", borderRadius: 9,
                fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                cursor: submitting ? "wait" : "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleRequestDeletion}
              disabled={submitting}
              style={{
                flex: 1, padding: "11px 12px",
                background: "#c9302c", color: "#fff",
                border: "1px solid #c9302c", borderRadius: 9,
                fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                cursor: submitting ? "wait" : "pointer",
                opacity: submitting ? 0.7 : 1,
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              {submitting ? "Requesting…" : "Request deletion"}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
