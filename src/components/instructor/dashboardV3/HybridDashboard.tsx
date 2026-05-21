import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  TriangleAlert, Clock, Users, CreditCard, User as UserIcon,
  Calendar, ShieldCheck, AwardIcon, BarChart3,
  ListChecks, Repeat2, TrendingUp, BookOpenCheck, Award,
  FileText, Search, Settings, Banknote, Plus, CarFront, MapPin,
} from "lucide-react";
import { t } from "./tokens";
import { useDayLessons } from "@/hooks/useDayLessons";
import { useDailyEarnings } from "@/hooks/useDailyEarnings";
import { useInstructorLiveStats } from "@/hooks/useInstructorLiveStats";
import { useInstructorDashboardStats } from "@/hooks/useInstructorDashboardStats";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { supabase } from "@/integrations/supabase/client";
import { SendAllRemindersDialog } from "@/components/instructor/payments/SendAllRemindersDialog";
import { formatCurrencyCompact, truncateName } from "@/lib/formatters";

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
  onAddLesson?: () => void;
  onAddPupil?: () => void;
  onTakePayment?: () => void;
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
function AlertBanner({ message, link, onAction }: { message: string; link?: { href?: string; label: string; onClick?: () => void }; onAction?: () => void }) {
  const actionStyle: React.CSSProperties = {
    marginLeft: "auto", fontSize: 11, fontWeight: 700, color: t.amber,
    background: "transparent", border: "none", padding: 0, cursor: "pointer",
    textDecoration: "none", whiteSpace: "nowrap",
  };
  return (
    <div style={{
      backgroundColor: t.amberLight, border: "1px solid #FDE68A", borderRadius: 9,
      padding: "9px 14px", display: "flex", alignItems: "center", gap: 9,
      marginBottom: 14, fontSize: 12, color: "#78350F", fontWeight: 500,
    }}>
      <TriangleAlert size={14} color={t.amber} />
      <span>{message}</span>
      {link && (
        onAction ? (
          <button type="button" onClick={onAction} style={actionStyle}>{link.label} →</button>
        ) : link.href ? (
          <Link to={link.href} style={actionStyle as any}>{link.label} →</Link>
        ) : null
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
type StatDef = { label: string; value: string; sub: string; pct: number; bar: string; href?: string; hasData?: boolean; extra?: string };
function StatsRow({ stats }: { stats: StatDef[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginBottom: 14 }}>
      {stats.map((s) => {
        const inner = (
          <div style={{ backgroundColor: t.white, border: `1px solid ${t.border}`, borderRadius: 10, padding: "12px 14px", height: "100%", cursor: s.href ? "pointer" : "default", position: "relative" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: t.navy, letterSpacing: -0.5, lineHeight: 1, marginBottom: 2 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 10, color: t.muted, fontWeight: 300 }}>{s.sub}</div>
            {s.extra && (
              <div style={{ fontSize: 9, color: t.mid, fontWeight: 500, marginTop: 2 }}>{s.extra}</div>
            )}
            <div style={{ height: 3, borderRadius: 2, backgroundColor: t.surface, marginTop: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 2, backgroundColor: s.bar, width: `${Math.min(100, Math.max(0, s.pct))}%`, transition: "width 0.4s ease" }} />
            </div>
            {s.href && s.hasData && (
              <div style={{ fontSize: 10, fontWeight: 600, color: t.blue, marginTop: 6 }}>View →</div>
            )}
          </div>
        );
        return s.href ? (
          <Link key={s.label} to={s.href} style={{ textDecoration: "none" }}>{inner}</Link>
        ) : (
          <div key={s.label}>{inner}</div>
        );
      })}
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

// ---------------- NextLessonCard ----------------
function NextLessonCard({ instructorId }: { instructorId: string }) {
  const navigate = useNavigate();
  const { data: next, isLoading } = useNextLessonDetails(instructorId);

  const headerStyle: React.CSSProperties = {
    padding: "8px 12px", borderBottom: `1px solid ${t.divider}`,
    display: "flex", alignItems: "center", gap: 7,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: t.navy,
    textTransform: "uppercase", letterSpacing: "0.05em", flex: 1,
  };

  if (isLoading) {
    return (
      <div style={{ backgroundColor: t.white, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden", width: "100%" }}>
        <div style={headerStyle}>
          <CarFront size={14} color={t.muted} />
          <span style={labelStyle}>Next lesson</span>
        </div>
        <div style={{ padding: 14, fontSize: 11, color: t.muted }}>Loading…</div>
      </div>
    );
  }

  if (!next) {
    return (
      <div style={{ backgroundColor: t.white, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden", width: "100%" }}>
        <div style={headerStyle}>
          <CarFront size={14} color={t.muted} />
          <span style={labelStyle}>Next lesson</span>
        </div>
        <div style={{ padding: "14px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 11, color: t.muted }}>No upcoming lessons</span>
          <Link to="/instructor/diary" style={{ fontSize: 11, fontWeight: 600, color: t.blue, textDecoration: "none" }}>
            Schedule →
          </Link>
        </div>
      </div>
    );
  }

  const lessonDate = new Date(`${next.lessonDate}T${next.startTime}`);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = format(tomorrow, "yyyy-MM-dd");
  let dayLabel = format(lessonDate, "EEE d MMM");
  if (next.lessonDate === todayStr) dayLabel = "Today";
  else if (next.lessonDate === tomorrowStr) dayLabel = "Tomorrow";
  const timeLabel = format(lessonDate, "HH:mm");

  return (
    <div
      onClick={() => navigate(`/instructor/diary?lessonId=${next.lessonId}`)}
      style={{ backgroundColor: t.white, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden", cursor: "pointer", width: "100%" }}
    >
      <div style={headerStyle}>
        <CarFront size={14} color={t.muted} />
        <span style={labelStyle}>Next lesson</span>
        <span style={{ fontSize: 11, fontWeight: 500, color: t.blue }}>View →</span>
      </div>
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: t.navy, letterSpacing: -0.2 }}>
            {dayLabel} {timeLabel}
          </span>
          <span style={{ fontSize: 11, color: t.muted, fontWeight: 500 }}>
            · {next.durationMinutes} min
          </span>
        </div>
        <div style={{ fontSize: 13, color: t.navy, fontWeight: 600 }}>{next.pupilName}</div>
        {(next.pickupPostcode || next.pickupLocation) && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: t.muted }}>
            <MapPin size={11} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {next.pickupPostcode || next.pickupLocation}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- DvsaStandardsCard ----------------
function DvsaStandardsCard({ standardsCheck }: { standardsCheck: { result: string; at: string } | null }) {
  const navigate = useNavigate();
  const hasResults = !!standardsCheck;

  return (
    <div style={{ backgroundColor: t.white, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden", width: "100%" }}>
      <div style={{ padding: "8px 12px", borderBottom: `1px solid ${t.divider}`, display: "flex", alignItems: "center", gap: 7 }}>
        <ShieldCheck size={14} color={t.muted} />
        <span style={{ fontSize: 11, fontWeight: 700, color: t.navy, textTransform: "uppercase", letterSpacing: "0.05em", flex: 1 }}>
          DVSA standards check
        </span>
        <Link to="/instructor/standards-check" style={{ fontSize: 11, fontWeight: 500, color: t.blue, textDecoration: "none" }}>
          {hasResults ? "View →" : "Log result →"}
        </Link>
      </div>
      {hasResults ? (
        <div style={{ padding: "10px 12px", display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: t.navy, letterSpacing: -0.2 }}>
            {standardsCheck!.result}
          </span>
          <span style={{ fontSize: 11, color: t.muted }}>
            {format(new Date(standardsCheck!.at), "d MMM yyyy")}
          </span>
        </div>
      ) : (
        <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <AwardIcon size={16} color={t.placeholder} />
            <span style={{ fontSize: 11, color: t.muted }}>No result logged yet</span>
          </div>
          <button
            onClick={() => navigate("/instructor/standards-check")}
            style={{
              backgroundColor: t.navy, border: "none", borderRadius: 7, padding: "5px 10px",
              fontSize: 11, fontWeight: 600, color: t.white, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Log
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
type Tile = {
  label: string; Icon: any; iconBg: string; iconColor: string; accent: string;
  stat: string; href: string;
  miniList?: { time: string; name: string; colour?: string }[];
  miniEmpty?: string;
  onAdd?: () => void;
  addLabel?: string;
};
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
              position: "relative",
            }}>
              {tile.onAdd && (
                <button
                  type="button"
                  aria-label={tile.addLabel ?? `Add ${tile.label}`}
                  title={tile.addLabel ?? `Add ${tile.label}`}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); tile.onAdd?.(); }}
                  style={{
                    position: "absolute", top: 8, right: 8,
                    width: 22, height: 22, borderRadius: 6,
                    backgroundColor: tile.iconBg, color: tile.iconColor,
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 0,
                  }}
                >
                  <Plus size={13} strokeWidth={2.2} />
                </button>
              )}
              <div style={{ height: 2, borderRadius: 1, backgroundColor: tile.accent, width: 24 }} />

              <div style={{
                width: 30, height: 30, borderRadius: 8, backgroundColor: tile.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <tile.Icon size={15} color={tile.iconColor} strokeWidth={1.8} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.navy }}>{tile.label}</div>
              {tile.miniList ? (
                tile.miniList.length === 0 ? (
                  <div style={{ fontSize: 10, fontWeight: 500, color: t.muted }}>
                    {tile.miniEmpty ?? tile.stat}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 1 }}>
                    {tile.miniList.slice(0, 3).map((row, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: t.navy, width: 30, flexShrink: 0 }}>
                          {row.time}
                        </span>
                        <span style={{
                          width: 4, height: 4, borderRadius: "50%",
                          backgroundColor: row.colour ?? tile.accent, flexShrink: 0,
                        }} />
                        <span style={{
                          fontSize: 10, color: t.mid, whiteSpace: "nowrap",
                          overflow: "hidden", textOverflow: "ellipsis", minWidth: 0,
                        }}>
                          {row.name}
                        </span>
                      </div>
                    ))}
                    {tile.miniList.length > 3 && (
                      <div style={{ fontSize: 9, color: t.muted, fontWeight: 500 }}>
                        +{tile.miniList.length - 3} more
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div style={{ fontSize: 10, fontWeight: 500, color: t.muted }}>{tile.stat}</div>
              )}
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
export function HybridDashboard({ instructorId, instructorName, pupils, todaysLessonCount, onAddLesson, onAddPupil, onTakePayment }: Props) {
  const firstName = (instructorName?.split(" ")[0]) || "there";
  const today = format(new Date(), "EEEE d MMMM yyyy");
  const greeting = getGreeting();

  const { hoursThisWeek, monthEarnings } = useInstructorLiveStats(instructorId);
  const { data: earningsData } = useDailyEarnings(instructorId);
  const { data: stats2 } = useInstructorDashboardStats(instructorId);
  const { data: todayLessons = [] } = useDayLessons(instructorId, new Date());
  const scheduleMini = todayLessons.map((l) => ({
    time: l.startTime?.slice(0, 5) ?? "",
    name: l.pupilName,
    colour: l.googleEventId ? t.amber : t.blue,
  }));

  const owing = pupils.filter((p) => (p.account_balance ?? 0) < 0);
  const outstandingTotal = owing.reduce((sum, p) => sum + Math.abs(p.account_balance ?? 0), 0);
  // Treat sum of positive balances as the "account balance" total
  const positiveBalance = pupils.reduce((sum, p) => sum + Math.max(0, p.account_balance ?? 0), 0);

  // Chase-now dialog
  const [chaseOpen, setChaseOpen] = useState(false);
  const [pupilContacts, setPupilContacts] = useState<Array<{ id: string; name: string; phone: string | null; email: string | null; account_balance: number | null }>>([]);
  useEffect(() => {
    if (!chaseOpen || !instructorId || owing.length === 0) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("pupils")
        .select("id, name, phone, email, account_balance")
        .eq("instructor_id", instructorId)
        .in("id", owing.map((p) => p.id));
      if (!cancelled && data) setPupilContacts(data as any);
    })();
    return () => { cancelled = true; };
  }, [chaseOpen, instructorId, owing.map((p) => p.id).join(",")]);

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
      href: "/instructor/pupils",
      hasData: pupils.length > 0,
    },
    {
      label: "Payments",
      value: `£${monthEarnings.toLocaleString()}`,
      sub: "This month",
      pct: monthEarnings > 0 ? 100 : 0,
      bar: t.green,
      href: "/instructor/pay",
      hasData: monthEarnings > 0,
    },
    {
      label: "Lessons booked",
      value: stats2 ? String(stats2.lessonsThisMonth) : "—",
      sub: "This month",
      pct: stats2 && stats2.lessonsThisMonth > 0 ? Math.min(100, stats2.lessonsThisMonth * 2) : 0,
      bar: t.blue,
      href: "/instructor/schedule",
      hasData: !!stats2 && stats2.lessonsThisMonth > 0,
    },
    {
      label: "Pass rate",
      value: stats2?.passRatePct != null ? `${stats2.passRatePct}%` : "—",
      sub: stats2 && stats2.passRateSampleSize > 0
        ? `${stats2.passRateSampleSize} test${stats2.passRateSampleSize !== 1 ? "s" : ""} · 12 mo`
        : "No results yet",
      pct: stats2?.passRatePct ?? 0,
      bar: t.red,
      href: "/instructor/test-requests",
      hasData: !!stats2 && stats2.passRateSampleSize > 0,
    },
    {
      label: "Tests booked",
      value: stats2 ? String(stats2.testsBooked) : "—",
      sub: stats2 && stats2.testsBooked > 0 ? "Upcoming" : "None upcoming",
      pct: stats2 && stats2.testsBooked > 0 ? Math.min(100, stats2.testsBooked * 10) : 0,
      bar: t.amber,
      href: "/instructor/test-requests",
      hasData: !!stats2 && stats2.testsBooked > 0,
      extra: stats2?.nextTestDate
        ? `Next: ${format(new Date(stats2.nextTestDate), "EEE d MMM")}`
        : undefined,
    },
    {
      label: "Cancelled",
      value: stats2 ? String(stats2.cancelledThisMonth) : "—",
      sub: "This month",
      pct: stats2 && stats2.cancelledThisMonth > 0 ? Math.min(100, stats2.cancelledThisMonth * 5) : 0,
      bar: t.red,
      href: "/instructor/schedule",
      hasData: !!stats2 && stats2.cancelledThisMonth > 0,
    },
  ];

  // Function tiles — labels/stats wired where possible, '—' otherwise
  const tiles: Tile[] = [
    { label: "Schedule",     Icon: Calendar,      iconBg: t.blueLight,   iconColor: t.blue,  accent: t.blue,  stat: `${todaysLessonCount} today`,           href: "/instructor/schedule", miniList: scheduleMini, miniEmpty: "No lessons today", onAdd: onAddLesson, addLabel: "Add lesson" },
    { label: "Pupils",       Icon: Users,         iconBg: t.blueLight,   iconColor: t.blue,  accent: t.blue,  stat: `${pupils.length} active`,              href: "/instructor/pupils", onAdd: onAddPupil, addLabel: "Add pupil" },
    { label: "Waiting list", Icon: ListChecks,    iconBg: t.blueLight,   iconColor: t.blue,  accent: t.blue,  stat: stats2 ? `${stats2.waitingListCount} waiting` : "—", href: "/instructor/waiting-list" },
    { label: "Payments",     Icon: CreditCard,    iconBg: t.greenLight,  iconColor: t.green, accent: t.green, stat: `£${outstandingTotal.toFixed(0)} due`,  href: "/instructor/pay", onAdd: onTakePayment, addLabel: "Take payment" },
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
          link={{ label: "Chase now" }}
          onAction={() => setChaseOpen(true)}
        />
      )}

      <SendAllRemindersDialog
        open={chaseOpen}
        onOpenChange={setChaseOpen}
        outstanding={owing.map((p) => ({
          id: p.id,
          name: p.name,
          amount: Math.abs(p.account_balance ?? 0),
        }))}
        allPupils={pupilContacts}
        instructorId={instructorId}
        instructorName={instructorName ?? undefined}
      />

      <QuickActionRow items={quickActions} />
      <StatsRow stats={stats} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 280px", gap: 10, marginBottom: 14, alignItems: "stretch" }}>
        <ScheduleCard instructorId={instructorId} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
            <NextLessonCard instructorId={instructorId} />
          </div>
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
            <DvsaStandardsCard standardsCheck={stats2?.standardsCheck ?? null} />
          </div>
        </div>
        <EarningsCard
          balance={positiveBalance}
          outstanding={outstandingTotal}
          outstandingPct={outstandingPct}
          monthTarget={null /* TODO: bind to monthly goal hook */}
          hoursTaught={hoursThisWeek}
        />
      </div>

      <FunctionTilesGrid tiles={tiles} />
    </div>
  );
}
