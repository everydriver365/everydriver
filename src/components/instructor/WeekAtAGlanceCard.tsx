import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
} from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Calendar, MessageCircle, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { a11yPx } from "@/lib/a11yScale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PeriodKey = "this-week" | "last-week" | "two-weeks" | "this-month" | "last-month";

interface PeriodOption {
  key: PeriodKey;
  label: string;
  range: () => { start: Date; end: Date };
  previousRange: () => { start: Date; end: Date };
}

const PERIODS: PeriodOption[] = [
  {
    key: "this-week",
    label: "This week",
    range: () => {
      const now = new Date();
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    },
    previousRange: () => {
      const ref = subWeeks(new Date(), 1);
      return { start: startOfWeek(ref, { weekStartsOn: 1 }), end: endOfWeek(ref, { weekStartsOn: 1 }) };
    },
  },
  {
    key: "last-week",
    label: "Last week",
    range: () => {
      const ref = subWeeks(new Date(), 1);
      return { start: startOfWeek(ref, { weekStartsOn: 1 }), end: endOfWeek(ref, { weekStartsOn: 1 }) };
    },
    previousRange: () => {
      const ref = subWeeks(new Date(), 2);
      return { start: startOfWeek(ref, { weekStartsOn: 1 }), end: endOfWeek(ref, { weekStartsOn: 1 }) };
    },
  },
  {
    key: "two-weeks",
    label: "2 weeks ago",
    range: () => {
      const ref = subWeeks(new Date(), 2);
      return { start: startOfWeek(ref, { weekStartsOn: 1 }), end: endOfWeek(ref, { weekStartsOn: 1 }) };
    },
    previousRange: () => {
      const ref = subWeeks(new Date(), 3);
      return { start: startOfWeek(ref, { weekStartsOn: 1 }), end: endOfWeek(ref, { weekStartsOn: 1 }) };
    },
  },
  {
    key: "this-month",
    label: "This month",
    range: () => {
      const now = new Date();
      return { start: startOfMonth(now), end: endOfMonth(now) };
    },
    previousRange: () => {
      const ref = subMonths(new Date(), 1);
      return { start: startOfMonth(ref), end: endOfMonth(ref) };
    },
  },
  {
    key: "last-month",
    label: "Last month",
    range: () => {
      const ref = subMonths(new Date(), 1);
      return { start: startOfMonth(ref), end: endOfMonth(ref) };
    },
    previousRange: () => {
      const ref = subMonths(new Date(), 2);
      return { start: startOfMonth(ref), end: endOfMonth(ref) };
    },
  },
];

const TXT = {
  primary: "#000000",
  secondary: "#6E6E73",
  hairline: "#E5E5EA",
  blue: "#2B7BC8",
};

