import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Search, ChevronRight, Info, AlertTriangle, Plus, X, GripVertical,
  CalendarDays, Users, PoundSterling, BarChart3, Car, Briefcase,
  type LucideIcon,
} from "lucide-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  QUICK_ACCESS_TILES,
  QUICK_ACCESS_TILES_BY_ID,
  TILE_TONE,
  type QuickAccessTile,
} from "@/components/instructor/quickAccess/tileRegistry";
import { useInstructorPinnedTiles } from "@/hooks/useInstructorPinnedTiles";

/* Premium iOS-style "Tools" hub: editable 3×2 pinned grid + categorised browse.
   Visual/layout only — reuses existing routes, gating, search, and pin store. */

const MAX_PINS = 6;
const ACCENT = "#1F3A8A";
const ACCENT_BG = "#EEF3FF";
const AMBER_BG = "#FFF6E6";
const AMBER_FG = "#B45309";
const RED = "#B23A3F";

type CategoryId = "scheduling" | "finance" | "pupils" | "vehicle" | "reports" | "admin";

interface Category {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
  /** Background tile colour for icons in this category. */
  bg: string;
  /** Accent / icon stroke colour. */
  fg: string;
  tileIds: string[];
}

const CATEGORIES: Category[] = [
  {
    id: "scheduling", label: "Scheduling", icon: CalendarDays,
    bg: ACCENT_BG, fg: ACCENT,
    tileIds: ["schedule","course-planner","availability","fill-gaps","plan-ahead","track-lesson","sat-nav","find-my-car","find-fuel","find-nearby","locations"],
  },
  {
    id: "finance", label: "Finance", icon: PoundSterling,
    bg: AMBER_BG, fg: AMBER_FG,
    tileIds: ["take-payment","earnings","expenses","referrals"],
  },
  {
    id: "pupils", label: "Pupils", icon: Users,
    bg: "#E8F8ED", fg: "#3B8B3B",
    tileIds: ["pupils","messages","log-test-result","tests","waiting-room"],
  },
  {
    id: "vehicle", label: "Vehicle", icon: Car,
    bg: "#FFF0F0", fg: RED,
    tileIds: ["vehicle-health"],
  },
  {
    id: "reports", label: "Reports", icon: BarChart3,
    bg: "#F0EEFF", fg: "#5B47C9",
    tileIds: ["weekly-report","standards-check","cpd-log","end-of-day","tasks-due","to-do"],
  },
  {
    id: "admin", label: "Admin", icon: Briefcase,
    bg: "#F2F4F8", fg: "#5B6B8A",
    tileIds: ["your-plan","settings","accessibility","nearby-adis","find-colleague","platform-updates"],
  },
];

const CATEGORY_BY_TILE: Record<string, Category> = {};
CATEGORIES.forEach((c) => c.tileIds.forEach((id) => { CATEGORY_BY_TILE[id] = c; }));

function getCategoryFor(tileId: string): Category {
  return CATEGORY_BY_TILE[tileId] ?? CATEGORIES[CATEGORIES.length - 1];
}

interface PupilSearchResult {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  postcode: string | null;
  address: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  lessons_completed: number | null;
  progress: number | null;
}

/* ─── Pinned tile (normal mode) ─────────────────────────────────────── */

function PinnedTile({
  tile, isPrimary, onPress, locked,
}: { tile: QuickAccessTile; isPrimary: boolean; onPress: () => void; locked?: boolean }) {
  const cat = getCategoryFor(tile.id);
  const Icon = tile.icon;
  const iconBg = isPrimary ? "rgba(255,255,255,0.16)" : cat.bg;
  const iconFg = isPrimary ? "#FFFFFF" : cat.fg;
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onPress}
      aria-label={tile.title}
      style={{
        position: "relative",
        background: isPrimary ? ACCENT : "#FFFFFF",
        borderRadius: 14,
        padding: "11px 6px",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 5, width: "100%", cursor: "pointer",
        opacity: locked ? 0.55 : 1,
        border: isPrimary ? "0.5px solid transparent" : "0.5px solid rgba(26,82,160,0.08)",
        boxShadow: isPrimary
          ? "0 4px 12px rgba(26,82,160,0.18)"
          : "0 1px 2px rgba(16,24,40,0.04)",
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={17} strokeWidth={1.8} color={iconFg} />
      </div>
      <span style={{
        fontSize: 10, fontWeight: 600,
        color: isPrimary ? "#FFFFFF" : "#1A1A1A",
        textAlign: "center", lineHeight: 1.25,
      }}>
        {tile.title}
      </span>
    </motion.button>
  );
}

