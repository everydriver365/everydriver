import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, TrendingUp, CreditCard, Users, Loader2 } from "lucide-react";
import { format, startOfMonth, subMonths } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

interface CommissionRecord {
  id: string;
  instructor_id: string | null;
  source_type: string;
  gross_amount: number;
  commission_amount: number;
  net_amount: number;
  description: string | null;
  created_at: string;
}

export function CommissionDashboard() {
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [instructors, setInstructors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [commRes, instrRes] = await Promise.all([
        supabase
          .from("platform_commissions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("instructors").select("id, name").eq("is_network_placeholder", false),
      ]);

      setCommissions((commRes.data as CommissionRecord[]) || []);
      const map: Record<string, string> = {};
      (instrRes.data || []).forEach((i: any) => { map[i.id] = i.name; });
      setInstructors(map);
    } catch (error) {
      console.error("Error fetching commissions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Summary stats
  const totalPaymentCommission = commissions
    .filter(c => c.source_type === "payment")
    .reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);

  const totalSubscriptionCommission = commissions
    .filter(c => c.source_type === "subscription")
    .reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);

  const totalCommission = commissions.reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);

  const thisMonthStart = startOfMonth(new Date());
  const thisMonthCommission = commissions
    .filter(c => new Date(c.created_at) >= thisMonthStart)
    .reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);

  // Commission by instructor
  const instrCommMap: Record<string, { payment: number; subscription: number }> = {};
  commissions.forEach(c => {
    const key = c.instructor_id || "unknown";
    if (!instrCommMap[key]) instrCommMap[key] = { payment: 0, subscription: 0 };
    if (c.source_type === "payment") {
      instrCommMap[key].payment += Number(c.commission_amount) || 0;
    } else {
      instrCommMap[key].subscription += Number(c.commission_amount) || 0;
    }
  });

  const instructorData = Object.entries(instrCommMap)
    .map(([id, vals]) => ({
      name: instructors[id] || id.slice(0, 8),
      payment: Math.round(vals.payment * 100) / 100,
      subscription: Math.round(vals.subscription * 100) / 100,
      total: Math.round((vals.payment + vals.subscription) * 100) / 100,
    }))
    .sort((a, b) => b.total - a.total);

  // Commission by source type for pie chart
  const sourceBreakdown = [
    { name: "Payment Commission", value: Math.round(totalPaymentCommission * 100) / 100 },
    { name: "Subscription Revenue", value: Math.round(totalSubscriptionCommission * 100) / 100 },
  ].filter(d => d.value > 0);

  // Monthly trend (last 6 months)
  const monthlyData: { label: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i));
    const monthEnd = startOfMonth(subMonths(new Date(), i - 1));
    const total = commissions
      .filter(c => {
        const d = new Date(c.created_at);
        return d >= monthStart && d < monthEnd;
      })
      .reduce((sum, c) => sum + (Number(c.commission_amount) || 0), 0);
    monthlyData.push({
      label: format(monthStart, "MMM yy"),
      amount: Math.round(total * 100) / 100,
    });
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(v);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalCommission)}</p>
                <p className="text-xs text-muted-foreground">Total Commission</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(thisMonthCommission)}</p>
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalPaymentCommission)}</p>
                <p className="text-xs text-muted-foreground">From Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalSubscriptionCommission)}</p>
                <p className="text-xs text-muted-foreground">From Subscriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5" /> Commission Trend (6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `£${v}`} />
              <Tooltip formatter={(v: number) => [`£${v.toFixed(2)}`, "Commission"]} />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Source Breakdown Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="h-5 w-5" /> Commission Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sourceBreakdown.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No commission data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={sourceBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                    {sourceBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`£${v.toFixed(2)}`, ""]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Commission by Instructor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5" /> Commission by Instructor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {instructorData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No commission data yet</p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {instructorData.map((instr, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{instr.name}</p>
                      <div className="flex gap-2 mt-0.5">
                        {instr.payment > 0 && (
                          <Badge variant="outline" className="text-[10px] h-4">
                            Payments: {formatCurrency(instr.payment)}
                          </Badge>
                        )}
                        {instr.subscription > 0 && (
                          <Badge variant="secondary" className="text-[10px] h-4">
                            Subs: {formatCurrency(instr.subscription)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground shrink-0 ml-3">
                      {formatCurrency(instr.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Commission Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">
              No commission entries yet. Commission is automatically recorded when digital payments or subscription payments are processed.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Instructor</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Source</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Gross</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Commission</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.slice(0, 20).map(c => (
                    <tr key={c.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2 text-muted-foreground">
                        {format(new Date(c.created_at), "dd MMM yy")}
                      </td>
                      <td className="py-2 font-medium">
                        {c.instructor_id ? (instructors[c.instructor_id] || c.instructor_id.slice(0, 8)) : "—"}
                      </td>
                      <td className="py-2">
                        <Badge variant={c.source_type === "payment" ? "outline" : "secondary"} className="text-[10px]">
                          {c.source_type}
                        </Badge>
                      </td>
                      <td className="py-2 text-right">{formatCurrency(Number(c.gross_amount))}</td>
                      <td className="py-2 text-right font-semibold text-primary">
                        {formatCurrency(Number(c.commission_amount))}
                      </td>
                      <td className="py-2 text-right">{formatCurrency(Number(c.net_amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
