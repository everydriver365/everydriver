import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { QUICK_ACCESS_TILES, QUICK_ACCESS_TILES_BY_ID, QuickAccessTile, TileTone } from "./tileRegistry";
import { CompactTile, PersistentSearchBar } from "./QuickAccessTiles";
import { CustomizeTilesSheet } from "./CustomizeTilesSheet";
import { useInstructorPinnedTiles } from "@/hooks/useInstructorPinnedTiles";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
import { useActivePupilsCount } from "@/hooks/useActivePupilsCount";
import { useTestSwapNotifications } from "@/hooks/useTestSwapNotifications";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import { useInstructorPeriodStats } from "@/hooks/useInstructorPeriodStats";

const TILES_PER_PAGE = 8;

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

  // Saved per-instructor order (also used by hybrid). When the row is
  // empty/missing, the hook returns the 6 defaults — we ignore that and
  // fall back to the full alphabetical list of all 33 tiles.
  const { data: pinnedRows, isCustomised, setPins, isSaving } =
    useInstructorPinnedTiles(instructorId);

  const alphabeticalIds = useMemo(
    () =>
      [...QUICK_ACCESS_TILES]
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((t) => t.id),
    [],
  );

  // Effective ordered visible tiles. If the user has saved a custom order,
  // use it verbatim (hidden tiles simply omitted). Otherwise alphabetical.
  const orderedTiles = useMemo(() => {
    const ids =
      isCustomised && pinnedRows && pinnedRows.length > 0
        ? pinnedRows.map((r) => r.tile_id)
        : alphabeticalIds;
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
          subtitle: "Manage learners",
          badge: n > 0 ? { label: String(n), tone: "green" } : undefined,
        };
      }
      case "tests": {
        const n = swapCount ?? 0;
        return {
          subtitle: n > 0 ? `${n} swap request${n === 1 ? "" : "s"}` : "No swap requests",
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
          subtitle: n > 0 ? `${n} unread` : "Chat",
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
    const m = richMeta(tile.id);
    const alertCount = m.badge ? Number(m.badge.label) || undefined : undefined;
    return (
      <CompactTile
        key={tile.id}
        icon={tile.icon}
        tone={tile.tone}
        label={tile.title}
        alertCount={alertCount}
        locked={isLocked(tile)}
        onPress={() => onTilePress(tile)}
      />
    );
  };

  return (
    <div style={{ padding: "0 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <PersistentSearchBar
            value={query}
            onChange={setQuery}
            totalToolCount={orderedTiles.length}
          />
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Customize tiles"
          style={{
            background: "transparent",
            border: 0,
            padding: "0 4px",
            marginBottom: 16,
            fontSize: 12,
            fontWeight: 500,
            color: "#3D55A1",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Customize
        </button>
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
                color: "#3D55A1",
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
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 12,
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
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gridAutoRows: "min-content",
                  rowGap: 14,
                  columnGap: 8,
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
                      background: active ? "#3D55A1" : "#C7C7CC",
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
