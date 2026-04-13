import { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { demoSchoolStats } from "@/data/demoSchoolData";

interface Props { instructorIds: string[]; schoolName: string; }

export default function SchoolReportsSection({ instructorIds, schoolName }: Props) {
  const { isDemo } = useSchoolDemo();
  const [stats, setStats] = useState({ lessons: 0, earnings: 0, pupils: 0, passed: 0, tests: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setStats({ lessons: demoSchoolStats.totalLessons, earnings: demoSchoolStats.totalEarnings, pupils: demoSchoolStats.totalPupils, passed: 3, tests: 5 });
      setLoading(false);
      return;
    }
    if (instructorIds.length === 0) { setLoading(false); return; }
    fetchStats();
  }, [instructorIds, isDemo]);

  const fetchStats = async () => {
    setLoading(true);
    const [lessonsRes, pupilsRes, testsRes] = await Promise.all([
      supabase.from("scheduled_lessons").select("amount_due, status").in("instructor_id", instructorIds),
      supabase.from("pupils").select("id").in("instructor_id", instructorIds).is("deleted_at", null),
      supabase.from("driving_test_results").select("result").in("instructor_id", instructorIds),
    ]);
    const completed = (lessonsRes.data || []).filter(l => l.status === "completed");
    const passed = (testsRes.data || []).filter(t => t.result === "pass").length;
    setStats({ lessons: completed.length, earnings: completed.reduce((s, l) => s + (l.amount_due || 0), 0), pupils: (pupilsRes.data || []).length, passed, tests: (testsRes.data || []).length });
    setLoading(false);
  };

  const exportCSV = () => {
    const rows = [["Metric", "Value"], ["Total Lessons", stats.lessons.toString()], ["Total Earnings", `£${stats.earnings}`], ["Total Pupils", stats.pupils.toString()], ["Tests Taken", stats.tests.toString()], ["Tests Passed", stats.passed.toString()], ["Pass Rate", stats.tests > 0 ? `${Math.round((stats.passed / stats.tests) * 100)}%` : "N/A"]];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${schoolName}-report.csv`; a.click();
    toast.success("Report downloaded");
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-muted-foreground">School performance summary</p>
        </div>
        <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1"><Download className="h-3.5 w-3.5" /> Export CSV</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: "Total Lessons", value: stats.lessons },
          { label: "Total Earnings", value: `£${stats.earnings.toLocaleString()}` },
          { label: "Total Pupils", value: stats.pupils },
          { label: "Tests Taken", value: stats.tests },
          { label: "Tests Passed", value: stats.passed },
          { label: "Pass Rate", value: stats.tests > 0 ? `${Math.round((stats.passed / stats.tests) * 100)}%` : "N/A" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
