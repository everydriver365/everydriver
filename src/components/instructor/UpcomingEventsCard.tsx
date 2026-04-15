import { useEffect, useState } from "react";
import { CalendarDays, ExternalLink, Clock } from "lucide-react";
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
    <div className={`rounded-2xl bg-card border border-border overflow-hidden ${className}`}>
      <div className="px-4 py-3 flex items-center gap-2 border-b border-border">
        <div className="h-8 w-8 rounded-2xl bg-purple-500 flex items-center justify-center shrink-0">
          <CalendarDays className="h-4 w-4 text-white" />
        </div>
        <p className="text-[15px] font-semibold text-foreground">Upcoming Events</p>
      </div>

      {events.map((event, i) => {
        const date = new Date(event.event_date);
        return (
          <div
            key={event.id}
            className={`px-4 py-3 ${i < events.length - 1 ? "border-b border-border" : ""}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center bg-purple-50 dark:bg-purple-500/10 rounded-xl px-2 py-1.5 min-w-[48px]">
                <span className="text-[11px] font-bold uppercase text-purple-600 dark:text-purple-400">
                  {format(date, "MMM")}
                </span>
                <span className="text-lg font-bold text-purple-700 dark:text-purple-300 leading-tight">
                  {format(date, "d")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-foreground leading-snug">{event.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[12px] text-muted-foreground">
                    {format(date, "EEE d MMM · HH:mm")} · {event.duration_minutes} min
                  </span>
                </div>
                {event.description && (
                  <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2">
                    {event.description}
                  </p>
                )}
                {event.link_url && (
                  <a
                    href={event.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-[13px] font-medium text-purple-600 dark:text-purple-400"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {event.link_label || "Join Event"}
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
