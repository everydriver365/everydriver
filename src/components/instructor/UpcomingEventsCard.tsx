import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";
import { SectionHeader } from "@/components/instructor/SectionHeader";

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

const PAL = {
  card: "#FFFFFF",
  hairline: "#D3D1C7",
  text: "#2C2C2A",
  textMuted: "#5F5E5A",
  textSubtle: "#888780",
  red: "#A32D2D",
  neutralChip: "#F1EFE8",
  skeleton: "#E8E6DE",
};

/**
 * Convert a possibly Title Case title to sentence case while preserving
 * uppercase acronyms (DVSA, ADI, DSA, etc.).
 */
function toSentenceCase(text: string): string {
  if (!text) return text;
  const words = text.split(/(\s+)/);
  let firstWordSeen = false;
  return words
    .map((token) => {
      if (/^\s+$/.test(token)) return token;
      // Preserve all-caps acronyms (length 2+, all letters uppercase)
      if (token.length >= 2 && /^[A-Z]+$/.test(token)) return token;
      // Preserve mixed acronyms followed by punctuation (e.g. DVSA's)
      if (/^[A-Z]{2,}[''’]?[a-z]?$/.test(token)) return token;
      if (!firstWordSeen) {
        firstWordSeen = true;
        return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
      }
      return token.toLowerCase();
    })
    .join("");
}

interface UpcomingEventsCardProps {
  className?: string;
  /** Render the SectionHeader on top of the list. Default true. */
  showHeader?: boolean;
}

export function UpcomingEventsCard({ className = "", showHeader = true }: UpcomingEventsCardProps) {
  const [events, setEvents] = useState<AdminEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("admin_events")
      .select("*")
      .eq("is_active", true)
      .gt("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(5)
      .then(({ data }) => {
        if (cancelled) return;
        setEvents((data as AdminEvent[]) || []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isLoading = events === null;
  const hasEvents = !!events && events.length > 0;

  // Header right-side meta
  const headerMeta = (() => {
    if (isLoading || !hasEvents) return undefined;
    const next = events![0];
    const days = differenceInDays(new Date(next.event_date), new Date());
    if (days <= 7) return "Next 7 days";
    return `Next: ${format(new Date(next.event_date), "EEE d MMM")}`;
  })();

  return (
    <div className={className}>
      {showHeader && (
        <SectionHeader
          title="Upcoming events"
          category="schedule"
          meta={headerMeta}
          metaLoading={isLoading}
        />
      )}

      <div style={{ padding: "0 16px" }}>
        {isLoading ? (
          <SkeletonRow />
        ) : !hasEvents ? (
          <div
            style={{
              background: PAL.card,
              border: `0.5px solid ${PAL.hairline}`,
              borderRadius: 12,
              padding: "16px 14px",
              textAlign: "center",
              fontSize: 13,
              color: PAL.textMuted,
              fontFamily: "Inter, sans-serif",
            }}
          >
            No events scheduled
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {events!.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventRow({ event }: { event: AdminEvent }) {
  const date = new Date(event.event_date);
  const month = format(date, "MMM").toUpperCase();
  const day = format(date, "d");
  const meta = `${format(date, "EEE")} ${format(date, "HH:mm")} · ${event.duration_minutes} min`;
  const isLink = !!event.link_url;

  const inner = (
    <div
      style={{
        background: PAL.card,
        border: `0.5px solid ${PAL.hairline}`,
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: isLink ? "pointer" : "default",
      }}
    >
      {/* Date tile */}
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 10,
          flexShrink: 0,
          background: PAL.neutralChip,
          border: `0.5px solid ${PAL.hairline}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 500,
            color: PAL.red,
            letterSpacing: 0.5,
            lineHeight: 1,
          }}
        >
          {month}
        </span>
        <span
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: PAL.text,
            marginTop: 2,
            lineHeight: 1,
          }}
        >
          {day}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, fontFamily: "Inter, sans-serif" }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: PAL.text,
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1.25,
          }}
        >
          {toSentenceCase(event.title)}
        </p>
        <p
          style={{
            fontSize: 11,
            fontWeight: 400,
            color: PAL.textSubtle,
            marginTop: 3,
            margin: "3px 0 0 0",
            lineHeight: 1.2,
          }}
        >
          {meta}
        </p>
      </div>

      <ChevronRight
        size={12}
        strokeWidth={2}
        color={PAL.textSubtle}
        style={{ flexShrink: 0, strokeLinecap: "round", strokeLinejoin: "round" }}
      />
    </div>
  );

  if (isLink) {
    return (
      <a
        href={event.link_url!}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", display: "block" }}
      >
        {inner}
      </a>
    );
  }
  return inner;
}

function SkeletonRow() {
  return (
    <div
      style={{
        background: PAL.card,
        border: `0.5px solid ${PAL.hairline}`,
        borderRadius: 12,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 10,
          background: PAL.skeleton,
          opacity: 0.6,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ height: 12, width: "70%", background: PAL.skeleton, opacity: 0.6, borderRadius: 4 }} />
        <div style={{ height: 10, width: "45%", background: PAL.skeleton, opacity: 0.45, borderRadius: 4, marginTop: 6 }} />
      </div>
    </div>
  );
}
