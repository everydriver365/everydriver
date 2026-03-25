import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, Calculator, PoundSterling, Users } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell,
} from "recharts";

const SQUARE_RATE = 1.4;
const SQUARE_FIXED = 25; // pence

interface TierScenario {
  label: string;
  ratePercent: number;
  fixedPence: number;
  colour: string;
}

const TIERS: TierScenario[] = [
  { label: "Free (2% + 25p)", ratePercent: 2.0, fixedPence: 25, colour: "hsl(var(--primary))" },
  { label: "Paid (1.5% + 25p)", ratePercent: 1.5, fixedPence: 25, colour: "hsl(var(--chart-2, 142 71% 45%))" },
];

function profitPerTx(tier: TierScenario, avgTx: number) {
  const ourFee = avgTx * (tier.ratePercent / 100) + tier.fixedPence / 100;
  const squareCost = avgTx * (SQUARE_RATE / 100) + SQUARE_FIXED / 100;
  return Math.round((ourFee - squareCost) * 100) / 100;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(v);

export function ProfitProjectionDashboard() {
  const [instructorCount, setInstructorCount] = useState(50);
  const [paidPct, setPaidPct] = useState(30); // % on paid plans
  const [avgTxAmount, setAvgTxAmount] = useState(40);
  const [txPerInstructor, setTxPerInstructor] = useState(8); // per month

  const paidCount = Math.round(instructorCount * (paidPct / 100));
  const freeCount = instructorCount - paidCount;
  const totalTxPerMonth = instructorCount * txPerInstructor;

  // Monthly projections across different instructor volumes
  const projectionData = useMemo(() => {
    const points = [10, 25, 50, 100, 150, 200, 300, 500];
    return points.map((count) => {
      const paid = Math.round(count * (paidPct / 100));
      const free = count - paid;
      const freeTx = free * txPerInstructor;
      const paidTx = paid * txPerInstructor;

      const freeProfit = freeTx * profitPerTx(TIERS[0], avgTxAmount);
      const paidTxProfit = paidTx * profitPerTx(TIERS[1], avgTxAmount);
      const subRevenue = paid * 7.99;
      const totalMonthly = freeProfit + paidTxProfit + subRevenue;

      return {
        instructors: count,
        "Service Fees": Math.round((freeProfit + paidTxProfit) * 100) / 100,
        Subscriptions: Math.round(subRevenue * 100) / 100,
        Total: Math.round(totalMonthly * 100) / 100,
      };
    });
  }, [paidPct, txPerInstructor, avgTxAmount]);

  // Current scenario breakdown
  const freeTxTotal = freeCount * txPerInstructor;
  const paidTxTotal = paidCount * txPerInstructor;
  const monthlyFreeProfit = freeTxTotal * profitPerTx(TIERS[0], avgTxAmount);
  const monthlyPaidTxProfit = paidTxTotal * profitPerTx(TIERS[1], avgTxAmount);
  const monthlySubRevenue = paidCount * 7.99;
  const monthlyTotal = monthlyFreeProfit + monthlyPaidTxProfit + monthlySubRevenue;
  const annualTotal = monthlyTotal * 12;

  const breakdownData = [
    { name: "Free Tier Fees", value: Math.round(monthlyFreeProfit * 100) / 100 },
    { name: "Paid Tier Fees", value: Math.round(monthlyPaidTxProfit * 100) / 100 },
    { name: "Subscriptions", value: Math.round(monthlySubRevenue * 100) / 100 },
  ].filter((d) => d.value > 0);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2, 142 71% 45%))", "hsl(var(--chart-4, 280 65% 60%))"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Calculator className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Profit Projection Calculator</h3>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Instructors: {instructorCount}</Label>
              <Slider
                value={[instructorCount]}
                onValueChange={([v]) => setInstructorCount(v)}
                min={5}
                max={500}
                step={5}
              />
              <p className="text-[10px] text-muted-foreground">Total instructors on platform</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Paid subscribers: {paidPct}%</Label>
              <Slider
                value={[paidPct]}
                onValueChange={([v]) => setPaidPct(v)}
                min={0}
                max={100}
                step={5}
              />
              <p className="text-[10px] text-muted-foreground">{paidCount} paid / {freeCount} free</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Avg transaction: £{avgTxAmount}</Label>
              <Slider
                value={[avgTxAmount]}
                onValueChange={([v]) => setAvgTxAmount(v)}
                min={20}
                max={200}
                step={5}
              />
              <p className="text-[10px] text-muted-foreground">Average payment amount per lesson</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Transactions/instructor/month: {txPerInstructor}</Label>
              <Slider
                value={[txPerInstructor]}
                onValueChange={([v]) => setTxPerInstructor(v)}
                min={1}
                max={30}
                step={1}
              />
              <p className="text-[10px] text-muted-foreground">{totalTxPerMonth} total transactions/month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <PoundSterling className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{fmt(monthlyTotal)}</p>
                <p className="text-[10px] text-muted-foreground">Monthly Profit</p>
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
                <p className="text-xl font-bold text-foreground">{fmt(annualTotal)}</p>
                <p className="text-[10px] text-muted-foreground">Annual Profit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{fmt(profitPerTx(TIERS[0], avgTxAmount))}</p>
                <p className="text-[10px] text-muted-foreground">Profit/Tx (Free)</p>
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
                <p className="text-xl font-bold text-foreground">{fmt(profitPerTx(TIERS[1], avgTxAmount))}</p>
                <p className="text-[10px] text-muted-foreground">Profit/Tx (Paid)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projection Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5" /> Profit by Instructor Volume (Monthly)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="instructors" fontSize={12} label={{ value: "Instructors", position: "bottom", offset: -5, fontSize: 11 }} />
              <YAxis fontSize={12} tickFormatter={(v) => `£${v}`} />
              <Tooltip formatter={(v: number) => [`£${v.toFixed(2)}`, ""]} />
              <Legend />
              <Line type="monotone" dataKey="Service Fees" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Subscriptions" stroke="hsl(var(--chart-4, 280 65% 60%))" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Total" stroke="hsl(var(--chart-2, 142 71% 45%))" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={breakdownData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" fontSize={12} tickFormatter={(v) => `£${v}`} />
              <YAxis type="category" dataKey="name" fontSize={11} width={110} />
              <Tooltip formatter={(v: number) => [`£${v.toFixed(2)}`, ""]} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {breakdownData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Fee comparison table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fee Structure vs Square Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground">Tier</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Our Fee</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Square Cost</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Profit/Tx</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Margin</th>
                </tr>
              </thead>
              <tbody>
                {TIERS.map((tier) => {
                  const ourFee = avgTxAmount * (tier.ratePercent / 100) + tier.fixedPence / 100;
                  const squareCost = avgTxAmount * (SQUARE_RATE / 100) + SQUARE_FIXED / 100;
                  const profit = ourFee - squareCost;
                  const margin = ourFee > 0 ? (profit / ourFee) * 100 : 0;
                  return (
                    <tr key={tier.label} className="border-b border-border/50">
                      <td className="py-2 font-medium text-foreground">{tier.label}</td>
                      <td className="py-2 text-right text-foreground">{fmt(ourFee)}</td>
                      <td className="py-2 text-right text-muted-foreground">{fmt(squareCost)}</td>
                      <td className="py-2 text-right font-semibold text-primary">{fmt(profit)}</td>
                      <td className="py-2 text-right text-muted-foreground">{margin.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">
            Based on £{avgTxAmount} average transaction. Square base cost: {SQUARE_RATE}% + {SQUARE_FIXED}p.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
