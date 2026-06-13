import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, CheckCircle2, AlertTriangle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { t } from "./tokens";

interface Props {
  instructorId: string;
}

interface Counts {
  created: number;
  sent: number;
  paid: number;
  failed: number;
  total: number;
}

const PAID_STATUSES = ["paid"];
const FAILED_STATUSES = ["failed", "overdue", "cancelled", "canceled", "refunded"];
const SENT_STATUSES = ["sent", "unpaid", "scheduled", "viewed", "partially_paid", "payment_pending"];
const CREATED_STATUSES = ["draft"];

export function InvoiceStatusStrip({ instructorId }: Props) {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data, error } = await supabase
        .from("ryft_invoices")
        .select("status")
        .eq("issuer_instructor_id", instructorId)
        .gte("created_at", since.toISOString())
        .limit(1000);
      if (cancelled) return;
      if (error || !data) {
        setCounts({ created: 0, sent: 0, paid: 0, failed: 0, total: 0 });
        return;
      }
      const c: Counts = { created: 0, sent: 0, paid: 0, failed: 0, total: data.length };
      for (const row of data) {
        const s = (row.status || "").toLowerCase();
        if (PAID_STATUSES.includes(s)) c.paid++;
        else if (FAILED_STATUSES.includes(s)) c.failed++;
        else if (SENT_STATUSES.includes(s)) c.sent++;
        else if (CREATED_STATUSES.includes(s)) c.created++;
      }
      setCounts(c);
    })();

    const channel = supabase
      .channel(`invoice-status-${instructorId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ryft_invoices", filter: `issuer_instructor_id=eq.${instructorId}` },
        () => {
          // simple re-fetch
          supabase
            .from("ryft_invoices")
            .select("status")
            .eq("issuer_instructor_id", instructorId)
            .gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString())
            .limit(1000)
            .then(({ data }) => {
              if (!data || cancelled) return;
              const c: Counts = { created: 0, sent: 0, paid: 0, failed: 0, total: data.length };
              for (const row of data) {
                const s = (row.status || "").toLowerCase();
                if (PAID_STATUSES.includes(s)) c.paid++;
                else if (FAILED_STATUSES.includes(s)) c.failed++;
                else if (SENT_STATUSES.includes(s)) c.sent++;
                else if (CREATED_STATUSES.includes(s)) c.created++;
              }
              setCounts(c);
            });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [instructorId]);

  const chip = (label: string, value: number | string, Icon: any, bg: string, fg: string) => (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: 8,
        backgroundColor: t.white,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        padding: "8px 10px",
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          backgroundColor: bg,
          color: fg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={14} strokeWidth={1.9} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span style={{ fontSize: 10, color: t.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>
          {label}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: t.navy, lineHeight: 1.1 }}>{value}</span>
      </div>
    </div>
  );

  const v = (n: number | undefined) => (counts ? String(n ?? 0) : "—");

  return (
    <Link to="/instructor/invoices" style={{ textDecoration: "none" }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.navy }}>Invoice status · last 30 days</div>
          <div style={{ fontSize: 11, color: t.muted }}>
            {counts ? `${counts.total} total` : "Loading…"}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {chip("Created", v(counts?.created), FileText, "#F3F4F6", "#374151")}
          {chip("Sent", v(counts?.sent), Send, "#E0E7FF", "#3730A3")}
          {chip("Paid", v(counts?.paid), CheckCircle2, "#D1FAE5", "#065F46")}
          {chip("Failed", v(counts?.failed), AlertTriangle, "#FEE2E2", "#991B1B")}
        </div>
      </div>
    </Link>
  );
}
