import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  TriangleAlert, Clock, Users, CreditCard, User as UserIcon,
  Calendar, ShieldCheck, AwardIcon, BarChart3,
  ListChecks, Repeat2, TrendingUp, BookOpenCheck, Award,
  FileText, Search, Settings, Banknote,
} from "lucide-react";
import { t } from "./tokens";
import { useDayLessons } from "@/hooks/useDayLessons";
import { useDailyEarnings } from "@/hooks/useDailyEarnings";
import { useInstructorLiveStats } from "@/hooks/useInstructorLiveStats";
import { useInstructorDashboardStats } from "@/hooks/useInstructorDashboardStats";

interface Pupil {
  id: string;
  name: string;
  account_balance: number | null;
}

interface Props {
  instructorId: string;
  instructorName?: string | null;
  pupils: Pupil[];
  todaysLessonCount: number;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

// ---------------- Greeting ----------------
function Greeting({ name, greeting, date }: { name: string; greeting: string; date: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: t.navy, letterSpacing: -0.4, marginBottom: 2 }}>
        {greeting}, {name}
      </h1>
      <p style={{ fontSize: 12, color: t.muted, fontWeight: 300 }}>{date} · perfect for catching up</p>
    </div>
  );
}

// ---------------- AlertBanner ----------------
function AlertBanner({ message, link }: { message: string; link?: { href: string; label: string } }) {
  return (
    <div style={{
      backgroundColor: t.amberLight, border: "1px solid #FDE68A", borderRadius: 9,
      padding: "9px 14px", display: "flex", alignItems: "center", gap: 9,
      marginBottom: 14, fontSize: 12, color: "#78350F", fontWeight: 500,
    }}>
      <TriangleAlert size={14} color={t.amber} />
      <span>{message}</span>
      {link && (
        <Link to={link.href} style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: t.amber, textDecoration: "none", whiteSpace: "nowrap" }}>
          {link.label} →
        </Link>
      )}
    </div>
  );
}

