import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { QUICK_ACCESS_TILES, QUICK_ACCESS_TILES_BY_ID, QuickAccessTile, TileTone } from "./tileRegistry";
import { RichTileCard, PersistentSearchBar } from "./QuickAccessTiles";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
import { useActivePupilsCount } from "@/hooks/useActivePupilsCount";
import { useTestSwapNotifications } from "@/hooks/useTestSwapNotifications";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import { useInstructorPeriodStats } from "@/hooks/useInstructorPeriodStats";

const TILES_PER_PAGE = 6;

interface Props {
  instructorId?: string;
}

interface TileMeta {
  subtitle?: string;
  badge?: { label: string; tone?: TileTone };
}

export function QuickAccessSwipeablePaged({ instructorId }: Props) {
  const navigate = useNavigate();
  const { subscription } = useInstructorAuth();
  const features = subscription?.features || [];

  const { data: todayLessons } = useTodayRemainingLessons(instructorId);
  const { data: activePupils } = useActivePupilsCount(instructorId);
  const { data: swapCount } = useTestSwapNotifications(instructorId);
  const { data: unreadMessages } = useUnreadMessagesCount(instructorId);
  const { data: monthStats } = useInstructorPeriodStats(instructorId, "month");
  const { devices: vehicleDevices } = useVehicleHealth();
  const vehicleFaultCount = vehicleDevices.flatMap((d) => d.last_fault_codes || []).length;

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const lastPageRef = useRef(0);

  // Alphabetical tile order
  const orderedTiles = useMemo(
    () => [...QUICK_ACCESS_TILES].sort((a, b) => a.title.localeCompare(b.title)),
    [],
  );

  const meta: Record<string, TileMeta> = useMemo(() => {
    const openTodos = (todos ?? []).filter((t: any) => !t.completed).length;
    return {
      messages: {
        subtitle: unreadMessages > 0 ? `${unreadMessages} unread` : "All caught up",
        badge: unreadMessages > 0 ? { label: String(unreadMessages), tone: "red" } : undefined,
      },
      pupils: {
        subtitle: activePupils > 0 ? `${activePupils} active` : "Manage learners",
        badge: activePupils > 0 ? { label: String(activePupils), tone: "green" } : undefined,
      },
      schedule: {
        subtitle: todayRemaining > 0 ? `${todayRemaining} today` : "Done for today",
        badge: todayRemaining > 0 ? { label: String(todayRemaining), tone: "blue" } : undefined,
      },
      "fill-gaps": {
        subtitle: gapSuggestions?.length ? `${gapSuggestions.length} open slots` : "No gaps",
        badge: gapSuggestions?.length ? { label: String(gapSuggestions.length), tone: "green" } : undefined,
      },
      "to-do": {
        subtitle: openTodos > 0 ? `${openTodos} open` : "All done",
        badge: openTodos > 0 ? { label: String(openTodos), tone: "amber" } : undefined,
      },
    };
  }, [unreadMessages, activePupils, todayRemaining, gapSuggestions, todos]);

  const isLocked = (tile: QuickAccessTile) => {
    if (!tile.requiredFeature) return false;
    return !(featureGates as any)?.[tile.requiredFeature];
  };

  const onTilePress = (tile: QuickAccessTile) => {
    if (isLocked(tile)) {
      navigate("/instructor/plans");
      return;
    }
    if (handleTileTap) handleTileTap(tile.id, tile.route);
    else navigate(tile.route);
  };

  // Search filtering
  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed
    ? orderedTiles.filter((t) => t.title.toLowerCase().includes(trimmed))
    : null;

  // Pages
  const pages = useMemo(() => {
    const out: QuickAccessTile[][] = [];
    for (let i = 0; i < orderedTiles.length; i += TILES_PER_PAGE) {
      out.push(orderedTiles.slice(i, i + TILES_PER_PAGE));
    }
    return out;
  }, [orderedTiles]);

  // Track scroll position to update active dot
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || filtered) return;
    const onScroll = () => {
      const w = el.clientWidth;
      if (!w) return;
      const idx = Math.round(el.scrollLeft / w);
      if (idx !== page) setPage(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [filtered, page]);

  // Remember page when entering search; restore when clearing
  useEffect(() => {
    if (filtered) {
      lastPageRef.current = page;
    } else {
      const el = scrollerRef.current;
      if (el) {
        requestAnimationFrame(() => {
          el.scrollTo({ left: lastPageRef.current * el.clientWidth, behavior: "instant" as ScrollBehavior });
          setPage(lastPageRef.current);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!filtered]);

  const jumpToPage = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setPage(i);
  };

  const renderTile = (tile: QuickAccessTile) => {
    const m = meta[tile.id] ?? {};
    return (
      <RichTileCard
        key={tile.id}
        icon={tile.icon}
        tone={tile.tone}
        title={tile.title}
        subtitle={m.subtitle ?? tile.subtitle}
        badge={m.badge}
        locked={isLocked(tile)}
        onPress={() => onTilePress(tile)}
      />
    );
  };

  return (
    <div style={{ padding: "0 16px" }}>
      <PersistentSearchBar
        value={query}
        onChange={setQuery}
        totalToolCount={orderedTiles.length}
      />

      {filtered ? (
        filtered.length === 0 ? (
          <div
            style={{
              padding: "32px 12px",
              textAlign: "center",
              color: "#6E6E73",
              fontSize: 13,
            }}
          >
            <div>No tools match “{query}”</div>
            <button
              type="button"
              onClick={() => setQuery("")}
              style={{
                marginTop: 8,
                background: "transparent",
                border: 0,
                color: "#2B7BC8",
                fontSize: 13,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Clear search
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 8,
            }}
          >
            {filtered.map(renderTile)}
          </div>
        )
      ) : (
        <>
          <div
            ref={scrollerRef}
            style={{
              display: "flex",
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
            className="hide-scrollbar"
          >
            {pages.map((pageTiles, idx) => (
              <div
                key={idx}
                style={{
                  flex: "0 0 100%",
                  width: "100%",
                  scrollSnapAlign: "start",
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gridAutoRows: "min-content",
                  gap: 8,
                }}
              >
                {pageTiles.map(renderTile)}
              </div>
            ))}
          </div>

          {pages.length > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                marginTop: 12,
              }}
            >
              {pages.map((_, i) => {
                const active = i === page;
                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to page ${i + 1}`}
                    onClick={() => jumpToPage(i)}
                    style={{
                      width: active ? 16 : 4,
                      height: 4,
                      background: active ? "#2B7BC8" : "#C7C7CC",
                      borderRadius: active ? 2 : 999,
                      border: 0,
                      padding: 0,
                      cursor: "pointer",
                      transition: "width 180ms ease, background 180ms ease",
                    }}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
