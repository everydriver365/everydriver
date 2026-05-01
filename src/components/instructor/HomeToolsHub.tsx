import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Mic, ChevronRight, ChevronDown, CalendarDays, Users,
  PoundSterling, BarChart3, Car, Briefcase, type LucideIcon,
} from "lucide-react";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import {
  QUICK_ACCESS_TILES,
  QUICK_ACCESS_TILES_BY_ID,
  TILE_TONE,
  type QuickAccessTile,
  type TileTone,
} from "@/components/instructor/quickAccess/tileRegistry";
import { useInstructorPinnedTiles } from "@/hooks/useInstructorPinnedTiles";

/* Premium iOS-style "Tools" hub embedded on the instructor home page.
   Visual/layout only — reuses existing routes, gating, and pin data. */

interface Category {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: TileTone;
  tileIds: string[];
}

const CATEGORIES: Category[] = [
  {
    id: "schedule", title: "Schedule & Lessons",
    subtitle: "Plan, track and fill your day",
    icon: CalendarDays, tone: "blue",
    tileIds: ["schedule","course-planner","availability","fill-gaps","plan-ahead","track-lesson","sat-nav","find-my-car","find-fuel","find-nearby","locations"],
  },
  {
    id: "pupils", title: "Pupils",
    subtitle: "Manage learners and progress",
    icon: Users, tone: "green",
    tileIds: ["pupils","messages","log-test-result","tests","waiting-room"],
  },
  {
    id: "money", title: "Money & Payments",
    subtitle: "Take payments and track earnings",
    icon: PoundSterling, tone: "amber",
    tileIds: ["take-payment","earnings","expenses","referrals"],
  },
  {
    id: "reports", title: "Reports & Insights",
    subtitle: "Weekly summaries and analytics",
    icon: BarChart3, tone: "purple",
    tileIds: ["weekly-report","standards-check","cpd-log","end-of-day","tasks-due","to-do"],
  },
  {
    id: "vehicle", title: "Vehicle & Compliance",
    subtitle: "Health, MOT and safety",
    icon: Car, tone: "red",
    tileIds: ["vehicle-health"],
  },
  {
    id: "business", title: "Business Tools",
    subtitle: "Plan, settings and updates",
    icon: Briefcase, tone: "grey",
    tileIds: ["your-plan","settings","accessibility","nearby-adis","find-colleague","platform-updates"],
  },
];

function LargeToolCard({ tile, onPress, locked }: { tile: QuickAccessTile; onPress: () => void; locked?: boolean }) {
  const palette = TILE_TONE[tile.tone];
  const Icon = tile.icon;
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onPress}
      aria-label={tile.title}
      style={{
        background: "#FFFFFF", borderRadius: 20, padding: "14px 12px",
        height: 92, display: "flex", flexDirection: "column",
        alignItems: "flex-start", justifyContent: "space-between",
        textAlign: "left", width: "100%", cursor: "pointer",
        opacity: locked ? 0.55 : 1, border: "0.5px solid rgba(0,0,0,0.04)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 4px 14px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 10, background: palette.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={17} strokeWidth={1.8} color={palette.fg} />
      </div>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: "#000", letterSpacing: "-0.2px", lineHeight: 1.2 }}>
        {tile.title}
      </span>
    </motion.button>
  );
}

function CategoryRow({ category, count, expanded, onPress }: { category: Category; count: number; expanded: boolean; onPress: () => void }) {
  const palette = TILE_TONE[category.tone];
  const Icon = category.icon;
  return (
    <motion.button
      type="button" whileTap={{ scale: 0.985 }} onClick={onPress}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
        background: "#FFFFFF", width: "100%", textAlign: "left",
        cursor: "pointer", border: 0, minHeight: 68,
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: palette.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} strokeWidth={1.8} color={palette.fg} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#000", letterSpacing: "-0.2px", lineHeight: 1.2 }}>
          {category.title}
        </div>
        <div style={{ fontSize: 12.5, color: "#6E6E73", marginTop: 2, lineHeight: 1.3 }}>
          {category.subtitle}
        </div>
      </div>
      <span style={{ fontSize: 12, color: "#8E8E93", background: "#F2F2F4", borderRadius: 999, padding: "2px 8px", fontWeight: 500 }}>
        {count}
      </span>
      {expanded
        ? <ChevronDown size={17} color="#C7C7CC" strokeWidth={2} />
        : <ChevronRight size={17} color="#C7C7CC" strokeWidth={2} />}
    </motion.button>
  );
}

function SearchResultRow({ tile, onPress }: { tile: QuickAccessTile; onPress: () => void }) {
  const palette = TILE_TONE[tile.tone];
  const Icon = tile.icon;
  return (
    <button type="button" onClick={onPress}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "#FFFFFF", width: "100%", textAlign: "left", border: 0, cursor: "pointer" }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: palette.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={15} strokeWidth={1.8} color={palette.fg} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, color: "#000", fontWeight: 500 }}>{tile.title}</div>
        <div style={{ fontSize: 12, color: "#8E8E93" }}>{tile.subtitle}</div>
      </div>
      <ChevronRight size={15} color="#C7C7CC" />
    </button>
  );
}

