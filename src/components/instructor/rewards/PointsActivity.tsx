import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const CATEGORY_ICON: Record<string, string> = {
  course: "✅",
  lesson: "📚",
  review: "⭐",
  complaint: "⚠️",
  compliance: "🏅",
  loyalty: "💎",
  referral: "🤝",
  manual: "✍️",
};

interface Tx {
  id: string;
  points: number;
  reason: string;
  category: string;
  status: string;
  created_at: string;
}

function relative(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  instructorId: string;
  className?: string;
}

export function PointsActivity({ instructorId, className }: Props) {
  const [rows, setRows] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const seasonYear = new Date().getUTCFullYear();
      const { data } = await supabase
        .from("instructor_point_transactions")
        .select("id, points, reason, category, status, created_at")
        .eq("instructor_id", instructorId)
        .eq("season_year", seasonYear)
        .order("created_at", { ascending: false })
        .limit(10);
      if (cancelled) return;
      setRows((data as Tx[]) ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [instructorId]);

  return (
    <div className={cn("rounded-2xl bg-white border border-slate-200 p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Points activity</h3>
        <Link to="/rewards" className="text-xs text-slate-500 hover:text-slate-700">See all →</Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500">
          No activity yet — earn points by delivering lessons and courses.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((tx) => {
            const positive = tx.points > 0;
            const pending = tx.status === "pending";
            return (
              <li key={tx.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base">{CATEGORY_ICON[tx.category] ?? "•"}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-900 truncate">{tx.reason}</div>
                    <div className="text-[10px] text-slate-500">
                      {relative(tx.created_at)}
                      {pending && <span className="ml-2 text-amber-600 font-semibold">Under review</span>}
                    </div>
                  </div>
                </div>
                <div className={cn(
                  "text-xs font-bold tabular-nums",
                  pending ? "text-amber-600" : positive ? "text-emerald-600" : "text-red-600",
                )}>
                  {positive ? "+" : ""}{tx.points}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
