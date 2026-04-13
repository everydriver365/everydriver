import { Calendar, TrendingUp, Users, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SchoolStatsGridProps {
  stats: {
    totalLessons: number;
    totalEarnings: number;
    totalPupils: number;
    passRate: number;
  };
}

export default function SchoolStatsGrid({ stats }: SchoolStatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card><CardContent className="pt-4 text-center">
        <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
        <p className="text-2xl font-bold">{stats.totalLessons}</p>
        <p className="text-xs text-muted-foreground">Total Lessons</p>
      </CardContent></Card>
      <Card><CardContent className="pt-4 text-center">
        <TrendingUp className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
        <p className="text-2xl font-bold">£{stats.totalEarnings.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">Total Earnings</p>
      </CardContent></Card>
      <Card><CardContent className="pt-4 text-center">
        <Users className="h-5 w-5 text-sky-500 mx-auto mb-1" />
        <p className="text-2xl font-bold">{stats.totalPupils}</p>
        <p className="text-xs text-muted-foreground">Total Pupils</p>
      </CardContent></Card>
      <Card><CardContent className="pt-4 text-center">
        <Award className="h-5 w-5 text-amber-500 mx-auto mb-1" />
        <p className="text-2xl font-bold">{stats.passRate}%</p>
        <p className="text-xs text-muted-foreground">Pass Rate</p>
      </CardContent></Card>
    </div>
  );
}
