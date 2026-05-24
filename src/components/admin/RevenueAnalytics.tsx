import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachWeekOfInterval, eachMonthOfInterval, differenceInDays } from "date-fns";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from "recharts";
import { TrendingUp, BarChart3, PieChartIcon, PoundSterling, Users, UserMinus, Crown, ArrowUpRight, ArrowDownRight, CreditCard } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const PLAN_COLORS: Record<string, string> = {
  free: "#94a3b8",
  pro: "#3b82f6",
  max: "#10b981",
  multi: "#f59e0b",
  enterprise: "#8b5cf6",
};

interface SubscriptionPlan {
  id: string;
  slug: string;
  name: string;
  price_monthly: number;
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  created_at: string;
  current_period_end: string | null;
  billing_cycle: string | null;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, trendLabel }: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  trend?: number;
  trendLabel?: string;
}) {
  const isPositive = trend && trend >= 0;
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {trend !== undefined && (
          <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
            {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(trend).toFixed(1)}% {trendLabel || "vs last month"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentTransactionsFeed() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("payment_history")
        .select("id, amount, payment_method, recorded_at, pupil_id, instructor_id")
        .order("recorded_at", { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        // Fetch pupil and instructor names
        const pupilIds = [...new Set(data.map((t: any) => t.pupil_id).filter(Boolean))];
        const instrIds = [...new Set(data.map((t: any) => t.instructor_id).filter(Boolean))];
        
        const [pupilsRes, instrsRes] = await Promise.all([
          pupilIds.length > 0 ? supabase.from("pupils").select("id, name").in("id", pupilIds) : { data: [] },
          instrIds.length > 0 ? supabase.from("instructors").select("id, name").in("id", instrIds) : { data: [] },
        ]);

        const pupilMap: Record<string, string> = {};
        (pupilsRes.data || []).forEach((p: any) => { pupilMap[p.id] = p.name; });
        const instrMap: Record<string, string> = {};
        (instrsRes.data || []).forEach((i: any) => { instrMap[i.id] = i.name; });

        setTransactions(data.map((t: any) => ({
          ...t,
          pupil_name: pupilMap[t.pupil_id] || "Unknown",
          instructor_name: instrMap[t.instructor_id] || "Unknown",
        })));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="py-4 text-center text-muted-foreground text-sm">Loading...</div>;
  if (transactions.length === 0) return <p className="text-center text-muted-foreground py-4">No transactions yet</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 font-medium">Time</th>
            <th className="pb-2 font-medium">Pupil</th>
            <th className="pb-2 font-medium">Instructor</th>
            <th className="pb-2 font-medium">Method</th>
            <th className="pb-2 font-medium text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t: any) => (
            <tr key={t.id} className="border-b last:border-0">
              <td className="py-2 text-muted-foreground">{format(new Date(t.recorded_at), "dd MMM HH:mm")}</td>
              <td className="py-2">{t.pupil_name}</td>
              <td className="py-2 text-muted-foreground">{t.instructor_name}</td>
              <td className="py-2"><Badge variant="outline" className="text-[10px]">{t.payment_method}</Badge></td>
              <td className={`py-2 text-right font-semibold ${Number(t.amount) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {Number(t.amount) >= 0 ? "+" : ""}£{Math.abs(Number(t.amount)).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RevenueAnalytics() {
  const [payments, setPayments] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<Record<string, string>>({});
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [allSubscriptions, setAllSubscriptions] = useState<Subscription[]>([]);
  const [commissionConfig, setCommissionConfig] = useState<any[]>([]);
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sixMonthsAgo = subMonths(new Date(), 6).toISOString();
        const [paymentsRes, lessonsRes, instructorsRes, plansRes, subsRes, allSubsRes, commissionRes] = await Promise.all([
          supabase.from("payment_history").select("amount, payment_method, recorded_at, instructor_id").gte("recorded_at", sixMonthsAgo),
          supabase.from("scheduled_lessons").select("lesson_type, lesson_date, status").gte("lesson_date", sixMonthsAgo.split("T")[0]),
          supabase.from("instructors").select("id, name").eq("is_network_placeholder", false),
          supabase.from("subscription_plans").select("id, slug, name, price_monthly").eq("is_active", true).order("display_order"),
          supabase.from("instructor_subscriptions").select("id, plan_id, status, created_at, current_period_end, billing_cycle").eq("status", "active"),
          supabase.from("instructor_subscriptions").select("id, plan_id, status, created_at, current_period_end, billing_cycle"),
          supabase.from("platform_commission_config").select("*").eq("is_active", true),
        ]);
        setPayments(paymentsRes.data || []);
        setLessons(lessonsRes.data || []);
        const map: Record<string, string> = {};
        (instructorsRes.data || []).forEach((i: any) => { map[i.id] = i.name; });
        setInstructors(map);
        setPlans(plansRes.data || []);
        setSubscriptions(subsRes.data || []);
        setAllSubscriptions(allSubsRes.data || []);
        setCommissionConfig(commissionRes.data || []);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // === SaaS Metrics ===
  const metrics = useMemo(() => {
    const now = new Date();
    const thisMonth = startOfMonth(now);
    const lastMonth = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // MRR: sum of active subscriptions * monthly price
    const planMap = new Map(plans.map(p => [p.id, p]));
    let mrr = 0;
    const tierCounts: Record<string, number> = {};
    plans.forEach(p => { tierCounts[p.slug] = 0; });

    subscriptions.forEach(sub => {
      const plan = planMap.get(sub.plan_id);
      if (plan) {
        const monthlyPrice = sub.billing_cycle === "yearly" 
          ? (plan.price_monthly * 0.8) // assume ~20% yearly discount
          : plan.price_monthly;
        mrr += monthlyPrice;
        tierCounts[plan.slug] = (tierCounts[plan.slug] || 0) + 1;
      }
    });

    // Commission revenue this month
    const thisMonthPayments = payments.filter(p => new Date(p.recorded_at) >= thisMonth);
    const lastMonthPayments = payments.filter(p => {
      const d = new Date(p.recorded_at);
      return d >= lastMonth && d <= lastMonthEnd;
    });

    const defaultCommission = commissionConfig[0];
    const commRate = defaultCommission?.rate_percent || 2.5;
    const commFixed = (defaultCommission?.fixed_fee_pence || 20) / 100;

    const calcCommission = (paymentList: any[]) =>
      paymentList
        .filter(p => ["klarna", "clearpay", "square", "card"].includes((p.payment_method || "").toLowerCase()))
        .reduce((sum, p) => sum + (Number(p.amount) * commRate / 100) + commFixed, 0);

    const commissionThisMonth = calcCommission(thisMonthPayments);
    const commissionLastMonth = calcCommission(lastMonthPayments);
    const commissionTrend = commissionLastMonth > 0
      ? ((commissionThisMonth - commissionLastMonth) / commissionLastMonth) * 100
      : 0;

    // Churn: subscriptions that became inactive (cancelled/expired) in last 30 days
    const thirtyDaysAgo = subMonths(now, 1);
    const churned = allSubscriptions.filter(s => {
      if (s.status === "active") return false;
      if (s.current_period_end) {
        const endDate = new Date(s.current_period_end);
        return endDate >= thirtyDaysAgo && endDate <= now;
      }
      return false;
    });

    const totalActiveStart = subscriptions.length + churned.length;
    const churnRate = totalActiveStart > 0 ? (churned.length / totalActiveStart) * 100 : 0;

    // MRR trend (compare active subs created before last month)
    const subsLastMonth = allSubscriptions.filter(s => {
      const created = new Date(s.created_at);
      return created < thisMonth && (s.status === "active" || (s.current_period_end && new Date(s.current_period_end) >= lastMonth));
    });
    let mrrLastMonth = 0;
    subsLastMonth.forEach(sub => {
      const plan = planMap.get(sub.plan_id);
      if (plan) {
        mrrLastMonth += sub.billing_cycle === "yearly" ? plan.price_monthly * 0.8 : plan.price_monthly;
      }
    });
    const mrrTrend = mrrLastMonth > 0 ? ((mrr - mrrLastMonth) / mrrLastMonth) * 100 : 0;

    return { mrr, tierCounts, commissionThisMonth, commissionTrend, churnRate, mrrTrend, totalSubscribers: subscriptions.length };
  }, [payments, plans, subscriptions, allSubscriptions, commissionConfig]);

  // MRR over time (last 6 months)
  const mrrOverTime = useMemo(() => {
    const planMap = new Map(plans.map(p => [p.id, p]));
    const months = eachMonthOfInterval({ start: startOfMonth(subMonths(new Date(), 5)), end: startOfMonth(new Date()) });

    return months.map(month => {
      const monthEnd = endOfMonth(month);
      // Count subs that were active during this month
      let monthMrr = 0;
      allSubscriptions.forEach(sub => {
        const created = new Date(sub.created_at);
        const ended = sub.current_period_end ? new Date(sub.current_period_end) : new Date("2099-01-01");
        if (created <= monthEnd && (sub.status === "active" || ended >= month)) {
          const plan = planMap.get(sub.plan_id);
          if (plan) {
            monthMrr += sub.billing_cycle === "yearly" ? plan.price_monthly * 0.8 : plan.price_monthly;
          }
        }
      });
      return { label: format(month, "MMM yy"), mrr: Math.round(monthMrr * 100) / 100 };
    });
  }, [plans, allSubscriptions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Revenue over time
  const now = new Date();
  const sixMonthsAgo = subMonths(now, 6);
  const intervals = period === "monthly"
    ? eachMonthOfInterval({ start: startOfMonth(sixMonthsAgo), end: endOfMonth(now) })
    : eachWeekOfInterval({ start: startOfWeek(sixMonthsAgo), end: endOfWeek(now) });

  const revenueData = intervals.map((date) => {
    const rangeStart = period === "monthly" ? startOfMonth(date) : startOfWeek(date);
    const rangeEnd = period === "monthly" ? endOfMonth(date) : endOfWeek(date);
    const total = payments
      .filter((p) => {
        const d = new Date(p.recorded_at);
        return d >= rangeStart && d <= rangeEnd;
      })
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return {
      label: period === "monthly" ? format(date, "MMM yy") : format(date, "dd MMM"),
      revenue: Math.round(total * 100) / 100,
    };
  });

  // Bookings by type
  const typeMap: Record<string, number> = {};
  lessons.forEach((l) => {
    const t = l.lesson_type || "Standard";
    typeMap[t] = (typeMap[t] || 0) + 1;
  });
  const bookingTypeData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

  // Top instructors by revenue
  const instrRevMap: Record<string, number> = {};
  payments.forEach((p) => {
    if (p.instructor_id) {
      instrRevMap[p.instructor_id] = (instrRevMap[p.instructor_id] || 0) + (Number(p.amount) || 0);
    }
  });
  const topInstructors = Object.entries(instrRevMap)
    .map(([id, rev]) => ({ name: instructors[id] || id.slice(0, 8), revenue: Math.round(rev) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // Payment method breakdown
  const methodMap: Record<string, number> = {};
  payments.forEach((p) => {
    const m = p.payment_method || "unknown";
    methodMap[m] = (methodMap[m] || 0) + 1;
  });
  const paymentMethodData = Object.entries(methodMap).map(([name, value]) => ({ name, value }));

  // Subscriber breakdown for pie
  const subscriberPieData = plans
    .filter(p => p.slug !== "free" && (metrics.tierCounts[p.slug] || 0) > 0)
    .map(p => ({ name: p.name, value: metrics.tierCounts[p.slug] || 0, color: PLAN_COLORS[p.slug] || COLORS[0] }));

  return (
    <div className="space-y-6">
      {/* SaaS KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Recurring Revenue"
          value={`£${metrics.mrr.toFixed(2)}`}
          subtitle={`${metrics.totalSubscribers} active subscriber${metrics.totalSubscribers !== 1 ? "s" : ""}`}
          icon={PoundSterling}
          trend={metrics.mrrTrend}
        />
        <StatCard
          title="Commission Revenue"
          value={`£${metrics.commissionThisMonth.toFixed(2)}`}
          subtitle="This month from digital payments"
          icon={Crown}
          trend={metrics.commissionTrend}
        />
        <StatCard
          title="Active Subscribers"
          value={metrics.totalSubscribers.toString()}
          subtitle={plans.filter(p => p.slug !== "free").map(p => `${p.name}: ${metrics.tierCounts[p.slug] || 0}`).join(" · ")}
          icon={Users}
        />
        <StatCard
          title="Churn Rate"
          value={`${metrics.churnRate.toFixed(1)}%`}
          subtitle="Last 30 days"
          icon={UserMinus}
          trend={metrics.churnRate > 0 ? -metrics.churnRate : 0}
          trendLabel={metrics.churnRate === 0 ? "no churn" : "monthly"}
        />
      </div>

      {/* Subscribers by Tier */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5" /> Subscribers by Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plans.filter(p => p.slug !== "free").map(plan => {
                const count = metrics.tierCounts[plan.slug] || 0;
                const maxCount = Math.max(...plans.map(p => metrics.tierCounts[p.slug] || 0), 1);
                return (
                  <div key={plan.slug} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PLAN_COLORS[plan.slug] }} />
                        <span className="font-medium">{plan.name}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          £{plan.price_monthly}/mo
                        </Badge>
                      </div>
                      <span className="font-semibold">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max((count / maxCount) * 100, count > 0 ? 8 : 0)}%`,
                          backgroundColor: PLAN_COLORS[plan.slug],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* MRR Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5" /> MRR Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={mrrOverTime}>
                <defs>
                  <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `£${v}`} />
                <Tooltip formatter={(v: number) => [`£${v.toFixed(2)}`, "MRR"]} />
                <Area type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={2} fill="url(#mrrGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue over time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Payment Revenue Over Time
          </CardTitle>
          <div className="flex gap-1">
            <Button size="sm" variant={period === "weekly" ? "default" : "outline"} onClick={() => setPeriod("weekly")}>Weekly</Button>
            <Button size="sm" variant={period === "monthly" ? "default" : "outline"} onClick={() => setPeriod("monthly")}>Monthly</Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `£${v}`} />
              <Tooltip formatter={(v: number) => [`£${v.toFixed(2)}`, "Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Bookings by type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5" /> Bookings by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={bookingTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment method pie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChartIcon className="h-5 w-5" /> Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={paymentMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {paymentMethodData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5" /> Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RecentTransactionsFeed />
        </CardContent>
      </Card>

      {/* Top instructors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5" /> Top Instructors by Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topInstructors.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No revenue data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, topInstructors.length * 40)}>
              <BarChart data={topInstructors} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} tickFormatter={(v) => `£${v}`} />
                <YAxis type="category" dataKey="name" fontSize={12} width={120} />
                <Tooltip formatter={(v: number) => [`£${v}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
