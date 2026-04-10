import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, BarChart3, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, Legend,
} from "recharts";
import { cn } from "@/lib/utils";

interface PassRateDashboardProps {
  instructorId: string;
}

interface TestResult {
  id: string;
  result: string;
  test_date: string;
  test_centre_id: string | null;
  total_minor_faults: number;
  total_serious_faults: number;
  total_dangerous_faults: number;
  faults: any;
  is_mock: boolean;
  test_centre?: { id: string; name: string } | null;
}

const NATIONAL_AVG = 49;

export function PassRateDashboard({ instructorId }: PassRateDashboardProps) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("driving_test_results")
        .select("id, result, test_date, test_centre_id, total_minor_faults, total_serious_faults, total_dangerous_faults, faults, is_mock, test_centre:test_centres(id, name)")
        .eq("instructor_id", instructorId)
        .eq("is_mock", false)
        .order("test_date", { ascending: true });

      setResults((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, [instructorId]);

  const stats = useMemo(() => {
    if (!results.length) return null;

    const passes = results.filter(r => r.result === "pass").length;
    const fails = results.filter(r => r.result === "fail").length;
    const total = passes + fails;
    const passRate = total > 0 ? Math.round((passes / total) * 100) : 0;

    // Rolling 12-month trend
    const now = new Date();
    const monthlyData: Record<string, { pass: number; fail: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyData[key] = { pass: 0, fail: 0 };
    }
    results.forEach(r => {
      const key = r.test_date.substring(0, 7);
      if (monthlyData[key]) {
        if (r.result === "pass") monthlyData[key].pass++;
        else monthlyData[key].fail++;
      }
    });
    const trendData = Object.entries(monthlyData).map(([month, d]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-GB", { month: "short" }),
      rate: d.pass + d.fail > 0 ? Math.round((d.pass / (d.pass + d.fail)) * 100) : null,
      national: NATIONAL_AVG,
    }));

    // By test centre
    const centreMap = new Map<string, { name: string; pass: number; fail: number }>();
    results.forEach(r => {
      const name = r.test_centre?.name || "Unknown";
      const id = r.test_centre_id || "unknown";
      if (!centreMap.has(id)) centreMap.set(id, { name, pass: 0, fail: 0 });
      const c = centreMap.get(id)!;
      if (r.result === "pass") c.pass++;
      else c.fail++;
    });
    const centreData = Array.from(centreMap.values())
      .filter(c => c.pass + c.fail > 1)
      .map(c => ({ name: c.name, pass: c.pass, fail: c.fail, rate: Math.round((c.pass / (c.pass + c.fail)) * 100) }));

    // Average faults
    const passFaults = results.filter(r => r.result === "pass");
    const failFaults = results.filter(r => r.result === "fail");
    const avgMinorPass = passFaults.length > 0
      ? (passFaults.reduce((s, r) => s + r.total_minor_faults, 0) / passFaults.length).toFixed(1)
      : "0";
    const avgMinorFail = failFaults.length > 0
      ? (failFaults.reduce((s, r) => s + r.total_minor_faults, 0) / failFaults.length).toFixed(1)
      : "0";

    // Top faults
    const faultCounts: Record<string, number> = {};
    results.forEach(r => {
      if (r.faults && typeof r.faults === "object") {
        Object.entries(r.faults as Record<string, any>).forEach(([key, val]) => {
          const count = typeof val === "number" ? val : (typeof val === "object" && val?.minor ? val.minor : 0);
          if (count > 0) {
            faultCounts[key] = (faultCounts[key] || 0) + count;
          }
        });
      }
    });
    const topFaults = Object.entries(faultCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name: name.replace(/_/g, " "), count }));

    return { passes, fails, total, passRate, trendData, centreData, avgMinorPass, avgMinorFail, topFaults };
  }, [results]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[30vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No test results recorded yet</p>
        <p className="text-xs text-muted-foreground mt-1">Record driving test results to see your pass rate analytics</p>
      </div>
    );
  }

  const pieData = [
    { name: "Pass", value: stats.passes },
    { name: "Fail", value: stats.fails },
  ];
  const COLORS = ["hsl(var(--primary))", "hsl(var(--muted-foreground) / 0.3)"];

  return (
    <div className="space-y-6">
      {/* Overall Pass Rate */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-none border border-border p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-none bg-primary/10 flex items-center justify-center">
            <Trophy className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Overall Pass Rate</h3>
        </div>

        <div className="flex items-center gap-6">
          <div className="w-28 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <span className="text-3xl font-bold text-foreground">{stats.passRate}%</span>
              <span className="text-sm text-muted-foreground ml-2">({stats.passes}/{stats.total})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              <span className="text-xs text-muted-foreground">National avg: {NATIONAL_AVG}%</span>
            </div>
            {stats.passRate > NATIONAL_AVG ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <TrendingUp className="h-3 w-3" />
                {stats.passRate - NATIONAL_AVG}% above average
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <AlertTriangle className="h-3 w-3" />
                {NATIONAL_AVG - stats.passRate}% below average
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* 12-Month Trend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-none border border-border p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-none bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">12-Month Trend</h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              />
              <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Your rate" connectNulls />
              <Line type="monotone" dataKey="national" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={1} dot={false} name="National avg" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* By Test Centre */}
      {stats.centreData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-none border border-border p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-none bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">By Test Centre</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.centreData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="pass" fill="hsl(var(--primary))" name="Pass" radius={[0, 4, 4, 0]} />
                <Bar dataKey="fail" fill="hsl(var(--muted-foreground) / 0.3)" name="Fail" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Fault Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-none border border-border p-5"
      >
        <h3 className="font-semibold text-foreground mb-4">Average Minor Faults</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-500/10 rounded-none p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.avgMinorPass}</p>
            <p className="text-xs text-muted-foreground mt-1">Passes</p>
          </div>
          <div className="bg-destructive/10 rounded-none p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.avgMinorFail}</p>
            <p className="text-xs text-muted-foreground mt-1">Fails</p>
          </div>
        </div>

        {stats.topFaults.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Top Fault Categories</p>
            <div className="space-y-2">
              {stats.topFaults.map((f, i) => (
                <div key={f.name} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground capitalize">{f.name}</span>
                      <span className="text-xs font-medium text-muted-foreground">{f.count}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min((f.count / stats.topFaults[0].count) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
