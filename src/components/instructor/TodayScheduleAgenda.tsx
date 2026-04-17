import { useState } from "react";
import { format, parse, addDays, addMinutes, isAfter } from "date-fns";
import { CalendarX, CheckCircle2, MapPin, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PupilAvatar } from "./PupilAvatar";
import { TodayLesson } from "@/hooks/useTodayRemainingLessons";

interface TodayScheduleAgendaProps {
  todayLessons: TodayLesson[];
  tomorrowLessons: TodayLesson[];
  className?: string;
}

const fmtTime24 = (t: string) => {
  try { return format(parse(t, "HH:mm:ss", new Date()), "HH:mm"); } catch { return t?.substring(0, 5); }
};

const typeColors: Record<string, { bg: string; text: string }> = {
  Standard: { bg: "#e8f0fc", text: "#185FA5" },
  "Test Prep": { bg: "rgba(217,119,6,0.08)", text: "#D97706" },
  "Mock Test": { bg: "rgba(139,92,246,0.08)", text: "#8B5CF6" },
  Motorway: { bg: "rgba(48,209,88,0.08)", text: "#30D158" },
  Refresher: { bg: "rgba(236,72,153,0.08)", text: "#EC4899" },
  "Pass Plus": { bg: "rgba(14,165,233,0.08)", text: "#0EA5E9" },
};

type LessonState = "done" | "overdue" | "next" | "upcoming";

function getLessonStates(lessons: TodayLesson[]): Map<string, LessonState> {
  const now = new Date();
  const states = new Map<string, LessonState>();
  let foundNext = false;

  for (const l of lessons) {
    if (l.status === "completed") {
      states.set(l.id, "done");
      continue;
    }
    try {
      const start = parse(l.startTime, "HH:mm:ss", new Date());
      const end = addMinutes(start, l.durationMinutes);
      if (isAfter(now, end)) {
        states.set(l.id, "overdue");
        continue;
      }
    } catch {
      // fall through
    }
    if (!foundNext) {
      states.set(l.id, "next");
      foundNext = true;
    } else {
      states.set(l.id, "upcoming");
    }
  }
  return states;
}

function SummaryBar({ lessons }: { lessons: TodayLesson[] }) {
  const totalMins = lessons.reduce((s, l) => s + l.durationMinutes, 0);
  const totalEarnings = lessons.reduce((s, l) => s + (l.amountDue || 0), 0);
  const paid = lessons.filter(l => l.paymentStatus === "paid").length;
  return (
    <div style={{
      backgroundColor: "#FAFAFA",
      borderTop: "0.5px solid #E4E4E7",
      borderBottom: "0.5px solid #E4E4E7",
      padding: "7px 16px",
      display: "flex",
      alignItems: "center",
      gap: 0,
      fontSize: 12,
    }}>
      <span style={{ color: "#18181B", fontWeight: 500 }}>{lessons.length} lesson{lessons.length !== 1 ? "s" : ""}</span>
      <span style={{ color: "#D4D4D8", margin: "0 6px" }}>·</span>
      <span style={{ color: "#71717A" }}>{(totalMins / 60).toFixed(1)}h</span>
      <span style={{ color: "#D4D4D8", margin: "0 6px" }}>·</span>
      <span style={{ color: "#71717A" }}>£{Math.round(totalEarnings)}</span>
      <span style={{ color: "#D4D4D8", margin: "0 6px" }}>·</span>
      <span style={{ color: "#71717A" }}>{paid}/{lessons.length} paid</span>
    </div>
  );
}

