import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { demoSchoolPayroll } from "@/data/demoSchoolData";

interface Props { instructorIds: string[]; schoolId: string; }

export default function SchoolPayrollSection({ instructorIds, schoolId }: Props) {
  const { isDemo } = useSchoolDemo();
  const [payroll, setPayroll] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) { setPayroll(demoSchoolPayroll); setLoading(false); return; }
    if (instructorIds.length === 0) { setLoading(false); return; }
    fetchPayroll();
  }, [instructorIds, isDemo]);

  const fetchPayroll = async () => {
    setLoading(true);
    const { data: members } = await supabase.from("school_instructors").select("instructor_id, instructors(name, lesson_rate)").eq("school_id", schoolId) as any;
    const results = await Promise.all((members || []).map(async (m: any) => {
      const { data: lessons } = await supabase.from("scheduled_lessons").select("amount_due").eq("instructor_id", m.instructor_id).eq("status", "completed");
      const totalEarned = (lessons || []).reduce((s: number, l: any) => s + (l.amount_due || 0), 0);
      return { name: m.instructors?.name || "Instructor", rate: m.instructors?.lesson_rate || 0, lessonCount: (lessons || []).length, totalEarned };
    }));
    setPayroll(results);
    setLoading(false);
  };

  const grandTotal = payroll.reduce((s, p) => s + p.totalEarned, 0);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payroll</h2>
          <p className="text-muted-foreground">Instructor earnings breakdown</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-emerald-600">£{grandTotal.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total school earnings</p>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Instructor</TableHead><TableHead>Rate</TableHead><TableHead>Lessons</TableHead><TableHead>Total Earned</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {payroll.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No data</TableCell></TableRow>
              ) : payroll.map((p, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>£{p.rate}/hr</TableCell>
                  <TableCell>{p.lessonCount}</TableCell>
                  <TableCell className="font-medium">£{p.totalEarned.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
