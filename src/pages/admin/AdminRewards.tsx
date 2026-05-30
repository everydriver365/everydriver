import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { BADGE_DEFINITIONS, TIER_THRESHOLDS, type Tier } from "@/constants/rewardsConfig";

interface LeaderRow {
  instructor_id: string;
  total_points: number;
  tier: Tier;
  instructor_name: string | null;
}

export default function AdminRewards() {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [adjustTarget, setAdjustTarget] = useState<LeaderRow | null>(null);
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const seasonYear = new Date().getUTCFullYear();

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("instructor_points")
      .select(
        "instructor_id, total_points, tier, instructors!inner(name, is_network_placeholder)",
      )
      .eq("season_year", seasonYear)
      .eq("instructors.is_network_placeholder", false)
      .order("total_points", { ascending: false })
      .limit(200);
    setRows(
      ((data as any[]) ?? []).map((r) => ({
        instructor_id: r.instructor_id,
        total_points: r.total_points,
        tier: r.tier,
        instructor_name: r.instructors?.name ?? null,
      })),
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function submitAdjustment() {
    if (!adjustTarget) return;
    const pts = parseInt(adjustPoints, 10);
    if (!Number.isFinite(pts) || pts === 0) {
      toast.error("Enter a non-zero integer");
      return;
    }
    if (!adjustReason.trim()) {
      toast.error("Reason required");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.functions.invoke("award-instructor-points", {
      body: {
        instructor_id: adjustTarget.instructor_id,
        points: pts,
        reason: adjustReason.trim(),
        category: "manual",
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to apply adjustment");
      return;
    }
    toast.success(`Adjusted ${pts > 0 ? "+" : ""}${pts} pts`);
    setAdjustTarget(null);
    setAdjustPoints("");
    setAdjustReason("");
    load();
  }

  const filtered = filter
    ? rows.filter((r) =>
        (r.instructor_name ?? "").toLowerCase().includes(filter.toLowerCase()),
      )
    : rows;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">DSM Pro Rewards — Admin</h1>
        <p className="text-sm text-slate-500 mb-6">
          Season {seasonYear} · {rows.length} ranked instructors
        </p>

        <div className="mb-4 flex gap-3">
          <Input
            placeholder="Search instructor name…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={load} variant="outline">
            Refresh
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="text-left px-4 py-2 w-12">#</th>
                <th className="text-left px-4 py-2">Instructor</th>
                <th className="text-left px-4 py-2">Tier</th>
                <th className="text-right px-4 py-2">Points</th>
                <th className="text-right px-4 py-2 w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No instructors found.</td></tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={r.instructor_id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-500 tabular-nums">{i + 1}</td>
                    <td className="px-4 py-2 font-medium">{r.instructor_name ?? r.instructor_id.slice(0, 8)}</td>
                    <td className="px-4 py-2">
                      {r.tier !== "suspended"
                        ? `${TIER_THRESHOLDS[r.tier as Exclude<Tier, "suspended">]?.emoji} ${r.tier}`
                        : "⏸️ suspended"}
                    </td>
                    <td className="px-4 py-2 text-right font-bold tabular-nums">
                      {r.total_points.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => setAdjustTarget(r)}>
                        Adjust
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-xs text-slate-500">
          Badge catalogue: {BADGE_DEFINITIONS.map((b) => `${b.emoji} ${b.label}`).join(" · ")}
        </div>
      </div>

      <Dialog open={!!adjustTarget} onOpenChange={(o) => !o && setAdjustTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manual point adjustment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-slate-500">Instructor: </span>
              <span className="font-semibold">{adjustTarget?.instructor_name}</span>
            </div>
            <Input
              type="number"
              placeholder="Points (e.g. 50 or -25)"
              value={adjustPoints}
              onChange={(e) => setAdjustPoints(e.target.value)}
            />
            <Textarea
              placeholder="Reason (audit trail)"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdjustTarget(null)}>Cancel</Button>
            <Button onClick={submitAdjustment} disabled={submitting}>
              {submitting ? "Applying…" : "Apply adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
