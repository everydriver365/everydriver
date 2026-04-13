import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertTriangle, XCircle, Gift, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Props {
  schoolId: string;
}

interface FeeRecord {
  id: string;
  instructor_id: string;
  period_start: string;
  period_end: string;
  amount: number;
  status: string;
  payment_method: string | null;
  paid_at: string | null;
  notes: string | null;
  instructors?: { name: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  paid: { label: "Paid", variant: "default", icon: CheckCircle },
  late: { label: "Late", variant: "destructive", icon: AlertTriangle },
  not_paid: { label: "Not Paid", variant: "outline", icon: XCircle },
  free: { label: "Free", variant: "secondary", icon: Gift },
};

export default function SchoolFranchiseFeesSection({ schoolId }: Props) {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    supabase
      .from("school_franchise_fees")
      .select("*, instructors(name)")
      .eq("school_id", schoolId)
      .order("period_start", { ascending: false })
      .then(({ data }) => {
        setFees((data as unknown as FeeRecord[]) || []);
        setLoading(false);
      });
  }, [schoolId]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return fees;
    return fees.filter(f => f.status === statusFilter);
  }, [fees, statusFilter]);

  const summary = useMemo(() => {
    const totalDue = fees.filter(f => f.status !== "free").reduce((s, f) => s + Number(f.amount), 0);
    const totalPaid = fees.filter(f => f.status === "paid").reduce((s, f) => s + Number(f.amount), 0);
    const overdue = fees.filter(f => f.status === "late").length;
    return { totalDue, totalPaid, overdue };
  }, [fees]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Total Due</p><p className="text-2xl font-bold">£{summary.totalDue.toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Total Paid</p><p className="text-2xl font-bold text-green-600">£{summary.totalPaid.toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Overdue</p><p className="text-2xl font-bold text-destructive">{summary.overdue}</p></CardContent></Card>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm">Status:</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="late">Late</SelectItem>
            <SelectItem value="not_paid">Not Paid</SelectItem>
            <SelectItem value="free">Free</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No fee records found</TableCell></TableRow>
                ) : filtered.map(fee => {
                  const cfg = STATUS_CONFIG[fee.status] || STATUS_CONFIG.not_paid;
                  const Icon = cfg.icon;
                  return (
                    <TableRow key={fee.id}>
                      <TableCell className="font-medium">{(fee.instructors as any)?.name || "—"}</TableCell>
                      <TableCell className="text-sm">{format(new Date(fee.period_start), "MMM yyyy")}</TableCell>
                      <TableCell>£{Number(fee.amount).toFixed(2)}</TableCell>
                      <TableCell><Badge variant={cfg.variant} className="gap-1"><Icon className="h-3 w-3" /> {cfg.label}</Badge></TableCell>
                      <TableCell className="text-sm">{fee.paid_at ? format(new Date(fee.paid_at), "dd MMM yyyy") : "—"}</TableCell>
                      <TableCell className="text-sm capitalize">{fee.payment_method || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
