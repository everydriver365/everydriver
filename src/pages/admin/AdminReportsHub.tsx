import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminBackButton } from "@/components/admin/AdminBackButton";

import { RevenueAnalytics } from "@/components/admin/RevenueAnalytics";
import { InstructorLeaderboard } from "@/components/admin/InstructorLeaderboard";
import { ChurnAnalyticsDashboard } from "@/components/admin/ChurnAnalyticsDashboard";
import { CommissionDashboard } from "@/components/admin/CommissionDashboard";
import { ComplianceDashboard } from "@/components/admin/ComplianceDashboard";
import { useAdminRetentionStats } from "@/hooks/useAdminRetentionStats";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3, Trophy, Users, PoundSterling, ShieldCheck, Coins,
  TrendingUp, GraduationCap, ChevronLeft,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

type ReportKey =
  | "overview"
  | "revenue"
  | "leaderboard"
  | "churn"
  | "commission"
  | "compliance";

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
}
function ReportCard({ title, description, icon: Icon, onClick }: ReportCardProps) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:bg-accent/50 transition-colors h-full"
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-0.5">
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-xs text-muted-foreground">{description}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PassRateSummary() {
  const [stats, setStats] = useState<{
    avgPassRate: number | null;
    avgMinorFaults: number | null;
    instructors: number;
    loading: boolean;
  }>({ avgPassRate: null, avgMinorFaults: null, instructors: 0, loading: true });

  useEffect(() => {
    (async () => {
      // Use latest period row per instructor from instructor_standards_check
      const { data } = await supabase
        .from("instructor_standards_check")
        .select("instructor_id, pass_rate_percentage, avg_minor_faults, calculated_at")
        .order("calculated_at", { ascending: false });

      const latestByInstructor = new Map<string, any>();
      for (const row of data ?? []) {
        if (!latestByInstructor.has(row.instructor_id)) {
          latestByInstructor.set(row.instructor_id, row);
        }
      }
      const rows = Array.from(latestByInstructor.values());
      if (rows.length === 0) {
        setStats({ avgPassRate: null, avgMinorFaults: null, instructors: 0, loading: false });
        return;
      }
      const avgPass =
        rows.reduce((s, r) => s + Number(r.pass_rate_percentage ?? 0), 0) / rows.length;
      const avgMin =
        rows.reduce((s, r) => s + Number(r.avg_minor_faults ?? 0), 0) / rows.length;
      setStats({
        avgPassRate: Math.round(avgPass * 10) / 10,
        avgMinorFaults: Math.round(avgMin * 10) / 10,
        instructors: rows.length,
        loading: false,
      });
    })();
  }, []);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Average pass rate</p>
            <p className="text-2xl font-bold tracking-tight">
              {stats.loading
                ? "—"
                : stats.avgPassRate == null
                  ? "No data"
                  : `${stats.avgPassRate}%`}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.loading
                ? ""
                : `Across ${stats.instructors} instructor${stats.instructors === 1 ? "" : "s"} · avg minor faults ${
                    stats.avgMinorFaults ?? "—"
                  }`}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RetentionSummary() {
  const { active30d, active60d, retentionPct, loading } = useAdminRetentionStats();
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Pupil retention</p>
            <p className="text-2xl font-bold tracking-tight">
              {loading ? "—" : retentionPct == null ? "No data" : `${retentionPct}%`}
            </p>
            <p className="text-xs text-muted-foreground">
              {loading
                ? ""
                : `30-day active ${active30d} vs 60-day active ${active60d}`}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminReportsHub() {
  const navigate = useNavigate();
  const [active, setActive] = useState<ReportKey>("overview");

  const renderActive = () => {
    switch (active) {
      case "revenue":
        return <RevenueAnalytics />;
      case "leaderboard":
        return <InstructorLeaderboard />;
      case "churn":
        return <ChurnAnalyticsDashboard />;
      case "commission":
        return <CommissionDashboard />;
      case "compliance":
        return <ComplianceDashboard />;
      default:
        return null;
    }
  };

  if (active !== "overview") {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setActive("overview")}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Reports
        </Button>
        {renderActive()}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <AdminBackButton onClick={() => navigate("/admin")} />
            <h1 className="text-2xl font-bold tracking-tight">Reports &amp; analytics</h1>
            <p className="text-sm text-muted-foreground">
              Unified hub for business performance, compliance and instructor metrics.
            </p>
          </div>
          <Badge variant="secondary">Live data</Badge>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Business performance
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <ReportCard
              title="Revenue analytics"
              description="MRR, transactions, plan breakdown"
              icon={BarChart3}
              onClick={() => setActive("revenue")}
            />
            <ReportCard
              title="Instructor leaderboard"
              description="Lessons, pass rate, pupils, reviews"
              icon={Trophy}
              onClick={() => setActive("leaderboard")}
            />
            <ReportCard
              title="Churn analytics"
              description="Subscription churn and cohorts"
              icon={Users}
              onClick={() => setActive("churn")}
            />
            <ReportCard
              title="Commission dashboard"
              description="Per-instructor commission tracking"
              icon={Coins}
              onClick={() => setActive("commission")}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Compliance
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <ReportCard
              title="Compliance dashboard"
              description="DVSA standards, certification status"
              icon={ShieldCheck}
              onClick={() => setActive("compliance")}
            />
            <Link to="/admin/platform-fees" className="block h-full">
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors h-full">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <PoundSterling className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold">Platform fees</div>
                      <div className="text-xs text-muted-foreground">
                        £1 booking fee ledger — totals &amp; per-booking records
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Instructor performance
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <PassRateSummary />
            <RetentionSummary />
          </div>
        </section>
      </div>
    </div>
  );

}