/* ─── Pinned tile (edit mode) — draggable, removable ──────────────── */

function EditablePinnedTile({
  tile, isPrimary, onRemove,
}: { tile: QuickAccessTile; isPrimary: boolean; onRemove: () => void }) {
  const cat = getCategoryFor(tile.id);
  const Icon = tile.icon;
  const iconBg = isPrimary ? "rgba(255,255,255,0.16)" : cat.bg;
  const iconFg = isPrimary ? "#FFFFFF" : cat.fg;
  return (
    <Reorder.Item
      value={tile.id}
      whileDrag={{
        scale: 1.05,
        backgroundColor: ACCENT_BG,
        boxShadow: "0 8px 18px rgba(26,82,160,0.18)",
        zIndex: 10,
      }}
      style={{
        position: "relative",
        background: isPrimary ? ACCENT : "#FFFFFF",
        borderRadius: 14,
        padding: "11px 6px",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 5,
        border: isPrimary
          ? "1.5px dashed rgba(255,255,255,0.28)"
          : "1.5px dashed rgba(26,82,160,0.22)",
        listStyle: "none",
        cursor: "grab",
        touchAction: "none",
      }}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        aria-label={`Remove ${tile.title}`}
        style={{
          position: "absolute", top: -6, left: -6, width: 17, height: 17,
          borderRadius: "50%", background: RED,
          border: "2px solid #F2F4F8",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", padding: 0, zIndex: 2,
        }}
      >
        <X size={9} color="#FFF" strokeWidth={2.4} />
      </button>
      <div
        aria-hidden="true"
        style={{
          position: "absolute", top: -6, right: -6, width: 17, height: 17,
          borderRadius: "50%", background: ACCENT,
          border: "2px solid #F2F4F8",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2, pointerEvents: "none",
        }}
      >
        <GripVertical size={9} color="#FFF" strokeWidth={2.2} />
      </div>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={17} strokeWidth={1.8} color={iconFg} />
      </div>
      <span style={{
        fontSize: 10, fontWeight: 600,
        color: isPrimary ? "#FFFFFF" : "#1A1A1A",
        textAlign: "center", lineHeight: 1.25,
      }}>
        {tile.title}
      </span>
    </Reorder.Item>
  );
}

/* ─── Tool row inside category card ─────────────────────────────── */

