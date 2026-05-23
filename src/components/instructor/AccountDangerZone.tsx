import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Settings2, CreditCard, Crown, ExternalLink, Download,
  Users, Calendar, PoundSterling, Route, AlertTriangle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useInstructorMembership } from "@/hooks/useInstructorMembership";
import { format, parseISO } from "date-fns";

interface Props {
  instructorId: string;
}

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

export function AccountDangerZone({ instructorId }: Props) {
  const { data: membership } = useInstructorMembership(instructorId);
  const [busy, setBusy] = useState<string | null>(null);

  const planName = membership?.planName || "Free";
  const renewLabel = membership?.currentPeriodEnd
    ? `Active · renews ${format(parseISO(membership.currentPeriodEnd), "d MMM yyyy")}`
    : membership?.status === "active" ? "Active" : "No active subscription";

  const runExport = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try { await fn(); }
    catch (e) {
      console.error(e);
      toast({ title: "Export failed", description: "Could not export data", variant: "destructive" });
    } finally { setBusy(null); }
  };

  const exportPupils = () => runExport("pupils", async () => {
    const { data, error } = await supabase.from("pupils").select("*").eq("instructor_id", instructorId).order("name");
    if (error) throw error;
    const headers = ["name", "email", "phone", "pickup_address", "test_date", "test_centre", "lessons_completed", "prepaid_hours", "outstanding_balance", "created_at"];
    download(toCSV((data || []) as any, headers), `pupils-${new Date().toISOString().slice(0, 10)}.csv`);
    toast({ title: "Pupils exported", description: `${data?.length || 0} rows` });
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
  });

  const exportMileage = () => runExport("mileage", async () => {
    const { data, error } = await supabase.from("mileage_logs").select("*").eq("instructor_id", instructorId).order("trip_date", { ascending: false });
    if (error) throw error;
    download(toCSV((data || []) as any, ["trip_date", "start_location", "end_location", "miles", "purpose", "notes"]), `mileage-${new Date().toISOString().slice(0, 10)}.csv`);
    toast({ title: "Mileage exported", description: `${data?.length || 0} rows` });
  });

  const exportRows = [
    { key: "pupils",   name: "Pupils list",   subtitle: "Names, contacts, progress",        Icon: Users,         iconBg: "#e8eefb", iconColor: "#2952b3", onClick: exportPupils },
    { key: "lessons",  name: "Lesson history", subtitle: "Past lessons with notes",          Icon: Calendar,      iconBg: "#e8f5ee", iconColor: "#2d8a4e", onClick: exportLessons },
    { key: "payments", name: "Payments",       subtitle: "Income and transaction history",   Icon: PoundSterling, iconBg: "#f0edfb", iconColor: "#6b4fc4", onClick: exportPayments },
    { key: "mileage",  name: "Mileage log",    subtitle: "HMRC-ready business mileage",      Icon: Route,         iconBg: "#fff3e0", iconColor: "#d97706", onClick: exportMileage },
  ];

  const card: React.CSSProperties = {
    background: "#fff", border: "1px solid #e0e3ea", borderRadius: 14, overflow: "hidden",
  };
  const sectionHeader = (Icon: any, label: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 14px 6px" }}>
      <Icon size={15} color="#2952b3" />
      <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1f" }}>{label}</span>
    </div>
  );
  const desc = (t: string) => (
    <p style={{ fontSize: 10, color: "#aaa", margin: 0, padding: "0 14px 10px" }}>{t}</p>
  );

  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{
          width: 36, height: 36, borderRadius: 10, background: "#e8eefb",
          display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Settings2 size={18} color="#2952b3" />
        </span>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1f", margin: 0, lineHeight: 1.2 }}>Plan, data & danger zone</h2>
          <p style={{ fontSize: 11, color: "#aaa", margin: "2px 0 0" }}>Billing, data export and account deletion</p>
        </div>
      </div>

      {/* Card 1 — Plan & billing */}
      <div style={card}>
        {sectionHeader(CreditCard, "Plan & billing")}
        {desc("Manage your subscription, payment method, invoices and add-ons")}
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
          <Link
            to="/instructor/billing"
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
        </div>
      </div>

      {/* Card 2 — Export your data */}
      <div style={{ ...card, marginTop: 12 }}>
        {sectionHeader(Download, "Export your data")}
        {desc("Download your data as CSV or PDF files")}
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

      {/* Delete account — preserved, lightly restyled */}
      <div style={{ ...card, marginTop: 12, padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <AlertTriangle size={15} color="#c9302c" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1f" }}>Delete account</span>
        </div>
        <p style={{ fontSize: 10, color: "#aaa", margin: "0 0 10px" }}>
          To permanently close your account and erase your data, contact support. We'll confirm
          your identity and process the request within 7 days, in line with GDPR.
        </p>
        <Button asChild variant="outline" size="sm">
          <a href="mailto:support@drive365.co.uk?subject=Delete%20my%20account">Email support</a>
        </Button>
      </div>
    </div>
  );
}