export function HomeToolsHub() {
  const navigate = useNavigate();
  const { instructor, subscription } = useInstructorAuth();
  const features = subscription?.features || [];
  const [query, setQuery] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const { pinnedIds } = useInstructorPinnedTiles(instructor?.id);

  const isLocked = (tile: QuickAccessTile) =>
    tile.requiredFeature ? !features.includes(tile.requiredFeature) : false;

  const handleTap = (tile: QuickAccessTile) => {
    if (isLocked(tile)) {
      toast.info(`${tile.title} requires a plan upgrade`, {
        action: { label: "View plans", onClick: () => navigate("/instructor/plans") },
      });
      return;
    }
    navigate(tile.route);
  };

  const frequentlyUsed = useMemo(
    () => pinnedIds.map((id) => QUICK_ACCESS_TILES_BY_ID[id]).filter(Boolean).slice(0, 6) as QuickAccessTile[],
    [pinnedIds],
  );
  const pinnedToHome = useMemo(
    () => pinnedIds.map((id) => QUICK_ACCESS_TILES_BY_ID[id]).filter(Boolean).slice(0, 4) as QuickAccessTile[],
    [pinnedIds],
  );

  const trimmed = query.trim().toLowerCase();
  const searchResults = trimmed
    ? QUICK_ACCESS_TILES.filter(
        (t) => t.title.toLowerCase().includes(trimmed) || t.subtitle.toLowerCase().includes(trimmed),
      )
    : [];

  const SectionLabel = ({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 4px 10px" }}>
      <h2 style={{
        fontSize: 12, fontWeight: 600, color: "#6E6E73",
        textTransform: "uppercase", letterSpacing: "0.4px", margin: 0,
      }}>
        {children}
      </h2>
      {action}
    </div>
  );

  return (
    <section style={{ marginTop: 24 }}>
      {/* Header */}
      <h2 style={{
        fontSize: 22, fontWeight: 700, letterSpacing: "-0.4px",
        color: "#000", margin: "0 4px 12px", lineHeight: 1.1,
      }}>
        Tools
      </h2>

      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "#FFFFFF", borderRadius: 14, padding: "11px 13px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        border: "0.5px solid rgba(0,0,0,0.05)",
      }}>
        <Search size={17} color="#8E8E93" strokeWidth={1.8} />
        <input
          value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools, pupils, lessons…"
          aria-label="Search"
          style={{
            flex: 1, border: 0, outline: "none", background: "transparent",
            fontSize: 14.5, color: "#000",
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
          }}
        />
        <Mic size={17} color="#8E8E93" strokeWidth={1.8} />
      </div>

      {trimmed ? (
        <div style={{
          marginTop: 14, background: "#FFFFFF", borderRadius: 16, overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          {searchResults.length === 0 ? (
            <div style={{ padding: 22, textAlign: "center", color: "#8E8E93", fontSize: 13.5 }}>
              No matches for "{query}"
            </div>
          ) : (
            searchResults.map((tile, i) => (
              <div key={tile.id}>
                <SearchResultRow tile={tile} onPress={() => handleTap(tile)} />
                {i < searchResults.length - 1 && (
                  <div style={{ marginLeft: 56, height: 0.5, background: "#E5E5EA" }} />
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          {/* Frequently used */}
          {frequentlyUsed.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <SectionLabel>Frequently used</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {frequentlyUsed.map((tile) => (
                  <LargeToolCard key={tile.id} tile={tile} onPress={() => handleTap(tile)} locked={isLocked(tile)} />
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          <div style={{ marginTop: 24 }}>
            <SectionLabel>Categories</SectionLabel>
            <div style={{
              background: "#FFFFFF", borderRadius: 18, overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              {CATEGORIES.map((cat, i) => {
                const validTiles = cat.tileIds.filter((id) => QUICK_ACCESS_TILES_BY_ID[id]);
                const expanded = openCategory === cat.id;
                return (
                  <div key={cat.id}>
                    <CategoryRow
                      category={cat} count={validTiles.length} expanded={expanded}
                      onPress={() => setOpenCategory((prev) => (prev === cat.id ? null : cat.id))}
                    />
                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: "hidden", background: "#FAFAFC", borderTop: "0.5px solid #E5E5EA" }}
                        >
                          <div style={{ padding: "12px 14px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {validTiles.map((id) => {
                              const tile = QUICK_ACCESS_TILES_BY_ID[id];
                              return (
                                <LargeToolCard key={id} tile={tile} onPress={() => handleTap(tile)} locked={isLocked(tile)} />
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {i < CATEGORIES.length - 1 && (
                      <div style={{ marginLeft: 62, height: 0.5, background: "#E5E5EA" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pinned to Home */}
          {pinnedToHome.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <SectionLabel
                action={
                  <button type="button" onClick={() => navigate("/instructor/menu?tab=pinned")}
                    style={{ background: "transparent", border: 0, color: "#007AFF", fontSize: 13, fontWeight: 500, padding: "0 4px", cursor: "pointer", textTransform: "none", letterSpacing: 0 }}>
                    Manage
                  </button>
                }
              >
                Pinned to Home
              </SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {pinnedToHome.map((tile) => (
                  <LargeToolCard key={tile.id} tile={tile} onPress={() => handleTap(tile)} locked={isLocked(tile)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
