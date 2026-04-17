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
          <a
            key={event.id}
            href={event.link_url || undefined}
            target={event.link_url ? "_blank" : undefined}
            rel={event.link_url ? "noopener noreferrer" : undefined}
            style={{
              background: "#FFFFFF",
              borderRadius: 14,
              border: "0.5px solid #E4E4E7",
              padding: "10px 14px 10px 10px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: event.link_url ? "pointer" : "default",
              textDecoration: "none",
            }}
          >
            {/* Left date tile (blue, matching waiting room icon size) */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                flexShrink: 0,
                background: "linear-gradient(to bottom, #1F2B3D, #2A394F)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", lineHeight: 1 }}>
                {format(date, "MMM")}
              </span>
              <span style={{ fontSize: 17, fontWeight: 700, color: "white", lineHeight: 1.1 }}>
                {format(date, "d")}
              </span>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ fontSize: 15, fontWeight: 500, color: "#18181B", fontFamily: "Inter, sans-serif", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {event.title}
                </p>
              </div>
              <p style={{ fontSize: 12, fontWeight: 400, color: "#71717A", marginTop: 2, fontFamily: "Inter, sans-serif" }}>
                {format(date, "EEE HH:mm")} · {event.duration_minutes} min
              </p>
            </div>

            {event.link_url && (
              <ExternalLink size={16} strokeWidth={2} color="#A1A1AA" style={{ flexShrink: 0 }} />
            )}
          </a>
        );
      })}
    </div>
  );
}
