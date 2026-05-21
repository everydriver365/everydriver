import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LucideIcon,
  Search as SearchIcon,
  LayoutGrid,
  ChevronRight,
} from "lucide-react";
import {
  QUICK_ACCESS_TILES,
  QUICK_ACCESS_TILES_BY_ID,
  QuickAccessTile,
  TILE_TONE,
} from "./tileRegistry";
import { CustomizeTilesSheet } from "./CustomizeTilesSheet";
import { InstructorSearchOverlay } from "@/components/instructor/InstructorSearchOverlay";
import { useInstructorPinnedTiles } from "@/hooks/useInstructorPinnedTiles";

const VISIBLE_COUNT = 4;
const PRIMARY = "#2952b3";
const BORDER = "#e0dfd9";
const SECTION_BG = "#f0efe9";
const CHARCOAL = "#1a1a1f";
const MUTED = "#888888";

interface Props {
  instructorId?: string;
}

export function QuickAccessSwipeablePaged({ instructorId }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);

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

  const visibleTiles = orderedTiles.slice(0, VISIBLE_COUNT);
  const totalCount = QUICK_ACCESS_TILES.length;

  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed
    ? orderedTiles.filter((t) => t.title.toLowerCase().includes(trimmed))
    : null;

  const gridTiles = filtered ?? visibleTiles;

  return (
    <div style={{ padding: "0 16px", background: SECTION_BG }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: MUTED,
              letterSpacing: 1.4,
              textTransform: "uppercase",
            }}
          >
            Quick access
          </span>
          <button
            type="button"
            onClick={() => {
              setSearchExpanded((v) => {
                const next = !v;
                if (!next) setQuery("");
                return next;
              });
            }}
            aria-label={searchExpanded ? "Close search" : "Search tools"}
            aria-expanded={searchExpanded}
            style={{
              width: 22,
              height: 22,
              borderRadius: 999,
              background: "transparent",
              border: 0,
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: MUTED,
            }}
          >
            <SearchIcon size={14} strokeWidth={2} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          style={{
            background: "transparent",
            border: 0,
            padding: 0,
            fontSize: 13,
            fontWeight: 600,
            color: PRIMARY,
            cursor: "pointer",
          }}
        >
          Edit pins
        </button>
      </div>

      {/* Expanding search bar */}
      <div
        style={{
          maxHeight: searchExpanded ? 60 : 0,
          opacity: searchExpanded ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 220ms ease, opacity 180ms ease, margin-bottom 220ms ease",
          marginBottom: searchExpanded ? 12 : 0,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "11px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            border: `1px solid ${BORDER}`,
          }}
        >
          <SearchIcon size={16} color={MUTED} strokeWidth={2} style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search all ${totalCount} tools…`}
            aria-label="Search tools"
            autoFocus={searchExpanded}
            style={{
              flex: 1,
              minWidth: 0,
              border: 0,
              outline: "none",
              background: "transparent",
              fontSize: 14,
              color: CHARCOAL,
              padding: 0,
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
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
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6M9 9l6 6" />
              </svg>
            </button>
          )}
        </div>
      </div>


      {/* 2×2 Grid */}
      {gridTiles.length === 0 ? (
        <div
          style={{
            padding: "28px 12px",
            textAlign: "center",
            color: "#6E6E73",
            fontSize: 13,
            background: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
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
              fontWeight: 600,
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
            gap: 10,
          }}
        >
          {gridTiles.map((tile) => (
            <QuickTile
              key={tile.id}
              icon={tile.icon}
              label={tile.title}
              tintBg={TILE_TONE[tile.tone].bg}
              tintFg={TILE_TONE[tile.tone].fg}
              onPress={() => navigate(tile.route)}
            />
          ))}
        </div>
      )}

      {/* See all */}
      {!filtered && (
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#e8eefb";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#fff";
          }}
          style={{
            marginTop: 10,
            width: "100%",
            background: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            padding: "13px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            transition: "background 150ms ease",
          }}
        >
          <LayoutGrid size={18} color={PRIMARY} strokeWidth={2.2} />
          <span
            style={{
              flex: 1,
              textAlign: "left",
              fontSize: 14,
              fontWeight: 600,
              color: PRIMARY,
            }}
          >
            See all {totalCount} tools
          </span>
          <ChevronRight size={18} color={PRIMARY} strokeWidth={2.2} />
        </button>
      )}

      <CustomizeTilesSheet
        open={editing}
        onOpenChange={setEditing}
        defaultOrder={alphabeticalIds}
        currentOrder={orderedTiles.map((t) => t.id)}
        onSave={setPins}
        saving={isSaving}
      />

      {instructorId && (
        <InstructorSearchOverlay
          open={searchOpen}
          onOpenChange={setSearchOpen}
          instructorId={instructorId}
        />
      )}
    </div>
  );
}

interface QuickTileProps {
  icon: LucideIcon;
  label: string;
  tintBg: string;
  tintFg: string;
  onPress: () => void;
}

function QuickTile({ icon: Icon, label, tintBg, tintFg, onPress }: QuickTileProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={label}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = PRIMARY;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER;
      }}
      style={{
        width: "100%",
        background: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        padding: "14px 14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 10,
        textAlign: "left",
        cursor: "pointer",
        transition: "border-color 150ms ease",
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: tintBg,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} strokeWidth={2.2} color={tintFg} />
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          lineHeight: "18px",
          color: CHARCOAL,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "100%",
        }}
      >
        {label}
      </span>
    </button>
  );
}
