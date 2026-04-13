import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { demoSchoolLessons } from "@/data/demoSchoolData";

interface Props { instructorIds: string[]; }
type StatusFilter = "all" | "scheduled" | "completed" | "cancelled";

export default function SchoolBookingsSection({ instructorIds }: Props) {
  const { isDemo } = useSchoolDemo();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    if (isDemo) { setLessons(demoSchoolLessons); setLoading(false); return; }
    if (instructorIds.length === 0) { setLoading(false); return; }
    fetchLessons();
  }, [instructorIds, isDemo]);

  const fetchLessons = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("scheduled_lessons").select("*, pupils(name), instructors(name)")
      .in("instructor_id", instructorIds).order("start_time", { ascending: false }).limit(100);
    setLessons(data || []);
    setLoading(false);
  };

  const filtered = filter === "all" ? lessons : lessons.filter(l => l.status === filter);
  const statusColor = (s: string) => s === "completed" ? "bg-emerald-100 text-emerald-700" : s === "cancelled" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700";

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Bookings</h2>
        <p className="text-muted-foreground">All lessons across your school</p>
      </div>
      <div className="flex gap-2">
        {(["all", "scheduled", "completed", "cancelled"] as StatusFilter[]).map(s => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)} className="capitalize">{s}</Button>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead><TableHead>Student</TableHead><TableHead>Instructor</TableHead><TableHead>Duration</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No bookings found</TableCell></TableRow>
              ) : filtered.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="text-sm">{new Date(l.start_time).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                  <TableCell className="text-sm font-medium">{l.pupils?.name || "—"}</TableCell>
                  <TableCell className="text-sm">{l.instructors?.name || "—"}</TableCell>
                  <TableCell className="text-sm">{l.duration_minutes || 60}min</TableCell>
                  <TableCell className="text-sm">£{l.amount_due || 0}</TableCell>
                  <TableCell><Badge className={`text-xs ${statusColor(l.status)}`}>{l.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
