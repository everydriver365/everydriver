import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ActionDrawer, DrawerEmpty, DrawerError, DrawerLoading, DrawerRow } from "../ActionDrawer";

type Payment = { id: string; amount: number | null; created_at: string };

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });

const money = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

export function PaymentsDrawer({ instructorId, instructorName, onClose }: { instructorId: string; instructorName: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Payment[]>([]);

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase
        .from("payment_history")
        .select("id,amount,created_at")
        .eq("instructor_id", instructorId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (err) { setError(err.message); setLoading(false); return; }
      setRows((data ?? []) as Payment[]);
      setLoading(false);
    })();
  }, [instructorId]);

  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  return (
    <ActionDrawer title="Payments" subtitle={instructorName} onClose={onClose}>
      {loading && <DrawerLoading />}
      {error && <DrawerError message={error} />}
      {!loading && !error && (
        <>
          <div style={{
            padding: "10px 12px", background: "#F8FAFC", borderRadius: 8,
            marginBottom: 12, display: "flex", justifyContent: "space-between", fontSize: 12,
          }}>
            <span style={{ color: "#6B7280" }}>Transactions</span>
            <strong>{rows.length}</strong>
            <span style={{ color: "#6B7280" }}>Total</span>
            <strong>{money(total)}</strong>
          </div>
          {rows.length === 0 && <DrawerEmpty>No payments recorded.</DrawerEmpty>}
          {rows.map((p) => (
            <DrawerRow
              key={p.id}
              left={<strong>{money(Number(p.amount) || 0)}</strong>}
              sub={fmt(p.created_at)}
            />
          ))}
        </>
      )}
    </ActionDrawer>
  );
}
