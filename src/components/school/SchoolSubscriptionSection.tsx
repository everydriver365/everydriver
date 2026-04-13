import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, PoundSterling, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  instructorIds: string[];
  schoolName: string;
}

interface SubRow {
  id: string;
  status: string;
  billing_cycle: string | null;
  current_period_end: string | null;
  total_monthly_amount: number | null;
  instructor: { name: string } | null;
  plan: { name: string; price_monthly: number } | null;
}

interface PaymentRow {
  id: string;
  amount: number;
  status: string;
  payment_date: string | null;
  currency: string;
  created_at: string;
}

const statusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Active</Badge>;
    case "past_due":
    case "late":
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Past Due</Badge>;
    case "cancelled":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
    case "free":
      return <Badge variant="secondary">Free</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function SchoolSubscriptionSection({ instructorIds, schoolName }: Props) {
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instructorIds.length) { setLoading(false); return; }

    const fetch = async () => {
      setLoading(true);

      const { data: subData } = await supabase
        .from("instructor_subscriptions")
        .select("id, status, billing_cycle, current_period_end, total_monthly_amount, instructor:instructors(name), plan:subscription_plans(name, price_monthly)")
        .in("instructor_id", instructorIds) as any;

      setSubs(subData || []);

      const { data: payData } = await supabase
        .from("subscription_payments")
        .select("id, amount, status, payment_date, currency, created_at")
        .in("instructor_id", instructorIds)
        .order("created_at", { ascending: false })
        .limit(50) as any;

      setPayments(payData || []);
      setLoading(false);
    };

    fetch();
  }, [instructorIds]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const activeSubs = subs.filter(s => s.status === "active");
  const overdueSubs = subs.filter(s => s.status === "past_due" || s.status === "late");
  const totalMonthly = subs.reduce((sum, s) => sum + (s.total_monthly_amount ?? s.plan?.price_monthly ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeSubs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PoundSterling className="h-4 w-4" /> Monthly Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">£{totalMonthly.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{overdueSubs.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-instructor breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Per-Instructor Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {subs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No subscriptions found for this school's instructors.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Period End</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.instructor?.name ?? "—"}</TableCell>
                    <TableCell>{s.plan?.name ?? "—"}</TableCell>
                    <TableCell>{statusBadge(s.status)}</TableCell>
                    <TableCell className="capitalize">{s.billing_cycle ?? "monthly"}</TableCell>
                    <TableCell>{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("en-GB") : "—"}</TableCell>
                    <TableCell className="text-right">£{(s.total_monthly_amount ?? s.plan?.price_monthly ?? 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No payment history available.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{p.payment_date ? new Date(p.payment_date).toLocaleDateString("en-GB") : new Date(p.created_at).toLocaleDateString("en-GB")}</TableCell>
                    <TableCell>£{Number(p.amount).toFixed(2)}</TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
