import { useState } from "react";
import { useFamulorStats, FamulorPeriod } from "@/hooks/useFamulorStats";
import type { FamulorHubScope } from "../FamulorHub";
import { Phone, PhoneIncoming, PhoneOutgoing, Clock, PoundSterling, Activity, CheckCircle2, XCircle, PhoneOff } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

const ACCENT = "#1A52A0";

interface Props {
  scope: FamulorHubScope;
  instructorId?: string;
  instructorIds?: string[];
}

const PERIODS: { id: FamulorPeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
];

export function FamulorOverviewTab({ scope, instructorId, instructorIds }: Props) {
  const [period, setPeriod] = useState<FamulorPeriod>("7d");
  const { kpis, loading } = useFamulorStats({ scope, instructorId, instructorIds, period });

  const fmtMin = (s: number) => s ? `${Math.floor(s / 60)}m ${s % 60}s` : "0s";
  const fmtGbp = (p: number) => `£${(p / 100).toFixed(2)}`;
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  const purposeRows = Object.entries(kpis.byPurpose).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-4">
      {/* Period switcher */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 rounded-full bg-white border border-[#E5E5EA] p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className="px-3 h-7 text-[12px] rounded-full transition-colors"
              style={{
                backgroundColor: period === p.id ? ACCENT : "transparent",
                color: period === p.id ? "white" : "#6B7280",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        {kpis.liveCount > 0 && (
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            {kpis.liveCount} live now
          </div>
        )}
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={Phone} label="Total calls" value={String(kpis.totalCalls)} sub={`${kpis.inbound} in / ${kpis.outbound} out`} />
        <Kpi icon={CheckCircle2} label="Answer rate" value={pct(kpis.answerRate)} sub={`${kpis.completed} completed`} />
        <Kpi icon={Clock} label="Avg duration" value={fmtMin(kpis.avgDurationSec)} sub="Per completed call" />
        <Kpi icon={PoundSterling} label="Cost" value={fmtGbp(kpis.totalCostPence)} sub="In selected period" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card title="Calls per day">
          {loading || kpis.byDay.length === 0 ? (
            <Empty>{loading ? "Loading…" : "No calls in this period yet."}</Empty>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={kpis.byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F4F8" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="calls" stroke={ACCENT} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="By purpose">
          {purposeRows.length === 0 ? (
            <Empty>No data yet.</Empty>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={purposeRows.map(([k, v]) => ({ purpose: k.replace("_", " "), count: v }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F4F8" />
                <XAxis dataKey="purpose" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill={ACCENT} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini icon={PhoneIncoming} label="Inbound" value={kpis.inbound} colour="#10B981" />
        <Mini icon={PhoneOutgoing} label="Outbound" value={kpis.outbound} colour={ACCENT} />
        <Mini icon={PhoneOff} label="No answer" value={kpis.noAnswer} colour="#F59E0B" />
        <Mini icon={XCircle} label="Failed" value={kpis.failed} colour="#EF4444" />
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[12px] bg-white border border-[#E5E5EA] p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-[22px] font-semibold mt-1">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Mini({ icon: Icon, label, value, colour }: { icon: any; label: string; value: number; colour: string }) {
  return (
    <div className="rounded-[12px] bg-white border border-[#E5E5EA] p-3 flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: `${colour}1A`, color: colour }}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="text-[16px] font-semibold leading-tight">{value}</div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] bg-white border border-[#E5E5EA] p-3">
      <div className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[180px] flex items-center justify-center text-[13px] text-muted-foreground">
      <Activity className="h-4 w-4 mr-2" />{children}
    </div>
  );
}
