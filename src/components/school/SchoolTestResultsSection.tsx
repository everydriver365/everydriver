import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { demoSchoolTestResults } from "@/data/demoSchoolData";

interface Props { instructorIds: string[]; }

export default function SchoolTestResultsSection({ instructorIds }: Props) {
  const { isDemo } = useSchoolDemo();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) { setResults(demoSchoolTestResults); setLoading(false); return; }
    if (instructorIds.length === 0) { setLoading(false); return; }
    fetchResults();
  }, [instructorIds, isDemo]);

  const fetchResults = async () => {
    setLoading(true);
    const { data } = await supabase.from("driving_test_results").select("*, pupils(name), instructors(name)").in("instructor_id", instructorIds).order("test_date", { ascending: false }).limit(100);
    setResults(data || []);
    setLoading(false);
  };

  const passed = results.filter(r => r.result === "pass").length;
  const rate = results.length > 0 ? Math.round((passed / results.length) * 100) : 0;

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Test Results</h2>
          <p className="text-muted-foreground">Driving test outcomes across your school</p>
        </div>
        <div className="flex gap-3 text-center">
          <div><p className="text-2xl font-bold text-emerald-600">{passed}</p><p className="text-xs text-muted-foreground">Passed</p></div>
          <div><p className="text-2xl font-bold text-destructive">{results.length - passed}</p><p className="text-xs text-muted-foreground">Failed</p></div>
          <div><p className="text-2xl font-bold">{rate}%</p><p className="text-xs text-muted-foreground">Pass Rate</p></div>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Date</TableHead><TableHead>Student</TableHead><TableHead>Instructor</TableHead><TableHead>Result</TableHead><TableHead>Faults</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No test results yet</TableCell></TableRow>
              ) : results.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{new Date(r.test_date).toLocaleDateString("en-GB")}</TableCell>
                  <TableCell className="text-sm font-medium">{r.pupils?.name || "—"}</TableCell>
                  <TableCell className="text-sm">{r.instructors?.name || "—"}</TableCell>
                  <TableCell>
                    {r.result === "pass" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs gap-1"><CheckCircle className="h-3 w-3" /> Pass</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 text-xs gap-1"><XCircle className="h-3 w-3" /> Fail</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{r.minor_faults ?? "—"} minor{r.serious_faults ? `, ${r.serious_faults} serious` : ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
