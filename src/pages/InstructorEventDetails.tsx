import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Video, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';
const BG = "#F2F4F8";
const BLUE = "#1A52A0";

interface Detail {
  typeLabel: string;
  title: string;
  dateLabel?: string;
  timeLabel?: string;
  locationLabel?: string;
  description?: string;
  meetingUrl?: string | null;
  related?: { label: string; path: string };
}

const URL_RE = /https?:\/\/[^\s)]+/i;

function detectMeeting(url?: string | null) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("zoom.")) return { label: "Join Zoom", host };
    if (host.includes("teams.")) return { label: "Join Teams", host };
    if (host.includes("meet.google")) return { label: "Join Google Meet", host };
    return { label: "Join meeting", host };
  } catch {
    return { label: "Open link", host: url };
  }
}

function findUrl(...vals: (string | null | undefined)[]) {
  for (const v of vals) {
    if (!v) continue;
    const m = v.match(URL_RE);
    if (m) return m[0];
  }
  return null;
}

export default function InstructorEventDetails() {
  const { eventKey = "" } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Detail | null>(null);

  const [prefix, restRaw] = useMemo(() => {
    const dash = eventKey.indexOf("-");
    return dash < 0 ? [eventKey, ""] : [eventKey.slice(0, dash), eventKey.slice(dash + 1)];
  }, [eventKey]);
  const id = decodeURIComponent(restRaw);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let d: Detail | null = null;
      try {
        if (prefix === "dt" || prefix === "tt") {
          const { data: p } = await supabase
            .from("pupils")
            .select("id, name, test_date, test_time, theory_test_date, test_centre_id")
            .eq("id", id)
            .maybeSingle();
          if (p) {
            const isDriving = prefix === "dt";
            const dateStr = isDriving ? p.test_date : p.theory_test_date;
            let centreName = "Test centre";
            if (isDriving && p.test_centre_id) {
              const { data: c } = await supabase
                .from("test_centres").select("name").eq("id", p.test_centre_id).maybeSingle();
              if (c?.name) centreName = c.name;
            }
            d = {
              typeLabel: isDriving ? "Driving test" : "Theory test",
              title: `${isDriving ? "Driving" : "Theory"} test · ${p.name}`,
              dateLabel: dateStr ? format(parseISO(dateStr), "EEE d MMM yyyy") : undefined,
              timeLabel: isDriving && p.test_time ? p.test_time.slice(0, 5) : undefined,
              locationLabel: isDriving ? centreName : "Theory test centre",
              related: { label: "Open pupil profile", path: `/instructor/pupils/${p.id}` },
            };
          }
        } else if (prefix === "mot" || prefix === "ins") {
          const { data: v } = await supabase
            .from("instructor_vehicles")
            .select("id, registration, make, model, mot_expiry, insurance_expiry")
            .eq("id", id).maybeSingle();
          if (v) {
            const isMot = prefix === "mot";
            const dateStr = isMot ? v.mot_expiry : v.insurance_expiry;
            d = {
              typeLabel: isMot ? "Vehicle MOT" : "Insurance renewal",
              title: `${isMot ? "MOT" : "Insurance"} · ${v.registration}`,
              dateLabel: dateStr ? format(parseISO(dateStr), "EEE d MMM yyyy") : undefined,
              locationLabel: [v.make, v.model].filter(Boolean).join(" ") || "Vehicle",
              related: { label: "Open vehicle health", path: "/instructor/vehicle-health" },
            };
          }
        } else if (prefix === "todo") {
          const { data: t } = await supabase
            .from("instructor_todos")
            .select("id, title, description, due_date").eq("id", id).maybeSingle();
          if (t) {
            d = {
              typeLabel: "Task",
              title: t.title,
              dateLabel: t.due_date ? format(parseISO(t.due_date), "EEE d MMM yyyy") : undefined,
              description: t.description || undefined,
              meetingUrl: findUrl(t.description),
              related: { label: "Open tasks", path: "/instructor/todos" },
            };
          }
        } else if (prefix === "cpd") {
          const { data: c } = await supabase
            .from("cpd_log_entries")
            .select("*").eq("id", id).maybeSingle();
          if (c) {
            const meeting = (c as any).meeting_url || findUrl((c as any).notes, (c as any).description, c.provider);
            d = {
              typeLabel: "Training / CPD",
              title: c.title,
              dateLabel: c.date ? format(parseISO(c.date as string), "EEE d MMM yyyy") : undefined,
              locationLabel: c.provider || undefined,
              description: (c as any).notes || (c as any).description || undefined,
              meetingUrl: meeting,
              related: { label: "Open CPD log", path: "/instructor/cpd" },
            };
          }
        } else if (prefix === "block") {
          const { data: b } = await supabase
            .from("instructor_manual_blocks")
            .select("*").eq("id", id).maybeSingle();
          if (b) {
            const start = b.start_datetime ? new Date(b.start_datetime as string) : null;
            const meeting = (b as any).meeting_url || findUrl((b as any).notes, b.title);
            d = {
              typeLabel: "Time block",
              title: b.title || "Time block",
              dateLabel: start ? format(start, "EEE d MMM yyyy") : undefined,
              timeLabel: start ? format(start, "HH:mm") : undefined,
              locationLabel: (b as any).block_type || undefined,
              description: (b as any).notes || undefined,
              meetingUrl: meeting,
              related: { label: "Open schedule", path: "/instructor/schedule" },
            };
          }
        }
      } catch (e) {
        console.error("[InstructorEventDetails]", e);
      }
      if (!cancelled) {
        setDetail(d);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [prefix, id]);

  const meeting = detectMeeting(detail?.meetingUrl);

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: FONT, paddingBottom: 40 }}>
      <div style={{ background: "#FFF", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: "0.5px solid #E5E9F0" }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{ width: 32, height: 32, borderRadius: 16, background: "#F2F4F8", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <ChevronLeft size={18} color="#1A1A1A" />
        </button>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A" }}>
          {detail?.typeLabel || "Event"}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={{ background: "#FFF", borderRadius: 14, padding: 20, color: "#8E8E93", fontSize: 13 }}>
            Loading…
          </div>
        ) : !detail ? (
          <div style={{ background: "#FFF", borderRadius: 14, padding: 20, color: "#8E8E93", fontSize: 13 }}>
            Event not found.
          </div>
        ) : (
          <>
            <div style={{ background: "#FFF", borderRadius: 14, padding: 16, border: "0.5px solid rgba(26,82,160,0.08)" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>
                {detail.title}
              </div>
              {detail.dateLabel && (
                <Row icon={<Calendar size={16} color={BLUE} />} text={detail.dateLabel} />
              )}
              {detail.timeLabel && (
                <Row icon={<Clock size={16} color={BLUE} />} text={detail.timeLabel} />
              )}
              {detail.locationLabel && (
                <Row icon={<MapPin size={16} color={BLUE} />} text={detail.locationLabel} />
              )}
              {detail.description && (
                <div style={{ marginTop: 12, fontSize: 13, color: "#3A3A3C", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                  {detail.description}
                </div>
              )}
            </div>

            {meeting && detail.meetingUrl && (
              <div style={{ marginTop: 16, background: "#FFF", borderRadius: 14, padding: 16, border: "0.5px solid rgba(26,82,160,0.08)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>
                  Online meeting
                </div>
                <a
                  href={detail.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    background: BLUE,
                    color: "#FFF",
                    borderRadius: 12,
                    padding: "12px 16px",
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <Video size={16} />
                  {meeting.label}
                </a>
                <div style={{ marginTop: 8, fontSize: 11, color: "#8E8E93", textAlign: "center", wordBreak: "break-all" }}>
                  {meeting.host}
                </div>
              </div>
            )}

            {detail.related && (
              <button
                onClick={() => navigate(detail.related!.path)}
                style={{
                  marginTop: 16,
                  width: "100%",
                  background: "#FFF",
                  border: "0.5px solid rgba(26,82,160,0.08)",
                  borderRadius: 14,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>
                  <ExternalLink size={16} color={BLUE} />
                  {detail.related.label}
                </span>
                <ChevronRight size={16} color="#C7C7CC" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
      {icon}
      <span style={{ fontSize: 14, color: "#1A1A1A" }}>{text}</span>
    </div>
  );
}
