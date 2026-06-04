import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ActionDrawer, DrawerEmpty, DrawerError, DrawerLoading, DrawerRow } from "../ActionDrawer";

type Review = { id: string; rating: number | null; created_at: string };

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export function ReviewsDrawer({ instructorId, instructorName, onClose }: { instructorId: string; instructorName: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Review[]>([]);

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase
        .from("course_reviews")
        .select("id,rating,created_at")
        .eq("instructor_id", instructorId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (err) { setError(err.message); setLoading(false); return; }
      setRows((data ?? []) as Review[]);
      setLoading(false);
    })();
  }, [instructorId]);

  const avg = rows.length
    ? (rows.reduce((s, r) => s + (Number(r.rating) || 0), 0) / rows.length).toFixed(2)
    : null;

  return (
    <ActionDrawer title="Reviews" subtitle={instructorName} onClose={onClose}>
      {loading && <DrawerLoading />}
      {error && <DrawerError message={error} />}
      {!loading && !error && (
        <>
          <div style={{
            padding: "10px 12px", background: "#F8FAFC", borderRadius: 8,
            marginBottom: 12, display: "flex", justifyContent: "space-between", fontSize: 12,
          }}>
            <span style={{ color: "#6B7280" }}>Total reviews</span>
            <strong>{rows.length}</strong>
            <span style={{ color: "#6B7280" }}>Avg rating</span>
            <strong>{avg ?? "—"}</strong>
          </div>
          {rows.length === 0 && <DrawerEmpty>No reviews yet.</DrawerEmpty>}
          {rows.map((r) => (
            <DrawerRow
              key={r.id}
              left={<strong>{r.rating != null ? `${"★".repeat(Math.round(r.rating))}${"☆".repeat(Math.max(0, 5 - Math.round(r.rating)))}` : "—"}</strong>}
              sub={fmtDate(r.created_at)}
              right={r.rating != null ? <span>{Number(r.rating).toFixed(1)}</span> : null}
            />
          ))}
        </>
      )}
    </ActionDrawer>
  );
}
