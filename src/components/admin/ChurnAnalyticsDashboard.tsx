import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, TrendingDown, Users, Clock, Activity, AlertTriangle } from "lucide-react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays, addDays } from "date-fns";

interface Subscription {
  id: string;
  instructor_id: string;
  plan_id: string;
  status: string | null;
  created_at: string | null;
  current_period_end: string | null;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
}

interface Payment {
  id: string;
  subscription_id: string | null;
  status: string;
  created_at: string;
}

export function ChurnAnalyticsDashboard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("instructor_subscriptions").select("id, instructor_id, plan_id, status, created_at, current_period_end"),
      supabase.from("subscription_plans").select("id, name, slug"),
      supabase.from("subscription_payments").select("id, subscription_id, status, created_at").order("created_at", { ascending: false }).limit(500),
    ]).then(([subsRes, plansRes, paymentsRes]) => {
      setSubscriptions(subsRes.data || []);
      setPlans(plansRes.data || []);
      setPayments(paymentsRes.data || []);
      setLoading(false);
    });
  }, []);

  const analytics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = subMonths(now, 1);

    const activeSubs = subscriptions.filter(s => s.status === "active");
    const totalSubs = subscriptions.length;

    // Churned = inactive/cancelled subs whose period ended in last 30 days
    const churned30d = subscriptions.filter(s => {
      if (s.status === "active") return false;
      if (!s.current_period_end) return false;
      const endDate = new Date(s.current_period_end);
      return endDate >= thirtyDaysAgo && endDate <= now;
    });

    const churnRate = totalSubs > 0 ? (churned30d.length / totalSubs) * 100 : 0;

    // Average subscription lifetime
    const lifetimes = subscriptions
      .filter(s => s.created_at)
      .map(s => {
        const end = s.current_period_end ? new Date(s.current_period_end) : now;
        return differenceInDays(end, new Date(s.created_at!));
      });
    const avgLifetime = lifetimes.length > 0
      ? Math.round(lifetimes.reduce((a, b) => a + b, 0) / lifetimes.length)
      : 0;

    // Net change (new subs in 30d minus churned)
    const newIn30d = subscriptions.filter(s => {
      if (!s.created_at) return false;
      return new Date(s.created_at) >= thirtyDaysAgo;
    }).length;
    const netChange = newIn30d - churned30d.length;

    // Churn by tier
    const planMap = new Map(plans.map(p => [p.id, p.name]));
    const tierBreakdown = plans.map(plan => {
      const planSubs = subscriptions.filter(s => s.plan_id === plan.id);
      const planChurned = churned30d.filter(s => s.plan_id === plan.id);
      return {
        name: plan.name.length > 14 ? plan.name.slice(0, 12) + "…" : plan.name,
        fullName: plan.name,
        total: planSubs.length,
        churned: planChurned.length,
        active: planSubs.filter(s => s.status === "active").length,
      };
    }).filter(t => t.total > 0);

    // Monthly trend (last 6 months)
    const monthlyTrend: { month: string; churnRate: number; churned: number; newSubs: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const label = format(monthDate, "MMM");

      const monthChurned = subscriptions.filter(s => {
        if (s.status === "active") return false;
        if (!s.current_period_end) return false;
        const endDate = new Date(s.current_period_end);
        return endDate >= start && endDate <= end;
      }).length;

      const monthNew = subscriptions.filter(s => {
        if (!s.created_at) return false;
        const d = new Date(s.created_at);
        return d >= start && d <= end;
      }).length;

      const totalAtMonth = subscriptions.filter(s => {
        if (!s.created_at) return false;
        return new Date(s.created_at) <= end;
      }).length;

      monthlyTrend.push({
        month: label,
        churnRate: totalAtMonth > 0 ? Math.round((monthChurned / totalAtMonth) * 100 * 10) / 10 : 0,
        churned: monthChurned,
        newSubs: monthNew,
      });
    }

    // Cohort retention
    const cohorts: { month: string; total: number; active: number; retained: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const label = format(monthDate, "MMM yyyy");

      const cohortSubs = subscriptions.filter(s => {
        if (!s.created_at) return false;
        const d = new Date(s.created_at);
        return d >= start && d <= end;
      });

      const stillActive = cohortSubs.filter(s => s.status === "active").length;

      cohorts.push({
        month: label,
        total: cohortSubs.length,
        active: stillActive,
        retained: cohortSubs.length > 0 ? Math.round((stillActive / cohortSubs.length) * 100) : 0,
      });
    }

    // At-risk subscribers
    const fourteenDaysFromNow = addDays(now, 14);
    const failedPaymentSubIds = new Set(
      payments.filter(p => p.status === "failed").map(p => p.subscription_id)
    );

    const atRisk = subscriptions
      .filter(s => {
        if (s.status !== "active") return false;
        const expiringInRange = s.current_period_end &&
          new Date(s.current_period_end) <= fourteenDaysFromNow &&
          new Date(s.current_period_end) >= now;
        const hasFailedPayment = failedPaymentSubIds.has(s.id);
        return expiringInRange || hasFailedPayment;
      })
      .map(s => ({
        id: s.id,
        instructorId: s.instructor_id,
        plan: planMap.get(s.plan_id) || "Unknown",
        periodEnd: s.current_period_end,
        hasFailedPayment: failedPaymentSubIds.has(s.id),
        daysRemaining: s.current_period_end
          ? differenceInDays(new Date(s.current_period_end), now)
          : null,
      }));

    return {
      churnRate: Math.round(churnRate * 10) / 10,
      churned30d: churned30d.length,
      activeSubs: activeSubs.length,
      avgLifetimeDays: avgLifetime,
      netChange,
      tierBreakdown,
      monthlyTrend,
      cohorts,
      atRisk,
    };
  }, [subscriptions, plans, payments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingDown}
          label="Churn Rate (30d)"
          value={`${analytics.churnRate}%`}
          subtitle="of total subscribers"
          variant={analytics.churnRate > 10 ? "danger" : analytics.churnRate > 5 ? "warning" : "success"}
        />
        <StatCard
          icon={Users}
          label="Churned (30d)"
          value={analytics.churned30d}
          subtitle={`${analytics.activeSubs} still active`}
          variant="danger"
        />
        <StatCard
          icon={Clock}
          label="Avg Lifetime"
          value={`${analytics.avgLifetimeDays}d`}
          subtitle="average subscription length"
          variant="info"
        />
        <StatCard
          icon={Activity}
          label="Net Change (30d)"
          value={analytics.netChange >= 0 ? `+${analytics.netChange}` : `${analytics.netChange}`}
          subtitle="new minus churned"
          variant={analytics.netChange >= 0 ? "success" : "danger"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Churn by Tier */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Churn by Plan Tier (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.tierBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No subscription data available.</p>
            ) : (
              <ChartContainer
                config={{
                  churned: { label: "Churned", color: "hsl(var(--destructive))" },
                  active: { label: "Active", color: "hsl(var(--primary))" },
                }}
                className="h-[220px]"
              >
                <BarChart data={analytics.tierBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="active" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="churned" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Churn Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Monthly Churn Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                churnRate: { label: "Churn Rate %", color: "hsl(var(--destructive))" },
                newSubs: { label: "New Subscribers", color: "hsl(var(--primary))" },
              }}
              className="h-[220px]"
            >
              <AreaChart data={analytics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="churnRate" fill="hsl(var(--destructive) / 0.15)" stroke="hsl(var(--destructive))" strokeWidth={2} />
                <Area type="monotone" dataKey="newSubs" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Retention Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Cohort Retention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Signup Month</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Still Active</TableHead>
                <TableHead className="text-right">Retention</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.cohorts.map(c => (
                <TableRow key={c.month}>
                  <TableCell className="font-medium">{c.month}</TableCell>
                  <TableCell className="text-right">{c.total}</TableCell>
                  <TableCell className="text-right">{c.active}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={c.retained >= 80 ? "default" : c.retained >= 50 ? "secondary" : "destructive"}>
                      {c.retained}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* At-Risk Subscribers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            At-Risk Subscribers
            {analytics.atRisk.length > 0 && (
              <Badge variant="destructive" className="ml-auto">{analytics.atRisk.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.atRisk.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No at-risk subscribers detected. All looking healthy!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor ID</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead>Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.atRisk.slice(0, 20).map(sub => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-mono text-xs">{sub.instructorId.slice(0, 8)}…</TableCell>
                    <TableCell>{sub.plan}</TableCell>
                    <TableCell>{sub.daysRemaining !== null ? `${sub.daysRemaining}d` : "—"}</TableCell>
                    <TableCell>
                      {sub.hasFailedPayment ? (
                        <Badge variant="destructive">Failed Payment</Badge>
                      ) : (
                        <Badge variant="secondary">Expiring</Badge>
                      )}
                    </TableCell>
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
