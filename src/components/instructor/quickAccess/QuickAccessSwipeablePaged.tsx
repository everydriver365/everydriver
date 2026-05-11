import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LucideIcon, Search as SearchIcon } from "lucide-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import {
  QUICK_ACCESS_TILES,
  QUICK_ACCESS_TILES_BY_ID,
  QuickAccessTile,
  TILE_TONE,
  TileTone,
} from "./tileRegistry";
import { CustomizeTilesSheet } from "./CustomizeTilesSheet";
import { useInstructorPinnedTiles } from "@/hooks/useInstructorPinnedTiles";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
import { useActivePupilsCount } from "@/hooks/useActivePupilsCount";
import { useTestSwapNotifications } from "@/hooks/useTestSwapNotifications";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import { useInstructorPeriodStats } from "@/hooks/useInstructorPeriodStats";

const TILES_PER_PAGE = 4;
const PRIMARY = "#1A52A0";

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
  const [editing, setEditing] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const lastPageRef = useRef(0);

  const { data: pinnedRows, isCustomised, setPins, isSaving } =
    useInstructorPinnedTiles(instructorId);

  const alphabeticalIds = useMemo(
    () =>
      [...QUICK_ACCESS_TILES]
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((t) => t.id),
    [],
  );

  const orderedTiles = useMemo(() => {
    const customIds =
      isCustomised && pinnedRows && pinnedRows.length > 0
        ? pinnedRows.map((r) => r.tile_id)
        : [];
    const seen = new Set(customIds);
    const tail = alphabeticalIds.filter((id) => !seen.has(id));
    const ids = [...customIds, ...tail];
    return ids
      .map((id) => QUICK_ACCESS_TILES_BY_ID[id])
      .filter(Boolean) as QuickAccessTile[];
  }, [isCustomised, pinnedRows, alphabeticalIds]);

  const richMeta = (tileId: string): TileMeta => {
    switch (tileId) {
      case "schedule": {
        const n = todayLessons?.length ?? 0;
        return { subtitle: n === 0 ? "Done for today" : `${n} lesson${n === 1 ? "" : "s"} today` };
      }
      case "pupils": {
        const n = activePupils ?? 0;
        return {
          subtitle: n > 0 ? `${n} active` : "Manage learners",
          badge: n > 0 ? { label: String(n), tone: "green" } : undefined,
        };
      }
      case "tests": {
        const n = swapCount ?? 0;
        return {
          subtitle: n > 0 ? `${n} swap request${n === 1 ? "" : "s"}` : undefined,
          badge: n > 0 ? { label: String(n), tone: "blue" } : undefined,
        };
      }
      case "earnings": {
        const amt = Math.round(monthStats?.earnings ?? 0);
        return { subtitle: `£${amt.toLocaleString("en-GB")} this month` };
      }
      case "messages": {
        const n = unreadMessages ?? 0;
        return {
          subtitle: n > 0 ? `${n} unread` : undefined,
          badge: n > 0 ? { label: String(n), tone: "red" } : undefined,
        };
      }
      case "vehicle-health": {
        const n = vehicleFaultCount;
        return {
          subtitle: n > 0 ? `${n} fault${n === 1 ? "" : "s"} detected` : "All clear",
          badge: n > 0 ? { label: String(n), tone: "red" } : undefined,
        };
      }
      default: {
        const t = QUICK_ACCESS_TILES_BY_ID[tileId];
        return { subtitle: t?.subtitle };
      }
    }
  };

  const isLocked = (tile: QuickAccessTile) =>
    tile.requiredFeature ? !features.includes(tile.requiredFeature) : false;

  const onTilePress = (tile: QuickAccessTile) => {
    if (isLocked(tile)) {
      toast.info(`${tile.title} requires a plan upgrade`, {
        action: { label: "View plans", onClick: () => navigate("/instructor/plans") },
      });
      return;
    }
    navigate(tile.route);
  };

  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed
    ? orderedTiles.filter((t) => t.title.toLowerCase().includes(trimmed))
    : null;

  const pages = useMemo(() => {
    const out: QuickAccessTile[][] = [];
    for (let i = 0; i < orderedTiles.length; i += TILES_PER_PAGE) {
      out.push(orderedTiles.slice(i, i + TILES_PER_PAGE));
    }
    return out;
  }, [orderedTiles]);

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

  const totalPages = pages.length;

  const renderTile = (tile: QuickAccessTile, index: number, pageIdx: number) => {
    const m = richMeta(tile.id);
    const isPrimary = false;
    return (
      <QuickTile
        key={tile.id}
        icon={tile.icon}
        tone={tile.tone}
        label={tile.title}
        subtitle={m.subtitle}
        isPrimary={isPrimary}
        locked={isLocked(tile)}
        onPress={() => onTilePress(tile)}
      />
    );
  };

  return (
    <div style={{ padding: "0 16px" }}>
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#8E8E93",
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          Quick access
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => setEditing(true)}
            style={{
              background: "transparent",
              border: 0,
              padding: 0,
              fontSize: 12,
              fontWeight: 600,
              color: PRIMARY,
              cursor: "pointer",
            }}
          >
            Edit
          </button>
          {totalPages > 1 && !filtered && (
            <PageDots currentPage={page} totalPages={totalPages} compact />
          )}
        </div>
      </div>

      {/* Search bar */}
      <div
        style={{
          background: "#FFF",
          borderRadius: 12,
          padding: "9px 12px",
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 12,
          border: "0.5px solid rgba(26,82,160,0.1)",
        }}
      >
        <SearchIcon size={13} color="#8E8E93" strokeWidth={1.8} style={{ flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools, pupils, lessons..."
          aria-label="Search tools, pupils, lessons"
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            outline: "none",
            background: "transparent",
            fontSize: 11.5,
            color: "#1A1A1A",
            padding: 0,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            style={{
              background: "transparent",
              border: 0,
              padding: 0,
              color: "#C7C7CC",
              cursor: "pointer",
              display: "flex",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m15 9-6 6M9 9l6 6"></path>
            </svg>
          </button>
        )}
      </div>

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
                color: PRIMARY,
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
              gap: 9,
            }}
          >
            {filtered.map((t, i) => renderTile(t, i, -1))}
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
            {pages.map((pageTiles, pageIdx) => (
              <div
                key={pageIdx}
                style={{
                  flex: "0 0 100%",
                  width: "100%",
                  scrollSnapAlign: "start",
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gridAutoRows: "min-content",
                  gap: 9,
                }}
              >
                {pageTiles.map((tile, i) => renderTile(tile, i, pageIdx))}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                marginTop: 10,
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
                      width: active ? 18 : 4,
                      height: 4,
                      background: active ? PRIMARY : "#D0D5DD",
                      borderRadius: 2,
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

      <CustomizeTilesSheet
        open={editing}
        onOpenChange={setEditing}
        defaultOrder={alphabeticalIds}
        currentOrder={orderedTiles.map((t) => t.id)}
        onSave={setPins}
        saving={isSaving}
      />
    </div>
  );
}

function PageDots({
  currentPage,
  totalPages,
  compact,
}: {
  currentPage: number;
  totalPages: number;
  compact?: boolean;
}) {
  const activeW = compact ? 16 : 18;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {Array.from({ length: totalPages }).map((_, i) => (
        <span
          key={i}
          style={{
            width: i === currentPage ? activeW : 4,
            height: 4,
            borderRadius: 2,
            background: i === currentPage ? PRIMARY : "#D0D5DD",
            transition: "width 180ms ease, background 180ms ease",
          }}
        />
      ))}
    </div>
  );
}

