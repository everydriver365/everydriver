import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface AdminEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  duration_minutes: number;
  event_type: string;
  link_url: string | null;
  link_label: string | null;
}

export function UpcomingEventsCard({ className = "" }: { className?: string }) {
  const [events, setEvents] = useState<AdminEvent[]>([]);

  useEffect(() => {
    supabase
      .from("admin_events")
      .select("*")
      .eq("is_active", true)
      .gt("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(5)
      .then(({ data }) => {
        if (data) setEvents(data as AdminEvent[]);
      });
  }, []);

  if (events.length === 0) return null;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {events.map((event) => {
        const date = new Date(event.event_date);
        return (
          <div
            key={event.id}
            style={{
              borderRadius: 20,
              overflow: "hidden",
              display: "flex",
              flexDirection: "row",
              minHeight: 130,
              boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)",
              border: "0.5px solid rgba(0,0,0,0.06)",
            }}
          >
            {/* Left date column */}
            <div
              style={{
                width: 72,
                flexShrink: 0,
                background: "linear-gradient(to bottom, #0d4fa0, #1a6fd4)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px 8px",
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                {format(date, "EEE")}
              </span>
              <span style={{ fontSize: 28, fontWeight: 700, color: "white", lineHeight: 1.1 }}>
                {format(date, "d")}
              </span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", textTransform: "uppercase" }}>
                {format(date, "MMM")}
              </span>
            </div>

            {/* Right content area */}
            <div
              style={{
                flex: 1,
                padding: "14px 16px",
                background: "white",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#8e8e93", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>
                  Upcoming Event
                </p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1c1c1e", lineHeight: 1.3, marginBottom: 4 }}>
                  {event.title}
                </p>
                <p style={{ fontSize: 12, color: "#8e8e93" }}>
                  {format(date, "HH:mm")} · {event.duration_minutes} min
                </p>
              </div>
              {event.link_url && (
                <a
                  href={event.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: "#1a6fd4", marginTop: 8, textDecoration: "none" }}
                >
                  <ExternalLink style={{ width: 13, height: 13 }} />
                  {event.link_label || "Join Event"}
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
