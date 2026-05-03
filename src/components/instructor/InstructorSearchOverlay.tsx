import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  X as XIcon,
  ChevronRight,
  Navigation as NavigateIcon,
  MessageSquare as MessageIcon,
  CornerDownLeft,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { QUICK_ACCESS_TILES } from "@/components/instructor/quickAccess/tileRegistry";
import { useNextLessonDetails } from "@/hooks/useNextLessonDetails";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";

const RECENT_KEY = "recentSearches";
const MAX_RECENT = 10;

type RecentItem = { id: string; label: string; route: string; iconKey: string; ts: number };

type Suggestion = {
  key: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  badge?: number | null;
  badgeBg?: string;
  pill?: { label: string; bg: string; color: string };
  onPress: () => void;
  isTopResult?: boolean;
};

function timeAgo(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

function readRecent(): RecentItem[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentItem[];
  } catch {
    return [];
  }
}

function writeRecent(item: Omit<RecentItem, "ts">) {
  try {
    const list = readRecent().filter((r) => r.id !== item.id);
    list.unshift({ ...item, ts: Date.now() });
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    /* noop */
  }
}

const TILE_BY_ID = Object.fromEntries(QUICK_ACCESS_TILES.map((t) => [t.id, t]));

const groupConfig = {
  Tools: { chipBg: "#EEF3FF", chipText: "#1A52A0" },
  Pupils: { chipBg: "#E8F8ED", chipText: "#1A7A3C" },
  Lessons: { chipBg: "#FFF6E6", chipText: "#B45309" },
} as const;

function HighlightedText({ text, query }: { text: string; query: string }) {
  const idx = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (idx === -1)
    return <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>{text}</span>;
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>
      {text.slice(0, idx)}
      <span style={{ color: "#1A52A0", fontWeight: 700 }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </span>
  );
}

function Divider() {
  return (
    <div style={{ height: 0.5, backgroundColor: "#F0F3F8", marginLeft: 14, marginRight: 14 }} />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        color: "#8E8E93",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        padding: "10px 14px 4px",
      }}
    >
      {children}
    </div>
  );
}

interface RowProps {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  titleNode: React.ReactNode;
  subtitle: string;
  isTopResult?: boolean;
  badge?: number | null;
  badgeBg?: string;
  pill?: { label: string; bg: string; color: string };
  trailing?: React.ReactNode;
  onClick: () => void;
}

