import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, PoundSterling, Calendar, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth } from "date-fns";

interface PlatformFeeRow {
  id: string;
  pupil_id: string | null;
  instructor_id: string | null;
  amount: number;
  currency: string;
  source: string;
  notes: string | null;
  created_at: string;
}

interface InstructorLite { id: string; name: string | null }
interface PupilLite { id: string; name: string | null }

export default function PlatformFees() {
  const [rows, setRows] = useState<PlatformFeeRow[]>([]);
  const [instructors, setInstructors] = useState<Record<string, string>>({});
  const [pupils, setPupils] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("platform_fees")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) {
        console.error("platform_fees query error", error);
        setLoading(false);
        return;
      }
      const list = (data || []) as PlatformFeeRow[];
      setRows(list);

      const instructorIds = Array.from(new Set(list.map((r) => r.instructor_id).filter(Boolean) as string[]));
      const pupilIds = Array.from(new Set(list.map((r) => r.pupil_id).filter(Boolean) as string[]));

      if (instructorIds.length) {
        const { data: insData } = await supabase
          .from("instructors")
          .select("id,name")
          .in("id", instructorIds);
        const map: Record<string, string> = {};
        ((insData as InstructorLite[]) || []).forEach((i) => { map[i.id] = i.name || "—"; });
        setInstructors(map);
      }
      if (pupilIds.length) {
        const { data: pupData } = await supabase
          .from("pupils")
          .select("id,name")
          .in("id", pupilIds);
        const map: Record<string, string> = {};
        ((pupData as PupilLite[]) || []).forEach((p) => { map[p.id] = p.name || "—"; });
        setPupils(map);
      }
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
    const monthStart = startOfMonth(new Date()).getTime();
    const thisMonth = rows
      .filter((r) => new Date(r.created_at).getTime() >= monthStart)
      .reduce((s, r) => s + Number(r.amount || 0), 0);
    return { total, thisMonth, count: rows.length };
  }, [rows]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-1" /> Admin</Link>
          </Button>
          <h1 className="text-2xl font-bold">Platform Fees</h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><PoundSterling className="h-4 w-4" /> Total collected</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">£{stats.total.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> This month</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">£{stats.thisMonth.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-4 w-4" /> Bookings charged</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{stats.count}</div></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent platform fees</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No platform fees recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase border-b">
                    <tr>
                      <th className="text-left py-2 pr-4">Date</th>
                      <th className="text-left py-2 pr-4">Instructor</th>
                      <th className="text-left py-2 pr-4">Pupil</th>
                      <th className="text-left py-2 pr-4">Source</th>
                      <th className="text-left py-2 pr-4">Notes</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{format(new Date(r.created_at), "dd MMM yyyy HH:mm")}</td>
                        <td className="py-2 pr-4">{r.instructor_id ? (instructors[r.instructor_id] || "—") : "—"}</td>
                        <td className="py-2 pr-4">{r.pupil_id ? (pupils[r.pupil_id] || "—") : "—"}</td>
                        <td className="py-2 pr-4">{r.source}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{r.notes || "—"}</td>
                        <td className="py-2 text-right font-medium">£{Number(r.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