function AgendaList({ lessons }: { lessons: TodayLesson[] }) {
  if (!lessons.length) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 16px", textAlign: "center" }}>
        <CalendarX style={{ height: 36, width: 36, color: "#C7C7CC", marginBottom: 8 }} />
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#8E8E93" }}>No lessons scheduled</p>
      </div>
    );
  }

  const states = getLessonStates(lessons);

  return (
    <div>
      <div>
        {lessons.map((l, i) => {
          const state = states.get(l.id) || "upcoming";
          const done = state === "done";
          const isNext = state === "next";
          const isOverdue = state === "overdue";
          const colors = typeColors[l.lessonType] || typeColors.Standard;

          return (
            <Link key={l.id} to={l.pupilId ? `/instructor/pupils/${l.pupilId}` : "/instructor/pupils"} style={{ textDecoration: "none" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 16px",
                  borderBottom: i < lessons.length - 1 ? "0.5px solid #F2F2F7" : "none",
                  opacity: done ? 0.55 : 1,
                  borderLeft: isNext ? "4px solid #0A7AFF" : "4px solid transparent",
                  backgroundColor: "#ffffff",
                }}
              >
                {/* Time */}
                <div style={{ width: 44, flexShrink: 0, textAlign: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1, color: "#18181B" }}>{fmtTime24(l.startTime)}</span>
                  <div style={{ fontSize: 10, color: "#A1A1AA", marginTop: 2 }}>{l.durationMinutes}m</div>
                </div>

                {/* Divider */}
                <div style={{ width: 2, alignSelf: "stretch", borderRadius: 1, backgroundColor: colors.bg, flexShrink: 0 }} />

                {/* Avatar + Details */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                  <PupilAvatar name={l.pupilName} imageUrl={l.pupilProfileImageUrl} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        fontSize: 14,
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                        textDecoration: done ? "line-through" : "none",
                        color: "#18181B",
                      }}>
                        {l.pupilName}
                      </span>
                      {done && <CheckCircle2 style={{ height: 14, width: 14, color: "#30D158", flexShrink: 0 }} />}
                      {isNext && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#0A7AFF",
                          backgroundColor: "rgba(10,122,255,0.1)",
                          padding: "1px 6px",
                          borderRadius: 4,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}>
                          Next
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#71717A", marginTop: 2, flexWrap: "wrap" as const }}>
                      {l.pickupPostcode && (
                        <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <MapPin style={{ height: 10, width: 10 }} />{l.pickupPostcode}
                        </span>
                      )}
                      <span style={{
                        display: "inline-block",
                        fontSize: 10,
                        fontWeight: 500,
                        padding: "1px 6px",
                        borderRadius: 4,
                        backgroundColor: colors.bg,
                        color: colors.text,
                      }}>
                        {l.lessonType}
                      </span>
                      {done && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#30D158" }}>✓ Done</span>
                      )}
                      {isOverdue && (
                        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: "#FF9500" }}>
                          <Clock style={{ height: 10, width: 10 }} />End lesson
                          <ArrowRight style={{ height: 9, width: 9 }} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <span style={{
                  fontSize: 14,
                  fontWeight: 600,
                  flexShrink: 0,
                  color: l.paymentStatus === "paid" ? "#30D158" : "#D97706",
                }}>
                  £{l.amountDue || 0}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

interface TomorrowAlert {
  icon: typeof CloudRain;
  text: string;
  bg: string;
  fg: string;
}

function useTomorrowWeather(lessons: TodayLesson[]): TomorrowAlert | null {
  const postcode = lessons.find((l) => l.pickupPostcode)?.pickupPostcode || null;
  const [alert, setAlert] = useState<TomorrowAlert | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!postcode) {
      setAlert(null);
      return;
    }
    (async () => {
      try {
        // postcodes.io for lat/lon
        const geo = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
        if (!geo.ok) return;
        const geoJson = await geo.json();
        const lat = geoJson?.result?.latitude;
        const lon = geoJson?.result?.longitude;
        if (typeof lat !== "number" || typeof lon !== "number") return;

        // Open-Meteo daily forecast for tomorrow
        const wx = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,precipitation_probability_max,wind_speed_10m_max&forecast_days=2&timezone=auto`
        );
        if (!wx.ok) return;
        const wxJson = await wx.json();
        const code: number = wxJson?.daily?.weather_code?.[1];
        const precip: number = wxJson?.daily?.precipitation_probability_max?.[1] ?? 0;
        const wind: number = wxJson?.daily?.wind_speed_10m_max?.[1] ?? 0;
        if (cancelled) return;

        // Severe codes: thunderstorm 95-99, snow 71-77/85-86, freezing rain 66-67, heavy rain 65/82
        let label: string | null = null;
        if (code >= 95) label = "Thunderstorms forecast";
        else if (code >= 71 && code <= 77) label = "Snow forecast";
        else if (code === 85 || code === 86) label = "Snow showers forecast";
        else if (code === 66 || code === 67) label = "Freezing rain forecast";
        else if (code === 65 || code === 82) label = "Heavy rain forecast";
        else if (precip >= 70) label = `Rain likely (${Math.round(precip)}%)`;
        else if (wind >= 50) label = `Strong winds (${Math.round(wind)} km/h)`;

        if (label) {
          setAlert({
            icon: CloudRain,
            text: label,
            bg: "#FEF3C7",
            fg: "#92400E",
          });
        }
      } catch {
        // silently ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postcode]);

  return alert;
}

function TomorrowHeadsUp({ lessons }: { lessons: TodayLesson[] }) {
  const weather = useTomorrowWeather(lessons);

  const owingCount = useMemo(
    () => lessons.filter((l) => l.paymentStatus !== "paid" && (l.amountDue || 0) > 0).length,
    [lessons]
  );
  const owingTotal = useMemo(
    () =>
      lessons
        .filter((l) => l.paymentStatus !== "paid")
        .reduce((s, l) => s + (l.amountDue || 0), 0),
    [lessons]
  );

  const items: TomorrowAlert[] = [];
  if (weather) items.push(weather);
  if (owingCount > 0) {
    items.push({
      icon: PoundSterling,
      text: `${owingCount} payment${owingCount !== 1 ? "s" : ""} owing · £${Math.round(owingTotal)}`,
      bg: "#FEE2E2",
      fg: "#991B1B",
    });
  }

  if (items.length === 0) return null;

  return (
    <div
      style={{
        padding: "10px 12px 4px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        backgroundColor: "#FFFFFF",
      }}
    >
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 10,
              backgroundColor: it.bg,
              fontSize: 12,
              fontWeight: 500,
              color: it.fg,
              fontFamily: "Inter, sans-serif",
            }}
          >
            <Icon style={{ height: 14, width: 14, flexShrink: 0 }} />
            <span>{it.text}</span>
          </div>
        );
      })}
    </div>
  );
}

export function TodayScheduleAgenda({ todayLessons, tomorrowLessons, className = "" }: TodayScheduleAgendaProps) {
  const [tab, setTab] = useState<"today" | "tomorrow">("today");
  const activeLessons = tab === "today" ? todayLessons : tomorrowLessons;
  const title = tab === "today" ? "Today's Schedule" : "Tomorrow's Schedule";

  return (
    <div
      className={className}
      style={{
        borderRadius: 14,
        border: "0.5px solid #E4E4E7",
        background: "#FFFFFF",
        overflow: "hidden",
        fontFamily: "Inter, -apple-system, 'SF Pro Text', sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ padding: "14px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "#18181B", fontFamily: "Inter, sans-serif" }}>{title}</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#71717A", fontFamily: "Inter, sans-serif" }}>
            {format(tab === "today" ? new Date() : addDays(new Date(), 1), "EEE d MMM")} · {activeLessons.length} lesson{activeLessons.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Pill toggle */}
        <div style={{ borderRadius: 20, border: "1.5px solid #2A394F", display: "flex", overflow: "hidden" }}>
          {(["today", "tomorrow"] as const).map((val) => (
            <button
              key={val}
              onClick={() => setTab(val)}
              style={{
                border: "none",
                cursor: "pointer",
                borderRadius: 20,
                padding: "5px 14px",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "inherit",
                backgroundColor: tab === val ? "#2A394F" : "transparent",
                color: tab === val ? "#ffffff" : "#2A394F",
              }}
            >
              {val === "today" ? "Today" : "Tomorrow"}
            </button>
          ))}
        </div>
      </div>

      {/* Tomorrow heads-up: weather, payments owing */}
      {tab === "tomorrow" && <TomorrowHeadsUp lessons={tomorrowLessons} />}

      {/* Stats bar */}
      {activeLessons.length > 0 && <SummaryBar lessons={activeLessons} />}

      {/* Lesson list */}
      <div>
        <AgendaList lessons={activeLessons} />
      </div>
    </div>
  );
}
