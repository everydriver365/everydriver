import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PoundSterling, TrendingUp, Users } from "lucide-react";
import { useSchoolDemo } from "@/context/SchoolDemoContext";

interface Props {
  instructorIds: string[];
}

interface Stats {
  totalRevenue: number;
  totalPayments: number;
  avgPayment: number;
}

export default function SchoolRevenueAnalyticsSection({ instructorIds }: Props) {
  const { isDemo } = useSchoolDemo();
  const [stats, setStats] = useState<Stats>({ totalRevenue: 0, totalPayments: 0, avgPayment: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setStats({ totalRevenue: 24750, totalPayments: 89, avgPayment: 278.09 });
      setLoading(false);
      return;
    }
    if (!instructorIds.length) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("payment_history")
        .select("amount")
        .in("instructor_id", instructorIds);
      const payments = data || [];
      const total = payments.reduce((s, p: any) => s + (p.amount || 0), 0);
      setStats({
        totalRevenue: total,
        totalPayments: payments.length,
        avgPayment: payments.length ? total / payments.length : 0,
      });
      setLoading(false);
    };
    fetch();
  }, [instructorIds, isDemo]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const cards = [
    { title: "Total Revenue", value: `£${stats.totalRevenue.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`, icon: PoundSterling },
    { title: "Total Payments", value: stats.totalPayments.toString(), icon: TrendingUp },
    { title: "Avg Payment", value: `£${stats.avgPayment.toFixed(2)}`, icon: Users },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Revenue Analytics</h2>
        <p className="text-muted-foreground">Financial overview for your school</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{c.title}</CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
