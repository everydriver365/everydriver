import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { EyebrowLabel } from "@/components/instructor/EyebrowLabel";
import {
  PersistentSearchBar,
  RichTileCard,
  CompactTile,
} from "./QuickAccessTiles";
import {
  QUICK_ACCESS_TILES,
  QUICK_ACCESS_TILES_BY_ID,
  QuickAccessTile,
  TILE_TONE,
  TileTone,
} from "./tileRegistry";
import { useInstructorPinnedTiles } from "@/hooks/useInstructorPinnedTiles";
import { useTodayRemainingLessons } from "@/hooks/useTodayRemainingLessons";
import { useActivePupilsCount } from "@/hooks/useActivePupilsCount";
import { useTestSwapNotifications } from "@/hooks/useTestSwapNotifications";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { useVehicleHealth } from "@/hooks/useVehicleHealth";
import { useInstructorPeriodStats } from "@/hooks/useInstructorPeriodStats";
import { CustomizeFrequentlyUsedSheet } from "./CustomizeFrequentlyUsedSheet";

const INITIAL_COMPACT_VISIBLE = 12;

interface RichBadgeAndSubtitle {
  subtitle?: string;
  badge?: { label: string; tone?: TileTone };
}

interface QuickAccessHybridProps {
  instructorId?: string;
}

/**
 * Replaces SwipeableQuickAccess. Three regions:
 *  1. Persistent search bar (filters all 33 tiles by title + subtitle)
 *  2. Frequently used — 6 rich cards (pinned, with adaptive 6th slot)
 *  3. All tools — compact 4-column grid, 12 visible + "Show more"
 *
 * All routes, plan-feature gating, and analytics-relevant actions are
 * preserved verbatim from the previous implementation.
 */
