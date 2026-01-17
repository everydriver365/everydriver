import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, format } from "date-fns";

interface DashboardStats {
  totalPupils: number;
  pupilsThisMonth: number;
  activeInstructors: number;
  newInstructorsThisMonth: number;
  lessonsToday: number;
  monthlyRevenue: number;
  revenueChange: number;
}

interface Alert {
  type: "warning" | "info" | "success";
  message: string;
  action: string;
  count?: number;
}

export function useAdminDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const monthStart = startOfMonth(new Date()).toISOString();
      const lastMonthStart = startOfMonth(new Date(new Date().setMonth(new Date().getMonth() - 1))).toISOString();
      const lastMonthEnd = startOfMonth(new Date()).toISOString();

      // Total pupils count
      const pupilsRes = await supabase
        .from("pupils")
        .select("id", { count: "exact", head: true });

      // Pupils this month
      const pupilsMonthRes = await supabase
        .from("pupils")
        .select("id", { count: "exact", head: true })
        .gte("created_at", monthStart);

      // Active instructors
      const instructorsRes = await supabase
        .from("instructors")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);

      // New instructors this month
      const newInstructorsRes = await supabase
        .from("instructors")
        .select("id", { count: "exact", head: true })
        .gte("created_at", monthStart);

      // Lessons today
      const lessonsRes = await supabase
        .from("scheduled_lessons")
        .select("id", { count: "exact", head: true })
        .eq("lesson_date", today);

      // Revenue this month
      const monthRevenueRes = await supabase
        .from("payment_history")
        .select("amount")
        .gte("recorded_at", monthStart);

      // Revenue last month
      const lastMonthRevenueRes = await supabase
        .from("payment_history")
        .select("amount")
        .gte("recorded_at", lastMonthStart)
        .lt("recorded_at", lastMonthEnd);

      // Calculate revenue
      let monthlyRevenue = 0;
      if (monthRevenueRes.data) {
        for (const p of monthRevenueRes.data) {
          monthlyRevenue += Number(p.amount) || 0;
        }
      }

      let lastMonthTotal = 0;
      if (lastMonthRevenueRes.data) {
        for (const p of lastMonthRevenueRes.data) {
          lastMonthTotal += Number(p.amount) || 0;
        }
      }

      const revenueChange = lastMonthTotal > 0 
        ? Math.round(((monthlyRevenue - lastMonthTotal) / lastMonthTotal) * 100) 
        : 0;

      setStats({
        totalPupils: pupilsRes.count || 0,
        pupilsThisMonth: pupilsMonthRes.count || 0,
        activeInstructors: instructorsRes.count || 0,
        newInstructorsThisMonth: newInstructorsRes.count || 0,
        lessonsToday: lessonsRes.count || 0,
        monthlyRevenue,
        revenueChange,
      });

      // Generate alerts 
      const newAlerts: Alert[] = [];

      // Check for lessons today
      if ((lessonsRes.count || 0) > 0) {
        newAlerts.push({
          type: "info",
          message: `${lessonsRes.count} lessons scheduled for today`,
          action: "View",
          count: lessonsRes.count || 0,
        });
      }

      // Check for new pupils this month
      if ((pupilsMonthRes.count || 0) > 0) {
        newAlerts.push({
          type: "success",
          message: `${pupilsMonthRes.count} new pupils this month`,
          action: "View",
          count: pupilsMonthRes.count || 0,
        });
      }

      if (newAlerts.length === 0) {
        newAlerts.push({
          type: "success",
          message: "All systems operational",
          action: "View",
        });
      }

      setAlerts(newAlerts);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, alerts, loading, refetch: fetchStats };
}