interface QuickTileProps {
  icon: LucideIcon;
  tone: TileTone;
  label: string;
  subtitle?: string;
  isPrimary?: boolean;
  locked?: boolean;
  onPress: () => void;
}

function QuickTile({
  icon: Icon,
  tone,
  label,
  subtitle,
  isPrimary,
  locked,
  onPress,
}: QuickTileProps) {
  const palette = TILE_TONE[tone];
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={label}
      style={{
        width: "100%",
        background: isPrimary ? PRIMARY : "#FFF",
        borderRadius: 16,
        padding: "14px 13px",
        border: isPrimary ? "0" : "0.5px solid rgba(26,82,160,0.08)",
        boxShadow: isPrimary
          ? "0 2px 8px rgba(26,82,160,0.25)"
          : "0 1px 4px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        textAlign: "left",
        cursor: "pointer",
        opacity: locked ? 0.55 : 1,
        position: "relative",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          marginBottom: 10,
          background: isPrimary ? "rgba(255,255,255,0.18)" : palette.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={14} strokeWidth={1.7} color={isPrimary ? "#FFF" : palette.fg} />
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          lineHeight: "15px",
          color: isPrimary ? "#FFF" : "#1A1A1A",
        }}
      >
        {label}
      </span>
      {subtitle && (
        <span
          style={{
            fontSize: 9,
            marginTop: 2,
            color: isPrimary ? "rgba(255,255,255,0.6)" : "#8E8E93",
          }}
        >
          {subtitle}
        </span>
      )}
    </button>
  );
}