function ToolRow({
  tile, isPinned, isEditMode, full, onPress, onPin,
}: {
  tile: QuickAccessTile; isPinned: boolean; isEditMode: boolean; full: boolean;
  onPress: () => void; onPin: () => void;
}) {
  const cat = getCategoryFor(tile.id);
  const Icon = tile.icon;
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 13px", width: "100%", textAlign: "left",
        background: "transparent", border: 0,
        borderTop: "0.5px solid #F0F3F8",
        cursor: "pointer",
      }}
    >
      <div style={{
        width: 26, height: 26, borderRadius: 8, background: cat.bg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={12} strokeWidth={1.8} color={cat.fg} />
      </div>
      <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: "#1A1A1A" }}>
        {tile.title}
      </span>
      {!isEditMode && isPinned && (
        <span aria-label="Pinned" style={{
          width: 5, height: 5, borderRadius: "50%", background: ACCENT,
        }} />
      )}
      {isEditMode && !isPinned && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (!full) onPin(); }}
          disabled={full}
          aria-label={`Pin ${tile.title}`}
          style={{
            width: 22, height: 22, borderRadius: 11,
            background: "#F2F4F8",
            border: `1.5px solid ${full ? "#E0E5EE" : "#C7C7CC"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: full ? "not-allowed" : "pointer", padding: 0,
          }}
        >
          <Plus size={9} color={full ? "#E0E5EE" : "#8E8E93"} strokeWidth={2.4} />
        </button>
      )}
      <ChevronRight size={11} color="#C7C7CC" strokeWidth={2} />
    </button>
  );
}

/* ─── Main hub ─────────────────────────────────────────────────── */

export function HomeToolsHub() {
  const navigate = useNavigate();
  const { instructor, subscription } = useInstructorAuth();
  const features = subscription?.features || [];

  const { pinnedIds, setPins } = useInstructorPinnedTiles(instructor?.id);

  const [isEditMode, setIsEditMode] = useState(false);
  // Local working copy of the pinned order while editing — committed on every change.
  const [draftPins, setDraftPins] = useState<string[]>(pinnedIds);
  useEffect(() => {
    if (!isEditMode) setDraftPins(pinnedIds);
  }, [pinnedIds, isEditMode]);

  const persistPins = (next: string[]) => {
    setDraftPins(next);
    setPins(next).catch(() => {/* hook surfaces its own errors */});
  };

  // Search (tap target navigates to existing search screen — fall back to focus + inline).
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [pupilSearchResults, setPupilSearchResults] = useState<PupilSearchResult[]>([]);
  const [pupilsLoading, setPupilsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const term = query.trim();
    if (!instructor?.id || term.length === 0) {
      setPupilSearchResults([]); setPupilsLoading(false); return;
    }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      setPupilsLoading(true);
      const pattern = `%${term}%`;
      const { data, error } = await supabase
        .from("pupils")
        .select("id, name, email, phone, postcode, address, parent_name, parent_phone, lessons_completed, progress")
        .eq("instructor_id", instructor.id)
        .is("deleted_at", null)
        .or(`name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern},postcode.ilike.${pattern},address.ilike.${pattern},parent_name.ilike.${pattern},parent_phone.ilike.${pattern}`)
        .order("name", { ascending: true })
        .limit(8);
      if (cancelled) return;
      setPupilSearchResults(error ? [] : ((data || []) as PupilSearchResult[]));
      setPupilsLoading(false);
    }, 180);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [query, instructor?.id]);

  const isLocked = (tile: QuickAccessTile) =>
    tile.requiredFeature ? !features.includes(tile.requiredFeature) : false;

  const handleTap = (tile: QuickAccessTile) => {
    if (isEditMode) return;
    if (isLocked(tile)) {
      toast.info(`${tile.title} requires a plan upgrade`, {
        action: { label: "View plans", onClick: () => navigate("/instructor/plans") },
      });
      return;
    }
    navigate(tile.route);
  };

  const handlePinTool = (toolId: string) => {
    if (draftPins.length >= MAX_PINS) return;
    if (draftPins.includes(toolId)) return;
    persistPins([...draftPins, toolId]);
  };
  const handleUnpinTool = (toolId: string) => {
    persistPins(draftPins.filter((id) => id !== toolId));
  };

  // Browse filter
  const [selectedCategory, setSelectedCategory] = useState<"all" | CategoryId>("all");
  const filterChips: { id: "all" | CategoryId; label: string }[] = [
    { id: "all", label: "All" },
    ...CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
  ];

  const visiblePins = isEditMode ? draftPins : pinnedIds;
  const pinnedTiles = visiblePins
    .map((id) => QUICK_ACCESS_TILES_BY_ID[id])
    .filter(Boolean)
    .slice(0, MAX_PINS) as QuickAccessTile[];

  const trimmed = query.trim().toLowerCase();
  const totalToolCount = QUICK_ACCESS_TILES.length;

  // Inline search results list (kept lightweight so search remains usable here).
  const searchResults = trimmed
    ? QUICK_ACCESS_TILES.filter(
        (t) => t.title.toLowerCase().includes(trimmed) || t.subtitle.toLowerCase().includes(trimmed),
      ).slice(0, 8)
    : [];

  return (
    <section style={{ marginTop: 16 }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 12, padding: "0 2px",
      }}>
        <div>
          <div style={{ fontSize: 21, fontWeight: 700, color: "#1A1A1A", letterSpacing: -0.4 }}>
            {isEditMode ? "Edit pins" : "Tools"}
          </div>
          <div style={{ fontSize: 10, color: "#8E8E93", marginTop: 1 }}>
            {isEditMode ? "Hold to drag · tap − to remove" : `${totalToolCount} features`}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsEditMode((v) => !v)}
          style={{
            background: isEditMode ? ACCENT : ACCENT_BG,
            borderRadius: 20,
            padding: "5px 14px",
            border: 0, cursor: "pointer",
            fontSize: 11, fontWeight: 700,
            color: isEditMode ? "#FFF" : ACCENT,
          }}
        >
          {isEditMode ? "Done" : "Edit"}
        </button>
      </div>

      {/* Search bar (tap target — opens inline search) */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          background: "#FFF", borderRadius: 12,
          padding: "8px 12px",
          display: "flex", alignItems: "center", gap: 7,
          marginBottom: 14,
          border: "0.5px solid rgba(26,82,160,0.1)",
          cursor: "text",
        }}
      >
        <Search size={12} color="#8E8E93" strokeWidth={1.8} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => window.setTimeout(() => setSearchFocused(false), 150)}
          placeholder={`Search ${totalToolCount} tools...`}
          aria-label="Search tools"
          autoComplete="off"
          spellCheck={false}
          style={{
            flex: 1, border: 0, outline: "none", background: "transparent",
            fontSize: 16, color: "#000", minWidth: 0, padding: 0,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
          }}
        />
      </div>

      {/* Inline search results */}
      <AnimatePresence initial={false}>
        {(trimmed || (searchFocused && pupilSearchResults.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            style={{
              marginBottom: 14, background: "#FFF", borderRadius: 12, overflow: "hidden",
              border: "0.5px solid rgba(26,82,160,0.08)",
            }}
          >
            {pupilsLoading && searchResults.length === 0 && pupilSearchResults.length === 0 ? (
              <div style={{ padding: 18, textAlign: "center", color: "#8E8E93", fontSize: 12 }}>Searching…</div>
            ) : searchResults.length === 0 && pupilSearchResults.length === 0 ? (
              <div style={{ padding: 18, textAlign: "center", color: "#8E8E93", fontSize: 12 }}>No matches for "{query}"</div>
            ) : (
              <>
                {pupilSearchResults.map((p) => (
                  <button key={`p-${p.id}`} type="button" onClick={() => navigate(`/instructor/pupils/${p.id}`)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", width: "100%", textAlign: "left", background: "transparent", border: 0, borderTop: "0.5px solid #F0F3F8", cursor: "pointer" }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: "#E8F8ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Users size={12} color="#3B8B3B" strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: "#8E8E93", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {[p.phone, p.postcode].filter(Boolean).join(" · ") || p.email || "Pupil"}
                      </div>
                    </div>
                    <ChevronRight size={11} color="#C7C7CC" />
                  </button>
                ))}
                {searchResults.map((tile) => {
                  const cat = getCategoryFor(tile.id);
                  const Icon = tile.icon;
                  return (
                    <button key={tile.id} type="button" onClick={() => handleTap(tile)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", width: "100%", textAlign: "left", background: "transparent", border: 0, borderTop: "0.5px solid #F0F3F8", cursor: "pointer" }}>
                      <div style={{ width: 26, height: 26, borderRadius: 8, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={12} color={cat.fg} strokeWidth={1.8} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>{tile.title}</div>
                        <div style={{ fontSize: 10, color: "#8E8E93" }}>{tile.subtitle}</div>
                      </div>
                      <ChevronRight size={11} color="#C7C7CC" />
                    </button>
                  );
                })}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit-mode info banner */}
      {isEditMode && (
        <div style={{
          background: ACCENT_BG, borderRadius: 10,
          padding: "8px 11px",
          display: "flex", alignItems: "center", gap: 7,
          marginBottom: 12,
        }}>
          <Info size={12} color={ACCENT} strokeWidth={2} />
          <span style={{ fontSize: 10, color: ACCENT, fontWeight: 500 }}>
            {draftPins.length} of {MAX_PINS} slots used · tap + in browse to add
          </span>
        </div>
      )}

      {/* Section: Pinned */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        margin: "0 2px 8px",
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: "#8E8E93",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          Pinned
        </span>
        {isEditMode && (
          <span style={{ fontSize: 10, color: "#8E8E93", fontWeight: 600 }}>
            {draftPins.length} / {MAX_PINS}
          </span>
        )}
      </div>

      {isEditMode ? (
        <Reorder.Group
          axis="y"
          values={draftPins}
          onReorder={persistPins}
          as="div"
          style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            gap: 7, marginBottom: 16, padding: 0, listStyle: "none",
          }}
        >
          {pinnedTiles.map((tile, idx) => (
            <EditablePinnedTile
              key={tile.id}
              tile={tile}
              isPrimary={idx === 0}
              onRemove={() => handleUnpinTool(tile.id)}
            />
          ))}
        </Reorder.Group>
      ) : (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 7, marginBottom: 16,
        }}>
          {pinnedTiles.map((tile, idx) => (
            <PinnedTile
              key={tile.id}
              tile={tile}
              isPrimary={idx === 0}
              onPress={() => handleTap(tile)}
              locked={isLocked(tile)}
            />
          ))}
        </div>
      )}

      {/* Section: Browse */}
      <div style={{
        margin: "4px 2px 8px",
        fontSize: 10, fontWeight: 700, color: "#8E8E93",
        textTransform: "uppercase", letterSpacing: "0.08em",
      }}>
        Browse
      </div>

      {/* Category filter chips */}
      <div style={{
        display: "flex", gap: 5, marginBottom: 12,
        overflowX: "auto", scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
      }}>
        {filterChips.map((chip) => {
          const active = selectedCategory === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setSelectedCategory(chip.id)}
              style={{
                background: active ? ACCENT : "#FFF",
                borderRadius: 20,
                padding: "4px 10px",
                border: active ? 0 : "0.5px solid rgba(26,82,160,0.15)",
                fontSize: 10, fontWeight: 600,
                color: active ? "#FFF" : "#5B6B8A",
                whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer",
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Category cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {CATEGORIES
          .filter((cat) => selectedCategory === "all" || selectedCategory === cat.id)
          .map((cat) => {
            const Icon = cat.icon;
            const validTiles = cat.tileIds
              .map((id) => QUICK_ACCESS_TILES_BY_ID[id])
              .filter(Boolean) as QuickAccessTile[];
            const previewTiles = validTiles.slice(0, 3);
            const full = draftPins.length >= MAX_PINS;
            const firstTile = validTiles[0];
            const goCategoryHome = () => firstTile && handleTap(firstTile);

            return (
              <div key={cat.id} style={{
                background: "#FFF", borderRadius: 16,
                border: "0.5px solid rgba(26,82,160,0.08)",
                overflow: "hidden",
              }}>
                <button
                  type="button"
                  onClick={goCategoryHome}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "11px 13px", width: "100%", background: "transparent",
                    border: 0, textAlign: "left", cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9, background: cat.bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={15} color={cat.fg} strokeWidth={1.8} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{cat.label}</div>
                      <div style={{ fontSize: 9, color: "#8E8E93", marginTop: 1 }}>
                        {validTiles.length} tool{validTiles.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={11} color="#C7C7CC" strokeWidth={2} />
                </button>

                {previewTiles.map((tile) => (
                  <ToolRow
                    key={tile.id}
                    tile={tile}
                    isPinned={draftPins.includes(tile.id)}
                    isEditMode={isEditMode}
                    full={full}
                    onPress={() => handleTap(tile)}
                    onPin={() => handlePinTool(tile.id)}
                  />
                ))}

                {validTiles.length > previewTiles.length && firstTile && (
                  <button
                    type="button"
                    onClick={goCategoryHome}
                    style={{
                      padding: "7px 13px", width: "100%", textAlign: "left",
                      background: "transparent", border: 0,
                      borderTop: "0.5px solid #F0F3F8",
                      fontSize: 10, fontWeight: 600, color: ACCENT, cursor: "pointer",
                    }}
                  >
                    See all {validTiles.length} →
                  </button>
                )}
              </div>
            );
          })}
      </div>

      {/* Full slots warning */}
      {isEditMode && draftPins.length >= MAX_PINS && (
        <div style={{
          background: AMBER_BG, borderRadius: 10,
          padding: "8px 11px",
          display: "flex", alignItems: "center", gap: 7,
          marginTop: 12, marginBottom: 20,
        }}>
          <AlertTriangle size={12} color={AMBER_FG} strokeWidth={2} />
          <span style={{ fontSize: 10, color: AMBER_FG, fontWeight: 500 }}>
            All {MAX_PINS} slots full — remove a pinned tool to add another
          </span>
        </div>
      )}

    </section>
  );
}
