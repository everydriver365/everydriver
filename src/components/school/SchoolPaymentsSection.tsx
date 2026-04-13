import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolDemo } from "@/context/SchoolDemoContext";
import { demoSchoolPayments } from "@/data/demoSchoolData";

interface Props { instructorIds: string[]; }

export default function SchoolPaymentsSection({ instructorIds }: Props) {
  const { isDemo } = useSchoolDemo();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) { setPayments(demoSchoolPayments); setLoading(false); return; }
    if (instructorIds.length === 0) { setLoading(false); return; }
    fetchPayments();
  }, [instructorIds, isDemo]);

  const fetchPayments = async () => {
    setLoading(true);
    const { data } = await supabase.from("payment_history").select("*, pupils(name), instructors(name)").in("instructor_id", instructorIds).order("created_at", { ascending: false }).limit(100);
    setPayments(data || []);
    setLoading(false);
  };

  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payments</h2>
          <p className="text-muted-foreground">Payment history across all instructors</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-emerald-600">£{total.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total received</p>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Date</TableHead><TableHead>Student</TableHead><TableHead>Instructor</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No payments found</TableCell></TableRow>
              ) : payments.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm">{new Date(p.created_at).toLocaleDateString("en-GB")}</TableCell>
                  <TableCell className="text-sm">{p.pupils?.name || "—"}</TableCell>
                  <TableCell className="text-sm">{p.instructors?.name || "—"}</TableCell>
                  <TableCell className="text-sm font-medium">£{p.amount}</TableCell>
                  <TableCell className="text-sm">{p.payment_method || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