function Row({
  icon: Icon,
  iconBg,
  iconColor,
  titleNode,
  subtitle,
  isTopResult,
  badge,
  badgeBg,
  pill,
  trailing,
  onClick,
}: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 14px",
        background: isTopResult ? "#EEF3FF" : "transparent",
        width: "100%",
        border: "none",
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={13} color={iconColor} strokeWidth={1.7} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {titleNode}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "#8E8E93",
            marginTop: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {subtitle}
        </div>
      </div>
      {isTopResult && (
        <div
          style={{
            background: "#1A52A0",
            borderRadius: 5,
            padding: "2px 6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CornerDownLeft size={9} color="#FFF" strokeWidth={2.5} />
        </div>
      )}
      {badge != null && badge > 0 && (
        <div
          style={{
            background: badgeBg || "#CC2229",
            borderRadius: 10,
            minWidth: 16,
            height: 16,
            padding: "0 4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 8, fontWeight: 700, color: "#FFF" }}>{badge}</span>
        </div>
      )}
      {pill && (
        <div
          style={{
            background: pill.bg,
            borderRadius: 20,
            padding: "2px 6px",
          }}
        >
          <span style={{ fontSize: 8, fontWeight: 700, color: pill.color }}>{pill.label}</span>
        </div>
      )}
      {trailing}
    </button>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
}

export function InstructorSearchOverlay({ open, onOpenChange, instructorId }: Props) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [pupilResults, setPupilResults] = useState<{ id: string; name: string }[]>([]);
  const [recents, setRecents] = useState<RecentItem[]>([]);

  const { data: nextLesson } = useNextLessonDetails(open ? instructorId : undefined);
  const { data: unreadCount = 0 } = useUnreadMessagesCount(open ? instructorId : "");

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setRecents(readRecent());
      // Autofocus
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Pupil search (debounced)
  useEffect(() => {
    if (!open || !instructorId) return;
    const q = query.trim();
    if (q.length < 2) {
      setPupilResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("pupils")
        .select("id, name")
        .eq("instructor_id", instructorId)
        .ilike("name", `%${q}%`)
        .limit(8);
      if (!cancelled) setPupilResults((data as any) || []);
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, open, instructorId]);

  const goToTile = (tile: (typeof QUICK_ACCESS_TILES)[number]) => {
    writeRecent({
      id: `tile-${tile.id}`,
      label: tile.title,
      route: tile.route,
      iconKey: tile.id,
    });
    onOpenChange(false);
    navigate(tile.route);
  };

  const goToPupil = (p: { id: string; name: string }) => {
    writeRecent({
      id: `pupil-${p.id}`,
      label: p.name,
      route: `/instructor/pupils/${p.id}`,
      iconKey: "pupils",
    });
    onOpenChange(false);
    navigate(`/instructor/pupils/${p.id}`);
  };

  // Suggestions
  const suggestions: Suggestion[] = useMemo(() => {
    const out: Suggestion[] = [];
    if (nextLesson) {
      const within4h = nextLesson.minutesUntil <= 240;
      if (within4h) {
        out.push({
          key: "navigate",
          icon: NavigateIcon,
          iconBg: "#1A52A0",
          iconColor: "#FFF",
          title: "Navigate to lesson",
          subtitle: `${nextLesson.pickupPostcode || "—"} · ${nextLesson.pupilName}`,
          isTopResult: true,
          onPress: () => {
            onOpenChange(false);
            navigate("/instructor/satnav");
          },
        });
      }
      out.push({
        key: "message",
        icon: MessageIcon,
        iconBg: "#EEF3FF",
        iconColor: "#1A52A0",
        title: `Message ${nextLesson.pupilName}`,
        subtitle: "Open conversation",
        badge: unreadCount > 0 ? unreadCount : null,
        badgeBg: "#CC2229",
        onPress: () => {
          onOpenChange(false);
          navigate(`/instructor/messages?pupilId=${nextLesson.pupilId}`);
        },
      });
    }
    return out;
  }, [nextLesson, unreadCount, navigate, onOpenChange]);

  const contextLabel = useMemo(() => {
    if (!nextLesson) return "for you";
    if (nextLesson.minutesUntil <= 0) return "lesson in progress";
    if (nextLesson.minutesUntil <= 120) {
      try {
        const t = nextLesson.startTime?.slice(0, 5);
        return `lesson at ${t}`;
      } catch {
        return "for you";
      }
    }
    return "for you";
  }, [nextLesson]);

  // Active results
  const queryTrim = query.trim();
  const toolMatches = useMemo(() => {
    if (!queryTrim) return [];
    const q = queryTrim.toLowerCase();
    return QUICK_ACCESS_TILES.filter(
      (t) =>
        t.title.toLowerCase().includes(q) || t.subtitle.toLowerCase().includes(q),
    );
  }, [queryTrim]);

  const totalResults = toolMatches.length + pupilResults.length;
  const topResultActive = toolMatches[0] || pupilResults[0];

  const handleTopResult = () => {
    if (queryTrim) {
      if (toolMatches[0]) goToTile(toolMatches[0]);
      else if (pupilResults[0]) goToPupil(pupilResults[0]);
    } else {
      const top = suggestions.find((s) => s.isTopResult);
      top?.onPress();
    }
  };

  if (!open) return null;

  const isActive = queryTrim.length > 0;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => onOpenChange(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,20,30,0.55)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFF",
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Search input row */}
        <div
          style={{
            background: "#FFF",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: isActive ? "1px solid #1A52A0" : "0.5px solid #F0F3F8",
          }}
        >
          <SearchIcon size={15} color="#1A52A0" strokeWidth={2} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleTopResult();
              }
            }}
            placeholder="Search tools, pupils, lessons..."
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: 400,
              color: "#1A1A1A",
              border: "none",
              outline: "none",
              background: "transparent",
              minWidth: 0,
            }}
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              background: "#F2F4F8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <XIcon size={11} color="#5B6B8A" strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {!isActive ? (
            <>
              {suggestions.length > 0 && (
                <>
                  <SectionLabel>Suggested · {contextLabel}</SectionLabel>
                  {suggestions.slice(0, 3).map((s, i) => (
                    <div key={s.key}>
                      {i > 0 && <Divider />}
                      <Row
                        icon={s.icon}
                        iconBg={s.iconBg}
                        iconColor={s.iconColor}
                        titleNode={
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>
                            {s.title}
                          </span>
                        }
                        subtitle={s.subtitle}
                        isTopResult={s.isTopResult}
                        badge={s.badge}
                        badgeBg={s.badgeBg}
                        pill={s.pill}
                        onClick={s.onPress}
                      />
                    </div>
                  ))}
                </>
              )}

              {recents.length > 0 && (
                <>
                  <SectionLabel>Recent</SectionLabel>
                  {recents.slice(0, 3).map((r, i) => {
                    const tile = TILE_BY_ID[r.iconKey];
                    const Icon = tile?.icon || SearchIcon;
                    return (
                      <div key={r.id}>
                        {i > 0 && <Divider />}
                        <Row
                          icon={Icon}
                          iconBg="#F2F4F8"
                          iconColor="#5B6B8A"
                          titleNode={
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>
                              {r.label}
                            </span>
                          }
                          subtitle={timeAgo(r.ts)}
                          trailing={
                            <ChevronRight size={12} color="#C7C7CC" strokeWidth={1.8} />
                          }
                          onClick={() => {
                            writeRecent({
                              id: r.id,
                              label: r.label,
                              route: r.route,
                              iconKey: r.iconKey,
                            });
                            onOpenChange(false);
                            navigate(r.route);
                          }}
                        />
                      </div>
                    );
                  })}
                </>
              )}

              {suggestions.length === 0 && recents.length === 0 && (
                <div
                  style={{
                    padding: "24px 16px",
                    textAlign: "center",
                    fontSize: 11,
                    color: "#8E8E93",
                  }}
                >
                  Start typing to search tools, pupils and lessons
                </div>
              )}
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize: 9,
                  color: "#8E8E93",
                  fontWeight: 500,
                  padding: "8px 14px 2px",
                }}
              >
                {totalResults} result{totalResults !== 1 ? "s" : ""}
              </div>

              {totalResults === 0 ? (
                <div
                  style={{
                    padding: "24px 16px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#1A1A1A",
                      marginBottom: 4,
                    }}
                  >
                    No results
                  </div>
                  <div style={{ fontSize: 10, color: "#8E8E93" }}>
                    Nothing matched "{queryTrim}" across tools, pupils or lessons
                  </div>
                </div>
              ) : (
                <>
                  {toolMatches.length > 0 && (
                    <>
                      <div style={{ padding: "4px 14px 3px" }}>
                        <div
                          style={{
                            background: groupConfig.Tools.chipBg,
                            borderRadius: 20,
                            padding: "2px 8px",
                            alignSelf: "flex-start",
                            display: "inline-block",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 600,
                              color: groupConfig.Tools.chipText,
                            }}
                          >
                            Tools
                          </span>
                        </div>
                      </div>
                      {toolMatches.map((t, i) => (
                        <div key={t.id}>
                          {i > 0 && <Divider />}
                          <Row
                            icon={t.icon}
                            iconBg="#F2F4F8"
                            iconColor="#5B6B8A"
                            titleNode={<HighlightedText text={t.title} query={queryTrim} />}
                            subtitle={t.subtitle}
                            isTopResult={topResultActive === t}
                            onClick={() => goToTile(t)}
                          />
                        </div>
                      ))}
                    </>
                  )}

                  {pupilResults.length > 0 && (
                    <>
                      <div style={{ padding: "8px 14px 3px" }}>
                        <div
                          style={{
                            background: groupConfig.Pupils.chipBg,
                            borderRadius: 20,
                            padding: "2px 8px",
                            display: "inline-block",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 600,
                              color: groupConfig.Pupils.chipText,
                            }}
                          >
                            Pupils
                          </span>
                        </div>
                      </div>
                      {pupilResults.map((p, i) => (
                        <div key={p.id}>
                          {i > 0 && <Divider />}
                          <Row
                            icon={SearchIcon}
                            iconBg="#E8F8ED"
                            iconColor="#1A7A3C"
                            titleNode={<HighlightedText text={p.name} query={queryTrim} />}
                            subtitle="Open pupil"
                            isTopResult={
                              topResultActive === p && toolMatches.length === 0
                            }
                            onClick={() => goToPupil(p)}
                          />
                        </div>
                      ))}
                    </>
                  )}

                  <div style={{ padding: "12px 0", textAlign: "center" }}>
                    <span style={{ fontSize: 10, color: "#C7C7CC" }}>
                      {toolMatches.length} of {QUICK_ACCESS_TILES.length} tools match "
                      {queryTrim}"
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