export function QuickAccessHybrid({ instructorId }: QuickAccessHybridProps) {
  const navigate = useNavigate();
  const { subscription } = useInstructorAuth();
  const features = subscription?.features || [];

  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  const { pinnedIds, isCustomised, setPins, isSaving } =
    useInstructorPinnedTiles(instructorId);

  // ---- Live data for rich-card subtitles & badges ---------------------------
  const { data: todayLessons } = useTodayRemainingLessons(instructorId);
  const { data: activePupils } = useActivePupilsCount(instructorId);
  const { data: swapCount } = useTestSwapNotifications(instructorId);
  const { data: unreadMessages } = useUnreadMessagesCount(instructorId);
  const { data: monthStats } = useInstructorPeriodStats(instructorId, "month");
  const { devices: vehicleDevices } = useVehicleHealth();
  const vehicleFaults = vehicleDevices.flatMap((d) => d.last_fault_codes || []);
  const vehicleFaultCount = vehicleFaults.length;

  // ---- Adaptive 6th slot ----------------------------------------------------
  // If the user hasn't customised AND there's a vehicle fault, swap the
  // last default pin (messages) for vehicle health. Otherwise leave the
  // user's pins exactly as they set them.
  const effectivePinnedIds = useMemo(() => {
    if (isCustomised) return pinnedIds;
    const next = [...pinnedIds];
    if (vehicleFaultCount > 0 && next.length === 6) {
      next[5] = "vehicle-health";
    }
    return next;
  }, [isCustomised, pinnedIds, vehicleFaultCount]);

  // ---- Subtitle / badge resolver per pinned tile ---------------------------
  const richMeta = (tileId: string): RichBadgeAndSubtitle => {
    switch (tileId) {
      case "schedule": {
        const n = todayLessons?.length ?? 0;
        return {
          subtitle: n === 0 ? "Done for today" : `${n} lesson${n === 1 ? "" : "s"} today`,
        };
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
      case "course-planner":
        return { subtitle: "Plan to test day" };
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

  // ---- Per-compact-tile alert counts (red badges only, genuine alerts) ----
  const compactAlertCount = (tileId: string): number | undefined => {
    if (tileId === "messages") return unreadMessages ?? 0;
    if (tileId === "vehicle-health") return vehicleFaultCount;
    if (tileId === "tests") return swapCount ?? 0;
    return undefined;
  };

  // ---- Tap handler with plan-gating preserved -----------------------------
  const handleTap = (tile: QuickAccessTile) => {
    const locked = tile.requiredFeature
      ? !features.includes(tile.requiredFeature)
      : false;
    if (locked) {
      toast.info(`${tile.title} requires a plan upgrade`, {
        action: { label: "View plans", onClick: () => navigate("/instructor/plans") },
      });
      return;
    }
    navigate(tile.route);
  };

  const isLocked = (tile: QuickAccessTile) =>
    tile.requiredFeature ? !features.includes(tile.requiredFeature) : false;

  // ---- Search -------------------------------------------------------------
  const trimmed = query.trim().toLowerCase();
  const isSearching = trimmed.length > 0;
  const searchResults = isSearching
    ? QUICK_ACCESS_TILES.filter(
        (t) =>
          t.title.toLowerCase().includes(trimmed) ||
          t.subtitle.toLowerCase().includes(trimmed),
      )
    : [];

  // ---- Rich list (pinned tiles, in order) ---------------------------------
  const richTiles = effectivePinnedIds
    .map((id) => QUICK_ACCESS_TILES_BY_ID[id])
    .filter(Boolean) as QuickAccessTile[];
  const pinnedSet = new Set(effectivePinnedIds);

  // ---- Compact list (everything not pinned, sorted: alerts → alpha) -------
  const compactTiles = useMemo(() => {
    const remaining = QUICK_ACCESS_TILES.filter((t) => !pinnedSet.has(t.id));
    return remaining.sort((a, b) => {
      const aAlert = (compactAlertCount(a.id) ?? 0) > 0 ? 1 : 0;
      const bAlert = (compactAlertCount(b.id) ?? 0) > 0 ? 1 : 0;
      if (aAlert !== bAlert) return bAlert - aAlert;
      return a.title.localeCompare(b.title);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectivePinnedIds, unreadMessages, vehicleFaultCount, swapCount]);

  const visibleCompact = expanded ? compactTiles : compactTiles.slice(0, INITIAL_COMPACT_VISIBLE);
  const hiddenCompactCount = Math.max(0, compactTiles.length - INITIAL_COMPACT_VISIBLE);

  return (
    <div className="px-4">
      {/* Region 1 — persistent search */}
      <PersistentSearchBar
        value={query}
        onChange={setQuery}
        totalToolCount={QUICK_ACCESS_TILES.length}
      />

      {isSearching ? (
        // ----- Search results: compact grid of every match ---------------
        <div>
          {searchResults.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No tools match “{query.trim()}”
            </p>
          ) : (
            <div
              style={{
                background: "#FFFFFF",
                border: "0.5px solid #E5E5EA",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: "14px 10px",
                }}
              >
                {searchResults.map((tile) => (
                  <CompactTile
                    key={tile.id}
                    icon={tile.icon}
                    tone={tile.tone}
                    label={tile.title}
                    alertCount={compactAlertCount(tile.id)}
                    onPress={() => handleTap(tile)}
                    locked={isLocked(tile)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Region 2 — Frequently used (rich 2-col grid) ----------------- */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              margin: "0 0 10px",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#6E6E73",
                letterSpacing: "0.3px",
                textTransform: "uppercase",
              }}
            >
              Frequently used
            </span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              style={{
                background: "transparent",
                border: 0,
                padding: 0,
                fontSize: 11,
                fontWeight: 500,
                color: "#2F63D3",
                cursor: "pointer",
              }}
            >
              Customize
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 8,
              marginBottom: 22,
            }}
          >
            {richTiles.map((tile) => {
              const meta = richMeta(tile.id);
              return (
                <RichTileCard
                  key={tile.id}
                  icon={tile.icon}
                  tone={tile.tone}
                  title={tile.title}
                  subtitle={meta.subtitle}
                  badge={meta.badge}
                  onPress={() => handleTap(tile)}
                  locked={isLocked(tile)}
                />
              );
            })}
          </div>

          {/* Region 3 — All tools (compact 4-col grid) -------------------- */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              margin: "0 0 12px",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#6E6E73",
                letterSpacing: "0.3px",
                textTransform: "uppercase",
              }}
            >
              All tools
            </span>
            <span style={{ fontSize: 11, color: "#6E6E73" }}>
              {compactTiles.length} more
            </span>
          </div>

          <div
            style={{
              background: "#FFFFFF",
              border: "0.5px solid #E5E5EA",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "14px 10px",
              }}
            >
              {visibleCompact.map((tile) => (
                <CompactTile
                  key={tile.id}
                  icon={tile.icon}
                  tone={tile.tone}
                  label={tile.title}
                  alertCount={compactAlertCount(tile.id)}
                  onPress={() => handleTap(tile)}
                  locked={isLocked(tile)}
                />
              ))}
            </div>

            {hiddenCompactCount > 0 && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                style={{
                  background: "transparent",
                  border: 0,
                  borderTop: "0.5px solid #E5E5EA",
                  marginTop: 10,
                  padding: "14px 0 4px",
                  width: "100%",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#2F63D3",
                  cursor: "pointer",
                }}
              >
                {expanded ? "Show fewer" : `Show ${hiddenCompactCount} more tools`}
              </button>
            )}
          </div>
        </>
      )}

      <CustomizeFrequentlyUsedSheet
        open={editing}
        onOpenChange={setEditing}
        initialPinnedIds={effectivePinnedIds}
        onSave={setPins}
        saving={isSaving}
      />
    </div>
  );
}