function formatRange(start: Date, end: Date) {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const sameYear = start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${format(start, "EEE d")} – ${format(end, "EEE d")}`;
  }
  if (sameYear) {
    return `${format(start, "EEE d MMM")} – ${format(end, "EEE d MMM")}`;
  }
  return `${format(start, "EEE d MMM")} – ${format(end, "EEE d MMM yyyy")}`;
}

interface PeriodTotals {
  lessons: number;
  earnings: number;
  messages: number;
}

async function fetchPeriodTotals(
  instructorId: string,
  start: Date,
  end: Date
): Promise<PeriodTotals> {
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  const [lessonsRes, instructorRes, conversationsRes] = await Promise.all([
    supabase
      .from("scheduled_lessons")
      .select("duration_minutes, amount_due")
      .eq("instructor_id", instructorId)
      .gte("lesson_date", startStr)
      .lte("lesson_date", endStr)
      .neq("status", "cancelled"),
    supabase.from("instructors").select("hourly_rate").eq("id", instructorId).maybeSingle(),
    supabase.from("conversations").select("id").eq("instructor_id", instructorId),
  ]);

  const lessons = lessonsRes.data ?? [];
  const hourlyRate = instructorRes.data?.hourly_rate ?? 35;
  const minutes = lessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
  const earnings = Math.round((minutes / 60) * hourlyRate);

  let messages = 0;
  const convIds = (conversationsRes.data ?? []).map((c) => c.id);
  if (convIds.length > 0) {
    const startIso = new Date(start).toISOString();
    const endIso = new Date(end.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
    const { data: msgs } = await supabase
      .from("messages")
      .select("conversation_id")
      .in("conversation_id", convIds)
      .gte("created_at", startIso)
      .lte("created_at", endIso);
    const distinct = new Set((msgs ?? []).map((m) => m.conversation_id));
    messages = distinct.size;
  }

  return { lessons: lessons.length, earnings, messages };
}

function usePeriodStats(instructorId: string | undefined, period: PeriodOption) {
  const current = period.range();
  const previous = period.previousRange();

  const currentQuery = useQuery({
    queryKey: ["week-glance-totals", instructorId, period.key, "current"],
    queryFn: () => fetchPeriodTotals(instructorId!, current.start, current.end),
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });

  const previousQuery = useQuery({
    queryKey: ["week-glance-totals", instructorId, period.key, "previous"],
    queryFn: () => fetchPeriodTotals(instructorId!, previous.start, previous.end),
    enabled: !!instructorId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    current: currentQuery.data,
    previous: previousQuery.data,
    isLoading: currentQuery.isLoading || previousQuery.isLoading,
    range: current,
  };
}

type TrendVariant = "up" | "down" | "flat" | "new";

interface TrendInfo {
  variant: TrendVariant;
  pct: number | null;
}

function computeTrend(current: number, previous: number | undefined): TrendInfo {
  if (previous === undefined) return { variant: "flat", pct: null };
  if (previous === 0 && current === 0) return { variant: "flat", pct: null };
  if (previous === 0 && current > 0) return { variant: "new", pct: null };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { variant: "flat", pct: 0 };
  return { variant: pct > 0 ? "up" : "down", pct: Math.abs(pct) };
}

function TrendPill({ trend }: { trend: TrendInfo }) {
  let bg = "#F2F2F4";
  let color = TXT.secondary;
  let icon: React.ReactNode = <span style={{ fontSize: 10, lineHeight: 1, color }}>—</span>;
  let label: React.ReactNode = null;

  if (trend.variant === "up") {
    bg = "#E8F3E8";
    color = "#3B8B3B";
    icon = <ArrowUp size={8} strokeWidth={1.6} color={color} />;
    label = trend.pct;
  } else if (trend.variant === "down") {
    bg = "#FBEAEC";
    color = "#C8434F";
    icon = <ArrowDown size={8} strokeWidth={1.6} color={color} />;
    label = trend.pct;
  } else if (trend.variant === "new") {
    bg = "#E8F3E8";
    color = "#3B8B3B";
    icon = null;
    label = "New";
  }

  return (
    <span
      style={{
        background: bg,
        borderRadius: 4,
        padding: "1px 5px",
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        color,
        fontSize: 9,
        fontWeight: 500,
        lineHeight: 1.2,
      }}
    >
      {icon}
      {label !== null && <span>{label}</span>}
    </span>
  );
}

interface MiniStatProps {
  iconBg: string;
  icon: React.ReactNode;
  value: string;
  label: string;
  trend: TrendInfo;
  onClick: () => void;
}

function MiniStat({ iconBg, icon, value, label, trend, onClick }: MiniStatProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "#FFFFFF",
        border: `0.5px solid ${TXT.hairline}`,
        borderRadius: 10,
        padding: 12,
        textAlign: "left",
        width: "100%",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: iconBg,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </span>
        <TrendPill trend={trend} />
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 500,
          color: TXT.primary,
          letterSpacing: "-0.3px",
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: TXT.secondary, margin: "1px 0 0" }}>{label}</div>
    </button>
  );
}

interface WeekAtAGlanceCardProps {
  instructorId: string | undefined;
}

export function WeekAtAGlanceCard({ instructorId }: WeekAtAGlanceCardProps) {
  const navigate = useNavigate();
  const [periodKey, setPeriodKey] = useState<PeriodKey>("this-week");
  const period = PERIODS.find((p) => p.key === periodKey) ?? PERIODS[0];
  const { current, previous, range } = usePeriodStats(instructorId, period);

  const lessons = current?.lessons ?? 0;
  const earnings = current?.earnings ?? 0;
  const messages = current?.messages ?? 0;

  const lessonTrend = useMemo(() => computeTrend(lessons, previous?.lessons), [lessons, previous]);
  const earningsTrend = useMemo(
    () => computeTrend(earnings, previous?.earnings),
    [earnings, previous]
  );
  const messagesTrend = useMemo(
    () => computeTrend(messages, previous?.messages),
    [messages, previous]
  );

  const currencyFormatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  });

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: `0.5px solid ${TXT.hairline}`,
        borderRadius: a11yPx(12),
        padding: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: TXT.secondary,
            letterSpacing: "0.3px",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          {period.label}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
                color: TXT.blue,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <span>{formatRange(range.start, range.end)}</span>
              <ChevronDown size={10} strokeWidth={1.6} color={TXT.blue} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {PERIODS.map((opt) => (
              <DropdownMenuItem key={opt.key} onSelect={() => setPeriodKey(opt.key)}>
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        <MiniStat
          iconBg="#E6F1FB"
          icon={<Calendar size={14} strokeWidth={2} color="#2B7BC8" />}
          value={lessons.toLocaleString("en-GB")}
          label="Lessons"
          trend={lessonTrend}
          onClick={() => navigate("/instructor/schedule")}
        />
        <MiniStat
          iconBg="#E8F3E8"
          icon={
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#3B8B3B",
                lineHeight: 1,
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              £
            </span>
          }
          value={currencyFormatter.format(earnings)}
          label="Earned"
          trend={earningsTrend}
          onClick={() => navigate("/instructor/pay")}
        />
        <MiniStat
          iconBg="#FBF1DE"
          icon={<MessageCircle size={14} strokeWidth={2} color="#B8801F" />}
          value={messages.toLocaleString("en-GB")}
          label="Messages"
          trend={messagesTrend}
          onClick={() => navigate("/instructor/messages")}
        />
      </div>
    </div>
  );
}
