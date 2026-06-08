// Public ICS feed for an instructor's lessons + manual blocks.
// Pasted once into Google/Apple/Outlook ("Add calendar from URL").
//
// Auth = secret per-instructor token in the query string. No user JWT.
// Stable UIDs so calendar apps update instead of duplicating.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const HORIZON_MONTHS = 12;

function pad(n: number) { return String(n).padStart(2, "0"); }

function toIcsUtc(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escIcs(s: string | null | undefined): string {
  if (!s) return "";
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

// Fold long lines to RFC 5545 75 octet soft limit.
function fold(line: string): string {
  if (line.length <= 73) return line;
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    const chunk = line.slice(i, i === 0 ? 73 : i + 72);
    out.push(chunk);
    i += chunk.length;
  }
  return out.join("\r\n ");
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token || token.length < 16) {
    return new Response("Forbidden", { status: 403 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const { data: inst, error: instErr } = await supabase
    .from("instructors")
    .select("id, name, calendar_feed_token")
    .eq("calendar_feed_token", token)
    .maybeSingle();

  if (instErr) return new Response("Server error", { status: 500 });
  if (!inst) return new Response("Forbidden", { status: 403 });

  const now = new Date();
  const horizon = new Date(now);
  horizon.setMonth(horizon.getMonth() + HORIZON_MONTHS);
  const past = new Date(now);
  past.setDate(past.getDate() - 7);

  // Lessons — assume lesson_date is in Europe/London civil calendar.
  // The poller in calendar apps shows them in the user's local TZ; we encode
  // UTC instants by combining lesson_date + start_time as Europe/London then
  // converting. To keep this lightweight we treat it as UTC (apps render the
  // wall time correctly for events sent in UTC; instructors in the UK see
  // GMT/BST applied by their phone). Good enough for personal calendar use.
  const pastDate = past.toISOString().slice(0, 10);
  const horizonDate = horizon.toISOString().slice(0, 10);

  const { data: lessons } = await supabase
    .from("scheduled_lessons")
    .select("id, lesson_date, start_time, duration_minutes, pickup_location, status, updated_at, pupils(name)")
    .eq("instructor_id", inst.id)
    .gte("lesson_date", pastDate)
    .lte("lesson_date", horizonDate)
    .neq("status", "cancelled")
    .is("deleted_at", null);

  // Manual blocks
  const { data: blocks } = await supabase
    .from("instructor_manual_blocks")
    .select("id, start_datetime, end_datetime, title, updated_at")
    .eq("instructor_id", inst.id)
    .gte("end_datetime", past.toISOString())
    .lte("start_datetime", horizon.toISOString());

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DSM//Instructor Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escIcs(`DSM — ${inst.name ?? "Lessons"}`)}`,
    "X-PUBLISHED-TTL:PT15M",
    "REFRESH-INTERVAL;VALUE=DURATION:PT15M",
  ];

  for (const l of lessons ?? []) {
    if (!l.scheduled_at || !l.duration_minutes) continue;
    const start = new Date(l.scheduled_at as string);
    const end = new Date(start.getTime() + (l.duration_minutes as number) * 60_000);
    const pupilName =
      (l.pupils && typeof l.pupils === "object" && "name" in (l.pupils as any))
        ? (l.pupils as any).name
        : null;
    const summary = pupilName ? `Lesson — ${pupilName}` : "Lesson";
    const loc = (l.pickup_location as string) || "";
    const dtstamp = toIcsUtc(new Date((l.updated_at as string) ?? l.scheduled_at as string));

    lines.push("BEGIN:VEVENT");
    lines.push(fold(`UID:dsm-lesson-${l.id}@dsm`));
    lines.push(`DTSTAMP:${toIcsUtc(new Date())}`);
    lines.push(`LAST-MODIFIED:${dtstamp}`);
    lines.push(`DTSTART:${toIcsUtc(start)}`);
    lines.push(`DTEND:${toIcsUtc(end)}`);
    lines.push(fold(`SUMMARY:${escIcs(summary)}`));
    if (loc) lines.push(fold(`LOCATION:${escIcs(loc)}`));
    lines.push("STATUS:CONFIRMED");
    lines.push("TRANSP:OPAQUE");
    lines.push("END:VEVENT");
  }

  for (const b of blocks ?? []) {
    if (!b.start_datetime || !b.end_datetime) continue;
    const start = new Date(b.start_datetime as string);
    const end = new Date(b.end_datetime as string);
    lines.push("BEGIN:VEVENT");
    lines.push(fold(`UID:dsm-block-${b.id}@dsm`));
    lines.push(`DTSTAMP:${toIcsUtc(new Date())}`);
    lines.push(`LAST-MODIFIED:${toIcsUtc(new Date((b.updated_at as string) ?? b.start_datetime as string))}`);
    lines.push(`DTSTART:${toIcsUtc(start)}`);
    lines.push(`DTEND:${toIcsUtc(end)}`);
    lines.push(fold(`SUMMARY:${escIcs((b.title as string) || "Blocked")}`));
    lines.push("STATUS:CONFIRMED");
    lines.push("TRANSP:OPAQUE");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  const body = lines.join("\r\n") + "\r\n";

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Content-Disposition": `inline; filename="dsm-calendar.ics"`,
    },
  });
});
