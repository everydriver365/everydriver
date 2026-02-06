import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, BarChart3, PieChartIcon } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export function RevenueAnalytics() {
  const [payments, setPayments] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<Record<string, string>>({});
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sixMonthsAgo = subMonths(new Date(), 6).toISOString();
        const [paymentsRes, lessonsRes, instructorsRes] = await Promise.all([
          supabase.from("payment_history").select("amount, payment_method, recorded_at, instructor_id").gte("recorded_at", sixMonthsAgo),
          supabase.from("scheduled_lessons").select("lesson_type, lesson_date, status").gte("lesson_date", sixMonthsAgo.split("T")[0]),
          supabase.from("instructors").select("id, name"),
        ]);
        setPayments(paymentsRes.data || []);
        setLessons(lessonsRes.data || []);
        const map: Record<string, string> = {};
        (instructorsRes.data || []).forEach((i: any) => { map[i.id] = i.name; });
        setInstructors(map);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Revenue over time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Revenue Over Time
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