// ---------------- QuickActionRow ----------------
type QA = { label: string; Icon: any; iconBg: string; iconColor: string; sub: string; href: string };
function QuickActionRow({ items }: { items: QA[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
      {items.map((qa) => (
        <Link key={qa.label} to={qa.href} style={{ textDecoration: "none" }}>
          <div style={{
            backgroundColor: t.white, border: `1px solid ${t.border}`, borderRadius: 10,
            padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, backgroundColor: qa.iconBg,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <qa.Icon size={16} color={qa.iconColor} strokeWidth={1.8} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.navy, marginBottom: 1 }}>{qa.label}</div>
              <div style={{ fontSize: 10, color: t.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{qa.sub}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ---------------- StatsRow ----------------
type StatDef = { label: string; value: string; sub: string; pct: number; bar: string };
function StatsRow({ stats }: { stats: StatDef[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginBottom: 14 }}>
      {stats.map((s) => (
        <div key={s.label} style={{ backgroundColor: t.white, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
            {s.label}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: t.navy, letterSpacing: -0.5, lineHeight: 1, marginBottom: 2 }}>
            {s.value}
          </div>
          <div style={{ fontSize: 10, color: t.muted, fontWeight: 300 }}>{s.sub}</div>
          <div style={{ height: 3, borderRadius: 2, backgroundColor: t.surface, marginTop: 8, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 2, backgroundColor: s.bar, width: `${Math.min(100, Math.max(0, s.pct))}%`, transition: "width 0.4s ease" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------- ScheduleCard ----------------
type LessonRow = { time: string; name: string; source: string; duration?: string; colour?: string };
function ScheduleCard({ instructorId }: { instructorId: string }) {
  const [tab, setTab] = useState<"Today" | "Tomorrow" | "+3 days">("Today");

  const offsetDate = useMemo(() => {
    const d = new Date();
    if (tab === "Tomorrow") d.setDate(d.getDate() + 1);
    if (tab === "+3 days") d.setDate(d.getDate() + 3);
    return d;
  }, [tab]);

  const { data: lessons = [] } = useDayLessons(instructorId, offsetDate);

  const rows: LessonRow[] = lessons.map((l) => ({
    time: l.startTime?.slice(0, 5) ?? "",
    name: l.pupilName,
    source: l.googleEventId ? "Google Calendar" : "Drive365 booking",
    duration: l.durationMinutes ? `${l.durationMinutes}m` : undefined,
    // Drive365 blue, GCal amber, cancelled red (already filtered by hook)
    colour: l.googleEventId ? t.amber : t.blue,
  }));

  return (
    <div style={{ backgroundColor: t.white, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden" }}>
      <div style={{ padding: "11px 14px", borderBottom: `1px solid ${t.divider}`, display: "flex", alignItems: "center", gap: 7 }}>
        <Calendar size={14} color={t.muted} />
        <span style={{ fontSize: 11, fontWeight: 700, color: t.navy, textTransform: "uppercase", letterSpacing: "0.05em", flex: 1 }}>
          Schedule
        </span>
        <Link to="/instructor/schedule" style={{ fontSize: 11, fontWeight: 500, color: t.blue, textDecoration: "none" }}>
          View all →
        </Link>
      </div>
      <div style={{ display: "flex", borderBottom: `1px solid ${t.divider}` }}>
        {(["Today", "Tomorrow", "+3 days"] as const).map((tabLabel) => (
          <div
            key={tabLabel}
            onClick={() => setTab(tabLabel)}
            style={{
              flex: 1, padding: "8px 10px", fontSize: 11, fontWeight: 500,
              color: tab === tabLabel ? t.navy : t.muted,
              borderBottom: `2px solid ${tab === tabLabel ? t.blue : "transparent"}`,
              cursor: "pointer", textAlign: "center", transition: "all 0.15s",
            }}
          >
            {tabLabel}
          </div>
        ))}
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 12, color: t.muted }}>No lessons scheduled</div>
      ) : (
        rows.map((lesson, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
            borderBottom: i < rows.length - 1 ? `1px solid ${t.divider}` : "none",
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: t.navy, width: 36, flexShrink: 0 }}>{lesson.time}</span>
            <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: lesson.colour ?? t.blue, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: t.navy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {lesson.name}
              </div>
              <div style={{ fontSize: 10, color: t.muted }}>{lesson.source}</div>
            </div>
            {lesson.duration && (
              <span style={{ fontSize: 10, fontWeight: 600, backgroundColor: t.surface, color: t.mid, borderRadius: 4, padding: "1px 6px", flexShrink: 0 }}>
                {lesson.duration}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ---------------- DvsaStandardsCard ----------------
function DvsaStandardsCard({ standardsCheck }: { standardsCheck: { result: string; at: string } | null }) {
  const navigate = useNavigate();
  const hasResults = !!standardsCheck;

  return (
    <div style={{ backgroundColor: t.white, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden" }}>
      <div style={{ padding: "11px 14px", borderBottom: `1px solid ${t.divider}`, display: "flex", alignItems: "center", gap: 7 }}>
        <ShieldCheck size={14} color={t.muted} />
        <span style={{ fontSize: 11, fontWeight: 700, color: t.navy, textTransform: "uppercase", letterSpacing: "0.05em", flex: 1 }}>
          DVSA standards check
        </span>
        <Link to="/instructor/standards-check" style={{ fontSize: 11, fontWeight: 500, color: t.blue, textDecoration: "none" }}>
          {hasResults ? "View →" : "Log result →"}
        </Link>
      </div>
      {hasResults ? (
        <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Latest result
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: t.navy, letterSpacing: -0.3 }}>
            {standardsCheck!.result}
          </div>
          <div style={{ fontSize: 11, color: t.muted }}>
            {format(new Date(standardsCheck!.at), "d MMM yyyy")}
          </div>
        </div>
      ) : (
        <div style={{ padding: "28px 16px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 7 }}>
          <AwardIcon size={28} color={t.placeholder} />
          <p style={{ fontSize: 11, color: t.muted, lineHeight: 1.5, maxWidth: 220 }}>
            No driving test results logged yet. Log your first DVSA standards check to track your performance.
          </p>
          <button
            onClick={() => navigate("/instructor/standards-check")}
            style={{
              backgroundColor: t.navy, border: "none", borderRadius: 7, padding: "7px 14px",
              fontSize: 11, fontWeight: 600, color: t.white, cursor: "pointer",
              fontFamily: "inherit", marginTop: 4,
            }}
          >
            Log a result
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------- EarningsCard ----------------
function EarningsCard({ balance, outstanding, outstandingPct, monthTarget, hoursTaught }: {
  balance: number; outstanding: number; outstandingPct: number;
  monthTarget?: number | null; hoursTaught: number;
}) {
  const balanceColour = balance >= 0 ? t.green : t.red;
  return (
    <div style={{ backgroundColor: t.white, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden" }}>
      <div style={{ padding: "11px 14px", borderBottom: `1px solid ${t.divider}`, display: "flex", alignItems: "center", gap: 7 }}>
        <Banknote size={14} color={t.muted} />
        <span style={{ fontSize: 11, fontWeight: 700, color: t.navy, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Earnings
        </span>
      </div>
      <div style={{ padding: "12px 14px", borderBottom: `1px solid ${t.divider}` }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
          Account balance
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: balanceColour, letterSpacing: -0.3, marginBottom: 2 }}>
          £{balance.toFixed(2)}
        </div>
        <div style={{ fontSize: 10, fontWeight: 300, color: t.muted }}>{balance >= 0 ? "All balanced" : "Negative balance"}</div>
        <div style={{ height: 3, borderRadius: 2, backgroundColor: t.surface, marginTop: 7, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 2, backgroundColor: balanceColour, width: "100%" }} />
        </div>
      </div>
      <div style={{ padding: "12px 14px", borderBottom: `1px solid ${t.divider}` }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
          Outstanding
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: t.red, letterSpacing: -0.3, marginBottom: 2 }}>
          £{outstanding.toFixed(2)}
        </div>
        <div style={{ fontSize: 10, fontWeight: 300, color: t.muted }}>{outstanding > 0 ? "Needs chasing now" : "Nothing outstanding"}</div>
        <div style={{ height: 3, borderRadius: 2, backgroundColor: t.surface, marginTop: 7, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 2, backgroundColor: t.red, width: `${Math.min(100, Math.max(0, outstandingPct))}%` }} />
        </div>
      </div>
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${t.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 11, color: t.muted }}>Month target</div>
        {monthTarget != null ? (
          <div style={{ fontSize: 13, fontWeight: 700, color: t.navy }}>£{monthTarget.toLocaleString()}</div>
        ) : (
          <Link to="/instructor/settings" style={{ fontSize: 11, fontWeight: 600, color: t.blue, textDecoration: "none" }}>
            Set target →
          </Link>
        )}
      </div>
      <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 11, color: t.muted }}>Hours taught</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: t.navy }}>{hoursTaught}h</div>
      </div>
    </div>
  );
}

// ---------------- FunctionTilesGrid ----------------
type Tile = { label: string; Icon: any; iconBg: string; iconColor: string; accent: string; stat: string; href: string };
function FunctionTilesGrid({ tiles }: { tiles: Tile[] }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: t.navy }}>All functions</div>
        <div style={{ fontSize: 11, color: t.muted }}>Click to open</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginBottom: 14 }}>
        {tiles.map((tile) => (
          <Link key={tile.label} to={tile.href} style={{ textDecoration: "none" }}>
            <div style={{
              backgroundColor: t.white, border: `1px solid ${t.border}`, borderRadius: 10,
              padding: 12, cursor: "pointer", display: "flex", flexDirection: "column", gap: 7,
            }}>
              <div style={{ height: 2, borderRadius: 1, backgroundColor: tile.accent, width: 24 }} />
              <div style={{
                width: 30, height: 30, borderRadius: 8, backgroundColor: tile.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <tile.Icon size={15} color={tile.iconColor} strokeWidth={1.8} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.navy }}>{tile.label}</div>
              <div style={{ fontSize: 10, fontWeight: 500, color: t.muted }}>{tile.stat}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Main hybrid dashboard
// ============================================================
export function HybridDashboard({ instructorId, instructorName, pupils, todaysLessonCount }: Props) {
  const firstName = (instructorName?.split(" ")[0]) || "there";
  const today = format(new Date(), "EEEE d MMMM yyyy");
  const greeting = getGreeting();

  const { hoursThisWeek, monthEarnings } = useInstructorLiveStats(instructorId);
  const { data: earningsData } = useDailyEarnings(instructorId);
  const { data: stats2 } = useInstructorDashboardStats(instructorId);

  const owing = pupils.filter((p) => (p.account_balance ?? 0) < 0);
  const outstandingTotal = owing.reduce((sum, p) => sum + Math.abs(p.account_balance ?? 0), 0);
  // Treat sum of positive balances as the "account balance" total
  const positiveBalance = pupils.reduce((sum, p) => sum + Math.max(0, p.account_balance ?? 0), 0);

  // Quick actions
  const quickActions: QA[] = [
    { label: "Availability", Icon: Clock,       iconBg: t.blueLight, iconColor: t.blue,  sub: "Manage your diary",                                href: "/instructor/schedule" },
    { label: "Pupils",       Icon: Users,        iconBg: t.blueLight, iconColor: t.blue,  sub: `${pupils.length} active`,                          href: "/instructor/pupils" },
    { label: "Payments",     Icon: CreditCard,   iconBg: t.greenLight, iconColor: t.green, sub: outstandingTotal > 0 ? `£${outstandingTotal.toFixed(0)} outstanding` : "All up to date", href: "/instructor/pay" },
    { label: "Profile",      Icon: UserIcon,     iconBg: t.redLight,  iconColor: t.red,   sub: "Keep details current",                             href: "/instructor/settings/profile" },
  ];

  // Stats — wire what exists, TODO for the rest
  const stats: StatDef[] = [
    {
      label: "Pupils",
      value: String(pupils.length),
      sub: `${owing.length} owe money`,
      pct: pupils.length ? Math.min(100, pupils.length * 4) : 0,
      bar: t.blue,
    },
    {
      label: "Payments",
      value: `£${monthEarnings.toLocaleString()}`,
      sub: "This month",
      pct: monthEarnings > 0 ? 100 : 0,
      bar: t.green,
    },
    {
      label: "Lessons booked",
      value: stats2 ? String(stats2.lessonsThisMonth) : "—",
      sub: "This month",
      pct: stats2 && stats2.lessonsThisMonth > 0 ? Math.min(100, stats2.lessonsThisMonth * 2) : 0,
      bar: t.blue,
    },
    {
      label: "Pass rate",
      value: stats2?.passRatePct != null ? `${stats2.passRatePct}%` : "—",
      sub: stats2 && stats2.passRateSampleSize > 0
        ? `${stats2.passRateSampleSize} test${stats2.passRateSampleSize !== 1 ? "s" : ""} · 12 mo`
        : "No results yet",
      pct: stats2?.passRatePct ?? 0,
      bar: t.red,
    },
    {
      label: "Tests booked",
      value: stats2 ? String(stats2.testsBooked) : "—",
      sub: "Upcoming",
      pct: stats2 && stats2.testsBooked > 0 ? Math.min(100, stats2.testsBooked * 10) : 0,
      bar: t.amber,
    },
    {
      label: "Cancelled",
      value: stats2 ? String(stats2.cancelledThisMonth) : "—",
      sub: "This month",
      pct: stats2 && stats2.cancelledThisMonth > 0 ? Math.min(100, stats2.cancelledThisMonth * 5) : 0,
      bar: t.red,
    },
  ];

  // Function tiles — labels/stats wired where possible, '—' otherwise
  const tiles: Tile[] = [
    { label: "Schedule",     Icon: Calendar,      iconBg: t.blueLight,   iconColor: t.blue,  accent: t.blue,  stat: `${todaysLessonCount} today`,           href: "/instructor/schedule" },
    { label: "Pupils",       Icon: Users,         iconBg: t.blueLight,   iconColor: t.blue,  accent: t.blue,  stat: `${pupils.length} active`,              href: "/instructor/pupils" },
    { label: "Waiting list", Icon: ListChecks,    iconBg: t.blueLight,   iconColor: t.blue,  accent: t.blue,  stat: stats2 ? `${stats2.waitingListCount} waiting` : "—", href: "/instructor/waiting-list" },
    { label: "Payments",     Icon: CreditCard,    iconBg: t.greenLight,  iconColor: t.green, accent: t.green, stat: `£${outstandingTotal.toFixed(0)} due`,  href: "/instructor/pay" },
    { label: "Test swap",    Icon: Repeat2,       iconBg: t.redLight,    iconColor: t.red,   accent: t.red,   stat: stats2 ? `${stats2.testSwapOpenCount} open` : "—", href: "/instructor/test-requests" },
    { label: "Progress",     Icon: TrendingUp,    iconBg: t.blueLight,   iconColor: t.blue,  accent: t.blue,  stat: "Open",                                 href: "/instructor/pupils" },
    { label: "Courses",      Icon: BookOpenCheck, iconBg: t.blueLight,   iconColor: t.blue,  accent: t.blue,  stat: stats2 ? `${stats2.coursesCount} active` : "—", href: "/instructor/course-planner" },
    { label: "CPD log",      Icon: Award,         iconBg: t.blueSurface, iconColor: t.navy,  accent: t.navy,  stat: stats2 ? (stats2.cpdTarget != null ? `${stats2.cpdThisYear} / ${stats2.cpdTarget}` : `${stats2.cpdThisYear} this year`) : "—", href: "/instructor/cpd" },
    { label: "Invoices",     Icon: FileText,      iconBg: t.greenLight,  iconColor: t.green, accent: t.green, stat: stats2 ? `${stats2.invoicesUnpaid} unpaid` : "—", href: "/instructor/pay" },
    { label: "Find a slot",  Icon: Search,        iconBg: t.blueLight,   iconColor: t.blue,  accent: t.blue,  stat: "Open",                                 href: "/instructor/find-appointment" },
    { label: "Settings",     Icon: Settings,      iconBg: t.blueSurface, iconColor: t.navy,  accent: t.navy,  stat: "Open",                                 href: "/instructor/settings" },
    { label: "DVSA check",   Icon: ShieldCheck,   iconBg: t.amberLight,  iconColor: t.amber, accent: t.amber, stat: stats2?.standardsCheck?.result ?? "—",  href: "/instructor/standards-check" },
  ];

  // TODO: derive hasAlert from real signals (overdue payments, expired docs, etc.)
  const hasAlert = outstandingTotal > 0;

  // Best-effort outstanding bar: outstanding / (outstanding + month earnings)
  const outstandingPct = outstandingTotal > 0
    ? Math.min(100, (outstandingTotal / Math.max(1, outstandingTotal + monthEarnings)) * 100)
    : 0;

  return (
    <div style={{ padding: "18px 20px", backgroundColor: t.surface, minHeight: "100%" }}>
      <Greeting name={firstName} greeting={greeting} date={today} />

      {hasAlert && (
        <AlertBanner
          message={`£${outstandingTotal.toFixed(0)} outstanding across ${owing.length} pupil${owing.length !== 1 ? "s" : ""}.`}
          link={{ href: "/instructor/pay", label: "Chase now" }}
        />
      )}

      <QuickActionRow items={quickActions} />
      <StatsRow stats={stats} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 10, marginBottom: 14 }}>
        <DvsaStandardsCard standardsCheck={stats2?.standardsCheck ?? null} />
        <EarningsCard
          balance={positiveBalance}
          outstanding={outstandingTotal}
          outstandingPct={outstandingPct}
          monthTarget={null /* TODO: bind to monthly goal hook */}
          hoursTaught={hoursThisWeek}
        />
      </div>

      <div
        style={{
          background: t.card,
          border: `1px solid ${t.border}`,
          borderRadius: 16,
          padding: "14px 6px 6px",
          marginBottom: 14,
          boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px 8px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Schedule</div>
          <Link to="/instructor/schedule" style={{ fontSize: 11, fontWeight: 500, color: t.blue, textDecoration: "none" }}>
            Open full schedule →
          </Link>
        </div>
        <div style={{ maxHeight: 640, overflowY: "auto" }}>
          <MultiDayScheduleView instructorId={instructorId} />
        </div>
      </div>

      <FunctionTilesGrid tiles={tiles} />
    </div>
  );
}
